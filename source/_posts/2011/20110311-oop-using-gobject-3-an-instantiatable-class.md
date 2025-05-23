---
title: "OOP Using GObject (3) - An Instantiatable Class"
date: "2011-03-11 08:10:00"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

We will make fundamental type instantiatable and complete our first usage sample in this article. An object class should be defined firstly:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
/* Foo object struct */
typedef struct _Foo {
    /*
     * Official document:
     * All instance structures must contain as first member a TypeInstance structure.
     */
    GTypeInstance parent;
    /* instance variable */
    int foo_instance_i;
} Foo;
```

Also, we re-define the class struct:

```
/* Foo class struct */
typedef struct _FooClass {
    /*
     * Official document:
     * All class structures must contain as first member a GTypeClass structure.
     */
    GTypeClass parent;
} FooClass;

/* static field of Foo class */
int foo_class_i;

/* static method of Foo class */
void foo_class_set_i(int i) {
    foo_class_i = i;
    printf("Invoking foo_class_set_i(): foo_class_i=%d\n", foo_class_i);
}
```

`GTypeClass` should be the first member of a class struct, while `TypeInstance` the first member of a object struct. You may wonder why there's two int variable in both struct. The `foo_class_i` is like a static variable in C++ class, while The `foo_instance_i` is like an instance variable in C++ class. And remember fields in a class struct? It is used as meta info.

The registry function also need modification:

```
GType foo_get_type() {
    static GType foo_type = 0;
    if (foo_type == 0) {
        static const GTypeInfo foo_type_info = {
            sizeof(FooClass),   /* class_size */
            NULL,               /* base_init */
            NULL,               /* base_finalize */
            (GClassInitFunc)foo_class_init, /* class_init */
            NULL,               /* class_finalize */
            NULL,               /* class_data */
            sizeof(Foo),        /* instance_size */
            0,                  /* n_preallocs */
            (GInstanceInitFunc)foo_instance_init, /* instance_init */
            NULL                /* value_table */
        };
        /* G_TYPE_FLAG_INSTANTIATABLE: Indicates an instantiable type (implies classed) */
        GTypeFundamentalInfo foo_type_fundamental_info = {
            G_TYPE_FLAG_CLASSED | G_TYPE_FLAG_INSTANTIATABLE
        };
        foo_type = g_type_register_fundamental(g_type_fundamental_next(),
            "FooClassedFundamentalType", &foo_type_info, &foo_type_fundamental_info, 0);
    }
    return foo_type;
}
```

We assigned the `instance_init()` callback. It is called when a instance of our `Foo` class is created. You may ask where is the corresponding `instance_finalize()` callback? Hey, we will discuss it in upcoming articles. The `instance_init()` callback can be regarded as the constructor of a C++ class. Note, an additional `G_TYPE_FLAG_INSTANTIATABLE` flag is also added in the `GTypeFundamentalInfo` struct.

Let's see how to create an instance:

```
int main() {
    g_type_init();
    my_dump_type(foo_get_type());

    /* Use g_type_create_instance if implement a fundamental class */
    Foo *foo = (Foo *)g_type_create_instance(foo_get_type());
    foo_class_set_i(101);
    foo_instance_set_i(foo, 201);

    printf("Is instance of int? %s\n",
        G_TYPE_CHECK_INSTANCE_TYPE(foo, G_TYPE_INT) ? "yes" : "no");
    printf("Is instance of FooClassedFundamentalType? %s\n",
        G_TYPE_CHECK_INSTANCE_TYPE(foo, foo_get_type()) ? "yes" : "no");

    return 0;
}
```

Congratulations! You've finished the learning of our fundamental sample.

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject3 folder.
