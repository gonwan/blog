---
title: "Two-phase Lookup in C++ Templates"
date: "2014-12-12 07:44:16"
categories: 
  - "cc"
tags: 
  - "gcc"
  - "msvc"
---

This is a quick note to [C++ Templates: The Complete Guide](http://www.amazon.com/C-Templates-The-Complete-Guide/dp/0201734842/). Name Taxonomy comes first in chapter 9:

**Qualified name**: This term is not defined in the standard, but we use it to refer to names that undergo so-called _qualified lookup_. Specifically, this is a qualified-id or an unqualified-id that is used after an explicit member access operator (`.` or `->`). Examples are `S::x`, `this->f`, and `p->A::m`. However, just `class_mem` in a context that is implicitly equivalent to `this->class_mem` is not a qualified name: The member access must be explicit.

**Unqualified name**: An unqualified-id that is not a qualified name. This is not a standard term but corresponds to names that undergo what the standard calls _unqualified lookup_.

**Dependent name**: A name that depends in some way on a template parameter. Certainly any qualified or unqualified name that explicitly contains a template parameter is dependent. Furthermore, a qualified name that is qualified by a member access operator (`.` or `->`) is dependent if the type of the expression on the left of the access operator depends on a template parameter. In particular, `b` in `this->b` is a dependent name when it appears in a template. Finally, the identifier `ident` in a call of the form `ident(x, y, z)` is a dependent name if and only if any of the argument expressions has a type that depends on a template parameter.

**Nondependent name**: A name that is not a dependent name by the above description.

And the definition from Chapter 10:

This leads to the concept of **two-phase lookup**: The first phase is the parsing of a template, and the second phase is its instantiation.

During the **first phase**, nondependent names are looked up while the template is being parsed using both the ordinary lookup rules and, if applicable, the rules for argument-dependent lookup (ADL). Unqualified dependent names (which are dependent because they look like the name of a function in a function call with dependent arguments) are also looked up that way, but the result of the lookup is not considered complete until an additional lookup is performed when the template is instantiated.

During the **second phase**, which occurs when templates are instantiated at a point called the point of instantiation(POI), dependent qualified names are looked up (with the template parameters replaced with the template arguments for that specific instantiation), and an additional ADL is performed for the unqualified dependent names.

To summarize: `nondependent names` are looked up in first phase, `qualified dependent names` are looked up in second phase, and `unqualified dependent names` are looked up in both phases. Some code to illustrate how this works:

```cpp
#include <iostream>

template <typename T>
struct Base {
    typedef int I;
};

template <typename T>
struct Derived : Base<T> {
    void foo() {
        //typename Base<T>::I i = 1.024;
        I i = 1.024;
        std::cout << i << std::endl;
    }
};

template <>
struct Base<void> {
    //const static int I = 0;
    typedef double I;
};

int main() {
    Derived<bool> d1;
    d1.foo();
    Derived<void> d2;
    d2.foo();
    return 0;
}
```

Now look into `Derived::foo()`. `I` is a nondependent name, it should be looked up only in first phase. But at that point, the compiler cannot decide the type of it. When instantiated with `Derived<bool>`, `I` is type `int`. When instantiated with `Derived<void>`, `I` is type `double`. So it's better to look up `I` in the second phase. We can use `typename Base<T>::I i = 1.024;` to delay the look up, for `I` is a qualified dependent name now.

Unfortunately, two-phase lookup(C++03 standard) is not fully supported in VC++ even in VC++2013. It compiles well and gives your most expecting result(output 1 and 1.024). With gcc-4.6, it gives errors like:

```
temp1.cpp: In member function ‘void Derived::foo()’:
temp1.cpp:12:9: error: ‘I’ was not declared in this scope
temp1.cpp:12:11: error: expected ‘;’ before ‘i’
temp1.cpp:13:22: error: ‘i’ was not declared in this scope
```

Another code snippet:

```cpp
#ifdef _USE_STRUCT
/* ADL of nondependent names in two-phase lookup should
 * only works for types that have an associated namespace. */
struct Int { 
    Int(int) { };
};
#else
typedef int Int;
#endif

template <typename T>
void f(T i) {
    g(i);
};

void g(Int i) {
}

int main() {
    f(Int(1024));
    return 0;
}
```

When the compiler sees `f()`, `g()` has not been declared. This code should not compile, if `f()` is a nontemplate function. Since `f()` is a template function and `g()` is a nondependent name, the compiler can use ADL in first phase to find the declaration of `g()`. Note, a user-defined type like `Int` is required here. Since `int` is a primitive type, it has no associated namespace, and no ADL is performed.

VC++2013 still compiles well with this code. You can find some [clue](http://blogs.msdn.com/b/vcblog/archive/2014/08/21/c-11-14-features-in-visual-studio-14-ctp3.aspx) that they will not support it in the next VC++2015 release. With gcc, they [declared](http://gcc.gnu.org/gcc-4.7/changes.html#cxx) to fully support two-phase lookup in gcc-4.7. I used gcc-4.8, error output looks like:

```
temp2.cpp: In instantiation of ‘void f(T) [with T = int]’:
temp2.cpp:20:16:   required from here
temp2.cpp:13:8: error: ‘g’ was not declared in this scope, and no declarations were found by argument-dependent lookup at the point of instantiation [-fpermissive]
     g(i);
        ^
temp2.cpp:16:6: note: ‘void g(Int)’ declared here, later in the translation unit
 void g(Int i) {
      ^
```

And the code compiles well with self-defined type `Int`(using `-D_USE_STRUCT` switch).
