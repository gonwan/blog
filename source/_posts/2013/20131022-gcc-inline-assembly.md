---
title: "GCC Inline Assembly"
date: "2013-10-22 07:48:00"
categories: 
  - "cpp"
tags: 
  - "gcc"
  - "inline-assembly"
---

Inline assembly is used in Linux kernel to optimize performance or access hardware. So I decided to check it first. Before digging deeper, you may wanna read the [GCC Inline Assembly HOWTO](http://www.ibiblio.org/gferg/ldp/GCC-Inline-Assembly-HOWTO.html) to get a general understanding. In C, a simple add function looks like:

```cpp
int add1(int a, int b)
{
    return a + b;
}
```

Its inline assembly version may be:

```cpp
int add2(int a, int b)
{
    __asm__ __volatile__ ("movl 12(%ebp), %eax\n\t"
                          "movl 8(%ebp), %edx\n\t"
                          "addl %edx, %eax"
    );
}
```

Or simpler:

```cpp
int add3(int a, int b)
{
    __asm__ __volatile__ ("movl 12(%ebp), %eax\n\t"
                          "addl 8(%ebp), %eax"
    );
}
```

Here's its generated code by gcc:

```bash
$ gcc -S testasm_linux.c -o testasm_linux.s
```

Output:

```
add3:
    pushl   %ebp
    movl    %esp, %ebp
#APP
# 21 "testasm_linux.c" 1
    movl 12(%ebp), %eax
    movl 8(%ebp), %edx
    addl %edx, %eax
# 0 "" 2
#NO_APP
    popl    %ebp
    ret
add3:
    pushl   %ebp
    movl    %esp, %ebp
#APP
# 31 "testasm_linux.c" 1
    movl 12(%ebp), %eax
    addl 8(%ebp), %eax
# 0 "" 2
#NO_APP
    popl    %ebp
    ret
```

Our inline assembly is surrounded by #APP and #NO_APP comments. Redundant gcc directives are already removed, the remaining are just function prolog/epilog code. `add2()` and `add3()` works fine using default gcc flags. But it is not the case when -O2 optimize flag is passed. From the output of `gcc -S -O2`(try it yourself), I found these 2 function calls are inlined in their caller, no function call at all. These 2 issues prevent the inline assembly from working: - Depending on %eax to be the return value. But it is silently ignored in -O2. - Depending on 12(%ebp) and 8(%ebp) as parameters of function. But it is not guaranteed that parameters are there in -O2. To solve issue 1, an explicit return should be used:

```cpp
int add4(int a, int b)
{
    int res;
    /* note the double % */
    __asm__ __volatile__ ("movl 12(%%ebp), %%eax\n\t"
                          "addl 8(%%ebp), %%eax"
                          : "=a" (res)
    );
    return res;
}
```

To solve issue 2, parameters are required to be loaded in registers first:

```cpp
int add5(int a, int b)
{
    int res;
    __asm__ __volatile__ ("movl %%ecx, %%eax\n\t"
                          "addl %%edx, %%eax"
                          : "=a" (res)
                          : "c" (a), "d" (b)
    );
    return res;
}
```

`add5()` now works in -O2. The default calling convention is cdecl for gcc. %eax, %ecx and %edx can be used from scratch in a function. It's the function caller's duty to preserve these registers. These registers are so-called scratch registers. So what if we specify to use other registers other than these scratch registers, like %esi and %edi?

```cpp
int add6(int a, int b)
{
    int res;
    __asm__ __volatile__ ("movl %%esi, %%eax\n\t"
                          "addl %%edi, %%eax"
                          : "=a" (res)
                          : "S" (a), "D" (b)
    );
    return res;
}
```

Again with `gcc -S`:

```
add6:
    pushl   %ebp
    movl    %esp, %ebp
    pushl   %edi
    pushl   %esi
    pushl   %ebx
    subl    $20, %esp
    movl    8(%ebp), %esi
    movl    %esi, -32(%ebp)
    movl    12(%ebp), %edx
    movl    -32(%ebp), %esi
    movl    %edx, %edi
#APP
# 65 "testasm_linux.c" 1
    movl %esi, %eax
    addl %edi, %eax
# 0 "" 2
#NO_APP
    movl    %eax, %ebx
    movl    %ebx, -16(%ebp)
    movl    -16(%ebp), %eax
    addl    $20, %esp
    popl    %ebx
    popl    %esi
    popl    %edi
    popl    %ebp
    ret
```

It seems that code generation of gcc in default optimize level is not so efficient:) But you should actually noticed that %esi and %edi are pushed onto stack before their usage, and popped out when finishing. These code generation is automatically done by gcc, since you have specified to use %esi("S") and %edi("D") in input list of the inline assembly. Actually, the code can be simpler by specify %eax as both input and output:

```cpp
int add7(int a, int b)
{
    int res;
    __asm__ __volatile__ ("addl %%edx, %%eax"
                          : "=a" (res)
                          : "a" (a), "d" (b)
    );
    return res;
}
```

We can tell gcc to use a general register("r") available in current context in inline assembly:

```cpp
int add8(int a, int b)
{
    int res;
    __asm__ __volatile__ ("movl %1, %%eax\n\t"
                          "addl %2, %%eax"
                          : "=a" (res)
                          : "r" (a), "r" (b)
    );
    return res;
}
```

And wrong code generation again...:

```
add8:
    pushl   %ebp
    movl    %esp, %ebp
    pushl   %ebx
    subl    $20, %esp
    movl    8(%ebp), %eax
    movl    %eax, -24(%ebp)
    movl    12(%ebp), %edx
    movl    -24(%ebp), %eax
#APP
# 88 "testasm_linux.c" 1
    movl %eax, %eax
    addl %edx, %eax
# 0 "" 2
#NO_APP
    movl    %eax, %ebx
    movl    %ebx, -8(%ebp)
    movl    -8(%ebp), %eax
    addl    $20, %esp
    popl    %ebx
    popl    %ebp
    ret
```

%eax is moved to %eax? gcc selected %eax and %edx as general registers to use.  The code accidentally does the right job, but it is still a potential pitfall. Clobber list can be used to avoid this:

```cpp
int add9(int a, int b)
{
    int res;
    /*
     * The clobber list tells gcc which registers(or memory) are changed by the asm,
     * but not listed as an output.
     */
    __asm__ __volatile__ ("movl %1, %0\n\t"
                          "addl %2, %0\n\t"
                          "movl %0, %%eax"
                          : "=r" (res)
                          : "r" (a), "r" (b)
                          : "%eax"
    );
    return res;
}
```

As commented inline: The clobber list tells gcc which registers(or memory) are changed by the asm, but not listed as an output. Now gcc does not use %eax as a candidate of general registers any more. gcc can also generate code to preserve(push onto stack) registers in clobber list if necessary.
