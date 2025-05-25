---
title: "Packaging a Qt Application"
date: "2011-01-17 16:44:00"
categories: 
  - "linux"
tags: 
  - "qt"
  - "symbian"
  - "ubuntu"
---

    This article applies to Ubuntu 8.04/10.04. I referred to the instruction here: [http://ubuntuforums.org/showthread.php?t=51003](http://ubuntuforums.org/showthread.php?t=51003). And I'll use my [qastrologer](http://code.google.com/p/qansieditor/source/browse/trunk/qastrologer/) project to demo the building procedure.

1. Install build tool packages:

```bash
$ sudo apt-get install build-essential dh-make debhelper devscripts
```

2. Get the source package, exact it into ~/packages/qastrologer. The directory structure should like: ~/packages/qastrologer/qastrologer-<version>/<source>. The <source> directory contains your `*.pro` file.

3. Add install section in `*.pro` file. Otherwise, the built package contains not binary:

```
unix {
    isEmpty(PREFIX):PREFIX = /usr
    BINDIR = $$PREFIX/bin
    DATADIR = $$PREFIX/share
    target.path = $$BINDIR
    icon.path = $$DATADIR/icons/hicolor/scalable/apps
    icon.files += qastrologer.svg
    desktop.path = $$DATADIR/applications
    desktop.files += qastrologer.desktop
    INSTALLS += target icon desktop
}
```

I referred to the guild here: [http://wiki.maemo.org/Packaging_a_Qt_application](http://wiki.maemo.org/Packaging_a_Qt_application). For more information on how to use the INSTALLS macro, refer to the Qt document: [http://doc.trolltech.com/4.7/qmake-environment-reference.html#installs](http://doc.trolltech.com/4.7/qmake-environment-reference.html#installs)

4. Run dh_make. This will create the basic debian package structure.

```bash
$ dh_make -s -c gpl --createorig
```

We are generating a single binary package and licensed with GPL. After running the command, a "debian" subdirectory is created. Now we need to fill in more useful infomations.

5. "rules" file:

It is the most important build script. The cdbs already have support for building QMake projects. Our "rules" file is simple:

```
#!/usr/bin/make -f

include /usr/share/cdbs/1/rules/debhelper.mk
include /usr/share/cdbs/1/class/qmake.mk

QMAKE = qmake-qt4
```

Last line ensures we use Qt4. I referred to the source of minitube project. You can access it via:

```bash
$ sudo apt-get source minitube
```

6. "control" file:

This file controls build and binary dependency. For my qastrologer, the default values are enough. You may want to have some minor changes in "Section"/"Priority"/"Maintainer" values. Since I want to keep my package installs from 8.04 to 10.04 and above, I must specify the minimum dependencies manually to use Qt 4.3. So my "control" file looks like:

```
Source: qastrologer
Section: network
Priority: optional
Maintainer: Binhao Qian 
Build-Depends: debhelper (>= 5), libcurl4-openssl-dev (>= 7.18), libqt4-dev (>= 4.3)
Standards-Version: 3.7.2

Package: qastrologer
Architecture: any
Depends: libcurl3 (>= 7.18),
         libqt4-core (>= 4.3) | libqtcore4 (>= 4.3), libqt4-gui (>= 4.3) | libqtgui4 (>= 4.3)
Description: Qt-based astrologer application
 Simple application to get astrologer information from sina.tw.
```

Note, the default "control" file uses "${shlibs:Depends}" and "${misc:Depends}" macros to generate binary dependencies automatically. Refer to the man page of debhelper to get more information.

7. Fill in "changelog" and "copyright" files.

8. Build the package:

For full build of the package (build source, deb, clean...) run:

```bash
$ dpkg-buildpackage -rfakeroot
```

Instead if you have a big package, you can also build only the deb file with:

```bash
$ fakeroot debian/rules binary
```
