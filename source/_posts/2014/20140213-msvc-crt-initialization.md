---
title: "MSVC CRT Initialization"
date: "2014-02-13 08:46:00"
categories: 
  - "cc"
tags: 
  - "crt"
  - "gcc"
  - "msvc"
---

This post provides a detailed view of the MSDN article [CRT Initialization](http://msdn.microsoft.com/en-us/library/bb918180.aspx). Just paste some content here:

> The CRT obtains the list of function pointers from the Visual C++ compiler. When the compiler sees a global initializer, it generates a dynamic initializer in the .CRT$XCU section (where CRT is the section name and XCU is the group name). To obtain a list of those dynamic initializers run the command dumpbin /all main.obj, and then search the .CRT$XCU section (when main.cpp is compiled as a C++ file, not a C file).
> 
> The CRT defines two pointers: - \_\_xc\_a in .CRT$XCA - \_\_xc\_z in .CRT$XCZ
> 
> Both groups do not have any other symbols defined except \_\_xc\_a and \_\_xc\_z. Now, when the linker reads various .CRT groups, it combines them in one section and orders them alphabetically. This means that the user-defined global initializers (which the Visual C++ compiler puts in .CRT$XCU) will always come after .CRT$XCA and before .CRT$XCZ.
> 
> So, the CRT library uses both \_\_xc\_a and \_\_xc\_z to determine the start and end of the global initializers list because of the way in which they are laid out in memory after the image is loaded.

Let's run our VS debugger to further investigate the CRT implementation. I'm using VS2010, and a global instance of class `A` is declared and initialized:

```
class A
{
public:
    A();
    ~A();
};

A::A()
{
    std::cout << "in A::A()" << std::endl;
}

A::~A()
{
    std::cout << "in A::~A()" << std::endl;
}

A a;
```

Now set the breakpoints in the constructor and destructor, and start debugging. I've tried exe/dll and dynamic/static CRT combinations to view the call stacks:

```
1) exe with crt dynamic linked:
  crtexe.c: (w)mainCRTStartup()
    +--> crtexe.c: __tmainCRTStartup()
           +--> crt0dat.c: _initterm()
2) exe with crt static linked:
  crt0.c: _tmainCRTStartup()
    +--> crt0.c: __tmainCRTStartup()
           +--> crt0dat.c: _cinit()
                  +--> crt0dat.c: _initterm()
3) dll with crt dynamic linked:
  crtdll.c: _DllMainCRTStartup()
    +--> crtdll.c: __DllMainCRTStartup()
           +--> crtdll.c: _CRT_INIT()
                  +--> crt0dat.c: _initterm()
4) dll with crt static linked:
  dllcrt0.c: _DllMainCRTStartup()
    +--> dllcrt0.c: __DllMainCRTStartup()
           +--> dllcrt0.c: _CRT_INIT()
                  +--> crt0dat.c: _cinit()
                         +--> crt0dat.c: _initterm()
```

`_initterm` is defined as follow. It is used to walk through `__xc_a` and `__xc_z` mentioned above:

```
// crt0dat.c
void __cdecl _initterm (
        _PVFV * pfbegin,
        _PVFV * pfend
        )
{
        /*
         * walk the table of function pointers from the bottom up, until
         * the end is encountered.  Do not skip the first entry.  The initial
         * value of pfbegin points to the first valid entry.  Do not try to
         * execute what pfend points to.  Only entries before pfend are valid.
         */
        while ( pfbegin < pfend )
        {
            /*
             * if current table entry is non-NULL, call thru it.
             */
            if ( *pfbegin != NULL )
                (**pfbegin)();
            ++pfbegin;
        }
}
```

`__xc_a`, `__xc_z` and other section groups are defined as:

```
// crt0dat.c
/*
 * pointers to initialization sections
 */
extern _CRTALLOC(".CRT$XIA") _PIFV __xi_a[];
extern _CRTALLOC(".CRT$XIZ") _PIFV __xi_z[];    /* C initializers */
extern _CRTALLOC(".CRT$XCA") _PVFV __xc_a[];
extern _CRTALLOC(".CRT$XCZ") _PVFV __xc_z[];    /* C++ initializers */
extern _CRTALLOC(".CRT$XPA") _PVFV __xp_a[];
extern _CRTALLOC(".CRT$XPZ") _PVFV __xp_z[];    /* C pre-terminators */
extern _CRTALLOC(".CRT$XTA") _PVFV __xt_a[];
extern _CRTALLOC(".CRT$XTZ") _PVFV __xt_z[];    /* C terminators */
// sect_attribs.h
#define _CRTALLOC(x) __declspec(allocate(x))
```

gcc uses [similar technology](http://gcc.gnu.org/onlinedocs/gccint/Initialization.html) to deal with pre/post-main stuff. The section names are `.init` and `.fini` .
