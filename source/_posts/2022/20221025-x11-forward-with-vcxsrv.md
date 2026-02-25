---
title: "X11 Forward with VcXsrv"
date: "2022-10-25 12:02:32"
categories: 
  - "tools"
tags: 
  - "x11"
  - "xcxsrv"
  - "remote-control"
---

- Install Gnome desktop on CentOS 7:
```shell
$ sudo yum groupinstall "GNOME Desktop"
```

- Install mesa drivers:
```shell
$ sudo yum install mesa-dri-drivers
```

- Edit `/etc/ssh/sshd_config`, make sure it contains:
```
X11Forwarding yes
X11UseLocalhost no
```

- [Download](https://github.com/marchaesen/vcxsrv) and install `XcXsrv`, run `XLaunch` --> `Multiple Windows` --> `Start no client` --> check `Clipboard`, check `Disable access control`, uncheck `Native opengl` --> Finish. The default `DISPLAY` is `${YOUR_LOCAL_IP}:0.0`.

- Now ssh connect to the remote server. Install ibus and pinyin input method:
```shell
$ sudo yum install chromium
$ sudo yum install ibus-gtk3 ibus-libpinyin
$ export DISPLAY=${YOUR_LOCAL_IP}:0.0
$ ibus-setup
```
  Run `ibus-setup` to add pinyin input method. The setup UI should appear on your local X server on Windows.

- Run chromium, it should now on the local X server and ibus also works:
```shell
$ export GTK_IM_MODULE=xim
$ export QT_IM_MODULE=xim
$ export XMODIFIERS=@im=ibus
$ export DISPLAY=${YOUR_LOCAL_IP}:0.0
$ ibus-daemon -drx
$ chromium-browser --proxy-server=socks5://127.0.0.1:xxxxx &
```

- Wayland support: Set `GDK_BACKEND=x11` for Gtk3/Gtk4 apps or `QT_QPA_PLATFORM=xcb` for Qt5/Qt6 apps, to force X11 usage in a Wayland session. The `xwayland` package is required to work.

