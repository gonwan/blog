---
title: "Reset GNOME Keyring Password on Ubuntu"
date: "2012-02-22 08:21:00"
categories: 
  - "tools"
tags: 
  - "ubuntu"
---

[http://ubuntu-tutorials.com/2010/01/16/reset-gnome-keyring-password-on-ubuntu/](http://ubuntu-tutorials.com/2010/01/16/reset-gnome-keyring-password-on-ubuntu/)

Just copy the solution here:

**Method 1:** It is possible to clobber your keyring passphrase and settings from the Terminal. Open a terminal (Applications > Accessories > Terminal), and run the command:

```
# rm ~/.gnome2/keyrings/login.keyring
```

On older systems you may need to try:

```
# rm ~/.gnome2/keyrings/default.keyring
```

**Method 2:** The second method bypasses the Terminal and uses the graphical interface strictly. To delete your current keyring, follow the steps below:

1. Navigate to Applications > Accessories > Passwords and Encryption Keys
2. Select the far-right tab "Passwords"
3. Select your keyring
4. Right-click and attempt "Change Password" or, if that doesn't work, select "Delete"
