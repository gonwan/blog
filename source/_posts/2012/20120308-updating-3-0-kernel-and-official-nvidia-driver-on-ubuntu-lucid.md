---
title: "Updating 3.0 Kernel and Official Nvidia Driver on Ubuntu Lucid"
date: "2012-03-08 07:42:00"
categories: 
  - "linux"
tags: 
  - "lucid"
  - "ubuntu"
---

Ubuntu Lucid(10.04) originally ships with 2.6.32 kernel. But on my T420 thinkpad, the wireless card is not recognized and graphics card is not functional well. Then I switched to 2.6.38 backport kernel, and installed [bumblebee](https://launchpad.net/~bumblebee/+archive/stable) package to utilize the Nvidia Optimus Technology. Now the [3.0.0-16](https://launchpad.net/ubuntu/+source/linux/3.0.0-16.29) backport kernel is out, it contains the fix for "rework ASPM disable code", and it should do a better job in power saving even using the discrete Nvidia card. Moreover, it's the new LTS kernel, so I decided to update to the 3.0 kernel. Please follow the steps if you are interested:

### 1\. Add X-Updates PPA

```
# sudo apt-add-repository ppa:ubuntu-x-swat/x-updates
# sudo apt-get update
# sudo apt-get install nvidia-current
```

These commands install official nvidia driver. Currently, it's the 295.20 version.

### 2\. Enable Nvidia Driver

```
# sudo update-alternatives --config gl_conf
```

This will let you to choose opengl engines. Select nvidia over mesa. This will also enable nvidia Xorg drivers, blacklist nouveau driver and add nvidia-xconfig into /usr/bin. You may find warnings like:

```
update-alternatives: warning: skip creation of /usr/lib32/vdpau/libvdpau_nvidia.so.1 because associated file /usr/lib32/nvidia-current/vdpau/libvdpau_nvidia.so.1 (of link group gl_conf) doesn't exist.
update-alternatives: warning: skip creation of /usr/lib32/libvdpau_nvidia.so because associated file /usr/lib32/nvidia-current/vdpau/libvdpau_nvidia.so (of link group gl_conf) doesn't exist.
```

Just ignore them, seems to be safe.

```
# sudo nvidia-xconfig
```

This will generate new /etc/X11/xorg.conf file for your Nvidia card. If you cannot find the command, the original location is: /usr/lib/nvidia-current/bin/nvidia-xconfig

### 3\. Fix ld Bindings

```
# echo "/usr/lib/nvidia-current/tls" | sudo tee -a /etc/ld.so.conf.d/GL.conf > /dev/null
```

This just add an ld path into /etc/ld.so.conf.d/GL.conf, otherwise, glx module cannot be loaded correctly. Here's the /etc/log/Xorg.0.log segments:

```
(II) LoadModule: "glx"
(II) Loading /usr/lib/xorg/extra-modules/libglx.so
dlopen: libnvidia-tls.so.295.20: cannot open shared object file: No such file or directory
(EE) Failed to load /usr/lib/xorg/extra-modules/libglx.so
(II) UnloadModule: "glx"
(EE) Failed to load module "glx" (loader failed, 7)
```

Now, update ld runtime bindings and reboot.

```
# sudo ldconfig
# sudo reboot
```

### 4\. Verify

```
# sudo apt-get install mesa-utils
# glxinfo | grep -i opengl
```

If your installation is successful, the output looks like:

```
OpenGL vendor string: NVIDIA Corporation
OpenGL renderer string: NVS 4200M/PCIe/SSE2
OpenGL version string: 4.2.0 NVIDIA 295.20
OpenGL shading language version string: 4.20 NVIDIA via Cg compiler
OpenGL extensions:
```

After installing the driver, hedgewars shows 120fps. While it used to show 4fps. It's a great improvement. :)

[![hedgewars](images/6963740713_6580285442_z.jpg)](http://www.flickr.com/photos/gonwan1985/6963740713 "hedgewars by Binhao Qian, on Flickr")
