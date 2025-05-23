---
title: "Debug Qt Libraries with Ubuntu Debug Packages"
date: "2011-03-28 09:51:00"
categories: 
  - "cc"
tags: 
  - "debugging"
  - "gdb"
  - "qt"
  - "ubuntu"
---

In previous [articles](http://www.gonwan.com/2010/07/07/using-ubuntu-debug-packages-in-gdb-2/), I was not able to use Qt's debug package provided by Ubuntu. Now, I will explain how to use them.

Our simple application:

```
// main.cpp
#include 
int main() {
    QString s = "1234567";
    int i = s.indexOf('3');
    return i != 2;
}
```

Our \*.pro file, you should enable the debug build:

```
# DebugQt.pro
TARGET = DebugQt
TEMPLATE = app
SOURCES += main.cpp
QT -= gui
CONFIG += console debug_and_release
```

1\. Build your debug version of application:

```
# qmake-qt4
# make debug
```

2\. Install Qt's debug package:

```
# sudo apt-get install libqt4-debug
```

3\. Install the Qt source:

```
# sudo apt-get source libqt4-debug
```

Now you can start debugging your application. Since Qt's debug symbols are installed in /usr/lib, It does not follow the GDB's global debug directory described [here](http://sourceware.org/gdb/onlinedocs/gdb/Separate-Debug-Files.html). We should tell GDB to load these symbols manually:

```
# gdb ./DebugQt
GNU gdb 6.8-debian
...
(gdb) b main
Breakpoint 1 at 0x8048696: file main.cpp, line 3.
(gdb) r
Starting program: /home/binson/DebugQt/DebugQt 
[Thread debugging using libthread_db enabled]
[New Thread 0xb71d36c0 (LWP 11138)]
[Switching to Thread 0xb71d36c0 (LWP 11138)]

Breakpoint 1, main () at main.cpp:3
3     QString s = "1234567";
(gdb) info sharedlibrary
From        To          Syms Read   Shared Object Library
0xb77a47f0  0xb77b96df  Yes         /lib/ld-linux.so.2
0xb7652510  0xb7740904  Yes         /usr/lib/libQtCore.so.4
0xb7605210  0xb7610a04  Yes         /lib/tls/i686/cmov/libpthread.so.0
0xb754fa60  0xb75ccb14  Yes         /usr/lib/libstdc++.so.6
0xb74eb440  0xb7505414  Yes         /lib/tls/i686/cmov/libm.so.6
0xb74de970  0xb74e5e04  Yes         /lib/libgcc_s.so.1
0xb73a4230  0xb74a4ea4  Yes         /lib/tls/i686/cmov/libc.so.6
0xb7368470  0xb7380684  Yes         /usr/lib/libfontconfig.so.1
0xb7350910  0xb735e3e4  Yes         /usr/lib/libz.so.1
0xb734a180  0xb734b804  Yes         /usr/lib/libgthread-2.0.so.0
0xb7341990  0xb7345ee4  Yes         /lib/tls/i686/cmov/librt.so.1
0xb72a0620  0xb72fe114  Yes         /usr/lib/libglib-2.0.so.0
0xb728ba70  0xb728ca74  Yes         /lib/tls/i686/cmov/libdl.so.2
0xb72249f0  0xb7276264  Yes         /usr/lib/libfreetype.so.6
0xb71fe190  0xb7214384  Yes         /usr/lib/libexpat.so.1
0xb71d5ef0  0xb71f1da4  Yes         /usr/lib/libpcre.so.3
```

We set a breakpoint at the beginning of main function to load all shared libraries. Next, we will load symbols for libQtCore.so.4. The symbol will be loaded in the start address of it (0xb7652510):

```
(gdb) add-symbol-file /usr/lib/libQtCore.so.4.3.4.debug 0xb7652510
add symbol table from file "/usr/lib/libQtCore.so.4.3.4.debug" at
 .text_addr = 0xb7652510
(y or n) y
Reading symbols from /usr/lib/libQtCore.so.4.3.4.debug...done.
```

Now, you are able to step into the Qt library, but no source is attached:

```
(gdb) b 4
Breakpoint 2 at 0x80486a9: file main.cpp, line 4.
(gdb) c
Continuing.

Breakpoint 2, main () at main.cpp:4
4     int i = s.indexOf('3');
(gdb) s
QChar (this=0xbfb1ec0e, ch=51 '3') at tools/qchar.cpp:432
432 tools/qchar.cpp: No such file or directory.
 in tools/qchar.cpp
```

Source files are attached by:

```
(gdb) dir ~/qt4-x11-4.3.4/src/corelib
Source directories searched: /home/binson/qt4-x11-4.3.4/src/corelib:$cdir:$cwd
(gdb) l
427 
428 /*!
429     Constructs a QChar corresponding to ASCII/Latin-1 character \a
430     ch.
431 */
432 QChar::QChar(char ch)
433 {
434 #ifndef QT_NO_CODEC_FOR_C_STRINGS
435     if (QTextCodec::codecForCStrings())
436         // #####
(gdb) bt
#0  QChar (this=0xbfb1ec0e, ch=51 '3') at tools/qchar.cpp:432
#1  0x080486bc in main () at main.cpp:4
```

See the source and backtrace? :)
