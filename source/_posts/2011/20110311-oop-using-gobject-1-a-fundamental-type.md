---
title: "OOP Using GObject (1) - A Fundamental Type"
date: "2011-03-11 06:20:00"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

These days, I tried to write C code with OO support. I found [GObject](http://library.gnome.org/devel/gobject/stable/) is such a well-designed library to simplify my implementation. However, the official documents is not so clear sometimes.  It do not provide sufficient information about all its stuff. I had to write my own demo applications to test the usage of some function. Moreover, the source code were also checked for reference.

There are 3 types in GObject type system: Fundamental, static and dynamic. Fundamental types are top-most types. The do not have parent types. They are seldom used, since all fundamental types are pre-defined rather than user-defined.

In this article, I will try to define a fundamental type using in GObject.Here's the code on how to register a basic fundamental type in GObject, and how it can be used.

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
#include 
#include 

int main() {
    /* Initialize type system */
    g_type_init();

    /* This is not important */
    GTypeInfo my_type_info = { 0, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL };
    /* This is not important */
    GTypeFundamentalInfo my_type_fundamental_info = { 0 };
    /* Register a fundamental type */
    GType my_type_id = g_type_register_fundamental(g_type_fundamental_next(),
        "MyFundamentalType", &my_type_info, &my_type_fundamental_info, 0);

    /* Print type names */
    printf("Type name of int: %s\n", g_type_name(G_TYPE_INT));
    printf("Type name of float: %s\n", g_type_name(G_TYPE_FLOAT));
    printf("Type name of object: %s\n", g_type_name(G_TYPE_OBJECT));
    printf("Type name of my fundamental type: %s\n", g_type_name(my_type_id));
    /* Print type id and name of MyFundamentalType */
    printf("Type id: %d\n", g_type_from_name("MyFundamentalType"));
    printf("Type name: %s\n", g_type_name(g_type_from_name("MyFundamentalType")));
    /* Print attributes of MyFundamentalType */
    printf("Is fundamental? %s\n", G_TYPE_IS_FUNDAMENTAL(my_type_id) ? "yes" : "no");
    printf("Is derived? %s\n", G_TYPE_IS_DERIVED(my_type_id) ? "yes" : "no");
    printf("Is interface? %s\n", G_TYPE_IS_INTERFACE(my_type_id) ? "yes" : "no");
    printf("Is classed? %s\n", G_TYPE_IS_CLASSED(my_type_id) ? "yes" : "no");
    printf("Is instantiatable? %s\n", G_TYPE_IS_INSTANTIATABLE(my_type_id) ? "yes" : "no");
    printf("Is derivable? %s\n", G_TYPE_IS_DERIVABLE(my_type_id) ? "yes" : "no");
    printf("Is deep derivable? %s\n", G_TYPE_IS_DEEP_DERIVABLE(my_type_id) ? "yes" : "no");
    printf("Is abstract? %s\n", G_TYPE_IS_ABSTRACT(my_type_id) ? "yes" : "no");
    printf("Is value abstract? %s\n", G_TYPE_IS_VALUE_ABSTRACT(my_type_id) ? "yes" : "no");
    printf("Is value type: %s\n", G_TYPE_IS_VALUE_TYPE(my_type_id) ? "yes" : "no");
    printf("Has value table: %s\n", G_TYPE_HAS_VALUE_TABLE(my_type_id) ? "yes" : "no");

    return 0;
}
```

My fundamental type is created by calling `g_type_register_fundamental()` function. A `GTypeInfo` and a `GTypeFundamentalInfo` struct are passed as parameters. And here comes the linux Makefile. You can use pkg-config to replace my include and lib paths:

```
CC      := gcc
CFLAGS  := -ansi -Wall
INCPATH := -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include
LIBS    := -lgobject-2.0
TARGET  := TestGObject1
OBJS    := main.o

all: $(OBJS)
    $(CC) $(CFLAGS) ${LIBS} $(OBJS) -o $(TARGET)

%.o: %.c
    $(CC) $(CFLAGS) $(INCPATH) -c $<

clean:
    rm -f *~
    rm -f *.o
    rm -f $(TARGET)
```

**NOTE**: REPLACE THE WHITESPACE WITH TAB IN MAKEFILES, IF YOU COPY THE CODE DIRECTLY.

The fundamental type is of no use at all presently. In the next article, I will extend my code to add class meta info.

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject1 folder.
