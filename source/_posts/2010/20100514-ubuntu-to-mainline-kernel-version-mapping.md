---
title: "Ubuntu to Mainline Kernel Version Mapping"
date: "2010-05-14 15:52:00"
categories: 
  - "linux"
tags: 
  - "kernel"
  - "ubuntu"
---

I'm now using Ubuntu 10.04 (Lucid Lynx). I want to dig into the kernel. When I check the kernel package in Synaptic, I found the version is 2.6.32-22.33, but currently the mainline kernel version is 2.6.32.13. How could that be?

Then I found the following address: [http://kernel.ubuntu.com/~kernel-ppa/info/kernel-version-map.html](http://kernel.ubuntu.com/~kernel-ppa/info/kernel-version-map.html). There's a map, and version 2.6.32-22.33 maps to mainline version 2.6.32.11+drm33.2. DRM stands for Direct Rendering Manager. It's a backport module from 2.6.33 to [provide video acceleration](http://en.wikipedia.org/wiki/Direct_Rendering_Manager).

To further verify the version, I install the linux-source package. In /usr/src/linux-source-2.6.32.tar.bz2!/linux-source-2.6.32/Makefile:

```
VERSION = 2
PATCHLEVEL = 6
SUBLEVEL = 32
EXTRAVERSION = .11+drm33.2
```

But it is a modified version. To get the original kernel package, run the command:

```
# sudo apt-get source linux-source-2.6.32
```

There files will be downloaded: linux\_2.6.32-22.33.dsc, linux\_2.6.32.orig.tar.gz, linux\_2.6.32-22.33.diff.gz. \*.dsc is a signature, \*.orig.tar.gz is the original source, \*.diff.gz is the patch. In the case of packages made specifically for ubuntu, the last of these is not downloaded and the first usually won't have "orig" in the name. In /usr/src/linux-source-2.6.32.orig.tar.gz!/linux-source-2.6.32/Makefile:

```
VERSION = 2
PATCHLEVEL = 6
SUBLEVEL = 32
EXTRAVERSION =
```

And after installed the source, the version number became same as that in the \*.deb package.
