---
title: "OOP Using GObject (9) - A Dynamic Type"
date: "2011-03-12"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

Recall there are 3 types in GObject type system: Fundamental, static and dynamic. A fundamental type is a top-most type which has no parent type. Most of them are pre-defined. Static types never load/unload its class type (say, their class struct) at runtime, since they are static. On the contrary, dynamic types can be dynamically loaded/unloaded at runtime. They are normally used within a module.

We can call `g_type_register_dynamic()` to register a dynamic type. When used in a module of GObject library (may be a `GTypeModule` type), We can also call `g_type_module_register_type()` to create your dynamic types. `g_type_register_dynamic()` is invoked for you in that function. Let's go through the code:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
// bartype.h
#ifndef BAR_TYPE_H_
#define BAR_TYPE_H_

#include 

/* Bar type class struct */
typedef struct _BarTypeClass {
    GObjectClass parent;
} BarTypeClass;

/* Far type object struct */
typedef struct _BarType {
    GObject parent;
} BarType;

/* type function */
GType bar_type_get_type();

/* register type */
void bar_type_register_type(GTypeModule *type_module);


#endif /* BAR_TYPE_H_ */
```

```
// bartype.c
#include "bartype.h"

static gpointer parent_klass = NULL;
static GType bar_type_type_id = 0;

static void bar_type_instance_init(BarType *self) {
    g_print("Calling bar_type_instance_init()\n");
}

static void bar_type_instance_finalize(GObject *object) {
    /* do some finalize, maybe release some dynamically allocated memory */
    g_print("Calling bar_type_instance_finalize()\n");
    /* chain to parent's finalize */
    G_OBJECT_CLASS(parent_klass)->finalize(object);
}

static void bar_type_class_init(BarTypeClass *klass) {
    g_print("Calling bar_type_class_init()\n");
    parent_klass = g_type_class_peek_parent(klass);
    G_OBJECT_CLASS(klass)->finalize = bar_type_instance_finalize;
}

static void bar_type_class_finalize(BarTypeClass *klass) {
    g_print("Calling bar_type_class_finalize()\n");
}

GType bar_type_get_type() {
    return bar_type_type_id;
}

void bar_type_register_type(GTypeModule *type_module) {
    const GTypeInfo type_info = {
        sizeof(BarTypeClass), /* class_size */
        NULL,                   /* base_init */
        NULL,                   /* base_finalize */
        (GClassInitFunc)bar_type_class_init, /* class_init */
        (GClassFinalizeFunc)bar_type_class_finalize, /* class_finalize */
        NULL,                   /* class_data */
        sizeof(BarType),        /* instance_size */
        0,                      /* n_preallocs */
        (GInstanceInitFunc)bar_type_instance_init, /* instance_init */
        NULL                    /* value_table */
    };
    bar_type_type_id = g_type_module_register_type(
        type_module, G_TYPE_OBJECT, "BarTypeDynamicClass", &type_info, 0);
}
```

The implementation structure may be a little different with the stuff when creating a static type. An additional parameter `GTypeModule` is passed in. It represents the module your dynamic type belongs to. So, when the module is unloaded, all dynamic types in it are unaccessible.

Also note the `bar_type_class_finalize()` function. We use it to override the `finalize()` virtual function in `GObjectClass`. Now you can do un-initialiation in this function. It is like the destructor in a C++ class.

Let's move on to the module type. This type inherits `GTypeModule`:

```
// fakemodule.h
#ifndef FAKE_MODULE_H_
#define FAKE_MODULE_H_

#include 

/* module object struct */
typedef struct _FakeModule {
    GTypeModule parent;
} FakeModule;

/* module class struct */
typedef struct _FakeModuleClass {
    GTypeModuleClass parent;
} FakeModuleClass;

/* type method */
GType fake_module_get_type();


#endif /* FAKE_MODULE_H_ */
```

```
// fakemodule.c
#include "fakemodule.h"

/*
 * If you implement a real shared library module, you
 * can init module variables, assign virtual function here.
 */
gboolean fake_module_load(GTypeModule *module) {
    g_print("Invoking fake_module_load()\n");
    /* successfully loaded */
    return TRUE;
}

/*
 * If you implement a real shared library module, you
 * can uninit module variables, and make all cleanups here.
 */
void fake_module_unload(GTypeModule *module) {
    /* noop */
    g_print("Invoking fake_module_unload()\n");
}

static void fake_module_class_init(FakeModuleClass *klass, gpointer data) {
    g_print("Calling fake_module_class_init()\n");
    GTypeModuleClass *module_class = G_TYPE_MODULE_CLASS(klass);
    module_class->load = fake_module_load;
    module_class->unload = fake_module_unload;
}

static void fake_module_instance_init(FakeModule *instance, gpointer data) {
    g_print("Calling fake_module_instance_init()\n");
}

GType fake_module_get_type() {
    static GType type_id = 0;
    if (type_id == 0) {
        static const GTypeInfo type_info = {
            sizeof(FakeModuleClass), /* class_size */
            NULL,                   /* base_init */
            NULL,                   /* base_finalize */
            (GClassInitFunc)fake_module_class_init, /* class_init */
            NULL,                   /* class_finalize */
            NULL,                   /* class_data */
            sizeof(FakeModule),     /* instance_size */
            0,                      /* n_preallocs */
            (GInstanceInitFunc)fake_module_instance_init, /* instance_init */
            NULL                    /* value_table */
        };
        type_id = g_type_register_static(
            G_TYPE_TYPE_MODULE, "FakeModuleStaticClass", &type_info, 0);
    }
    return type_id;
}
```

`GTypeModule` is an abstract type. We should implements its `load()` and `unload()` virtual function.

Our test code:

```
// main.c
#include "footype.h"
#include "bartype.h"
#include "fakemodule.h"
#include 

/*
 * Module entry point. If you implement a real shared library module,
 * you can use dlopen()/dlsym() or g_module_open()/g_module_symbol() to
 * load this module dynamically.
 */
void module_init(GTypeModule *type_module) {
    foo_type_register_type(type_module);
    bar_type_register_type(type_module);
}

int main() {
    g_type_init();

    FakeModule *module = (FakeModule *)g_object_new(fake_module_get_type(), NULL);
    module_init((GTypeModule *)module);

    /*
     * Add a reference to foo type class here. Otherwise, the fake module
     * will be unloaded right after the free() of foo type object and cause error.
     */
    FooTypeClass *foo_type_class = (FooTypeClass *)g_type_class_ref(foo_type_get_type());

    FooType *foo_type = (FooType *)g_object_new(foo_type_get_type(), NULL);
    BarType *bar_type = (BarType *)g_object_new(bar_type_get_type(), NULL);

    /* Test for override finalize() */
    g_object_unref(foo_type);
    g_object_unref(bar_type);

    g_type_class_unref(foo_type_class);

    return 0;
}
```

Another dynamic type `BarType` is defined in addition to `FooType` to demo the usage. The output maybe:

```
Calling fake_module_class_init()
Calling fake_module_instance_init()
Invoking fake_module_load()
Calling foo_type_class_init()
Calling foo_type_instance_init()
Calling bar_type_class_init()
Calling bar_type_instance_init()
Calling foo_type_instance_finalize()
Calling bar_type_instance_finalize()
Calling bar_type_class_finalize()
Calling foo_type_class_finalize()
Invoking fake_module_unload()
```

See the init/finalize process?

At the end of my note, Let me summarize to compare GObject library with C++ implementation:

1\. Member Variables:

<table style="text-align: center; width: 500px;" border="1" cellspacing="0" cellpadding="0"><tbody><tr><td>GObject</td><td>C++</td></tr><tr><td>in class struct</td><td>class meta info</td></tr><tr><td>in object struct</td><td>class instance member</td></tr><tr><td>global variable</td><td>class static member</td></tr></tbody></table>

2\. Function Callbacks:

<table style="text-align: center; width: 700px;" border="1" cellspacing="0" cellpadding="0"><tbody><tr><td style="width: 200px;">GObject</td><td>C++</td></tr><tr><td>base_init</td><td>init class dynamic meta info</td></tr><tr><td>base_finalize</td><td>finalize dynamic class meta info, only dynamic types use it</td></tr><tr><td>class_init</td><td>init class static meta info</td></tr><tr><td>class_finalize</td><td>finalize class static meta info, only dynamic types use it</td></tr><tr><td>instance_init</td><td>init instace, like C++ constructor</td></tr><tr><td>override finalize in GObjectClass</td><td>finalize instance, like C++ destructor</td></tr></tbody></table>

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject7 folder.
