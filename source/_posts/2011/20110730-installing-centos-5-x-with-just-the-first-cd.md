---
title: "Installing CentOS 5.x with Just the First CD"
date: "2011-07-30"
categories: 
  - "linux"
tags: 
  - "centos"
---

Since the DVD size of CentOS 5.x is largely increased(1.7G for 3.x, 2.3G for 4.x, while 4.0G for 5.x), I decided to use the CD approach. I downloaded the first CD image from one of its mirror site: [http://mirrors.163.com/centos/5.6/isos/i386/](http://mirrors.163.com/centos/5.6/isos/i386/).

Now, follow the official FAQ [here](http://wiki.centos.org/FAQ/CentOS5#head-c79c201900d22f163a445f134fcc6c916eb3cb6e):

> \- You can do a minimal install that just requires the first CD by performing the following two steps during the installation: \*\* During the category/task selection, deselect all package categories, and choose the "Customize now" option at the bottom of screen. \*\* During the customized package selection, deselect everything ( including the Base group ). - There are reports that more than CD 1 is required in the following case: \*\* If you use some software raid options (this will also require CD 2 and 5) \*\* If you use encrypted filesystems - When the anaconda installer notes that additional disks will be required but you desire a one CD install, the quick answer is one or more of the following approaches: \*\* Trim back and do a minimal install. Then once the install is up and running, pull in more packages with yum and add more options later. - If you want to avoid using more than one CD but want to install more than just the minimal set of packages, you could also consider doing a network installation. A network installation ISO (called boot.iso) is available from the 5/os/<arch>/images/ directory on CentOS mirrors. - This latter mode of installation, however, is only really reliable via a LAN (an Intranet installation) and not via the Internet.

From my practice, you MUST follow the de-selection order. Otherwise, it will still require other CDs. The actual installation lasts for about 1 minutes(installation of \*.rpm files). After reboot, the system gives you a minimum installation with only text mode support. Now login with your root account, and make sure your network is ready. Additional components shall be installed manually using yum:

```
# yum groupinstall "Base" "X Window System" "GNOME Desktop Environment"
```

**NOTE**: All group names are case-sensitive.

Actually, if only "X Window System" are passed to yum, you will get a simple GUI with an xterm and an xclock after running "startx" command.

You may want to take coffee during the process. For me, about 350M contents were downloaded. Reboot when finished and add "single" option to enter single mode in GRUB menu.

Since the first CD does not install GUI contents, so the runlevel is set to 3(text mode) by default after installation. We should switch it to 5(GUI mode) by editing /etc/inittab file, Find the line and change the middle value from 3 to 5:

```
id:3:initdefault:
```

Now, we want to start the "firstboot" configuration utility to simplify our user account creation and other initial configurations. Check /etc/sysconfig/firstboot file, and make sure the value is set to "YES" like:

```
RUN_FIRSTBOOT=YES
```

If the value is "NO", the "firstboot" utility is skipped and GDM is displayed directly. When all have been done, issue the "exit" command to return to the normal startup process. This time, the "firstboot" wizard should show.

Here is the GDM screenshot after all above steps:

[![centos5_gdm](images/5989997912_02cec9fe6d_z.jpg)](http://www.flickr.com/photos/gonwan1985/5989997912 "centos5_gdm by Binhao Qian, on Flickr")

**PS**:

In 6.x, CentOS provides LiveCD and LiveDVD that can be used also for installation. But in 5.x, they can only be used for trial experience.

In 4.x/3.x, the openoffice suite is outdated, I suggest to not install them. I also suggest to remove redundant kernels:

```
# For 4.x
# yum remove kernel-smp kernel-smp-devel kernel-hugemem-devel
# For 3.x
# rpm -e kernel-smp
```

There's 4.9 release but no 4.9 \*.iso images. The readme.txt says:

> \- The upstream provider did not respin media for the 4.9 release and therefore the CentOS project will also not respin our install media. - Installs moving forward will be off the 4.8 media and an upgrade will move you from version 4.8 to version 4.9. - We do this to maintain compatibility with 3rd party kernel drivers which are designed to be installed as part of the installation process.

Run "yum update" to update from 4.8 to 4.9. For me, about 300M contents were downloaded.

In 3.x release, I suggest to select "Kernel Development" group during installation. The 2.4.x kernel needs its source to compile kernel modules(like virtual machine addons).
