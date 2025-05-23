---
title: "Speeding up Qt Building"
date: "2010-12-03 08:46:00"
categories: 
  - "tools"
tags: 
  - "qt"
---

As starting with version 4.4, the size of Qt source grows extremely fast. It take hours or even a entire afternoon to build it with full feature enabled. Since I do not use advanced features like Webkit or Phonon, I always build Qt with them disabled. I will show and explain my configure parameters in 4.3 and 4.6 in both windows and linux build in this article.

### Windows Build

v4.3, just disable the qt3support module:

```bash
$ configure -fast -no-qt3support
```

v4.6, more modules are disabled:

```bash
$ configure -fast -no-qt3support -no-xmlpatterns -no-webkit -no-phonon -no-multimedia -no-script -no-scripttools -no-declarative -no-s60 -no-native-gestures
```

Qt4.4 added concurrent, webkit, phonon and xmlpattern code, and the format of help files was changed.

Qt4.5 added the gtkstyle. In configure script, -make and -nomake switch are added. But official support for VC6 and VS2002 were dropped. Actually, VC6 generates incorrect code.

Qt4.6 added javascriptcore backend for QtScript module. So I added the "-no-script" switch.

Maybe you have noted, there's no "-no-make" switch exists before Qt4.5. So, how to exclude building of demos and examples? I looked into the v4.5 source code of configure.exe(located in $QTSRC/tools/configure), and found all "no-make" parts are just excluded by writing to a .qmake.cache file. After running configure, the .qmake.cache file may have a line like:

```
QT_BUILD_PARTS  = libs tools examples demos docs translations
```

Now just keep the first 2 entries.

### Linux Build

From v4.6, there's only one all-in-one source package, no separate platform-specific source packages are provided. I firstly chose the qt-everywhere-opensource-src-4.6.3.zip. But even its configure script did not run. Finally, I found it's a line ending issue, and we need to convert it first using dos2unix utility.

```bash
$ sudo apt-get install tofrodos
```

Now convert line endings:

```bash
$ dos2unix configure
$ find config.tests/ -type f | xargs dos2unix
$ find src/corelib/global/ -type f | xargs dos2unix
$ find mkspecs/ -type f | xargs dos2unix
```

The first 3 lines ensure running of configure script. The last line ensures correct generation of makefiles. Without it, no separated debug info are generated and you may also encounter errors when linking the assistant application as described in [QTBUG-5471](http://bugreports.qt.nokia.com/browse/QTBUG-5471). The qt-everywhere-opensource-src-4.6.3.tar.gz with \*nix line endings does not need above steps and may have less undiscovered build issues.

I've tested this approach under Hardy(Ubuntu8.04) and Lucid(Ubuntu10.04). Under Lucid, the dos2unix/unix2dos utility seems to be renamed to fromdos/todos. Just replace the command name.

We can configure it now:

v4.3, as easy as windows:

```bash
$ ./configure -prefix /usr/local -fast -no-qt3support
```

v4.6, we do not have s60 and gesture switches:

```bash
$ ./configure -prefix /usr/local -fast -no-qt3support -no-xmlpatterns -no-webkit -no-phonon -no-multimedia -no-script -no-scripttools -no-declarative
```

After running configure, modify the .qmake.cache file to remove unnecessary entries.
