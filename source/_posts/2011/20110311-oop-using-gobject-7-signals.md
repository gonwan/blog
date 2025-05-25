---
title: "OOP Using GObject (7) - Signals"
date: "2011-03-11 14:36:00"
categories: 
  - "cpp"
tags: 
  - "gobject"
  - "oop"
---

Signals in GObject are used to support a event-driven programming. Signals can be connected to callback handlers. When they are emitted, these handlers are invoked. To add signals to a type, notice following lines of code:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```cpp
static void fake_base_class_init(FakeBaseClass *klass, gpointer data) {
    // ...
    /* signals */
    g_signal_new("base-signal-int", FAKE_TYPE_BASE, G_SIGNAL_RUN_LAST, 0,
        NULL, NULL, g_cclosure_marshal_VOID__INT, G_TYPE_NONE, 1, G_TYPE_INT, NULL);
    g_signal_new("base-signal-string", FAKE_TYPE_BASE, G_SIGNAL_RUN_LAST, 0,
        NULL, NULL, g_cclosure_marshal_VOID__STRING, G_TYPE_NONE, 1, G_TYPE_STRING, NULL);
    // ...
}
```

Like properties, signals can be inherited too. Use signals like:

```cpp
int main() {
    // ...
    FakeBase *base = (FakeBase *)g_object_new(FAKE_TYPE_BASE, NULL);
    FakeDerived *derived = (FakeDerived *)g_object_new(FAKE_TYPE_DERIVED, NULL);
    /* Test for signals */
    /* 1 <-> 1 */
    g_signal_connect(base, "base-signal-int", G_CALLBACK(print_int1), NULL);
    g_signal_connect(base, "base-signal-string", G_CALLBACK(print_string1), NULL);
    g_signal_emit_by_name(base, "base-signal-int", 12345);
    g_signal_emit_by_name(base, "base-signal-string", "abcde");
    /* 1 <-> 1+ */
    g_signal_connect(base, "base-signal-int", G_CALLBACK(print_int2), NULL);
    g_signal_emit_by_name(base, "base-signal-int", 123456);
    /* signal inheritance */
    g_signal_connect(derived, "base-signal-int", G_CALLBACK(print_int1), NULL);
    g_signal_connect(derived, "base-signal-string", G_CALLBACK(print_string1), NULL);
    g_signal_connect(derived, "derived-signal-int", G_CALLBACK(print_int2), NULL);
    g_signal_connect(derived, "derived-signal-string", G_CALLBACK(print_string2), NULL);
    g_signal_emit_by_name(derived, "base-signal-int", 1234567);
    g_signal_emit_by_name(derived, "base-signal-string", "abcdefg");
    g_signal_emit_by_name(derived, "derived-signal-int", 1234567);
    g_signal_emit_by_name(derived, "derived-signal-string", "abcdefg");
    // ...
}
```

The callback functions are defined simply like:

```cpp
void print_int1(GObject *sender, int i, gpointer data) {
    if (FAKE_IS_DERIVED(sender)) {
        g_print("Invoking print_int1(): derived.i=%d\n", i);
    } else if (FAKE_IS_BASE(sender)) {
        g_print("Invoking print_int1(): base.i=%d\n", i);
    }
}

void print_int2(GObject *sender, int i, gpointer data) {
    if (FAKE_IS_DERIVED(sender)) {
        g_print("Invoking print_int2(): derived.i=%d\n", i);
    } else if (FAKE_IS_BASE(sender)) {
        g_print("Invoking print_int2(): base.i=%d\n", i);
    }
}

void print_string1(GObject *sender, gchar* str, gpointer data) {
    if (FAKE_IS_DERIVED(sender)) {
        g_print("Invoking print_string1(): derived.str=\"%s\"\n", str);
    } else if (FAKE_IS_BASE(sender)) {
        g_print("Invoking print_string1(): base.str=\"%s\"\n", str);
    }
}

void print_string2(GObject *sender, gchar* str, gpointer data) {
    if (FAKE_IS_DERIVED(sender)) {
        g_print("Invoking print_string2(): derived.str=\"%s\"\n", str);
    } else if (FAKE_IS_BASE(sender)) {
        g_print("Invoking print_string2(): base.str=\"%s\"\n", str);
    }
}
```

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject5 folder.
