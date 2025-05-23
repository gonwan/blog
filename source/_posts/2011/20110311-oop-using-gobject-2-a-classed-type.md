---
title: "OOP Using GObject (2) - A Classed Type"
date: "2011-03-11"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

In last article, we defined a fundamental type. But nothing can be done with it. Now, we will extend it to be a classed type, say adding class info into our fundamental type. To do this, we should define a class struct, which can be regard as the meta info of a C++ class:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
typedef struct _FooClass {
    /*
     * Official document:
     * All class structures must contain as first member a GTypeClass structure.
     */
    GTypeClass parent;
    /*
     * Since glib 2.24, there're new functions to keep privacy.
     */
    int i;
    void (*bar)();
} FooClass;
```

`GTypeClass` should be the first member of a class struct. You can image the i field to be the version of the class. And we can add a string field to hold the author of this class. There's also a function pointer bar(). As you may already know, it is used to implement polymorphism, which can be regard as virtual function of a C++ class.

When registering our fundamental type, additional field in `GTypeInfo` and `GTypeFundamentalInfo` are filled:

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
            0,                  /* instance_size */
            0,                  /* n_preallocs */
            NULL,               /* instance_init */
            NULL                /* value_table */
        };
        /* G_TYPE_FLAG_CLASSED: Indicates a classed type */
        GTypeFundamentalInfo foo_type_fundamental_info = { G_TYPE_FLAG_CLASSED };
        foo_type = g_type_register_fundamental(g_type_fundamental_next(),
            "FooClassedFundamentalType", &foo_type_info, &foo_type_fundamental_info, 0);
    }
    return foo_type;
}
```

`GTypeInfo` is the key data structure of GObject type system. It defines how a classed type should be initialized and finalized. Here, we just assigned the `class_init()` callback. It is called when our `FooClass` needs initialization. For fundamental and static types, their `class_finalize()` are never called. We will demo the usage of this callback when introducing dynamic types. Please also note the `G_TYPE_FLAG_CLASSED` flag passed into `GTypeFundamentalInfo` struct.

Now, let's implement our `foo_class_init()` function. This function is used to initialize fields and assign virtual functions in most time:

```
void foo_class_bar();

void foo_class_init(FooClass *klass, gpointer data) {
    klass->i = 129;
    klass->bar = foo_class_bar;
    printf("Calling foo_class_init(): i=%d\n", klass->i);
}

void foo_class_bar() {
    printf("Invoking foo_class_bar()\n");
}
```

Now, we've finished our definition of the class struct. Let's see how to use it:

```
int main() {
    g_type_init();
    my_dump_type(foo_get_type());

    FooClass *klass = (FooClass *)g_type_class_ref(foo_get_type());
    klass->bar();
    g_type_class_unref(klass);

    return 0;
}
```

See? We use `g_type_class_ref()` and `g_type_class_unref()` to ref/unref a class, and invoke a function. But its function is still limited. We can just get/set its meta info. It still cannot be instantiated. This will be discussed in the next article.

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject2 folder.
