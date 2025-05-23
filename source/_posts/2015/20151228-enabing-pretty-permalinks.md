---
title: "Enabing Pretty Permalinks"
date: "2015-12-28 05:20:54"
categories: 
  - "tools"
tags: 
  - "wordpress"
---

Well.. long time no see. Just have some time to optimize the site for better analysis.

According to the official [tutorial](http://codex.wordpress.org/Using_Permalinks): 1. Enable `mod_rewrite` in apache2.

```bash
$ sudo a2enmod rewrite
```

2. Enable `FollowSymLinks` option, which is default. 3. Enable `FileInfo` directives. Edit `/etc/apache2/sites-available/yoursite.com.conf`, add:

```apache
  <Directory /home/yourname/yoursite/>
    Require all granted
    AllowOverride FileInfo
  </Directory>
```

4. Restart apache:

```bash
$ sudo service apache2 restart
```

**Updated Dec 31, 2015**: Enabling `mod_rewrite` rewrites all requests including the one used by `mod_status`. To disable this, add a rule to the `.htaccess` file.

```apache
RewriteCond %{REQUEST_URI} !=/server-status
```

Then, change its user & group attributes to prevent overwriting from apache.
