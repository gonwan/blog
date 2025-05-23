---
title: "Some Wordpress Hardening Work"
date: "2025-04-29 18:03:56"
categories: 
  - "linux"
  - "tools"
tags: 
  - "apache"
  - "security"
  - "wordpress"
---

### 1. Disable File Access

```apache
<Files "wp-config.php">
  Require all denied
</Files>
<Files "xmlrpc.php">
  Require all denied
</Files>
```

### 2. Disable `wp-cron.php`

See [here](https://medium.com/@thecpanelguy/the-nightmare-that-is-wpcron-php-ae31c1d3ae30).

> The default method works perfectly fine on a small site with very few visitors per hour. However, when implemented on a medium or larger site or even a site that is being scanned by bots (which is very common these days), this means you get twice fold whatever traffic you are currently handling. It becomes a rudimentary DDoS attack against yourself.

Add `define('DISABLE_WP_CRON', true);` to `wp-config.php`.

### 3. Disable Pingback in Comments

Go to `Settings` --> `Discussion`, uncheck `Allow link notifications from other blogs (pingbacks and trackbacks) on new posts`.

### 4. Disable Json API

Via [Disable WP REST API](https://wordpress.org/plugins/disable-wp-rest-api/). Activate and it just works.

### 5. Hide Login Page

Via [WPS Hide Login](https://wordpress.org/plugins/wps-hide-login/).

### 6. Hide Server Info

Via [mod_security](https://github.com/owasp-modsecurity/ModSecurity). Install and add config in `/etc/apache2/mods-enabled/security2.conf`:

```apache
SecServerSignature "gws"
```

### 7. Disallow IFrame Embedding

To avoid [clickjacking](https://developer.mozilla.org/en-US/docs/Web/Security/Types_of_attacks#clickjacking) attacks:

```apache
Header always set X-Frame-Options "SAMEORIGIN"
```

### 8. Add reCAPTCHA

Via [Advanced Google reCAPTCHA](https://wordpress.org/plugins/advanced-google-recaptcha/).

### 9. Refine `robots.txt`

Via [WP Robots Txt](https://wordpress.org/plugins/wp-robots-txt/):

```
User-agent: AhrefsBot
User-agent: MJ12bot
User-agent: Baiduspider
Disallow: /

User-agent: *
Disallow: /author/
Disallow: /page
Disallow: /wp-admin/

Sitemap: https://www.gonwan.com/wp-sitemap.xml
```

The `/wp-admin/admin-ajax.php` path is allowed by default, see [here](https://developer.wordpress.org/plugins/javascript/ajax/#url) and [here](https://core.trac.wordpress.org/ticket/33156). Simply remove it. **Updated May 8, 2025**: It seems `Baiduspider` ignores `robots.txt`, since no access log for the file is found in latest 5 years. Simply blocked it in Cloudflare WAF.

### 10. More Fail2ban Rules

Including [400/403/404 errors](https://github.com/fail2ban/fail2ban/issues/3322), [directory listing](https://github.com/fail2ban/fail2ban/pull/3993) filters, and [subnet bannning](https://github.com/fail2ban/fail2ban/issues/927).
