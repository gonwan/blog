---
title: "Customizing Ubuntu Image with UCK"
date: "2012-09-14 18:19:00"
categories: 
  - "tools"
tags: 
  - "ubuntu"
---

UCK stands for Ubuntu Customization Kit: [https://launchpad.net/uck](https://launchpad.net/uck)

We can use PPA to install it:

```
# sudo apt-add-repository ppa:uck-team/uck-stable
# sudo apt-get update
# sudo apt-get install uck
```

And you'll find it in under "System Tools" section of your menu. Follow the wizard to create your own Ubuntu image. It will extract your Ubuntu image, and also the squashfs on it. 5G free disk space is required under `~/tmp`. The final customized image locates as `~/tmp/remaster-new-files/livecd.iso`.

I tried to use a 10.04.4 image as base image. It ends with message:

```
You asked for a hybrid ISO but isohybrid command was not found.
```

Don't worry. The final image is already created. `isohybrid` is in `syslinux` package 3.72 and later. But Ubuntu 10.04 has only 3.63.

Now you can use the image like the source image. Either burn it or use it to install from harddisk. I integrated all Chinese supports, codecs and some development tools. See screenshot of my livecd:

[![ubuntu_uck](images/7986046431_fdb8f051e6_z.jpg)](http://www.flickr.com/photos/gonwan1985/7986046431 "ubuntu_uck by Binhao Qian, on Flickr")
