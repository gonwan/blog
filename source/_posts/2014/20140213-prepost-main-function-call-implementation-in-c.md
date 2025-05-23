---
title: "Pre/Post-main Function Call Implementation in C"
date: "2014-02-13 10:46:00"
categories: 
  - "cc"
tags: 
  - "gcc"
  - "msvc"
---

In C++, pre/post-main function call can be implemented using a global class instance. Its constructor and destructor are invoked automatically before and after the main function. But in C, no such mechanism. Actually, there's a glib [implementation](https://git.gnome.org/browse/glib/tree/glib/gconstructor.h) that can help. You may want to read my previous post about [CRT sections](http://www.gonwan.com/2014/02/13/msvc-crt-initialization/) of MSVC. I just copy the code and do some renaming:

```
#include 
#if defined (_MSC_VER)
#if (_MSC_VER >= 1500)
/* Visual Studio 2008 and later have __pragma */
#define HAS_CONSTRUCTORS
#define DEFINE_CONSTRUCTOR(_func) \
    static void _func(void); \
    static int _func ## _wrapper(void) { _func(); return 0; } \
    __pragma(section(".CRT$XCU",read)) \
    __declspec(allocate(".CRT$XCU")) static int (* _array ## _func)(void) = _func ## _wrapper;
#define DEFINE_DESTRUCTOR(_func) \
    static void _func(void); \
    static int _func ## _constructor(void) { atexit (_func); return 0; } \
    __pragma(section(".CRT$XCU",read)) \
    __declspec(allocate(".CRT$XCU")) static int (* _array ## _func)(void) = _func ## _constructor;
#elif (_MSC_VER >= 1400)
/* Visual Studio 2005 */
#define HAS_CONSTRUCTORS
#pragma section(".CRT$XCU",read)
#define DEFINE_CONSTRUCTOR(_func) \
    static void _func(void); \
    static int _func ## _wrapper(void) { _func(); return 0; } \
    __declspec(allocate(".CRT$XCU")) static int (* _array ## _func)(void) = _func ## _wrapper;
#define DEFINE_DESTRUCTOR(_func) \
    static void _func(void); \
    static int _func ## _constructor(void) { atexit (_func); return 0; } \
    __declspec(allocate(".CRT$XCU")) static int (* _array ## _func)(void) = _func ## _constructor;
#else
/* Visual Studio 2003 and early versions should use #pragma code_seg() to define pre/post-main functions. */
#error Pre/Post-main function not supported on your version of Visual Studio.
#endif
#elif (__GNUC__ > 2) || (__GNUC__ == 2 && __GNUC_MINOR__ >= 7)
#define HAS_CONSTRUCTORS
#define DEFINE_CONSTRUCTOR(_func) static void __attribute__((constructor)) _func (void);
#define DEFINE_DESTRUCTOR(_func) static void __attribute__((destructor)) _func (void);
#else
/* not supported */
#endif
```

One limitation in glib code is the lack of support for VS2003 and early versions. `#pragma code_seg()` is used to implement the same function:

```
/*
 * cl ctor.c
 * gcc ctor.c -o ctor
 */
#include "ctor.h"
#include 

#ifdef HAS_CONSTRUCTORS
DEFINE_CONSTRUCTOR(before)
DEFINE_DESTRUCTOR(after)
#else
#ifdef _MSC_VER
static void before(void);
static void after(void);
#pragma data_seg(".CRT$XCU")
static void (*msc_ctor)(void) = before;
#pragma data_seg(".CRT$XPU")
static void (*msc_dtor)(void) = after;
#pragma data_seg()
#endif
#endif

void before()
{
    printf("before main\n");
}

void after()
{
    printf("after main\n");
}

int main()
{
    printf("in main\n");
    return 0;
}
```

Output from msvc/gcc:

```
before main
in main
after main
```
