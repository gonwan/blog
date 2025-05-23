---
title: "OOP Using GObject (4) - An Inheritable Class"
date: "2011-03-11 09:06:00"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

Now, we will begin to implement some real OO mechanism using GObject library. In this article, we will make our fundamental type Inheritable.

Here's comes our Base type:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```cpp
// base.h
#ifndef BASE_H_
#define BASE_H_

#include <glib-object.h>

/* Base object struct */
typedef struct _Base {
    GTypeInstance parent;
    /* instance variable, should be hidden */
    gint base_instance_i;
} Base;

/* Base class struct */
typedef struct _BaseClass {
    GTypeClass parent;
    /* instance method, used as a virtual method */
    void (*base_instance_dump)(struct _Base *instance);
} BaseClass;

/* static method of Base class */
void base_class_set_i(gint i);

/* non-virtual public method for Base object */
void base_instance_set_i(Base *instance, gint i);

/* virtual public method for Base object, both version are supported */
void base_instance_dump(Base *instance);

/* type method */
GType base_get_type();


#endif /* BASE_H_ */
```

```cpp
// base.c
#include "base.h"

/* static field of Base class */
gint base_class_i;

/* static method of Base class */
void base_class_set_i(gint i) {
    base_class_i = i;
    g_print("Invoking base_class_set_i(): base_class_i=%d\n", base_class_i);
}

void base_instance_set_i(Base *instance, gint i) {
    instance->base_instance_i = i;
    g_print("Invoking base_instance_set_i(): base_instance_i=%d\n", instance->base_instance_i);
}

void base_instance_dump(Base *instance) {
    g_print("Invoking base_instance_dump(): base_instance_i=%d\n", instance->base_instance_i);
}

static void base_class_init(BaseClass *klass, gpointer data) {
    base_class_i = 100;
    g_print("Calling base_class_init(): base_class_i=%d\n", base_class_i);
    klass->base_instance_dump = base_instance_dump;
}

static void base_instance_init(Base *instance, gpointer data) {
    instance->base_instance_i = 200;
    g_print("Calling base_instance_init(): base_instance_i=%d\n", instance->base_instance_i);
}

GType base_get_type() {
    static GType base_type = 0;
    if (base_type == 0) {
        static const GTypeInfo base_type_info = {
            sizeof(BaseClass),  /* class_size */
            NULL,               /* base_init */
            NULL,               /* base_finalize */
            (GClassInitFunc)base_class_init, /* class_init */
            NULL,               /* class_finalize */
            NULL,               /* class_data */
            sizeof(Base),       /* instance_size */
            0,                  /* n_preallocs */
            (GInstanceInitFunc)base_instance_init, /* instance_init */
            NULL                /* value_table */
        };
        GTypeFundamentalInfo foo_type_fundamental_info = {
            G_TYPE_FLAG_CLASSED           /* Indicates a classed type */
            | G_TYPE_FLAG_INSTANTIATABLE  /* Indicates an instantiable type */
            | G_TYPE_FLAG_DERIVABLE       /* Indicates a flat derivable type */
            | G_TYPE_FLAG_DEEP_DERIVABLE  /* Indicates a deep derivable type */
        };
        base_type = g_type_register_fundamental(g_type_fundamental_next(),
            "BaseFundamentalType", &base_type_info, &foo_type_fundamental_info, 0);
    }
    return base_type;
}
```

In `base_instance_init()`, we assigned the `base_instance_dump()` callback. Thus, we can invoke this function by both global function or instance function of `BaseClass` class. Additional flags `G_TYPE_FLAG_DERIVABLE` and `G_TYPE_FLAG_DEEP_DERIVABLE` are also passed to the `GTypeFundamentalInfo` struct to enable inheritance.

It's time to define our Derived type:

```
// derived.h
#ifndef DERIVED_H_
#define DERIVED_H_

#include "base.h"
#include 

/* Derived object struct */
typedef struct _Derived {
    /* The GTypeClass structure is still the first member of the class structure */
    Base parent;
    /* should be hidden */
    gint derived_instance_i;
} Derived;

/* Derived class struct */
typedef struct _DerivedClass {
    /* The TypeInstance structure is still the first member of the instance structure */
    BaseClass parent;
} DerivedClass;

/* non-virtual public method for Derived object */
void derived_instance_set_i(Derived *instance, gint i);

/* (Overwrite) virtual public method for Derived object, both version are supported */
void derived_instance_dump(Base *instance);

/* type method */
GType derived_get_type();


#endif /* DERIVED_H_ */
```

```
// derived.c
#include "derived.h"

void derived_instance_set_i(Derived *instance, gint i) {
    instance->derived_instance_i = i;
    g_print("Invoking derived_instance_set_i(): derived_instance_i=%d\n", instance->derived_instance_i);
}

void derived_instance_dump(Base *instance) {
    Derived *derived = G_TYPE_CHECK_INSTANCE_CAST(instance, derived_get_type(), Derived);
    g_print("Invoking derived_instance_dump(): base_instance_i=%d, derived_instance_i=%d\n", instance->base_instance_i, derived->derived_instance_i);
}

static void derived_class_init(DerivedClass *klass, gpointer data) {
    g_print("Calling derived_class_init()\n");
    base_class_set_i(300);
    /* override */
    BaseClass *base_klass = G_TYPE_CHECK_CLASS_CAST(klass, base_get_type(), BaseClass);
    base_klass->base_instance_dump = derived_instance_dump;
}

static void derived_instance_init(Derived *instance, gpointer data) {
    instance->derived_instance_i = 400;
    g_print("Calling derived_instance_init(): derived_instance_i=%d\n", instance->derived_instance_i);
}

GType derived_get_type() {
    static GType derived_type = 0;
    if(derived_type == 0) {
        static const GTypeInfo derived_type_info = {
            sizeof(DerivedClass), /* class_size */
            NULL,               /* base_init */
            NULL,               /* base_finalize */
            (GClassInitFunc)derived_class_init, /* class_init */
            NULL,               /* class_finalize */
            NULL,               /* class_data */
            sizeof(Derived),    /* instance_size */
            0,                  /* n_preallocs */
            (GInstanceInitFunc)derived_instance_init, /* instance_init */
            NULL                /* value_table */
        };
        derived_type = g_type_register_static(
            base_get_type(), "DerivedStaticClass", &derived_type_info, 0);
    }
    return derived_type;
}
```

Our `Derived` type inherits `Base` by replacing `GTypeClass` and `GTypeInstance` with the corresponding struct of the Base type. According to the memory layout of structs, `GTypeClass` and `GTypeInstance` are still the first member of corresponding struct. In `derived_get_type()`, we register `Derived` type using `g_type_register_static()` since it's not a fundamental at all. And the first parameter is the type id of `Base` type.

Let's have some time to look up how to implement polymorphism. In `derived_class_init()`, we re-assign the `base_instance_dump()` callback to from the `Base`'s implementation to `Derived`'s implementation.

Test code:

```
int main() {
    g_type_init();
    my_dump_type(base_get_type());
    my_dump_type(derived_get_type());

    /*
     * Official document:
     * Use of g_type_create_instance() is reserved for implementators of
     * fundamental types only. E.g. instances of the GObject hierarchy should
     * be created via g_object_new() and never directly through
     * g_type_create_instance() which doesn't handle things like singleton
     * objects or object construction.
     */
    Base *base = (Base *)g_type_create_instance(base_get_type());
    base_class_set_i(101);
    base_instance_set_i(base, 201);
    Derived *derived = (Derived *)g_type_create_instance(derived_get_type());
    derived_instance_set_i(derived, 401);

    /* Test polymorphism */
    Base *instances[2] = { base, (Base *)derived };
    int i;
    for (i = 0; i < 2; i++) {
        Base *inst = instances[i];
        BaseClass *klass = G_TYPE_INSTANCE_GET_CLASS(inst, base_get_type(), BaseClass);
        klass->base_instance_dump(inst);
    }

    return 0;
}
```

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject4 folder.
