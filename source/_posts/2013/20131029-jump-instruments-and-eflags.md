---
title: "Jump Instruments and EFLAGS"
date: "2013-10-29 12:25:00"
categories: 
  - "cc"
tags: 
  - "assembly"
  - "x86"
---

There was a misleading in my knowledge of a conditional jump: It checks only the result of `CMP` and `TEST` instruments. So when it appears after other instruments like `ADD` or `SUB`, I can find no clue on how it works.

Actually, a conditional jump checks flags in the **EFLAGS** control register. From Intel's manual, vol 1, 3.4.3:

> The status flags (bits 0, 2, 4, 6, 7, and 11) of the EFLAGS register indicate the results of arithmetic instructions, such as the ADD, SUB, MUL, and DIV instructions. The status flag functions are:
> 
> CF (bit 0) Carry flag: Set if an arithmetic operation generates a carry or a borrow out of the most-significant bit of the result; cleared otherwise. This flag indicates an overflow condition for unsigned-integer arithmetic. It is also used in multiple-precision arithmetic.
> 
> PF (bit 2) Parity flag: Set if the least-significant byte of the result contains an even number of 1 bits; cleared otherwise. AF (bit 4) Adjust flag: Set if an arithmetic operation generates a carry or a borrow out of bit 3 of the result; cleared otherwise. This flag is used in binary-coded decimal (BCD) arithmetic.
> 
> ZF (bit 6) Zero flag: Set if the result is zero; cleared otherwise.
> 
> SF (bit 7) Sign flag: Set equal to the most-significant bit of the result, which is the sign bit of a signed integer. (0 indicates a positive value and 1 indicates a negative value.)
> 
> OF (bit 11) Overflow flag: Set if the integer result is too large a positive number or too small a negative number (excluding the sign-bit) to fit in the destination operand; cleared otherwise. This flag indicates an overflow condition for signed-integer (two’s complement) arithmetic.

And again from vol 2a, section _Jcc Jump if Condition is met_, more details. I just copy content from [here](http://www.unixwiz.net/techtips/x86-jumps.html):

| Instruction | Description | signed? | Flags | short jump opcodes | near jump opcodes |
| --- | --- | --- | --- | --- | --- |
| JO | Jump if overflow |  | OF = 1 | 70 | 0F 80 |
| JNO | Jump if not overflow |  | OF = 0 | 71 | 0F 81 |
| JS | Jump if sign |  | SF = 1 | 78 | 0F 88 |
| JNS | Jump if not sign |  | SF = 0 | 79 | 0F 89 |
| JE JZ | Jump if equal Jump if zero |  | ZF = 1 | 74 | 0F 84 |
| JNE JNZ | Jump if not equal Jump if not zero |  | ZF = 0 | 75 | 0F 85 |
| JB JNAE JC | Jump if below Jump if not above or equal Jump if carry | unsigned | CF = 1 | 72 | 0F 82 |
| JNB JAE JNC | Jump if not below Jump if above or equal Jump if not carry | unsigned | CF = 0 | 73 | 0F 83 |
| JBE JNA | Jump if below or equal Jump if not above | unsigned | CF = 1 or ZF = 1 | 76 | 0F 86 |
| JA JNBE | Jump if above Jump if not below or equal | unsigned | CF = 0 and ZF = 0 | 77 | 0F 87 |
| JL JNGE | Jump if less Jump if not greater or equal | signed | SF <> OF | 7C | 0F 8C |
| JGE JNL | Jump if greater or equal Jump if not less | signed | SF = OF | 7D | 0F 8D |
| JLE JNG | Jump if less or equal Jump if not greater | signed | ZF = 1 or SF <> OF | 7E | 0F 8E |
| JG JNLE | Jump if greater Jump if not less or equal | signed | ZF = 0 and SF = OF | 7F | 0F 8F |
| JP JPE | Jump if parity Jump if parity even |  | PF = 1 | 7A | 0F 8A |
| JNP JPO | Jump if not parity Jump if parity odd |  | PF = 0 | 7B | 0F 8B |
| JCXZ JECXZ | Jump if %CX register is 0 Jump if %ECX register is 0 |  | %CX = 0 %ECX = 0 | E3 | E3 |

There are signed and unsigned versions when comparing: `JA` Vs `JG`, `JB` Vs `JL` etc.. Let's take `JA` and `JG` to explain the difference. For `JA`, it's clear that it requires CF=0(no borrow bit) and ZF=0(not equal). For `JG`, when two operands are both positive or negative, it requires ZF=0 and SF=OF=0. When two operands have different signs, it requires ZF=0 and the first operand is positive, thus requires SF=OF=1.

Note, the following 2 lines(AT&T syntax) are equivalent. CPU does arithmetic calculation, it does not care about whether it is signed or unsigned. It only set flags. It is we that make the signed or unsigned jump decision.

```
movl $-1, %eax
movl $0xffffffff, %eax
```

Last, I'd like to use `ndisasm`(install `nasm` package to get it) to illustrate how jump instruments are encoded, including short jump, near jump and far jump:

```bash
$ echo -e "\x74\x00" | ndisasm -
00000000  7400              jz 0x2
00000002  0A                db 0x0a
$ echo -e "\x74\xfe" | ndisasm -
00000000  74FE              jz 0x0
00000002  0A                db 0x0a
$ echo -e "\x0f\x84\x00\x00" | ndisasm -
00000000  0F840000          jz word 0x4
00000004  0A                db 0x0a
$ echo -e "\x0f\x84\xfc\xff" | ndisasm -
00000000  0F84FCFF          jz word 0x0
00000004  0A                db 0x0a
$ echo -e "\x0f\x84\x00\x00\x00\x00" | ndisasm - -b 32
00000000  0F8400000000      jz dword 0x6
00000006  0A                db 0x0a
$ echo -e "\x0f\x84\xfa\xff\xff\xff" | ndisasm - -b 32
00000000  0F84FAFFFFFF      jz dword 0x0
00000006  0A                db 0x0a
$ echo -e "\xeb\x00" | ndisasm -
00000000  EB00              jmp short 0x2
00000002  0A                db 0x0a
$ echo -e "\xe9\x00\x00" | ndisasm -
00000000  E90000            jmp word 0x3
00000003  0A                db 0x0a
$ echo -e "\xe9\x00\x00\x00\x00" | ndisasm - -b32
00000000  E900000000        jmp dword 0x5
00000005  0A                db 0x0a
$ echo -e "\xea\x00\x00\x34\x12" | ndisasm -
00000000  EA00003412        jmp word 0x1234:0x0
00000005  0A                db 0x0a
$ echo -e "\xea\x00\x00\x00\x00\x34\x12" | ndisasm - -b 32
00000000  EA000000003412    jmp dword 0x1234:0x0
00000007  0A                db 0x0a
```
