---
title: "Metacity Compositing"
date: "2010-07-16"
categories: 
  - "tools"
tags: 
  - "ubuntu"
---

I installed [Cairo-Dock](http://www.glx-dock.org/) when installing Lucid. And it automatically enabled some desktop effects. Nowadays, I found these effects make my desktop less responsive. So, I decided to turn off them. First, I thought they were compiz effects. I was wrong. Actually, they are metacity compositing effects and come with gnome 2.22 and later versions.

To disable them, run:

```
# gconftool-2 -s '/apps/metacity/general/compositing_manager' --type bool false
```

And this command to enable them:

```
# gconftool-2 -s '/apps/metacity/general/compositing_manager' --type bool true
```

Additional info: [http://blogs.gnome.org/metacity/category/compositing/](http://blogs.gnome.org/metacity/category/compositing/)
