---
title: "Updating Kernel in Lucid (2)"
date: "2010-05-18 15:27:00"
categories: 
  - "linux"
tags: 
  - "kernel"
  - "lucid"
  - "ubuntu"
---

It seems a little easier when building Lucid kernel from ubuntu source.

1. Tools:

```
# sudo apt-get install fakeroot kernel-wedge build-essential makedumpfile kernel-package
```

2. Sources:

```
# sudo apt-get source linux-source-2.6.32
```

3. Customize:

cd into "linux-2.6.32" root.

I selected "core2" as my custom name.

```
# cp debian.master/control.d/vars.generic debian.master/control.d/vars.core2
# cp debian.master/abi/2.6.32-21.32/i386/generic debian.master/abi/2.6.32-21.32/i386/core2
# cp debian.master/abi/2.6.32-21.32/i386/generic.modules debian.master/abi/2.6.32-21.32/i386/core2.modules
# cp debian.master/config/i386/config.flavour.generic debian.master/config/i386/config.flavour.core2
```

Then patch some files:

\*) debian.master/etc/getabis: From: getall i386 generic generic-pae 386 To: getall i386 generic generic-pae 386 core2

\*) debian.master/rules.d/i386.mk: From: flavours = generic generic-pae 386 To: flavours = generic generic-pae 386 core2

Now, edit the config file. You will have to go through all the flavors for this script to work properly:

```
# debian/rules editconfigs
```

You should not make changes to any of the configurations until you see the core2 configuration:

```
* Run menuconfig on i386/config.flavour.core2... Press a key.
```

I disabled the "Kernel hacking ==> Kernel debugging" feature to accelerate build process. If you got the error like:

```
debian/scripts/misc/kernelconfig: line 121: /home/gonwan/linux-2.6.32/debian/scripts/misc/splitconfig.pl: Permission denied
```

Simply add the x permission to all scripts, it's a [known bug](https://bugs.launchpad.net/ubuntu/+source/linux/+bug/273437):

```
# chmod +x debian/scripts/*
# chmod +x debian/scripts/misc/*
```

4. Build:

```
# fakeroot debian/rules clean
# CONCURRENCY_LEVEL=2 AUTOBUILD=1 NOEXTRAS=1 skipabi=true fakeroot debian/rules binary-core2
```

If you got the error like:

```
II: Checking modules for core2...
reading new modules...read 2674 modules.
reading old modules...
MISS: dccp_probe
read 2675 modules : new(0)  missing(1)
EE: Missing modules (start begging for mercy)
```

Add option "skipmodule=true" to the last command line. If you got:

```
get_debug_info: Can't create a handle for a new debug session.
makedumpfile Failed.
```

Add option "no_dumpfile=true" to the last command line. And there will be no vmcoreinfo-2.6.32-22-core2 file.

5. Done:

I found that Lucid has 2675 driver modules while Hardy has only 1921. It seems the kernel was greatly enhanced between the two releases.

My T60 has a Duo Core 1.83G CPU. It took about 90 minutes to finish. The kernel also consumed about 4G storage T.T. After all, two \*.deb files were generated: \*) linux-headers-2.6.32-22-core2_2.6.32-22.33_i386.deb \*) linux-image-2.6.32-22-core2_2.6.32-22.33_i386.deb

6. Others:

Since the build process used so much storage, I was monitor my available disk space from time to time using "df" utility. I found the "free space" is about 500M larger than "available space". What happened? Then I found the answer here: [http://ubuntuforums.org/showthread.php?t=328786&page=3](http://ubuntuforums.org/showthread.php?t=328786&page=3) . We can use "tune2fs" utility to set the size of reserved space:

> Set the percentage of the filesystem which may only be allocated by privileged processes. Reserving some number of filesystem blocks for use by privileged processes is done to avoid filesystem fragmentation, and to allow system daemons, such as syslogd(8), to continue to function correctly after non-privileged processes are prevented from writing to the filesystem. Normally, the default percentage of reserved blocks is 5%.

7. Reference: - [https://help.ubuntu.com/community/Kernel/Compile](https://help.ubuntu.com/community/Kernel/Compile) - [http://blog.avirtualhome.com/2010/05/05/how-to-compile-a-ubuntu-lucid-kernel/](http://blog.avirtualhome.com/2010/05/05/how-to-compile-a-ubuntu-lucid-kernel/)
