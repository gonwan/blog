---
title: "Installing Ad-free Cheat Engine"
date: "2026-06-14 19:03:56"
categories: 
  - "tools"
tags: 
  - "cheat-engine"
  - "reverse-engineering"
---

[Cheat Engine](https://cheatengine.org/) 7.7 was just release several days ago. The new version gains additional support for both Linux and MacOS.

The 7.7 installer on the website is just a downloader of the actual installer. It is a InnoSetup one. After some process monitoring work, the actual installer is downloaded into `%LocalAppData%\Temp\is-XXXXX.tmp` directory. The directory name is randrom. So I copied the actual installer as an offline installer. But it only installs 32-bit files.

With the help of [InnoUnpacker-Windows-GUI](https://github.com/jrathlev/InnoUnpacker-Windows-GUI) and some reverse-engineering work. I found that the key is to add two command line options. This can be cross-verified [here](https://www.reddit.com/user/ChucksFeedAndSeed/comments/sw4ttp/cheat_engine_74_adfree_installer/) on Reddit.
```
$ CheatEngine77.exe /VERYSILENT /ZBDIST
```

You can also change the default installation directory with `/DIR="some_custom_directory"` option.
