---
title: "Root Galaxy Nexus with Android 4.1 Jelly Bean"
date: "2012-07-20 05:53:00"
categories: 
  - "tools"
tags: 
  - "android"
  - "jelly-bean"
---

Just tried to root my GSM Galaxy Nexus manually several days ago. I followed the instruments on the XDA forum [here](http://forum.xda-developers.com/showpost.php?p=19583168) and [here](http://forum.xda-developers.com/showthread.php?t=1737849). File used are placed in my [skydrive](https://skydrive.live.com/#cid=481CBE104492A3AF&id=481CBE104492A3AF%21814).

1. Download root package (SuperSU-0.93-Busybox-1.20.2.zip)
2. Download CWM (recovery-clockwork-5.5.0.2-maguro.img)
3. Reboot into Fastboot Mode: Power off your device and (Power + Volume Up and Down)
4. Unlock the bootloader if locked (fastboot oem unlock) then reboot into fastboot mode again
5. Temporarily flash CWM (fastboot flash recovery recovery-clockwork-5.5.0.2-maguro.img)
6. Boot into recovery (Press Volume Up twice until you see "Recovery mode" then press the Power button)
7. Using CWM recovery, install SuperSU-0.93-Busybox-1.20.2.zip that you downloaded in step 1. The file should be placed in your /sdcard folder.
8. Reboot into the OS
9. You are now rooted
