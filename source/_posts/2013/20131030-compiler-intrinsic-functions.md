---
title: "Compiler Intrinsic Functions"
date: "2013-10-30 09:49:00"
categories: 
  - "cc"
tags: 
  - "assembly"
  - "gcc"
  - "msvc"
  - "x86"
---

Copied from [Wikipedia](http://en.wikipedia.org/wiki/Intrinsic_function):

> An intrinsic function is a function available for use in a given programming language whose implementation is handled specially by the compiler. Typically, it substitutes a sequence of automatically generated instructions for the original function call, similar to an inline function. Unlike an inline function though, the compiler has an intimate knowledge of the intrinsic function and can therefore better integrate it and optimize it for the situation. This is also called builtin function in many languages.

A code snippet is written to check the code generation when intrinsic is enabled or not:

```
/*
 * # gcc -S intrinsic.c -o intrinsic.s
 * # gcc -S -fno-builtin intrinsic.c -o intrinsic2.s
 * # cl /c /Oi intrinsic.c /FAs /Faintrinsic.asm
 * # cl /c intrinsic.c /FAs /Faintrinsic2.asm
 */
#include 
#include 
#include 

const char *c = "Hello World!";
char c2[16];

int main(int argc, char *argv[])
{
    int a = abs(argc);
    memcpy(c2, c, 12);
    printf("%d,%s\n", a, c2);
    return 0;
}
```

Generated assembly:

```
main:
    pushl   %ebp
    movl    %esp, %ebp
    andl    $-16, %esp
    subl    $32, %esp
    movl    8(%ebp), %eax
    sarl    $31, %eax
    movl    %eax, %edx
    xorl    8(%ebp), %edx
    movl    %edx, 28(%esp)
    subl    %eax, 28(%esp)
    movl    c, %eax
    movl    %eax, %edx
    movl    $c2, %eax
    movl    (%edx), %ecx
    movl    %ecx, (%eax)
    movl    4(%edx), %ecx
    movl    %ecx, 4(%eax)
    movl    8(%edx), %edx
    movl    %edx, 8(%eax)
    movl    $.LC1, %eax
    movl    $c2, 8(%esp)
    movl    28(%esp), %edx
    movl    %edx, 4(%esp)
    movl    %eax, (%esp)
    call    printf
    movl    $0, %eax
    leave
    ret
```

Only `printf()` is in code. No `abs()` nor `memcpy()`. Since they are intrinsic, as listed [here](http://gcc.gnu.org/onlinedocs/gcc/Other-Builtins.html) in gcc's online document.

Intrinsic can be explicitly disabled. For instance, CRT intrinsic must be disabled for kernel development. Add `-fno-builtin` flag to gcc, or remove `/Oi` switch in MSVC. Only paste the generated code in gcc case here:

```
main:
    pushl   %ebp
    movl    %esp, %ebp
    andl    $-16, %esp
    subl    $32, %esp
    movl    8(%ebp), %eax
    movl    %eax, (%esp)
    call    abs
    movl    %eax, 28(%esp)
    movl    c, %eax
    movl    %eax, %edx
    movl    $c2, %eax
    movl    $12, 8(%esp)
    movl    %edx, 4(%esp)
    movl    %eax, (%esp)
    call    memcpy
    movl    $.LC1, %eax
    movl    $c2, 8(%esp)
    movl    28(%esp), %edx
    movl    %edx, 4(%esp)
    movl    %eax, (%esp)
    call    printf
    movl    $0, %eax
    leave
    ret
```

There _are_ `abs()` and `memcpy()` now. General MSVC intrinsic can be found [here](http://msdn.microsoft.com/en-us/library/tzkfha43%28v=vs.100%29.aspx).

Intrinsic is easier than [inline assembly](https://www.gonwan.com/2013/10/22/gcc-inline-assembly/). It is used to increase performance in most cases. Both gcc and MSVC provide intrinsic support for Intel's MMX, SSE and SSE2 instrument set. Code snippet to use MMX:

```
/*
 * # gcc -O2 -S -mmmx intrinsic_mmx.c -o intrinsic_mmx.s
 * # cl /O2 /c intrinsic_mmx.c /FAs /Faintrinsic_mmx.asm
 */
#include 
#include 

int main()
{
    __m64 m1, m2, m3;
    int out1, out2;
    int in1[] = { 222, 111 };
    int in2[] = { 444, 333 };
#if 0
    m1 = _mm_setr_pi32(in1[0], in1[1]);
    m2 = _mm_setr_pi32(in2[0], in2[1]);
#else
    m1 = *(__m64 *)in1;
    m2 = *(__m64 *)in2;
#endif
    m3 = _mm_add_pi32(m1, m2); 
    out1 = _mm_cvtsi64_si32(m3);
    m3  = _mm_srli_si64(m3, 32);
    out2 = _mm_cvtsi64_si32(m3);
    _mm_empty();
    printf("out1=%d,out2=%d\n", out1, out2);
    return 0;
}
```

Assembly looks like:

```
main:
    pushl   %ebp
    movl    %esp, %ebp
    andl    $-16, %esp
    subl    $16, %esp
    movq    .LC1, %mm0
    paddd   .LC2, %mm0
    movd    %mm0, 8(%esp)
    psrlq   $32, %mm0
    movd    %mm0, 12(%esp)
    emms
    movl    $.LC0, 4(%esp)
    movl    $1, (%esp)
    call    __printf_chk
    xorl    %eax, %eax
    leave
    ret
```

You see MMX registers and instruments this time. `-mmmx` flag is required to build for gcc. MSVC also generate similar code. Reference for these instrument set is available on Intel's [website](http://software.intel.com/en-us/intel-isa-extensions).

A simple benchmark to use SSE is avalable [here](http://felix.abecassis.me/2011/09/cpp-getting-started-with-sse/).
