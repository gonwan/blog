---
title: "11 Years of My Site"
date: "2025-04-09 21:17:04"
categories: 
  - "tools"
tags: 
  - "wordpress"
---

As the recorded by Linode, the site server was first launched on Apr 1, 2014. It was running Ubuntu 12.04. Later I setup wordpress and moved my blog here from Blogspot on Aug 16, 2024. [Spurious Wakeups](https://www.gonwan.com/2014/11/20/spurious-wakeups/) was my first post. Now, the server is running Ubuntu 24.04, and is using [catch box](https://wordpress.org/themes/catch-box/) theme with css customization:

```css
@media screen and (width > 960px) {
  div#page.site {
    width: 1400px;
  }
  div#primary {
    width: calc(100% - 280px);
  }
  aside#secondary {
    width: 260px;
  }
}
.entry-content p {
  margin-bottom: 20px;
}
code {
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 4px 6px;
}
```

Just updated all plugins and found 3 problems.

### 1. Google Analytics 4

Google fully replaced Universal Analytics with [Google Analytics 4](http://) on July 1, 2024. Just noticed that, all visiting history are lost :(

### 2. Fail2ban not working

`Fail2ban` is not working anymore, due to the switch from iptables to nftables in Ubuntu 21.10. So it has broken for about 2 years, since my last upgrade to Ubuntu 22.04. Found the issue by running `fail2ban-client -d`. Simply revert the change in config `sudo vi /etc/fail2ban/jail.d/defaults-debian.conf`.

```ini
[DEFAULT]
#banaction = nftables
#banaction_allports = nftables[type=allports]
banaction = iptables-multiport
banaction_allports = iptables-allports
backend = systemd
```

Since `Fail2ban` also updated its default backend from `pyinotify` to `systemd`(see above), backend should be also reverted in wordpress config `sudo vi /etc/fail2ban/jail.d/wordpress.conf`.

```ini
[wordpress-hard]
backend = pyinotify
enabled = true
filter = wordpress-hard
logpath = /var/log/auth.log
bantime = 86400
maxretry = 1
port = http,https

[wordpress-soft]
backend = pyinotify
enabled = true
filter = wordpress-soft
logpath = /var/log/auth.log
bantime = 3600
maxretry = 3
port = http,https
```

Make sure package `python3-pyinotify` and `python3-system` are installed. Restart Fail2ban.

### 3. Akismet not working

`Akismet` is reporting 500 errors. Details are found in logs: `.../plugins/akismet/.htaccess: Require not allowed here`. This is sloved by adding config to apache server to allow `AuthConfig`, in both http and https config files.

```apache
<Directory .../gonwan.com/public/>
  Require all granted
  AllowOverride AuthConfig FileInfo
</Directory>
```
