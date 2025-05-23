---
title: "Compact Gnome Theme in Hardy"
date: "2010-06-02 16:49:00"
categories: 
  - "tools"
tags: 
  - "gnome"
  - "ubuntu"
---

Refer to: [http://martin.ankerl.com/2008/10/10/how-to-make-a-compact-gnome-theme/](http://martin.ankerl.com/2008/10/10/how-to-make-a-compact-gnome-theme/)

I chosen the Glossy theme and made a compact one. I tried to make smallest changes and it was enough.

```bash
$ sudo cp -r /usr/share/themes/Glossy/ /usr/share/themes/GlossyCompact/
$ cd /usr/share/themes/GlossyCompact/
$ sudo gedit index.theme
```

Modify the name and comments, save.

```bash
$ sudo gedit gtk-2.0/gtkrc
```

Add the following line:

```
gtk-icon-sizes = "panel-menu=20,20:gtk-menu=16,16:gtk-button=16,16:gtk-small-toolbar=16,16:gtk-large-toolbar=20,20:gtk-dnd=32,32:gtk-dialog=32,32"
```

Ok, now let's compare the result:

[![theme_glossy](images/4641411335_ebeec6b293_z.jpg)](http://www.flickr.com/photos/gonwan1985/4641411335 "theme_glossy by Binhao Qian, on Flickr")

[![theme_glossy_compact](images/4641411233_05716ff8a5_z.jpg)](http://www.flickr.com/photos/gonwan1985/4641411233 "theme_glossy_compact by Binhao Qian, on Flickr")
