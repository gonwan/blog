---
title: "Windows XP Targeting with C++ in Visual Studio 2012"
date: "2013-04-08 12:45:00"
categories: 
  - "windows"
tags: 
  - "msvc"
  - "visual-studio-2012"
---

Just downloaded and tried Visual Studio 2012(with update 2, version 11.0.60315.01). The Windows XP targeting is available(actually already available in update 1):

![vs2012_xp_target](../../images/2013/vs2012_xp_target.png)

The executable generated by the original VS2012 toolchain does not run under Windows XP. A error message box is shown:

![vs2012_xp_target_2](../../images/2013/vs2012_xp_target_2.png)

In update 1, the static and dynamic link libraries for the CRT, STL and MFC have been updated in-place to add runtime support for Windows XP and Windows Server 2003. And the runtime version is upgraded to 11.0.51106.1 from 11.0.50727.1.

Except the library update, there's none real difference when selecting "v110" or "v110_xp" toolchain. I wrote a simple HelloWorld application and compare the two generated binary.

```bash
$ hexdump hello_vs2012.exe > vs2012.txt
$ hexdump hello_vs2012_xp.exe > vs2012_xp.txt
$ diff -ru vs2012.txt vs2012_xp.txt
```

And the output:

```diff
--- vs2012.txt 2013-04-08 17:25:32.253623916 +0800
+++ vs2012_xp.txt 2013-04-08 17:25:41.321624132 +0800
@@ -12,11 +12,11 @@
 00000b0 1544 65e8 d30d 6526 382e 65e9 d3b4 6526
 00000c0 382e 65ea d3b4 6526 6952 6863 d3b5 6526
 00000d0 0000 0000 0000 0000 4550 0000 014c 0004
-00000e0 3d72 5162 0000 0000 0000 0000 00e0 0102
+00000e0 3d82 5162 0000 0000 0000 0000 00e0 0102
 00000f0 010b 000b 7e00 0001 fa00 0000 0000 0000
 0000100 614e 0000 1000 0000 9000 0001 0000 0040
-0000110 1000 0000 0200 0000 0006 0000 0000 0000
-0000120 0006 0000 0000 0000 a000 0002 0400 0000
+0000110 1000 0000 0200 0000 0005 0001 0000 0000
+0000120 0005 0001 0000 0000 a000 0002 0400 0000
 0000130 0000 0000 0003 8140 0000 0010 1000 0000
 0000140 0000 0010 1000 0000 0000 0000 0010 0000
 0000150 0000 0000 0000 0000 0b44 0002 0028 0000
```

The first difference represents the timestamps of the two binary. The other two differences standard for "Operating System Version" and "Subsystem Version". We have 5.1 for Windows XP, 6.0 for Windows Vista and later. That's all. And we can easily build a Windows XP binary from the command line with only one additional linker switch:

```bash
$ cl hello.cpp /link /subsystem:console,5.01
```

I also built a simple MFC application(dynamic link to MFC) with Windows XP target in VS2012. It runs fine under Windows XP with MFC DLLs copied in the same directory. From VS2010, the SxS assembly is not used any more. All you need to do is copy the dependent DLLs to the application directory and run.

Reference:
- [http://blogs.msdn.com/b/vcblog/archive/2012/10/08/10357555.aspx](http://blogs.msdn.com/b/vcblog/archive/2012/10/08/10357555.aspx)
