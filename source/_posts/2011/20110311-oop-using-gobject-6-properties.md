---
title: "OOP Using GObject (6) - Properties"
date: "2011-03-11"
categories: 
  - "cc"
tags: 
  - "gobject"
  - "oop"
---

Properties are supported by the GObject library. To use it, you should override the `set_property()` and `get_property()` function in `GObjectClass`:

**NOTE**: PLEASE READ ALL COMMENT CAREFULLY.

```
enum {
    PROP_0,
    PROP_BASE_ID,
    PROP_BASE_NAME
};

static void fake_base_set_property(GObject *object,
    guint property_id, const GValue *value, GParamSpec *pspec) {
    FakeBase *self = FAKE_BASE(object);
    switch (property_id) {
        case PROP_BASE_ID:
            self->priv->id = g_value_get_int(value);
            break;
        case PROP_BASE_NAME:
            g_free(self->priv->name);
            self->priv->name = g_value_dup_string(value);
            break;
        default:
            /* We don't have any other property... */
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void fake_base_get_property(GObject *object,
    guint property_id, GValue *value, GParamSpec *pspec) {
    FakeBase *self = FAKE_BASE(object);
    switch (property_id) {
        case PROP_BASE_ID:
            g_value_set_int(value, self->priv->id);
            break;
        case PROP_BASE_NAME:
            g_value_set_string(value, self->priv->name);
            break;
        default:
            /* We don't have any other property... */
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void fake_base_class_init(FakeBaseClass *klass, gpointer data) {
    // ...
    /* properties */
    GObjectClass *gobject_klass = G_OBJECT_CLASS(klass);
    gobject_klass->set_property = fake_base_set_property;
    gobject_klass->get_property = fake_base_get_property;
    GParamSpec *pspec;
    pspec = g_param_spec_int("base-id", "Base ID", 
        "Set/Get Base ID", -1000, 1000, 0, G_PARAM_CONSTRUCT_ONLY | G_PARAM_READWRITE);
    g_object_class_install_property(gobject_klass, PROP_BASE_ID, pspec);
    pspec = g_param_spec_string("base-name",
        "Base Name", "Set/Get Base Name ", NULL, G_PARAM_READWRITE);
    g_object_class_install_property(gobject_klass, PROP_BASE_NAME, pspec);
    // ...
}
```

All APIs are clear and easy to use, please refer to the official document. Last but not least, properties can be inherited by derived classes. Here's my test code:

```
int main() {
    // ...
    /* Base object */
    FakeBase *base = (FakeBase *)g_object_new(FAKE_TYPE_BASE, "base-id", 111, NULL);
    GValue base_name = { 0 };
    g_value_init(&base_name, G_TYPE_STRING);
    g_value_set_static_string(&base_name, "aaa");
    g_object_set_property(G_OBJECT(base), "base-name", &base_name);
    g_value_unset(&base_name);
    /* Derived object */
    FakeDerived *derived = (FakeDerived *)g_object_new(
        FAKE_TYPE_DERIVED, "base-id", 222, "derived-age", 333, NULL);
    g_object_set(derived, "base-name", "bbb", "derived-hash", "ccc", NULL);
    // ...
}
```

As you see, we can get/set properties one by one or using a parameter list.

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestGObject-{date}.zip/TestGObject5 folder.
