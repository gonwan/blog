---
title: "Coroutines in C++/Boost (3)"
date: 2025-06-10 16:44:06
categories: 
  - "cpp"
tags: 
  - "boost"
  - "cpp20"
  - "coroutine"
---

Also see my previous article: [Coroutines in C++/Boost](https://www.gonwan.com/2016/01/19/coroutines-in-cpp-boost/), [Coroutines in C++/Boost (2)](https://www.gonwan.com/2025/04/15/coroutines-in-cpp-boost-2/).

C++ 20 chooses stackless coroutine as mentioned in my previous post. It borrows much from C# implementation, and author of original [coroutine TS](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/n4760.pdf) comes from Microsoft. However, in recent [research](https://photonlibos.github.io/blog/stackful-coroutine-made-fast), stackful coroutines can have competitive performance as stackless ones when optimized. They introduced `CACS`(Context-Aware Context Switching) to improve the efficiency of register saving, accuracy of branch prediction, and hit rate of CPU cache.

There are two kinds of interfaces that are defined by the coroutines TS: The Awaitable interface and the `Promise` interface.

The Awaitable interface specifies methods that control the semantics of a `co_await` expression. When a value is co_awaited, the code is translated into a series of calls to methods on the awaitable object that allow it to specify: whether to suspend the current coroutine, execute some logic after it has suspended to schedule the coroutine for later resumption, and execute some logic after the coroutine resumes to produce the result of the `co_await` expression.

The `Promise` interface specifies methods for customising the behaviour of the coroutine itself. The library-writer is able to customise what happens when the coroutine is called, what happens when the coroutine returns (either by normal means or via an unhandled exception) and customise the behaviour of any `co_await` or `co_yield` expression within the coroutine.

### 1. Awaitable interface
```cpp
{
  auto&& value = <expr>;
  auto&& awaitable = get_awaitable(promise, static_cast<decltype(value)>(value));
  auto&& awaiter = get_awaiter(static_cast<decltype(awaitable)>(awaitable));
  if (!awaiter.await_ready())
  {
    using handle_t = std::experimental::coroutine_handle<P>;
 
    using await_suspend_result_t =
      decltype(awaiter.await_suspend(handle_t::from_promise(promise)));
 
    <suspend-coroutine>
 
    if constexpr (std::is_void_v<await_suspend_result_t>)
    {
      awaiter.await_suspend(handle_t::from_promise(promise));
      <return-to-caller-or-resumer>
    }
    else
    {
      static_assert(
         std::is_same_v<await_suspend_result_t, bool>,
         "await_suspend() must return 'void' or 'bool'.");
 
      if (awaiter.await_suspend(handle_t::from_promise(promise)))
      {
        <return-to-caller-or-resumer>
      }
    }
 
    <resume-point>
  }
 
  return awaiter.await_resume();
}
```

### 2. Promise interface
The coroutine TS
And C++20

They did not define a `promise_type` interface or traits/concepts, but a large paragraph of description.
```cpp
{
  co_await promise.initial_suspend();
  try
  {
    <body-statements>
  }
  catch (...)
  {
    promise.unhandled_exception();
  }
FinalSuspend:
  co_await promise.final_suspend();
}
```
```cpp
struct promise_type {
  auto get_return_object();
  auto initial_suspend();
  auto final_suspend() noexcept;
  void return_void();
  void unhandled_exception();
};
```

### 3. Reference
- [Stackful Coroutine Made Fast](https://photonlibos.github.io/blog/stackful-coroutine-made-fast)
- [C++ Coroutines: Understanding operator co_await](https://lewissbaker.github.io/2017/11/17/understanding-operator-co-await)
- [C++ Coroutines: Understanding the promise type](https://lewissbaker.github.io/2018/09/05/understanding-the-promise-type)
