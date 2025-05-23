---
title: "Exception Safety with shared_ptr"
date: "2014-02-10 07:16:00"
categories: 
  - "cc"
tags: 
  - "boost"
  - "shared_ptr"
---

Code snippet:

```
#include 
#include 

class A {
public:
    A() { std::cout << "in A::A()." << std::endl; }
    ~A() { std::cout << "in A::~A()." << std::endl; }
};

class B {
public:
    B() { std::cout << "in B::B()." << std::endl; throw 1024; }
    ~B() { std::cout << "in B::~B()." << std::endl; }
};

class C {
public:
    C() : m_a(new A), m_b(new B) { }
#ifndef _USE_SHARED_PTR
    ~C() { delete m_b; delete m_a; }
#endif
private:
#ifndef _USE_SHARED_PTR
    A *m_a;
    B *m_b;
#else
    boost::shared_ptr m_a;
    boost::shared_ptr m_b;
#endif
};

int main() {
    try { C c; } catch (...) { }
    return 0;
}
```

**

Output:

```
binson@binson-precise:~$ g++ ptr.cpp -o ptr
binson@binson-precise:~$ ./ptr
in A::A().
in B::B().
binson@binson-precise:~$ g++ -D_USE_SHARED_PTR ptr.cpp -o ptr
binson@binson-precise:~$ ./ptr
in A::A().
in B::B().
in A::~A().
```

Exception safety is ensured, when using `shared_ptr`. Memory allocated by m_a is freed even when an exception is thrown. The trick is: the destructor of class `shared_ptr` is invoked after the destructor of class `C`.**
