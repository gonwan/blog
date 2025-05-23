---
title: "C++ Class Layout Using MSVC"
date: "2010-09-20 17:28:00"
categories: 
  - "cc"
tags: 
  - "msvc"
---

The article is originally inspired by this one: [http://www.openrce.org/articles/full_view/23](http://www.openrce.org/articles/full_view/23). The undocumented parameters in MSVC++ compiler are: /d1reportSingleClassLayout<classname> and /d1reportAllClassLayout.

A simple example:

```cpp
class CBase {
    int a;
public:
    virtual void foo() { }
};

class CDerived1: public CBase {
    int a1;
public:
    virtual void foo1() { }
};

class CDerived2: virtual public CBase {
    int a2;
public:
    virtual void foo() { }
    virtual void foo2() { }
};
```

The dumped layout:

```
class CBase size(8):
        +---
 0      | {vfptr}
 4      | a
        +---

CBase::$vftable@:
        | &CBase_meta
        |  0
 0      | &CBase::foo

CBase::foo this adjustor: 0


class CDerived1 size(12):
        +---
        | +--- (base class CBase)
 0      | | {vfptr}
 4      | | a
        | +---
 8      | a1
        +---

CDerived1::$vftable@:
        | &CDerived1_meta
        |  0
 0      | &CBase::foo
 1      | &CDerived1::foo1

CDerived1::foo1 this adjustor: 0


class CDerived2 size(20):
        +---
 0      | {vfptr}
 4      | {vbptr}
 8      | a2
        +---
        +--- (virtual base CBase)
12      | {vfptr}
16      | a
        +---

CDerived2::$vftable@CDerived2@:
        | &CDerived2_meta
        |  0
 0      | &CDerived2::foo2

CDerived2::$vbtable@:
 0      | -4
 1      | 8 (CDerived2d(CDerived2+4)CBase)

CDerived2::$vftable@CBase@:
        | -12
 0      | &CDerived2::foo

CDerived2::foo this adjustor: 12
CDerived2::foo2 this adjustor: 0

vbi:       class  offset o.vbptr  o.vbte fVtorDisp
           CBase      12       4       4 0
```

You see: When using virtual inheritance, an additional vbptr is added into class layout. There is also a separated section containing the virtual base class, with vbptr pointing to it. So, the object size of virtual inheritance is bigger than non-virtual inheritance.

Now, here is a complex example:

```cpp
class CBase1 {
    int a1;
public:
    virtual void foo1() { }
};

class CBase2 : public virtual CBase1 {
    int a2;
public:
    virtual void foo2() { }
};

class CBase3 : public virtual CBase1 {
    int a3;
public:
    virtual void foo3() { }
};

class CBase4 : public CBase1 {
    int a4;
public:
    virtual void foo4() { }
};

class CDerive: public CBase2, public CBase3, public CBase4 {
    int b;
public:
    virtual void bar() { }
};
```

The dumped layout:

```
class CBase1 size(8):
        +---
 0      | {vfptr}
 4      | a1
        +---

CBase1::$vftable@:
        | &CBase1_meta
        |  0
 0      | &CBase1::foo1
CBase1::foo1 this adjustor: 0


class CBase2 size(20):
        +---
 0      | {vfptr}
 4      | {vbptr}
 8      | a2
        +---
        +--- (virtual base CBase1)
12      | {vfptr}
16      | a1
        +---

CBase2::$vftable@CBase2@:
        | &CBase2_meta
        |  0
 0      | &CBase2::foo2

CBase2::$vbtable@:
 0      | -4
 1      | 8 (CBase2d(CBase2+4)CBase1)

CBase2::$vftable@CBase1@:
        | -12
 0      | &CBase1::foo1

CBase2::foo2 this adjustor: 0

vbi:       class  offset o.vbptr  o.vbte fVtorDisp
          CBase1      12       4       4 0


class CBase3 size(20):
        +---
 0      | {vfptr}
 4      | {vbptr}
 8      | a3
        +---
        +--- (virtual base CBase1)
12      | {vfptr}
16      | a1
        +---

CBase3::$vftable@CBase3@:
        | &CBase3_meta
        |  0
 0      | &CBase3::foo3

CBase3::$vbtable@:
 0      | -4
 1      | 8 (CBase3d(CBase3+4)CBase1)

CBase3::$vftable@CBase1@:
        | -12
 0      | &CBase1::foo1

CBase3::foo3 this adjustor: 0

vbi:       class  offset o.vbptr  o.vbte fVtorDisp
          CBase1      12       4       4 0


class CBase4 size(12):
        +---
        | +--- (base class CBase1)
 0      | | {vfptr}
 4      | | a1
        | +---
 8      | a4
        +---

CBase4::$vftable@:
        | &CBase4_meta
        |  0
 0      | &CBase1::foo1
 1      | &CBase4::foo4

CBase4::foo4 this adjustor: 0


class CDerive size(48):
        +---
        | +--- (base class CBase2)
 0      | | {vfptr}
 4      | | {vbptr}
 8      | | a2
        | +---
        | +--- (base class CBase3)
12      | | {vfptr}
16      | | {vbptr}
20      | | a3
        | +---
        | +--- (base class CBase4)
        | | +--- (base class CBase1)
24      | | | {vfptr}
28      | | | a1
        | | +---
32      | | a4
        | +---
36      | b
        +---
        +--- (virtual base CBase1)
40      | {vfptr}
44      | a1
        +---

CDerive::$vftable@CBase2@:
        | &CDerive_meta
        |  0
 0      | &CBase2::foo2
 1      | &CDerive::bar

CDerive::$vftable@CBase3@:
        | -12
 0      | &CBase3::foo3

CDerive::$vftable@:
        | -24
 0      | &CBase1::foo1
 1      | &CBase4::foo4

CDerive::$vbtable@CBase2@:
 0      | -4
 1      | 36 (CDerived(CBase2+4)CBase1)

CDerive::$vbtable@CBase3@:
 0      | -4
 1      | 24 (CDerived(CBase3+4)CBase1)

CDerive::$vftable@CBase1@:
        | -40
 0      | &CBase1::foo1

CDerive::func5 this adjustor: 0

vbi:       class  offset o.vbptr  o.vbte fVtorDisp
          CBase1      40       4       4 0
```

The layout of CDerive class is so complicated. First, it has 3 base classes, 1 field and 1 virtual base section. The the first 2 base classes(CBase2, CBase3) have their vbptr pointed to the address of the virtual base section.
