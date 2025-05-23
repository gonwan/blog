---
title: "Fix Window Button Order in Lucid"
date: "2010-08-12"
categories: 
  - "tools"
tags: 
  - "lucid"
  - "ubuntu"
---

I read this [article](http://motersho.com/blog/index.php/2010/03/08/fix-minimizemaximizeclose-button-order-in-ubuntu-10-04-lucid-lynx/) when Lucid was just released. It works good, but there's no window icon in the title bar(See my previous screen-shots).

Then I tried to modify the theme files. Take "Radiance" theme as example:

```
# sudo gedit /usr/share/themes/Radiance/index.theme
```

Change the last line into:

```
ButtonLayout=menu:minimize,maximize,close
```

This will set your window button order. And every time you switch to "Radiance" theme, no confirm dialog will prompt to tell that the button order will be changed. Then:

```
# sudo gedit /usr/share/themes/Radiance/metacity-1/metacity-theme-1.xml
```

Search "menu\_focused\_normal", there are four lines regarding graphics drawing of menu: "menu\_focused\_normal", "menu\_focused\_prelight", "menu\_unfocused\_prelight", "menu\_unfocused\_prelight". Add first line into "menu\_focused\_\*" and remove the image tag, and use second line to replace the image tag in "menu\_unfocused\_\*" too.

OK, you're done.

[![lucid_menu_icon](images/4884126279_515ee61a8f_z.jpg)](http://www.flickr.com/photos/gonwan1985/4884126279 "lucid_menu_icon by Binhao Qian, on Flickr")

**Update Feb 17, 2012**: You can simply run:

```
# gconftool-2 -t string -s /apps/metacity/general/button_layout :minimize,maximize,close
```
