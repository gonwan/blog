---
title: "Installing Ubuntu 10.04 (2)"
date: "2010-05-02 12:23:00"
categories: 
  - "linux"
tags: 
  - "lucid"
  - "ubuntu"
---

Some additional words:

Today, I finally reverted to use pidgin instead of emphathy. There's a plugin call "musictracker" which displays the "now playing" info.

```bash
$ sudo apt-get install pidgin-musictracker
```

![lucid_pidgin_now_playing](../../images/2010/lucid_pidgin_now_playing.jpg)

It seems that nickname cannot be changed when using MSN protocol. I did set the friendly name, but Others cannot see. And the personal message is called status in pidgin, so set it there.

For QQ protocol, using pidgin may cause activation problem. An error shows to tell you to activate your account via [jihuo.qq.com](http://jihuo.qq.com/). Open the account settings, uncheck the "Connect by TCP" may solve the issue.

I google a lot to find a plugin for rhythmbox to show lyrics automatically. Though rhythmbox does have a lyrics plugin, it cannot find most Chinese lyrics. Then I find [LrcShow-X](http://forum.ubuntu.org.cn/viewtopic.php?f=74&t=253276&start=0). It works well.

![lucid_rhythmbox_lyrics](../../images/2010/lucid_rhythmbox_lyrics.jpg)
