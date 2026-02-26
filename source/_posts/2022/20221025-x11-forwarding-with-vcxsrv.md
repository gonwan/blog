---
title: "X11 Forwarding with VcXsrv"
date: "2022-10-25 12:02:32"
categories: 
  - "tools"
tags: 
  - "x11"
  - "xcxsrv"
  - "remote-control"
---

[`VcXsrv`](https://github.com/marchaesen/vcxsrv) runs an X-server on Windows, which can be used as the server for X11 forwarding.

- `ssh -X` to connect to remote CentOS 7. Install Gnome desktop:

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

- Download and install `XcXsrv` on local Windows system, run `XLaunch` --> `Multiple Windows` --> `Start no client` --> check `Clipboard`, check `Disable access control`, uncheck `Native opengl` --> Finish. The default `DISPLAY` is `${YOUR_LOCAL_IP}:0.0`.

- Install ibus and pinyin input method:
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

- Wayland support: Set `GDK_BACKEND=x11` for Gtk3/Gtk4 apps or `QT_QPA_PLATFORM=xcb` for Qt5/Qt6 apps, to force X11 usage in a Wayland session. The snap version of Firefox may not work, use the deb version from Mozilla.

