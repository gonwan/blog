---
title: "Fixing \"App Is Damaged and Can’t Be Opened\""
date: "2019-12-08 10:20:18"
tags: 
  - "macos"
---

Just a reminder when installing 3rdparty software on MacOS.

Starting with MacOS Sierra 10.12, run:

```bash
$ sudo spctl --master-disable
```

Starting with MacOS Catalina 10.15, run:

```bash
$ sudo xattr -d com.apple.quarantine /Applications/<YourApplication>.app
```
