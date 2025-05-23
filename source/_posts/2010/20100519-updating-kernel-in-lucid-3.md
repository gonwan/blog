---
title: "Updating Kernel in Lucid (3)"
date: "2010-05-19 17:18:00"
categories: 
  - "linux"
tags: 
  - "kernel"
  - "lucid"
  - "ubuntu"
---

Today, I built the mainline kernel v2.6.33.4 on Lucid. Most instruments were taken from here: [https://wiki.ubuntu.com/KernelTeam/GitKernelBuild](https://wiki.ubuntu.com/KernelTeam/GitKernelBuild):

1. Unpack:

```
# tar -jxf linux-2.6.33.4.tar.bz2
```

2. Config:

```
# cd linux-2.6.33.4
# cp /boot/config-`uname -r` .config
# yes '' | make oldconfig
# make menuconfig
```

The last line is optional. The wiki said:

> Note that Ubuntu kernels build with debugging information on, which makes the resulting kernel modules (\*.ko files) much larger than they would otherwise be (linux-image\*.deb will be 200-300 MB instead of 20-30 MB). To turn this off, go into "Kernel hacking"; then, under "Kernel debugging", turn off "Compile the kernel with debug info".

**It's outdated maybe.** When building kernel 2.6.24.x in Hardy, It WAS 200-300MB. But in Lucid, it is always 20-30MB. When you turn off the option, the build process took 80min instead of 100min, and 800MB instead of 5G storage. The option is configured by "CONFIG_DEBUG_KERNEL" in .config file.

3. Build:

```
# make-kpkg clean
# CONCURRENCY_LEVEL=`getconf _NPROCESSORS_ONLN` fakeroot make-kpkg --initrd --append-to-version=-custom --revision=2.6.33.4-1 kernel_image kernel_headers
```

After all, two files were generated. It contains 2772 modules. You may find the usage of "--append-to-version" and "--revision" options here: \*) linux-headers-2.6.33.4-custom_2.6.33.4-1_i386.deb \*) linux-image-2.6.33.4-custom_2.6.33.4-1_i386.deb

4. Install:

```
# sudo dpkg -i linux-headers-2.6.33.4-custom_2.6.33.4-1_i386.deb
# sudo dpkg -i linux-image-2.6.33.4-custom_2.6.33.4-1_i386.deb
# sudo update-initramfs -c -k 2.6.33.4-custom
# sudo update-grub
```

The last 2 lines are **NOT** mentioned in the wiki. They are used to generate the initrd image in Lucid. The build also do not generate abi and vmcoreinfo files in /boot.

5. Reference:

[http://ubuntuforums.org/showthread.php?p=9120942](http://ubuntuforums.org/showthread.php?p=9120942)
