---
title: "OO Impelementation in Java"
date: "2011-03-13 10:40:00"
categories: 
  - "java"
tags: 
  - "oop"
---

Continue with last article, we will try to write an identical application to use OO features including: encapsulation, inheritance, polymorphism, properties, meta info and event-driven mechanism. Java supports the 3 basic features in language level. It uses interfaces to implements event-driven. To implements properties and meta info, we have to write our own code. We want to implements API like `someObject.setProperty(prop-name, prop-value)`. I write my own `NewObject` class:

```java
package my;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import my.annotation.ClassInfo;
import my.annotation.ClassInfoList;
import my.annotation.Property;
import my.annotation.PropertyAccess;

/**
 * We just set/get values as Object type. End users know the exact type of the
 * property, and they can do the conversion themselves.
 */
public class NewObject {

    private static String makeGetPropertyName(Field field) {
        String fieldName = field.getName();
        if (fieldName == null || fieldName.equals("")) {
            return null;
        }
        return "get" + Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
    }

    private static String makeSetPropertyName(Field field) {
        String fieldName = field.getName();
        if (fieldName == null || fieldName.equals("")) {
            return null;
        }
        return "set" + Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
    }

    /**
     * Get property
     * @param name
     * @return
     */
    public Object getProperty(String name) {
        Class klass = this.getClass();
        Field field = null;
        while (!klass.getName().equals(NewObject.class.getName())) {
            try {
                field = klass.getDeclaredField(name);
                break;  // found
            } catch (NoSuchFieldException e) {
                // noop
            }
            klass = klass.getSuperclass();
        }
        if (field != null) {
            Property property = field.getAnnotation(Property.class);
            if (property.value() == PropertyAccess.WRITE
                    || property.value() == PropertyAccess.READWRITE) {
                String methodName = makeGetPropertyName(field);
                try {
                    /**
                     * We can also get the value directly as below, but this
                     * bypass the getter function which is wrong.
                     * <code>
                     * field.setAccessible(true);
                     * Object value = field.get(this);
                     * field.setAccessible(false);
                     * return value;
                     * </code>
                     */
                    Method getMethod = klass.getMethod(methodName);
                    return getMethod.invoke(this);
                } catch (IllegalAccessException e) {
                    // noop
                } catch (IllegalArgumentException e) {
                    // noop
                } catch (InvocationTargetException e) {
                    // noop
                } catch (NoSuchMethodException e) {
                    // noop
                } catch (SecurityException e) {
                    // noop
                }
            }
        }
        return null;
    }

    /**
     * Set property
     * @param name
     * @param value
     */
    public void setProperty(String name, Object value) {
        Class klass = this.getClass();
        Field field = null;
        while (!klass.getName().equals(NewObject.class.getName())) {
            try {
                field = klass.getDeclaredField(name);
                break;  // found
            } catch (NoSuchFieldException e) {
                // noop
            }
            klass = klass.getSuperclass();
        }
        if (field != null) {
            Property property = field.getAnnotation(Property.class);
            if (property.value() == PropertyAccess.WRITE
                    || property.value() == PropertyAccess.READWRITE) {
                String methodName = makeSetPropertyName(field);
                try {
                    Method setMethod = klass.getMethod(methodName, field.getType());
                    setMethod.invoke(this, value);
                } catch (IllegalAccessException e) {
                    // noop
                } catch (IllegalArgumentException e) {
                    // noop
                } catch (InvocationTargetException e) {
                    // noop
                } catch (NoSuchMethodException e) {
                    // noop
                } catch (SecurityException e) {
                    // noop
                }
            }
        }
    }

    /**
     * Dump class info by given class
     * @param klass
     */
    public static void dumpClassInfo(Class klass) {
        System.out.println(klass.getCanonicalName() + "(");
        ClassInfo[] klassInfos = klass.getAnnotation(ClassInfoList.class).value();
        for (int i = 0; i < klassInfos.length; i++) {
            System.out.println(klassInfos[i].name() + "=" + klassInfos[i].value());
        }
        System.out.println(")");
    }

    /**
     * Dump class info of current object
     */
    public void dumpClassInfo() {
        Class klass = this.getClass();
        System.out.println(klass.getCanonicalName() + "(");
        ClassInfo[] klassInfos = klass.getAnnotation(ClassInfoList.class).value();
        for (int i = 0; i < klassInfos.length; i++) {
            System.out.println(klassInfos[i].name() + "=" + klassInfos[i].value());
        }
        System.out.println(")");
    }

    /**
     * Get class info by given name
     * @param name
     * @return
     */
    public String getClassInfo(String name) {
        Class klass = this.getClass();
        ClassInfo[] klassInfos = klass.getAnnotation(ClassInfoList.class).value();
        for (int i = 0; i < klassInfos.length; i++) {
            if (klassInfos[i].name().equals(name)) {
                return klassInfos[i].value();
            }
        }
        return null;
    }

}
```

To use our `setProperty()`/`getProperty()` method, all classes should derive from the `NewObject` class. To be consistent with the JavaBean convention, we assume that the getter/setter function to be "get"/"set" + capitalize_first_letter_of(member-variable-name).

`Property` annotation and `PropertyAccess` enum are defined to indicate properties:

```java
// PropertyAccess.java
package my.annotation;

public enum PropertyAccess {
    READ, WRITE, READWRITE
}
```

```java
// Property.java
package my.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Property {
    /* "value" seems to be a magic name */
    public PropertyAccess value();
}
```

`ClassInfo` and `ClassInfoList` annotation are defined to indicate class meta info:

```java
// ClassInfo.java
package my.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface ClassInfo {
    public String name();
    public String value();
}
```

```java
// ClassInfoList.java
package my.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface ClassInfoList {
    ClassInfo[] value();
}
```

Let's see how to use them, our `Base` is defined as:

```java
// Base.java
package fake;

import java.util.LinkedList;
import java.util.List;

import my.NewObject;
import my.annotation.ClassInfo;
import my.annotation.ClassInfoList;
import my.annotation.Property;
import my.annotation.PropertyAccess;

@ClassInfoList({ 
    @ClassInfo(name = "author", value = "gonwan"),
    @ClassInfo(name = "version", value = "1.0.0") 
})
public class Base extends NewObject {
    @Property(PropertyAccess.READWRITE)
    private int id;
    @Property(PropertyAccess.READWRITE)
    private String name;

    private List<IPrintInt> basePrintIntListeners;
    private List<IPrintString> basePrintStringListeners;

    public Base() {
        basePrintIntListeners = new LinkedList<IPrintInt>();
        basePrintStringListeners = new LinkedList<IPrintString>();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void virtualDump() {
        System.out.printf("Base(virtual): id=%d, name=\"%s\"\n", getId(), getName());
    }

    final public void nonvirtualDump() {
        System.out.printf("Base(nonvirtual): id=%d, name=\"%s\"\n", getId(), getName());
    }

    public void addBasePrintIntListener(IPrintInt listener) {
        basePrintIntListeners.add(listener);
    }

    public void addBasePrintStringListener(IPrintString listener) {
        basePrintStringListeners.add(listener);
    }

    public void fireBasePrintIntEvent(int i) {
        for (IPrintInt listener : basePrintIntListeners) {
            listener.printInt(i);
        }
    }

    public void fireBasePrintStringEvent(String str) {
        for (IPrintString listener : basePrintStringListeners) {
            listener.PrintString(str);
        }
    }

}
```

Since our implementation of properties are simply methods, they can be inherited by subclasses. But the class meta info cannot be retrieved in subclasses. They just get their own.

I do not want to demo events/listeners code here, just find them in source code in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestJavaObject-{date}.zip file.
