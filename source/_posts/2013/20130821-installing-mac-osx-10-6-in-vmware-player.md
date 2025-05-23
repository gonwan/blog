---
title: "Installing Mac OSX 10.6 in VMware Player"
date: "2013-08-21"
categories: 
  - "tools"
tags: 
  - "osx"
  - "snow-leopard"
---

Macintosh really has a fantastic UI. I once installed OSX 10.3 successfully using [pearpc](http://pearpc.sourceforge.net/), but it was awfully slow, since it need to emulate PowerPC via software layer. And now, I just successfully installed OSX 10.6 Snow Leopard in VMware player 5.0.2. The equivalent workstation version is 9.0.2. I tried [virtualbox](http://www.virtualbox.org/), but it just did not work. Now, please follow my steps:

1\. Create a new VM and select the OS type as "FreeBSD".

2\. Close the VMware player. Open the \*.vmx file find the line:

```
guestOS = "freebsd"
```

Change to:

```
guestOS = "darwin10"
```

Start VMware player again. The OS type is now set to "Mac OSX 10.6 Server":

[![osx106_1](images/9560234467_1107f52d79_z.jpg)](https://www.flickr.com/photos/gonwan1985/9560234467 "osx106_1 by Binhao Qian, on Flickr")

3\. Modify VM: set Memory to 1G, check "Accelerate 3D Graphics". Now, here's the most **\_important\_** step: Remove your existing hard disk, and add a new one, but choose SCSI as the virtual disk type. Change the CD/DVD device to also use SCSI type via the "Advanced" button. Without these steps, you will encounter the famous "still waiting for root device" error. Seems OSX cannot handle IDE devices correctly. :(

[![osx106_2](images/9563024154_d67f724616_z.jpg)](https://www.flickr.com/photos/gonwan1985/9563024154 "osx106_2 by Binhao Qian, on Flickr")

4\. I used EmpireEFI v1085 to boot and install OSX 10.6, please find both images for your own. When EmpireEFI boots finishes, mount the OSX 10.6 image and press F5 to refresh. VMware player 5.0.2 supports \*.dmg file directly, please select all files to find the image:

[![osx106_3](images/9563024018_cbfb5f77d6_z.jpg)](https://www.flickr.com/photos/gonwan1985/9563024018 "osx106_3 by Binhao Qian, on Flickr")

5\. Here we go, just press enter and you will be booted into OSX installer:

[![osx106_4](images/9560234011_dd89f87fb2_z.jpg)](https://www.flickr.com/photos/gonwan1985/9560234011 "osx106_4 by Binhao Qian, on Flickr")

6\. If the disk drive doesn't appear under "Select the disk where you want to Install Mac OSX", go to menu Utility --> Disk Utilities and erase the whole disk:

[![osx106_5](images/9563022640_96ae410c8c_z.jpg)](https://www.flickr.com/photos/gonwan1985/9563022640 "osx106_5 by Binhao Qian, on Flickr")

7\. The disk should now appear. You may want to customize the installation by clicking the button in left-bottom corner. Then let's move on:

[![osx106_6](images/9560232069_a56127fe68_z.jpg)](https://www.flickr.com/photos/gonwan1985/9560232069 "osx106_6 by Binhao Qian, on Flickr")

8\. When finished, the system will reboot automatically. And it will fail. We must still use EmpireEFI to boot. But we select to boot OSX this time:

[![osx106_7](images/9563133930_f21195e5e3_z.jpg)](https://www.flickr.com/photos/gonwan1985/9563133930 "osx106_7 by Binhao Qian, on Flickr")

9\. After some simple configuration, you will finally have your OSX desktop. Cheers!

[![osx106_8](images/9560343949_2a412110d8_z.jpg)](https://www.flickr.com/photos/gonwan1985/9560343949 "osx106_8 by Binhao Qian, on Flickr")

**Updated Aug 23:** The EmpireEFI did not work after I upgraded to 10.6.8. Kernel panic appeared like:

```
This symbol set has the following unresolved symbols:
```

I used iBoot 3.3 to replace EmpireEFI, and booted successfully.

[![osx106_9](images/9570527928_d3a1d1756f_z.jpg)](https://www.flickr.com/photos/gonwan1985/9570527928 "osx106_9 by Binhao Qian, on Flickr")

You will have App Store(available in 10.6.6+) in your menu after upgrade. I also installed Xcode 3.2.6 which can still be downloaded from Apple. It requires 10.6.6 too.
