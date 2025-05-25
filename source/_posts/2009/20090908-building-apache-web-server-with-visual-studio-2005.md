---
title: "Building Apache Web Server with Visual Studio 2005"
date: "2009-09-08 05:13:00"
categories: 
  - "windows"
tags: 
  - "apache"
  - "msvc"
---

### 1. Source

a) apache 2.2.13: [http://www.apache.org/dist/httpd/httpd-2.2.13-win32-src.zip](http://www.apache.org/dist/httpd/httpd-2.2.13-win32-src.zip) b) zlib 1.2.3 (for mod_deflate): [http://www.zlib.net/zlib-1.2.3.tar.gz](http://www.zlib.net/zlib-1.2.3.tar.gz) c) openssl 0.9.8k (for mod_ssl): [http://www.openssl.org/source/openssl-0.9.8k.tar.gz](http://www.openssl.org/source/openssl-0.9.8k.tar.gz)

### 2. Tools

a) ActivePerl: [http://aspn.activestate.com/ASPN/Downloads/ActivePerl/](http://aspn.activestate.com/ASPN/Downloads/ActivePerl/) b) awk & patch tools: [http://gnuwin32.sourceforge.net/packages.html](http://gnuwin32.sourceforge.net/packages.html)

### 3. Steps

a) Setup Perl environment, add `%Perl%/bin` to `%PATH%`. b) Also add awk, path tools to `%PATH%`. c) Decompress the apache source code to `%Apache%`, `D:Apache` maybe. d) Decompress the zlib into `srclib` subdirectory named `zlib`. e) Decompress the openssl into `srclib` subdirectory named `openssl`. f) Now the source tree should look like:

```
%Apache%
　　|
　　+ srclib
　　|   |
　　|   + apr
　　|   |
　　|   + openssl
　　|   |
　　|   + zlib
　　|   |
　　|   + ...
　　|
　　+ ...
```

g) Patch zlib: Download the patch from: [http://www.apache.org/dist/httpd/binaries/win32/patches_applied/zlib-1.2.3-vc32-2005-rcver.patch](http://www.apache.org/dist/httpd/binaries/win32/patches_applied/zlib-1.2.3-vc32-2005-rcver.patch). This patch contains minor fixes and enable generation of \*.pdb files. Copy the patch file into `zlib` subdirectory, swith to the directory in cmd.exe and run the command:

```bash
$ patch -p0 < zlib-1.2.3-vc32-2005-rcver.patch
```

h) Patch openssl: Download the patch from: [http://www.apache.org/dist/httpd/binaries/win32/patches_applied/openssl-0.9.8k-vc32.patch](http://www.apache.org/dist/httpd/binaries/win32/patches_applied/openssl-0.9.8k-vc32.patch). This patch will correct a link issue with zlib and enable generation of \*.pdb files. Copy the patch file into `openssl` subdirectory, swith to the directory in cmd.exe and run the command:

```bash
$ patch -p0 < openssl-0.9.8k-vc32.patch
```

i) Build zlib:

```bash
$ nmake -f win32Makefile.msc
```

j) Build openssl:

```bash
$ perl Configure no-rc5 no-idea enable-mdc2 enable-zlib VC-WIN32 -I../zlib -L../zlib
$ msdo_masm.bat
$ nmake -f msntdll.mak
```

k) Patch Apache: There's an issue in the Makefile.win that build Apache in 2.2.13: [https://issues.apache.org/bugzilla/show_bug.cgi?id=47659](https://issues.apache.org/bugzilla/show_bug.cgi?id=47659). Download the patch against branch into the %Apache% directory and run the command:

```bash
$ patch -p0 < r799070_branch_makefile_fix.diff
```

l) Build Apache using command line: Now you can buid Apache by:

```bash
$ nmake -f Makefile.win _apache[d|r]
```

And install Apache by:

```bash
$ nmake -f Makefile.win install[d|r]
```

m) Build Apache using Visual Studio 2005: There's also a flaw in the \*.vcproj conversion of \*.dsp through Visual Studio 2005. We must run a perl script to fix it first:

```bash
$ perl srclibaprbuildcvtdsp.pl -2005
```

Now, everything are OK. In Visual Studio 2005, open the Apache.dsw and convert all \*.dsp files to \*.vcproj files. Then build the project "BuildBin". The project "InstallBin" project will distribute all the project in the Apache solution.

### 4. Debugging with Visual Studio 2005

It's quite simple. After build the project "InstallBin", open the property page of the "httpd" project. Switch to "Debugging" tab, change the Command value into your binary of installed directory. Now, add breakpoints, and press F5 to start your tracing or debugging.

### 5. Reference

- [Compiling Apache for Microsoft Windows](http://httpd.apache.org/docs/2.2/platform/win_compiling.html)
- [Apache 2.2.9 command line build with the Windows 2008 SDK](http://www.apachelounge.com/viewtopic.php?t=2560)
