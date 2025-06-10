---
title: "Coroutines in C++/Boost (2)"
date: "2025-04-15 22:15:28"
categories: 
  - "cpp"
tags: 
  - "boost"
  - "cpp20"
  - "coroutine"
---

Also see my previous article: [Coroutines in C++/Boost](https://www.gonwan.com/2016/01/19/coroutines-in-cpp-boost/).

C++ finally has a native implementation in C++20. The principal difference between coroutines and routines is that a coroutine enables explicit **suspend** and **resume** of its progress via additional operations by preserving execution state and thus provides an enhanced control flow (maintaining the execution context).

### 1. Asymmetric vs Symmetric

From `boost`:

> An **asymmetric** coroutine knows its invoker, using a special operation to implicitly yield control specifically to its invoker.
> 
> By contrast, all **symmetric** coroutines are equivalent; one symmetric coroutine may pass control to any other symmetric coroutine. Because of this, a symmetric coroutine must specify the coroutine to which it intends to yield control.

So C++20 coroutines are asymmetric ones. A coroutine only knows its parent. With the dependency, symmetric coroutines can be chained, just like a normal function calls another one. No `goto` semantics as with a symmetric one.

C++23 generators are also asymmetric. They are resumed repeatedly to *generate* a series of return values.

### 2. Stackless vs Stackful

Again From `boost`:

> In contrast to a stackless coroutine, a **stackful coroutine** can be suspended from within a nested stackframe. Execution resumes at exactly the same point in the code where it was suspended before.
> 
> With a **stackless coroutine**, only the top-level routine may be suspended. Any routine called by that top-level routine may not itself suspend. This prohibits providing suspend/resume operations in routines within a general-purpose library.

Well, these two are confusing. Tutorials and Blogs have different description. To make it simple, if there is `await/yield` definition, it's stackless. Then if there is something called `Fiber` in the language, it's stackful.

`Fiber`s are just like threads, they can be suspended at **any** stackframe. While `await/yield` is used as a suspend point, a stackless coroutine can only suspend at **exactly** that point.

A stackless coroutine shares a default stack among all the coroutines, while a stackful coroutine assigns a separate stack to each coroutine. With stackless coroutine, the code is transformed into event handlers at compile time, and driven by an event engine at run time, i.e. the scheduler of stackless coroutine. Transferring control of CPU to a stackless coroutine is merely a function call with an argument pointing to its context. Conversely, transferring CPU control to a stackful coroutine requires a context switch.

Here's a summary of how coroutine is implemented in most popular programming languages.

| Language | Stackful coroutines (Fibers) | Stackless coroutines (await/yield) |
| --- | --- | --- |
| Java | (Y2023) Virtual threads in Java 21 | n/a |
| C | n/a | n/a |
| C++ | n/a | (Y2020) co_await, co_yield, co_return in C++ 20 |
| Python | n/a | (Y2015) async, await/yield in Python 3.5 |
| C# | n/a | (Y2012) async, await/yield in C# 5.0 |
| Javascript | n/a | (Y2017) async, await/yield in ES 2017 |
| PHP | (Y2021) Fiber in PHP 8.1 | n/a |
| Go | (Y2012) Goroutine in Go 1.0<br />(Y2020) asynchronously preemptible in 1.14 |n/a|
| Objective-C | n/a | n/a |
| Swift | n/a | (Y2021) async, await/yield in Swift 5.5 |
| Rust | n/a | (Y2019) async, await in Rust 1.39 |

### Reference

- [Boost.Coroutine2](https://www.boost.org/doc/libs/1_88_0/libs/coroutine2/doc/html/coroutine2/intro.html)
- [Fibers under the magnifying glass](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p1364r0.pdf)
- [Stackful Coroutine Made Fast](https://photonlibos.github.io/blog/stackful-coroutine-made-fast)
