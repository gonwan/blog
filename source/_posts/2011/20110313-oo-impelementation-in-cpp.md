---
title: "OO Impelementation in C++"
date: "2011-03-13 09:51:00"
categories: 
  - "cpp"
tags: 
  - "oop"
  - "qt"
---

From the last series of GObject library, we know the approach of OOP using C. Now, I just want to have a comparison of OO implementation in all leading programming languages: C, C++, Java and C#. I will use C++/Qt in this article. Apart from basic features like encapsulation, inheritance, polymorphism, I will demonstrate how to use advanced features including properties, meta info and event-driven programming.

Now, let's start. Since C++ supports inheritance and polymorphism in language level. They are not the problem. When encounter encapsulation, it does not do well. We CAN declare member variables as private to prohibit their directly access. But the internal implementation is still exposed. When adding/removing private member variables, the class structure is changed. This can cause binary compatible issues. According to the guide of Qt, we define a private class to hold all private member variables, and add the pointer of it to our public class. The size of pointer is constant in all platforms, so this will not break the binary compatibility. Here's the code:

**NOTE**: To use Qt's object mechanism, your class should inherit `QObject` class and include the `Q_OBJECT` macro.

```cpp
// qfakebase.h
#ifndef QFAKEBASE_H
#define QFAKEBASE_H

#include <QtCore/QObject>
#include <QtCore/QString>


namespace Fake {

class QBasePrivate;

class QBase : public QObject
{
    Q_OBJECT
    Q_DECLARE_PRIVATE(QBase)
    Q_CLASSINFO("Author", "gonwan")
    Q_CLASSINFO("Version", "1.0.0")
    Q_PROPERTY(int id READ id WRITE setId)
    Q_PROPERTY(QString name READ name WRITE setName)

public:
    explicit QBase(QObject *parent=0);
    virtual ~QBase();
    int id();
    void setId(int id);
    QString name();
    void setName(QString name);
    virtual void virtualDump();
    void nonvirtualDump();
    /*
     * All signals are defined protected, they can be only emit by
     * themselves or their subclasses. So we add these two help function
     * to help to emit our singals.
     */
    void emitBasePrintInt(int i);
    void emitBasePrintString(QString str);

protected:
    QBasePrivate *const d_ptr;

signals:
    void basePrintInt(int i);
    void basePrintString(QString str);

};


}  // namespace Fake


#endif // QFAKEBASE_H
```

```cpp
// qfakebase.cpp
#include "qfakebase.h"
#include <stdio.h>


namespace Fake {


/* private class */
class QBasePrivate
{
    //Q_DECLARE_PUBLIC(QBase)
public:
    int id;
    QString name;
};


/* public class */
QBase::QBase(QObject *parent)
    : QObject(parent), d_ptr(new QBasePrivate) {
}

QBase::~QBase() {
    delete d_ptr;
}

int QBase::id() {
    Q_D(QBase);
    return d->id;
}

void QBase::setId(int id) {
    Q_D(QBase);
    d->id = id;
}

QString QBase::name() {
    Q_D(QBase);
    return d->name;
}

void QBase::setName(QString name) {
    Q_D(QBase);
    d->name = name;
}

void QBase::virtualDump() {
    printf("QBase(virtual): id=%d, name=\"%s\"\n", id(), qPrintable(name()));
}

void QBase::nonvirtualDump() {
    printf("QBase(nonvirtual): id=%d, name=\"%s\"\n", id(), qPrintable(name()));
}

void QBase::emitBasePrintInt(int i) {
    emit basePrintInt(i);
}

void QBase::emitBasePrintString(QString str) {
    emit basePrintString(str);
}


}  // namespace Fake
```

Just note the forward declaration of `QBasePrivate` private class. It is define in `*.c` file, and cannot be used by client applications. We defined a `d_ptr` protected member variable of this type to hold all private data values. Qt library provideds a series of easy-to-use macros to support this scheme to implementation:

```cpp
// qglobal.h
#define Q_DECLARE_PRIVATE(Class) \
    inline Class##Private* d_func() { return reinterpret_cast<Class##Private *>(d_ptr); } \
    inline const Class##Private* d_func() const { return reinterpret_cast<const Class##Private *>(d_ptr); } \
    friend class Class##Private;

#define Q_DECLARE_PUBLIC(Class) \
    inline Class* q_func() { return static_cast<Class *>(q_ptr); } \
    inline const Class* q_func() const { return static_cast<const Class *>(q_ptr); } \
    friend class Class;

#define Q_D(Class) Class##Private * const d = d_func()
#define Q_Q(Class) Class * const q = q_func()
```

Qt library supports properties and meta info. properties are defined with `Q_PROPERTY`macro, while class meta info are defined with `Q_CLASSINFO`. Both of them can be inherited by derived classes. Last is Qt's event-driven mechanism: signals/slots. Since they are also based on `QObject`, we had to define a test class to include all slots:

```cpp
// mytestclass.h
#ifndef MYTESTCLASS_H
#define MYTESTCLASS_H

#include <QtCore/QObject>
#include <stdio.h>


/*
 * Qt's signal/slot mechanism only works with
 * QObject-derived classes. So we define a test class here.
 */
class MyTestClass : public QObject {
    Q_OBJECT
public slots:
    void printInt1(int i) {
        QString name = sender()->metaObject()->className();
        printf("Invoking printInt1(): %s.i=%d\n", qPrintable(name), i);
    }
    void printInt2(int i) {
        QString name = sender()->metaObject()->className();
        printf("Invoking printInt2(): %s.i=%d\n", qPrintable(name), i);
    }
    void printString1(QString str) {
        QString name = sender()->metaObject()->className();
        printf("Invoking printString1(): %s.str=%s\n", qPrintable(name), qPrintable(str));
    }
    void printString2(QString str) {
        QString name = sender()->metaObject()->className();
        printf("Invoking printString2(): %s.str=%s\n", qPrintable(name), qPrintable(str));
    }
};


#endif // MYTESTCLASS_H
```

Test code:

```cpp
#include <stdio.h>
#include <QtCore/QMetaClassInfo>
#include <QtCore/QObject>
#include <QtCore/QVariant>
#include "qfakebase.h"
#include "qfakederived.h"
#include "mytestclass.h"

using namespace Fake;


void myDumpClass(QMetaObject metaObject) {
    printf("%s (\n", metaObject.className());
    int start = metaObject.superClass()->classInfoCount();
    for (int i = start; i < metaObject.classInfoCount(); i++) {
        printf("%s=\"%s\"\n",
            metaObject.classInfo(i).name(), metaObject.classInfo(i).value());
    }
    printf(")\n");
}

int main() {
    /* Test class */
    myDumpClass(QBase::staticMetaObject);
    myDumpClass(QDerived::staticMetaObject);
    /* Test property */
    QBase base;
    base.setId(111);
    base.setProperty("name", QVariant("aaa"));
    base.nonvirtualDump();
    QDerived derived;
    derived.setId(222);
    derived.setAge(333);
    derived.setProperty("name", QVariant("bbb"));
    derived.setProperty("hash", QVariant("ccc"));
    derived.nonvirtualDump();
    /* Test polymorphism */
    QBase *objs[2] = { &base, &derived };
    for (int i = 0; i < 2; i++) {
        objs[i]->virtualDump();
    }
    /* Test signal/slot */
    /* 1 <-> 1 */
    MyTestClass instance;
    QObject::connect(&base, 
        SIGNAL(basePrintInt(int)), &instance, SLOT(printInt1(int)));
    QObject::connect(&base, 
        SIGNAL(basePrintString(QString)), &instance, SLOT(printString1(QString)));
    base.emitBasePrintInt(12345);
    base.emitBasePrintString("abcde");
    /* 1 <-> 1+ */
    QObject::connect(&base, 
        SIGNAL(basePrintInt(int)), &instance, SLOT(printInt2(int)));
    base.emitBasePrintInt(123456);
    /* signal inheritance */
    QObject::connect(&derived, 
        SIGNAL(basePrintInt(int)), &instance, SLOT(printInt1(int)));
    QObject::connect(&derived, 
        SIGNAL(basePrintString(QString)), &instance, SLOT(printString1(QString)));
    QObject::connect(&derived, 
        SIGNAL(derivedPrintInt(int)), &instance, SLOT(printInt2(int)));
    QObject::connect(&derived, 
        SIGNAL(derivedPrintString(QString)), &instance, SLOT(printString2(QString)));
    derived.emitBasePrintInt(1234567);
    derived.emitBasePrintString("abcdefg");
    derived.emitDerivedPrintInt(1234567);
    derived.emitDerivedPrintString("abcdefg");

}
```

All source code is available in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestQObject-{date}.zip file.
