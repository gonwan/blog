---
title: "Zip Compression Bug in JDK was Fixed"
date: "2009-05-14 11:03:00"
categories: 
  - "java"
---

The long-living zip compression file name encoding bug in JDK was finally fixed. Since the original ZipEntry class will encode/decode the file name in platform's native encoding, one zip file created under one codepage cannot be decoded correctly under another codepage. The workaround is to use the ZipEntry class in the [ant project](http://ant.apache.org/). But in current JDK7 early access, the ZipEntry class also added the encoding support as the ant project.

This feature was found occasionally when I checked the JDK7 project's changeset: [http://download.java.net/jdk7/changes/jdk7-b57.html](http://download.java.net/jdk7/changes/jdk7-b57.html)
