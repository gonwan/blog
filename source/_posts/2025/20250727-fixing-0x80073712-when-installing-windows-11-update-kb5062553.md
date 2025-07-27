---
title: Fixing 0x80073712 When Installing Windows 11 Update KB5062553
categories:
  - "windows"
date: 2025-07-27 18:12:56
---

`0x80073712` means `ERROR_SXS_COMPONENT_STORE_CORRUPT`. Searched a lot, tried to fix it using `sfc` and `dism` commands, nothing helps. Finally, was able to fix it using windows recovery.

Go to `Settings` --> `System` --> `Recovery`, Run `Fix problems using Windows Update`. Now download starts and it will reinstall the current version of windows. All settings and user files are preserved. For me, it took about 1 hour. About 20 GB free space is required. 

After reinstallation, the build version of windows is `26100.4652`, the version of 2025-07 cumulative update. And in windows update history, a `Windows 11, version 24H2 (repair version)` entity appears.
