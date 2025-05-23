---
title: "Mount Samba Share as a Non-root User"
date: "2015-04-09 07:03:12"
categories: 
  - "linux"
tags: 
  - "samba"
---

I used to access windows share folders directly in nautilus, or mount them like:

```bash
$ mount -t cifs -o username=,password= /// /mnt/
```

The problem is, they can be accessed only by root. The solution is adding a simple `uid` option like:

```bash
$ sudo mount -t cifs -o uid=,username=,password=,domain= /// /mnt/ -vvv
```

See: [http://wiki.centos.org/TipsAndTricks/WindowsShares](http://wiki.centos.org/TipsAndTricks/WindowsShares)

**Updated June 1, 2015:**

You may encounter 121 error like:

```
mount error(121): Remote I/O error
Refer to the mount.cifs(8) manual page (e.g. man mount.cifs)
```

It's a Windows side issue, set following registry value to 3. This value tells Windows to prioritize file sharing over reducing memory usage.

```
HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters\Size
```

Reboot (or just restart the "Server" service in services.msc). Your problem should now be solved.

See: [https://boinst.wordpress.com/2012/03/20/mount-cifs-cannot-allocate-memory-mounting-windows-share/](https://boinst.wordpress.com/2012/03/20/mount-cifs-cannot-allocate-memory-mounting-windows-share/)
