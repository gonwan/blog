---
title: "Fix Window Button Order in Lucid"
date: "2010-08-12 07:05:00"
categories: 
  - "tools"
tags: 
  - "lucid"
  - "ubuntu"
---

I read this [article](http://motersho.com/blog/index.php/2010/03/08/fix-minimizemaximizeclose-button-order-in-ubuntu-10-04-lucid-lynx/) when Lucid was just released. It works good, but there's no window icon in the title bar(See my previous screen-shots).

Then I tried to modify the theme files. Take "Radiance" theme as example:

```bash
$ sudo gedit /usr/share/themes/Radiance/index.theme
```

Change the last line into:

```
ButtonLayout=menu:minimize,maximize,close
```

This will set your window button order. And every time you switch to "Radiance" theme, no confirm dialog will prompt to tell that the button order will be changed. Then:

```bash
$ sudo gedit /usr/share/themes/Radiance/metacity-1/metacity-theme-1.xml
```

Search "menu_focused_normal", there are four lines regarding graphics drawing of menu: "menu_focused_normal", "menu_focused_prelight", "menu_unfocused_prelight", "menu_unfocused_prelight". Add first line into "menu_focused_\*" and remove the image tag, and use second line to replace the image tag in "menu_unfocused_\*" too.

OK, you're done.

![lucid_menu_icon](../../images/2010/lucid_menu_icon.jpg)

**Update Feb 17, 2012**: You can simply run:

```bash
$ gconftool-2 -t string -s /apps/metacity/general/button_layout :minimize,maximize,close
```
