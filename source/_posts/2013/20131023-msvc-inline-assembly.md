---
title: "MSVC Inline Assembly"
date: "2013-10-23 07:48:00"
categories: 
  - "cc"
tags: 
  - "inline-assembly"
  - "msvc"
---

MSVC's inline assembly is easier to use, as compared to [gcc's version](http://www.gonwan.com/2013/10/22/gcc-inline-assembly/). It is easier to write right code than wrong one, I think. Still a simple add function is used to illustrate:

```
int add1(int a, int b)
{
    return a + b;
}
```

The corresponding inline version:

```
int add2(int a, int b)
{
    __asm {
        mov eax, a;
        add eax, b;
    }
}
```

`__asm` keyword is used to specify a inline assembly block. From MSDN, there is another `asm` keyword which is not recommended:

> Visual C++ support for the Standard C++ asm keyword is limited to the fact that the compiler will not generate an error on the keyword. However, an asm block will not generate any meaningful code. Use \_\_asm instead of asm.

Symbols in C/C++ code can be used directly in inline assembly. This is much more convenient than gcc. And it is also not necessary to load parameters into registers before usage as in gcc. MSVC does the job right even in optimization case.

**NOTE**: Inline assembly is not supported on the Itanium and x64 processors.

Let's see the generated code:

```
# cl /c /FA testasm_windows.c
```

Output:

```
PUBLIC _add2
_TEXT SEGMENT
_a$ = 8
_b$ = 12
_add2 PROC
 push ebp
 mov ebp, esp
 mov eax, DWORD PTR _a$[ebp]
 add eax, DWORD PTR _b$[ebp]
 pop ebp
 ret 0
_add2 ENDP
_TEXT ENDS
```

Function parameters are located in `[ebp+12]` and `[ebp+8]` as referred by symbol `a` and `b`. Then, what happened if registers other than scratch registers are specified?

```
int add3(int a, int b)
{
    __asm {
        mov ebx, a;
        add ebx, b;
        mov eax, ebx;
    }
}
```

Output assembly code:

```
PUBLIC _add3
_TEXT SEGMENT
_a$ = 8
_b$ = 12
_add3 PROC
 push ebp
 mov ebp, esp
 push ebx
 mov ebx, DWORD PTR _a$[ebp]
 add ebx, DWORD PTR _b$[ebp]
 mov eax, ebx
 pop ebx
 pop ebp
 ret 0
_add3 ENDP
_TEXT ENDS
```

As you see, MSVC automatically preserves `ebx` for us. From MSDN:

> When using \_\_asm to write assembly language in C/C++ functions, you don't need to preserve the EAX, EBX, ECX, EDX, ESI, or EDI registers.

Let's see the case when stdcall calling convention is used:

```
int __stdcall add4(int a, int b)
{
    __asm {
        mov eax, a;
        add eax, b;
    }
}
```

Output:

```
PUBLIC _add4@8
_TEXT SEGMENT
_a$ = 8
_b$ = 12
_add4@8 PROC
 push ebp
 mov ebp, esp
 mov eax, DWORD PTR _a$[ebp]
 add eax, DWORD PTR _b$[ebp]
 pop ebp
 ret 8
_add4@8 ENDP
_TEXT ENDS
```

In stdcall, stack is cleaned up by callee. So, there's a `ret 8` before return. And the function name is mangled to `_add4@8`.

MSVC also supports fastcall calling convention, but it causes register conflicts as mentioned on MSDN, and is not recommended. Just test it here, the code happens to work:)

```
int __fastcall add5(int a, int b)
{
    __asm {
        mov eax, a;
        add eax, b;
    }
}
```

Output:

```
PUBLIC @add5@8
_TEXT SEGMENT
_b$ = -8
_a$ = -4
@add5@8 PROC
 push ebp
 mov ebp, esp
 sub esp, 8
 mov DWORD PTR _b$[ebp], edx
 mov DWORD PTR _a$[ebp], ecx
 mov eax, DWORD PTR _a$[ebp]
 add eax, DWORD PTR _b$[ebp]
 mov esp, ebp
 pop ebp
 ret 0
@add5@8 ENDP
_TEXT ENDS
```

Function parameters are passed in `ecx` and `edx` when using fastcall. But they are saved to stack first. It seems we get no benefit using this calling convention. Maybe MSVC does not implement it well. The function name is mangled to `@add5@8`.

Last, we can tell MSVC that we want to write our own prolog/epilog code sequences using `__declspec(naked)` directive:

```
__declspec(naked) int __cdecl add6(int a, int b)
{
    __asm {
        push ebp;
        mov ebp, esp;
        mov eax, a;
        add eax, b;
        pop ebp;
        ret;
    }
}
```

Output:

```
PUBLIC _add6
_TEXT SEGMENT
_a$ = 8
_b$ = 12
_add6 PROC
 push ebp
 mov ebp, esp
 mov eax, DWORD PTR _a$[ebp]
 add eax, DWORD PTR _b$[ebp]
 pop ebp
 ret 0
_add6 ENDP
_TEXT ENDS
```

Normal prolog/epilog is used here. MSVC does not generate duplicate these code when using `__declspec(naked)` directive.
