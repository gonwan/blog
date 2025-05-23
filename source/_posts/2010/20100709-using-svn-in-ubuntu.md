---
title: "Using SVN in Ubuntu"
date: "2010-07-09 12:15:00"
categories: 
  - "tools"
tags: 
  - "svn"
  - "ubuntu"
---

Since I chose SVN as my VCS in google code, a SVN GUI client may be helpful. I found kdesvn. It's free, powerful, and just there in the Ubuntu repository:

```
# sudo apt-get install kdesvn
# sudo apt-get install konqueror
```

The 2nd line is used to fix the bookmark issue in kdesvn :).

Then invoke the line below first:

```
# svn help
```

This will create a default configuration directory for SVN in ~/.subversion/. In fact, any SVN command will do. There are configuration files located in /etc/subversion/. But they seems to be of no use.

Note, kdesvn will use SVN configuration files when perform operations. Now, we need to edit them.

### 1. Proxy

```
# gedit ~/.subversion/servers &
```

Uncomment and modify the following lines in \[global\] section:

```
http-proxy-host = 
http-proxy-port = 
```

It seems that we can use separate settings for different host groups. This is not verified, leaves to you.

### 2. Password

SVN 1.6 added gnome/gnome-keyring and kde/kwallet credentials management support. Some additional options were introduced.

#### 2.1 SVN 1.4.6 (Ubuntu 8.04, Hardy)

```
# gedit ~/.subversion/config &
```

Uncomment and modify the following lines in \[auth\] section:

```
store-passwords = no
store-auth-creds = no
```

You're done. The 1st option prevents SVN from saving plain-text password locally. The 2nd even stops caching the credentials. Then every time you need an SVN authentication, a prompt appears.

Note: you cannot find an option in kdesvn's configuration to set a user/password values. The application just use cached key values in ~/.subversion/auth/ directory.

#### 2.2 SVN 1.6.6 (Ubuntu 10.04, Lucid)

If you do not want to save password, set the 2 values as that in Hardy. But they are deprecated and moved to ~/.subversion/servers.

```
# gedit ~/.subversion/servers &
```

Uncomment and modify the following lines in \[global\] section:

```
store-passwords = no
store-auth-creds = no
```

Then the ~/.subversion/config file:

```
# gedit ~/.subversion/config &
```

Uncomment and modify the following lines in \[auth\] section. Set to empty:

```
password-stores =
```

You're done! All SVN behaviors are consistent with that in Hardy.

If you want to integrate with gnome-keyring or kwallet, modify the line to contain "gnome-keyring", "kwallet" or both. Gnome-keyring does not integrate well with SVN, so I chose kwallet and have a test.

In kdesvn, go to Settings --> Configure Kdesvn --> Subversion, check the "Store passwords into KDE Kwallet" option. It's the default configuration. Make sure that the option and the "password-stores" value are consistent. Otherwise, our kdesvn fail to commit code. When a kdesvn prompts to ask for username/password, check "Store password (into KDE Wallet)" option. Then you can view your saved login information in KWallet Manager application:

[![](images/4777151306_6f5435338d.jpg)](http://www.flickr.com/photos/49942740@N00/4777151306/)

Some other screenshot of kdesvn in Lucid:

Main Window:

[![lucid_kdesvn](images/4777151300_c50f5feb2f_z.jpg)](http://www.flickr.com/photos/gonwan1985/4777151300 "lucid_kdesvn by Binhao Qian, on Flickr")

Revision Tree:

[![lucid_kdesvn_2](images/4777151304_67dd3a7f40_z.jpg)](http://www.flickr.com/photos/gonwan1985/4777151304 "lucid_kdesvn_2 by Binhao Qian, on Flickr")
