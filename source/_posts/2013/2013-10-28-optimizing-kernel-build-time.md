---
title: "Optimizing Kernel Build Time"
date: "2013-10-28"
categories: 
  - "linux"
tags: 
  - "ccache"
  - "kernel"
---

Continue with [Updating Kernel in Lucid](http://www.gonwan.com/?p=75), I want to decrease overview build time this time. My benchmark is run in Ubuntu 10.04 installed in Virtualbox. My CPU is i5-2540M at 2.6GHz.

I'm learning kernel code these days. A minimal kernel will save a lot of build time. As you see, it took 64min to build 2772 modules when running `oldconfig` target:

|  | Build Time | Build Modules | Package Size |
| --- | --- | --- | --- |
| oldconfig | 64min | 2772 | 33MB |
| localmodconfig | 16min | 244 | 7MB |
| localmodconfig + ccache 1st time | 19min | 244 | 7MB |
| localmodconfig + ccache 2nd time | 7min | 244 | 7MB |

Fortunately, a new build target `localmodconfig` was added in [kernel 2.6.32](http://kernelnewbies.org/Linux_2_6_32) that just helps:

> It runs "lsmod" to find all the modules loaded on the current running system. It will read all the Makefiles to map which CONFIG enables a module. It will read the Kconfig files to find the dependencies and selects that may be needed to support a CONFIG. Finally, it reads the .config file and removes any module "=m" that is not needed to enable the currently loaded modules. With this tool, you can strip a distro .config of all the unuseful drivers that are not needed in our machine, and it will take much less time to build the kernel.

The build time was dramatically decreased to 16min to build only 244 modules. It could still boot my VM to desktop, and everything was working fine. However, it failed to mount an \*.iso file, since the module was not in lsmod when building I think. To use localmodconfig target, run:

```
# yes '' | make localmodconfig
```

It may end up with errors. Please ignore, a new .config file is already generated. Then remember to turn off the `CONFIG_DEBUG_KERNEL` option in the .config file, as mentioned in my previous article.

Then [ccache](http://ccache.samba.org/) is used. I downloaded the source code and built myself, since the 3.x version seems to be faster than 2.4.x version:

```
# tar xzvf ccache-3.1.9.tar.gz
# cd ccache-3.1.9/
# ./configure
# make
# sudo make install
# sudo ln -s /usr/local/bin/ccache /usr/local/bin/gcc
# sudo ln -s /usr/local/bin/ccache /usr/local/bin/cc
```

Default prefix(`/usr/local`) is used here. Last 2 lines created symbolic links(named as the compiler) to ccache, to let ccache masquerade as the compiler. This is suggested in ccache's man page.

So why bother a compiler cache? The makefile doesn't work?

If you ever run "make clean; make" then you can probably benefit from ccache. It is very common for developers to do a clean build of a project for a whole host of reasons, and this throws away all the information from your previous compiles. By using ccache you can get exactly the same effect as "make clean; make" but much faster. Compiler output is kept in `$HOME/.ccache`, by default.

The first run creates the cache, and the second benefits from the cache. That's it.

To display ccache statistics, run:

```
# ccache -s
cache directory                     /home/gonwan/.ccache
cache hit (direct)                  2232
cache hit (preprocessed)              14
cache miss                          2305
called for link                       49
called for preprocessing            1875
compile failed                         1
preprocessor error                     1
bad compiler arguments                 1
unsupported source language         3652
autoconf compile/link                 22
no input file                       4205
files in cache                      6874
cache size                          83.8 Mbytes
max cache size                       1.0 Gbytes
```
