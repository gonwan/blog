---
title: "Pointer-to-function Vs Pointer-to-member-function"
date: "2013-06-25 05:53:00"
categories: 
  - "cc"
---

There's a series of C++ FAQ: [http://www.parashift.com/c++-faq/pointers-to-members.html](http://www.parashift.com/c++-faq/pointers-to-members.html). And one of it addresses some technical details:

> Pointers to member functions and pointers to data are not necessarily represented in the same way. A pointer to a member function might be a data structure rather than a single pointer. Think about it: if it's pointing at a virtual function, it might not actually be pointing at a statically resolvable pile of code, so it might not even be a normal address - it might be a different data structure of some sort.

Let's write some demo code:

```
#include 
using namespace std;

class A
{
public:
    void fun1();
};

class B
{
public:
    virtual void fun2();
};

class C : public A, public B
{
};

int main()
{
    typedef void (A::*pfnAFun1)();
    typedef void (B::*pfnBFun2)();
    typedef void (C::*pfnCFun1)();
    typedef void (C::*pfnCFun2)();
    cout << "sizeof(pfnAFun1) is " << sizeof(pfnAFun1) << endl;
    cout << "sizeof(pfnBFun2) is " << sizeof(pfnBFun2) << endl;
    cout << "sizeof(pfnCFun1) is " << sizeof(pfnCFun1) << endl;
    cout << "sizeof(pfnCFun2) is " << sizeof(pfnCFun2) << endl;
    //delete cout;
    return 0;
}
```

Output on WinXP/VS2005:

```
sizeof(pfnAFun1) is 4
sizeof(pfnBFun2) is 4
sizeof(pfnCFun1) is 8
sizeof(pfnCFun2) is 8
```

Output on Ubuntu12.04/gcc4.6:

```
sizeof(pfnAFun1) is 8
sizeof(pfnBFun2) is 8
sizeof(pfnCFun1) is 8
sizeof(pfnCFun2) is 8
```

Both are run on 32bit systems. Sizes of pointer-to-member-function are not confirmed to be equal to `sizeof(void *)`. And you are not allowed to convert a pointer-to-member-function to `void *` or a plain pointer-to-function type. Only equality comparisons(=, !=) are supported. Thus, it can be used to implement the "Safe Bool Idiom" here: [http://www.artima.com/cppsource/safebool.html](http://www.artima.com/cppsource/safebool.html).

Perhaps the best-known use of this technique comes from the C++ Standard the conversion that allows the state of iostreams to be queried uses it.

```
if (std::cin) {  // Is the stream ok?
}
```

But at least in gcc/libstdc++, its implementation uses `bool` and `void *` conversion operations. In `basic_ios` class:

```
public:
    //@{
    /**
     *  @brief  The quick-and-easy status check.
     *
     *  This allows you to write constructs such as
     *  "if (!a_stream) ..." and "while (a_stream) ..."
     */
    operator void*() const
    { return this->fail() ? 0 : const_cast(this); }

    bool
    operator!() const
    { return this->fail(); }
    //@}
```

This allows `std::cout` to even be deleted. Hmmm...Just write down some details here.
