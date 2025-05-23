---
title: "Linux System Call"
date: "2013-11-08 06:51:00"
categories: 
  - "os"
tags: 
  - "assembly"
  - "system-call"
  - "x86"
---

The HelloWorld application is much simpler than the Windows one. Just put parameters into registers from %eax to %edx, and trigger a 0x80 interrupt.

```
# gcc -nostdlib syscall_linux.s -o syscall_linux
.global _start

.text

_start:
    # write(1, message, 13)
    mov     $4, %eax            # system call 4 is write
    mov     $1, %ebx            # file handle 1 is stdout
    mov     $message, %ecx      # address of string to output
    mov     $13, %edx           # number of bytes to write
    int     $0x80               # invoke system call  
    # exit(0)
    mov     $1, %eax            # system call 1 is exit
    xor     %ebx, %ebx          # return 0
    int     $0x80               # invoke system call
message:
    .ascii  "Hello World!\n"
```
