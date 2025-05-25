---
title: "C++ Template Function Overload & Specialization"
date: "2014-07-06 18:26:18"
categories: 
  - "cc"
tags: 
  - "template"
---

Currently reading *[C++ Templates: The Complete Guide](http://www.amazon.com/C-Templates-The-Complete-Guide/dp/0201734842/)* these days. Just summarize confusions about template function overload & specialization.

```cpp
#include <iostream>
using namespace std;

template <typename T>
void foo(T) {
    cout << "in foo(T)" << endl;    
}

/* overload only */
template <typename T>
void foo(T *) {
    cout << "in foo(T *)" << endl;
}

/* full specialization of foo(T *) */
template <>
void foo<int>(int *) {
    cout << "in foo(int *)" << endl;
}

int main()
{
    /* The compiler does overload resolution before it looks at specializations. */
    foo(new int);
    return 0;
}
```

It first selects `foo(T *)` over `foo(T)`, and use the specialized version `foo<int>(int *)`.

```cpp
#include <iostream>
using namespace std;

template <typename T>
void foo(T) {
    cout << "in foo(T)" << endl;    
}

/* overload only */
template <typename T>
void foo(T *) {
    cout << "in foo(T *)" << endl;
}

/* full specialization of foo(T) */
template <>
void foo<int *>(int *) {
    cout << "in foo(int *)" << endl;
}

#if 0
/* function partial specialization, not allowed in c++ specification. */
template <typename T>
void foo<T *>(T *) {
    cout << "in foo<T *>(T *)" << endl;
}
#endif

int main()
{
    /* The compiler does overload resolution before it looks at specializations. */
    foo(new int);
    return 0;
}
```

Here it just selects `foo(T *)`. The `foo<int *>(int *)` version is not a specialization of it, and is not selected.

Note the syntax of function partial specialization(if possible) here.

Difference between overload and specilization from the book:

> In Chapter 12 we discussed how class templates can be partially specialized, whereas function templates are simply overloaded. The two mechanisms are somewhat different.
> 
> Partial specialization doesn't introduce a completely new template: It is an extension of an existing template (the primary template). When a class template is looked up, only primary templates are considered at first. If, after the selection of a primary template, it turns out that there is a partial specialization of that template with a template argument pattern that matches that of the instantiation, its definition (in other words, its body) is instantiated instead of the definition of the primary template. (Full template specializations work exactly the same way.)
> 
> In contrast, overloaded function templates are separate templates that are completely independent of one another. When selecting which template to instantiate, all the overloaded templates are considered together, and overload resolution attempts to choose one as the best fit. At first this might seem like an adequate alternative, but in practice there are a number of limitations:
> 
> \- It is possible to specialize member templates of a class without changing the definition of that class. However, adding an overloaded member does require a change in the definition of a class. In many cases this is not an option because we may not own the rights to do so. Furthermore, the C++ standard does not currently allow us to add new templates to the std namespace, but it does allow us to specialize templates from that namespace.
> 
> \- To overload function templates, their function parameters must differ in some material way. Consider a function template R convert(T const&) where R and T are template parameters. We may very well want to specialize this template for R = void, but this cannot be done using overloading.
> 
> \- Code that is valid for a nonoverloaded function may no longer be valid when the function is overloaded. Specifically, given two function templates f(T) and g(T) (where T is a template parameter), the expression g(&f) is valid only if f is not overloaded (otherwise, there is no way to decide which f is meant).
> 
> \- Friend declarations refer to a specific function template or an instantiation of a specific function template. An overloaded version of a function template would not automatically have the privileges granted to the original template.
