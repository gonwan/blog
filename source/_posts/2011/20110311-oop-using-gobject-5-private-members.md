---
title: "OOP Using GObject (5) - Private Members"
date: "2011-03-11 09:39:00"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

Here's some trivial note on using GObject library.

### 1\. Private members

Recall our definition of `Base` type:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
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
```

It expose the visibility of `base_instance_i` field. We should keep encapsulation in OOP. GObject library has support for this. We can define the class as:

```
/* private data of Base object */
typedef struct _FakeBasePrivate FakeBasePrivate;

/* Base object struct */
typedef struct _FakeBase {
    /* GObject as the first field */
    GObject parent;
    /* private data */
    FakeBasePrivate *priv;
} FakeBase;

/* Base class struct */
typedef struct _FakeBaseClass {
    /*
     * The type GObject is supposed to be the base class of other user-defined classes.
     *   - Reference count support.
     *   - Support adding properties to GObject subclasses.
     *   - Support signals for asynchronized event handling like "event" in C#.
     */
    /* GObjectClass as the first field */
    GObjectClass parent;
    /*
     * Since glib 2.24, there're new functions to keep privacy:
     *   - g_type_add_class_private()
     *   - g_type_class_get_private()
     */
    /* private static field */
    gint version;
    /* private dynamic field */
    gchar *author;
    /* instance method, used as a virtual method */
    void (*virtual_dump)(struct _FakeBase *instance);
} FakeBaseClass;
```

We declare a new `FakeBasePrivate` struct to contain all private field used in `FakeBase` type. And the private struct is defined in \*.c file, so its internal representation remains invisible. Then in \*.c file, we got:

```
struct _FakeBasePrivate {
    gint id;
    gchar *name;
};

static void fake_base_class_init(FakeBaseClass *klass, gpointer data) {
    // ...
    /* Registers a private structure for an instantiable type. */
    g_type_class_add_private(klass, sizeof(FakeBasePrivate));
    // ...
}

static void fake_base_instance_init(FakeBase *instance, gpointer data) {
    // ...
    instance->priv = 
        G_TYPE_INSTANCE_GET_PRIVATE(instance, FAKE_TYPE_BASE, FakeBasePrivate);
    // ...
}
```

The private member is malloc in `class_init()` callback, and is ready to use after invoking `instance_init()`. When we will use property mechanism to get/set these private field later.

### 2\. Naming convention

Official document: [http://library.gnome.org/devel/gobject/stable/gtype-conventions.html](http://library.gnome.org/devel/gobject/stable/gtype-conventions.html). Just follow it to make your code more readable.

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject5 folder.
