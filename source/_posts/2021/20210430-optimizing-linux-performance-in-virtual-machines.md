---
title: "Optimizing Linux Performance in Virtual Machines"
date: "2021-04-30"
categories: 
  - "linux"
tags: 
  - "linuxmint"
---

Bad performance after upgrading to Linux Mint 20 (Ubuntu 20.04 based). Solved by disabling transparent hugepage in kernel.

The grub approach survives a restart:

```bash
$ sudo vi /etc/default/grub
```

Find and replace `GRUB_CMDLINE_LINUX` line to:

```
GRUB_CMDLINE_LINUX="transparent_hugepage=never"
```

Update grub and reboot:

```bash
$ sudo update-grub
```

**Updated Oct 4, 2021**: if using Windows guest, also use OpenGL render to avoid high CPU usage. Edit \*.vmx file and add:

```
mks.enableMTLRenderer = "FALSE"
mks.enableGLRenderer = "TRUE"
```
