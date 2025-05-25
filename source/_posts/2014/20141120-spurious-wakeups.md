---
title: "Spurious Wakeups"
date: "2014-11-20 13:13:01"
categories: 
  - "cpp"
tags: 
  - "boost"
  - "multithreading"
---

[http://vladimir_prus.blogspot.com/2005/07/spurious-wakeups.html](http://vladimir_prus.blogspot.com/2005/07/spurious-wakeups.html)

One of the two basic synchronisation primitives in multithreaded programming is called "condition variables". Here's a small example:

```cpp
bool something_happened;
boost::mutex m;
boost::condition_variable c;
void thread1() {
    boost::mutex::scoped_lock(m);
    while (!something_happened) {
        c.wait(m);
    }
}
void thread2() {
    // do lots of work
    boost::mutex::scoped_lock(m);
    something_happened = true;
    c.notify_one();
}
```

Here, the call to "c.wait()" unlocks the mutex (allowing the other thread to eventually lock it), and suspends the calling thread. When another thread calls 'notify', the first thread wakes up, locks the mutex again (implicitly, inside 'wait'), sees that variable is set to 'true' and goes on.

But why do we need the while loop, can't we write:

```cpp
    if (!something_happened) {
        c.wait(m);
    }
```

We can't. And the killer reason is that 'wait' can return without any 'notify' call. That's called spurious wakeup and is explicitly allowed by POSIX. Essentially, return from 'wait' only indicates that the shared data might have changed, so that data must be evaluated again.

Okay, so why this is not fixed yet? The first reason is that nobody wants to fix it. Wrapping call to 'wait' in a loop is very desired for several other reasons. But those reasons require explanation, while spurious wakeup is a hammer that can be applied to any first year student without fail.

The second reason is that fixing this is supposed to be hard. Most sources I've seen say that fixing that would require very large overhead on certain architectures. Strangely, no details were ever given, which made me wonder if avoiding spurious wakeups is simple, but all the threading experts secretly decided to tell everybody it's hard.

After asking on comp.programming.thread, I at least know the reason for Linux (thanks to [Ben Hutchings](http://groups-beta.google.com/group/comp.programming.threads/msg/aca08ebdab2cbf52)). Internally, wait is implemented as a call to the 'futex' system call. Each blocking system call on Linux returns abruptly when the process receives a signal -- because calling signal handler from kernel call is tricky. What if the signal handler calls some other system function? And a new signal arrives? It's easy to run out of kernel stack for a process. Exactly because each system call can be interrupted, when glibc calls any blocking function, like 'read', it does it in a loop, and if 'read' returns EINTR, calls 'read' again.

Can the same trick be used to conditions? No, because the moment we return from 'futex' call, another thread can send us notification. And since we're not waiting inside 'futex', we'll miss the notification(A third thread can get it, and change the value of predicate. -- gonwan). So, we need to return to the caller, and have it reevaluate the predicate. If another thread indeed set it to true, we'll break out of the loop.

So much for spurious wakeups on Linux. But I'm still very interested to know what the original reasons were.

\============================== Also see the explanation for spurious wakeups on the linux man page: [pthread_cond_signal](http://linux.die.net/man/3/pthread_cond_signal). Last note: `PulseEvent()` in windows(manual-reset) = `pthread_cond_signal()` in linux, while `SetEvent()` in windows(auto-reset) = `pthread_cond_broadcast()` in linux, see [here](http://blogs.msdn.com/b/csliu/archive/2009/03/20/windows-unix-and-ansi-c-api-comparison.aspx) and [here](http://www.cs.wustl.edu/~schmidt/win32-cv-1.html). And spurious wakeups are also possible on windows when using [condition variables](http://msdn.microsoft.com/en-us/library/windows/desktop/ms682052%28v=vs.85%29.aspx).
