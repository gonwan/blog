---
title: "Patching QTerm"
date: "2010-10-23 18:36:00"
categories: 
  - "cc"
tags: 
  - "qt"
  - "qterm"
---

Long time no post here. Recently, I reported 3 bugs to [QTerm](http://qterm.sourceforge.net/wiki/index.php/Main_Page) project and patches were provided. This is my first time to contribute an open-source project.

Then I was able to build my private patched debian package of QTerm with the guide [here](http://ubuntuforums.org/showthread.php?t=51003). I just use the official debian package meta info found in [this mirror site](http://mirror.lupaworld.com/ubuntu/pool/universe/q/qterm/). Some notes to take: 1. The path should be like: /home/<your\_name>/packages/<your\_project>/ 2. Before running "dpkg-buildpackage -rfakeroot", check the debian/control file to see what packages is required to build. 3. The revision of package seems to be controlled by debian/changelog.

My private build file can be found in my skydrive: - For Hardy(8.04): [QTerm 0.5.7](http://cid-481cbe104492a3af.office.live.com/self.aspx/share/dev/QAnsiEditor/qterm%5E_0.5.7-2%5E_i386.deb) - For Lucid(10.04): [QTerm 0.5.11](http://cid-481cbe104492a3af.office.live.com/self.aspx/share/dev/QAnsiEditor/qterm%5E_0.5.11-2%5E_i386.deb)
