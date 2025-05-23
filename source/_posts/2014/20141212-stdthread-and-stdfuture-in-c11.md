---
title: "std::thread and std::future in C++11"
date: "2014-12-12 13:01:09"
categories: 
  - "cc"
tags: 
  - "c0x"
  - "multithreading"
---

This is a quick note to chapter 4 of [C++ Concurrency in Action](http://www.amazon.com/C-Concurrency-Action-Practical-Multithreading/dp/1933988770/).

### 1. std::thread

In C++11, It's quite simple to create a separate thread using `std::thread`. Following code will simply output "hello world" or "world hello":

```
#include 
#include 
using namespace std;

void foo(const char *s) {
    cout << s << endl;
}

int main() {
    thread t(foo, "hello");
    cout << "world" << endl;
    /* destructor of std::thread calls std::terminate(), so we should call join() manually. */
    t.join();
    return 0;
}
```

### 2. std::mutex and std::condition_variable

If you need synchronization between threads, there are `std::mutex` and `std::condition_variable`. The semantics are the same with that in pthread library. Here's a simple producer/consumer demo:

```
#include 
#include 
#include 
#include 
#include 
#include 
using namespace std;

queue q;
mutex m;
condition_variable c;
const chrono::milliseconds ms(1000);

void producer() {
    static int i = 0;
    while (true) {
        m.lock();
        cout << "pushing " << i << endl;
        q.push(i++);
        c.notify_one();
        m.unlock();
        this_thread::sleep_for(ms);
    }
}

void consumer() {
    while (true) {
        unique_lock lk(m);
        c.wait(lk, [](){ return !q.empty(); });
        int i = q.front();
        cout << "popping " << i << endl;
        q.pop();
        lk.unlock();
        this_thread::sleep_for(ms);
    }
}

int main() {
    thread t(consumer);
    thread t2(producer);
    t.join();
    t2.join();
    return 0;
}
```

### 3. std::future with std::async()

C++11 also simplifies our work with one-off events with `std::future`. `std::future` provides a mechanism to access the result of asynchronous operations. It can be used with `std::async()`, `std::packaged_task` and `std::promise`. Starting with `std::async()`:

```
#include 
#include 
using namespace std;

void foo(const char *s) {
    cout << s << endl;
}

int bar(int a, int b) {
    return a + b;
}

int main() {
    /* auto will be simpler */
    future f = std::async(foo, "hello");
    future f2 = std::async(launch::async, bar, 1, 2);
    /* f.get() is required if f is deferred by the library */
    //f.get();
    /* std::async() can return a value */
    cout << "1 + 2 = " << f2.get() << endl;
    /* threads created by std::async() are joined automatically */
    return 0;
}
```

`std::async()` gives two advantages over the direct usage of `std::thread`. Threads created by it are automatically joined. And we can now have a return value. `std::async()` decides whether to run the callback function in a separate thread or just in the current thread. But there's a chance to specify a control flag(`launch::async` or `launch::deferred`) to tell the library, what approach we want it to run the callback.

When testing With gcc-4.8, `foo()` is not called. But with VC++2013, it does output "hello".

### 4. std::future with std::packaged_task

With `std::async()`, we cannot control when our callback function is invoked. That's what `std::packaged_task` is designed to deal with. It's just a wrapper to callables. We can request an associated `std::future` from it. And when a `std::packaged_task` is invoked and finished, the associated future will be ready:

```
#include 
#include 
using namespace std;

void foo() {
    cout << "in pt.." << endl;
}

int bar(int a, int b) {
    cout << "in pt2.." << endl;
    return a + b;
}

/* associate with tasks */
packaged_task pt(foo);
packaged_task pt2(bar);

void waiter() {
    /* get associated future */
    auto f = pt.get_future();
    /* wait here */
    f.get();
    cout << "after f.get().." << endl;
}

void waiter2() {
    auto f2 = pt2.get_future();
    f2.get();
    cout << "after f2.get().." << endl;
}

int main() {
    auto t = std::async(launch::async, waiter);
    auto t2 = std::async(launch::async, waiter2);
    /* associated futures will be ready when the packaged tasks complete */
    pt();
    pt2(1, 2);
    return 0;
}
```

In `waiter()` and `waiter2()`, `future::get()` blocks until the associating `std::packaged_task` completes. You will always get "in pt" before "after f.get()" and "in pt2" before "after f2.get()". They are synchronized.

### 5. std::future with std::promise

You may also need to get notified in the middle of a task. `std::promise` can help you. It works like a lightweight event.

Future and Promise are the two separate sides of an asynchronous operation. `std::promise` is used by the "producer/writer", while `std::future` is used by the "consumer/reader". The reason it is separated into these two interfaces is to hide the "write/set" functionality from the "consumer/reader":

```
#include 
#include 
using namespace std;

promise p;
promise p2;

void waiter() {
    /* get associated future */
    auto f = p.get_future();
    /* wait here */
    f.get();
    cout << "after f.get().." << endl;
}

void waiter2() {
    auto f2 = p2.get_future();
    try {
        f2.get();
    } catch (...) {
        /* caught exception */
        cout << "caught exception in f2.get().." << endl;
    }
    cout << "after f2.get().." << endl;
}

int main() {
    auto t = std::async(launch::async, waiter);
    auto t2 = std::async(launch::async, waiter2);
    /* associated futures will be ready after a value is set */
    cout << "setting p.." << endl;
    p.set_value(true);
    /* exceptions can also be set */
    cout << "setting p2.." << endl;
    p2.set_exception(std::exception_ptr(nullptr));
    return 0;
}
```

Again in `waiter()` and `waiter2()`, `future::get()` blocks until a value or an exception is set into the associating `std::promise`. So "setting p" is always before "f.get()" and "setting p2" is always before "f2.get()". They are synchronized.

**NOTE**: `std::future` seems to be not correctly implemented in VC++2013. So the last two code snippet do not work with it. But you can try the online [VC++2015 compiler](http://webcompiler.cloudapp.net/)(still in preview as this writing), it works.
