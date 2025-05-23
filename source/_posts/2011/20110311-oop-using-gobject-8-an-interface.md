---
title: "OOP Using GObject (8) - An interface"
date: "2011-03-11"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

Interfaces usage in library is like class usage. We need to define a interface struct, but no object struct is needed:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
typedef struct _FakeIServer FakeIServer; /* dummy object */
typedef struct _FakeIServerInterface {
    GTypeInterface parent;
    void (*response)(FakeIServer *instance);
} FakeIServerInterface;
```

Then we register the interface using `g_type_register_static()` with `G_TYPE_INTERFACE` as first parameter. For interfaces, we only need to assign `base_init()` and `base_finalize()`callbacks.

```
static void fake_iserver_base_init(gpointer g_class) {
    static gboolean is_initialized = FALSE;
    if (!is_initialized) {
        /* add properties and signals to the interface here */
        is_initialized = TRUE;
    }
}

GType fake_iserver_get_type() {
    static GType type_id = 0;
    if (type_id == 0) {
        static const GTypeInfo interface_info = {
            sizeof(FakeIServerInterface),   /* class_size */
            fake_iserver_base_init,         /* base_init */
            NULL,                           /* base_finalize */
        };
        type_id = g_type_register_static(
            G_TYPE_INTERFACE, "FakeIServerInterface", &interface_info, 0);
    }
    return type_id;
}
```

As described in the [official document](http://library.gnome.org/devel/gobject/stable/gobject-Type-Information.html#GClassInitFunc), we should allocate dynamic memebers of class struct in `base_init()`. Otherwise, all copies of the class struct share only one copy of dynamic members. This leads to problems.

Let's define the type which implements the interface:

```
// fakedesktop.h
#ifndef FAKE_DESKTOP_H_
#define FAKE_DESKTOP_H_

#include 

#define FAKE_TYPE_DESKTOP              ( fake_desktop_get_type() )
#define FAKE_DESKTOP(obj)              \
 ( G_TYPE_CHECK_INSTANCE_CAST((obj), FAKE_TYPE_DESKTOP, FakeDesktop) )
#define FAKE_IS_DESKTOP(obj)           \
 ( G_TYPE_CHECK_INSTANCE_TYPE((obj), FAKE_TYPE_DESKTOP) )
#define FAKE_DESKTOP_CLASS(cls)        \
 ( G_TYPE_CHECK_CLASS_CAST((cls), FAKE_TYPE_DESKTOP, FakeDesktopClass) )
#define FAKE_IS_DESKTOP_CLASS(cls)     \
 ( G_TYPE_CHECK_CLASS_TYPE((cls), FAKE_TYPE_DESKTOP) )
#define FAKE_DESKTOP_GET_CLASS(obj)    \
 ( G_TYPE_INSTANCE_GET_CLASS((obj), FAKE_TYPE_DESKTOP, FakeDesktopClass ) )

/* Base object struct */
typedef struct _FakeDesktop {
    /* GObject as the first field */
    GObject parent;
} FakeDesktop;

/* Base class struct */
typedef struct _FakeDesktopClass {
    /* GObjectClass as the first field */
    GObjectClass parent;
} FakeDesktopClass;

/* type method */
GType fake_desktop_get_type();


#endif /* FAKE_DESKTOP_H_ */
```

Note the naming convention I used here. Our `FakeDesktop` class will implement the `FakeIServer` interface and another `FakeIClient` interface. This time do not use corresponding interface struct as the first members of `FakeDesktop` and `FakeDesktopClass`. Interface info will be added dynamically when initialize a real instance of `FakeDesktop`. Let's move to the \*.c code:

```
// fakedesktop.c
#include "fakedesktop.h"
#include "fakeiface.h"

void fake_desktop_request(FakeIClient *instance) {
    g_print("Invoking fake_desktop_request()\n");
}

void fake_desktop_response(FakeIServer *instance) {
    g_print("Invoking fake_desktop_response()\n");
}

static void fake_desktop_class_init(FakeDesktopClass *klass, gpointer data) {
}

static void fake_desktop_instance_init(FakeDesktop *instance, gpointer data) {
}

static void fake_desktop_interface_init_iclient(FakeIClientInterface* iface, gpointer iface_data) {
    iface->request = fake_desktop_request;
}

static void fake_desktop_interface_init_iserver(FakeIServerInterface* iface, gpointer iface_data) {
    iface->response = fake_desktop_response;
}

GType fake_desktop_get_type() {
    static GType type_id = 0;
    if (type_id == 0) {
        static const GTypeInfo type_info = {
            sizeof(FakeDesktopClass),  /* class_size */
            NULL,                   /* base_init */
            NULL,                   /* base_finalize */
            (GClassInitFunc)fake_desktop_class_init, /* class_init */
            NULL,                   /* class_finalize */
            NULL,                   /* class_data */
            sizeof(FakeDesktop),    /* instance_size */
            0,                      /* n_preallocs */
            (GInstanceInitFunc)fake_desktop_instance_init, /* instance_init */
            NULL                    /* value_table */
        };
        type_id = g_type_register_static(G_TYPE_OBJECT, "FakeDesktopClass", &type_info, 0);

        /* add interface */
        GInterfaceInfo interface_info_iclient = {
            (GInterfaceInitFunc)fake_desktop_interface_init_iclient, /* interface_init */
            NULL,   /* interface_finalize */
            NULL,   /* interface_data */
        };
        GInterfaceInfo interface_info_iserver = {
            (GInterfaceInitFunc)fake_desktop_interface_init_iserver, /* interface_init */
            NULL,   /* interface_finalize */
            NULL,   /* interface_data */
        };
        g_type_add_interface_static(type_id, FAKE_TYPE_ICLIENT, &interface_info_iclient);
        g_type_add_interface_static(type_id, FAKE_TYPE_ISERVER, &interface_info_iserver);
    }

    return type_id;
}
```

Note the `g_type_add_interface_static()` function call to add interface info. The interface info is defined in a `GInterfaceInfo` struct. We just make use of the `interface_init()` callback. In it, we assign function pointers of corresponding interface to our implementation function. We can add multiple interface infos to implement them.

Finally, the test code:

```
// main.c
#include "fakeiface.h"
#include "fakedesktop.h"
#include "fakelaptop.h"
#include 

void my_dump_type(GType type_id) {
    g_print("Type id: %d\n", type_id);
    g_print("Type name: %s\n", g_type_name(type_id));
    g_print("Is fundamental? %s\n", G_TYPE_IS_FUNDAMENTAL(type_id) ? "yes" : "no");
    g_print("Is derived? %s\n", G_TYPE_IS_DERIVED(type_id) ? "yes" : "no");
    g_print("Is interface? %s\n", G_TYPE_IS_INTERFACE(type_id) ? "yes" : "no");
    g_print("Is classed? %s\n", G_TYPE_IS_CLASSED(type_id) ? "yes" : "no");
    g_print("Is instantiatable? %s\n", G_TYPE_IS_INSTANTIATABLE(type_id) ? "yes" : "no");
    g_print("Is derivable? %s\n", G_TYPE_IS_DERIVABLE(type_id) ? "yes" : "no");
    g_print("Is deep derivable? %s\n", G_TYPE_IS_DEEP_DERIVABLE(type_id) ? "yes" : "no");
    g_print("Is abstract? %s\n", G_TYPE_IS_ABSTRACT(type_id) ? "yes" : "no");
    g_print("Is value abstract? %s\n", G_TYPE_IS_VALUE_ABSTRACT(type_id) ? "yes" : "no");
    g_print("Is value type: %s\n", G_TYPE_IS_VALUE_TYPE(type_id) ? "yes" : "no");
    g_print("Has value table: %s\n", G_TYPE_HAS_VALUE_TABLE(type_id) ? "yes" : "no");
}

int main() {
    g_type_init();
    my_dump_type(FAKE_TYPE_ICLIENT);
    my_dump_type(FAKE_TYPE_ISERVER);
    my_dump_type(FAKE_TYPE_LAPTOP);
    my_dump_type(FAKE_TYPE_DESKTOP);

    FakeLaptop *laptop = (FakeLaptop *)g_object_new(FAKE_TYPE_LAPTOP, NULL);
    FakeDesktop *desktop = (FakeDesktop *)g_object_new(FAKE_TYPE_DESKTOP, NULL);
    g_print("laptop is FakeIServer? %s\n", FAKE_IS_ISERVER(laptop) ? "yes" : "no");
    g_print("laptop is FakeIClient? %s\n", FAKE_IS_ICLIENT(laptop) ? "yes" : "no");
    g_print("desktop is FakeIServer? %s\n", FAKE_IS_ISERVER(desktop) ? "yes" : "no");
    g_print("desktop is FakeIClient? %s\n", FAKE_IS_ICLIENT(desktop) ? "yes" : "no");

    /* Polynophysm */
    int i;
    FakeIServer *servers[2] = { (FakeIServer *)laptop, (FakeIServer *)desktop };
    for (i = 0; i < 2; i++) {
        FakeIServer *inst = servers[i];
        FakeIServerInterface *iface = FAKE_ISERVER_GET_INTERFACE(inst);
        if (iface) {
            iface->response(inst);
        }
    }
    FakeIClient *clients[2] = { (FakeIClient *)laptop, (FakeIClient *)desktop };
    for (i = 0; i < 2; i++) {
        FakeIClient *inst = clients[i];
        FakeIClientInterface *iface = FAKE_ICLIENT_GET_INTERFACE(inst);
        if (iface) {
            iface->request(inst);
        }
    }

    return 0;
}
```

In runtime, if your classed type implements an interface, it will be considered as the interface type (is-a).

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject6 folder.
