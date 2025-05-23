---
title: "iOS 5 Device Support in Ubuntu Lucid 10.04"
date: "2012-06-16 04:40:00"
categories: 
  - "tools"
tags: 
  - "lucid"
  - "ubuntu"
---

Seems it's quite easy to make my iPod touth 4 (iOS 5.0.1) work. 2 packages need update using PPA [here](https://launchpad.net/~pmcenery/+archive/ppa). Or you can simply download them and install:

```
# wget http://ppa.launchpad.net/pmcenery/ppa/ubuntu/pool/main/u/usbmuxd/usbmuxd_1.0.7-1ubuntu1~lucid1_i386.deb
# wget http://ppa.launchpad.net/pmcenery/ppa/ubuntu/pool/main/u/usbmuxd/libusbmuxd1_1.0.7-1ubuntu1~lucid1_i386.deb
# sudo dpkg -i *.deb
```

Now your audios/videos in your iOS devices are recognized in Rhythmbox :).
