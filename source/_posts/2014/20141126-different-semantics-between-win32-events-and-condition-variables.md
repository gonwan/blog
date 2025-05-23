---
title: "Different Semantics Between Win32 Events and Condition Variables"
date: "2014-11-26 09:03:00"
categories: 
  - "cc"
tags: 
  - "multithreading"
  - "pthread"
---

Following the last post, I'm trying to implement a thread pool for practise, which supposed to work under both Windows and Linux platform. But the different semantics between Win32 events and condition variables makes it impossible to code in a unified logic. First, Linux uses mutex and condition variable to keep synchronization. While there is only event under Windows. Then, `pthread_cond_signal()` does nothing if no thread is currently waiting on the condition:

```cpp
int main() {
    pthread_mutex_t m;
    pthread_cond_t c;
    pthread_mutex_init(&m, NULL);
    pthread_cond_init(&c, NULL);
    /* signal & wait */
    pthread_cond_signal(&c);
    pthread_mutex_lock(&m); /* hangs here, since signal is missed. */
    pthread_cond_wait(&c, &m);
    pthread_mutex_unlock(&m);
    /* destroy */
    pthread_mutex_destroy(&m);
    pthread_cond_destroy(&c);
    return 0;
}
```

But under Windows, code below simply pass through:

```cpp
int main() {
    HANDLE e = CreateEvent(NULL, FALSE, FALSE, NULL);
    SetEvent(e);
    WaitForSingleObject(e, INFINITE); /* won't miss. */
    return 0;
}
```

And, under Windows Vista and later versions, a new series of synchronization API was introduced to align with the Linux API:

```cpp
int main() { /* requires windows vista and later. */
    CRITICAL_SECTION cs;
    CONDITION_VARIABLE cv;
    InitializeCriticalSection(&cs);
    InitializeConditionVariable(&cv);
    /* signal & wait */
    WakeConditionVariable(&cv);
    EnterCriticalSection(&cs);
    SleepConditionVariableCS(&cv, &cs, INFINITE); /* hangs here, since signal is missed. */
    LeaveCriticalSection(&cs);
    /* destroy */
    DeleteCriticalSection(&cs);
    return 0;
}
```
