---
title: "Switching to the Linuxmint 17.1 Theme"
date: "2014-12-02 08:23:28"
categories: 
  - "linux"
tags: 
  - "linuxmint"
---

Just upgraded to Linuxmint 17.1. Themes in the distribution were greatly improved. They've done a better job than Ubuntu, so I switched to the mint theme. [![mint17-3](images/15741443810_386089ae8d_z.jpg)](https://www.flickr.com/photos/gonwan1985/15741443810 "mint17-3 by Binhao Qian, on Flickr")

No broken visual glitch any more in eclipse. And it seems the new themes include fixes for the black background color for tooltips issue. See eclipse FAQ [here](http://wiki.eclipse.org/IRC_FAQ#Black_background_color_for_tooltips_on_Linux.2FUbuntu.2FGTK).

You can compare with the previous screenshot: [Configuring Ubuntu Themes in Linuxmint 17](https://www.gonwan.com/2014/08/12/configuring-ubuntu-themes-in-linuxmint-17/). The only fix I want to apply is to make the theme look brighter. First, go to `/usr/share/themes/Mint-X-Aqua`. For gtk3 applications, patch with:

```diff
--- gtk-3.0/gtk-main.css.bak	2014-12-02 14:06:03.864745990 +0800
+++ gtk-3.0/gtk-main.css	2014-12-02 14:21:32.508879444 +0800
@@ -1,8 +1,8 @@
 /* Default Color Scheme */
 
-@define-color theme_bg_color #d6d6d6;
+@define-color theme_bg_color #e3e3e3;
 @define-color theme_fg_color #212121;
-@define-color theme_base_color #f7f7f7;
+@define-color theme_base_color #fafafa;
 @define-color theme_text_color #212121;
 @define-color theme_selected_bg_color #6cabcd;
 @define-color theme_selected_fg_color #f5f5f5;
```

For gtk2 applications, patch with:

```diff
--- gtk-2.0/gtkrc.bak	2014-12-02 14:22:07.798517093 +0800
+++ gtk-2.0/gtkrc	2014-12-02 14:22:26.575901978 +0800
@@ -1,6 +1,6 @@
 # These are the defined colors for the theme, you can change them in GNOME's appearance preferences.
 
-gtk_color_scheme = "bg_color:#d6d6d6\nselected_bg_color:#6cabcd\nbase_color:#F7F7F7" # Background, base.
+gtk_color_scheme = "bg_color:#e3e3e3\nselected_bg_color:#6cabcd\nbase_color:#fafafa" # Background, base.
 gtk_color_scheme = "fg_color:#212121\nselected_fg_color:#f5f5f5\ntext_color:#212121" # Foreground, text.
 gtk_color_scheme = "tooltip_bg_color:#fbeaa0\ntooltip_fg_color:#212121" # Tooltips.
 gtk_color_scheme = "link_color:#08c" # Hyperlinks
```
