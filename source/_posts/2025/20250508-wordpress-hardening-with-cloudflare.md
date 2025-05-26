---
title: "WordPress Hardening with Cloudflare"
date: "2025-05-08 22:35:41"
categories: 
  - "tools"
tags: 
  - "cache"
  - "cdn"
  - "cloudflare"
  - "cms"
  - "security"
  - "wordpress"
---

Now the site is under protection of Cloudflare. Some settings:

### 1. Cloudflare as CDN

Cloudflare DNS to configured to proxy the original server. The DNS is also served as CDN. It also adds IPv6, HTTP2 & HTTP3 support. Cloudflare IPs are whitelisted in the inbound rules of my upstream VPS. `mod_remoteip` is enabled in Apache2, and configure with `RemoteIPHeader X-Forwarded-For` for logging.

Go to `SSL/TLS / Overview`, set `SSL/TLS encryption` mode to `Full (strict)`.

#### 1.1 Redirect Rule: Redirect from root to www

Go to `Rules/Overview` to add a cache rule.

```
Request URL: https://gonwan.com/*
Target URL: https://www.gonwan.com/${1}
Preserve query string: true
```

**NOTE**: wordpress does redirect root URL to www URL internally, to align with the `Site Address` settings in `Settings/General`. It can be observed by:

```bash
$ curl -I "https://gonwan.com/" --resolve "gonwan.com:443:<original ip>"
HTTP/1.1 301 Moved Permanently
Date: Sun, 8 May 2025 17:42:48 GMT
Server: gws
X-Redirect-By: WordPress
Location: https://www.gonwan.com/
Content-Type: text/html; charset=UTF-8
```

I just delegated this job to Cloudflare.

### 2. Security Settings

#### 2.1 Security Headers

In `Rules/Settings`, check `Add security headers`. It adds 3 headers in response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and `X-XSS-Protection: 1; mode=block`.

#### 2.2 WAF Rule: Challenge empty referer

Only pseudo code is used to describe the rules, to keep it a secret from web crawlers. Go to `Security/WAF`.

```
(!req.is_ssl && !req.is_root && !req.is_lets_encrypt)
|| (req.user_agent == "")
|| (req.referer == "" && req.url.is_wordpress_post_url && !req.is_known_bot)
```

I actually merge several rules into one, since only 5 rules can be added for a free Cloudflare plan. Here, we allow `Let's Encrypt` to bypass the rule. Their servers renew certificates through plain Http requests.

#### 2.3 WAF Rule: Block `xmlrpc.php`

```
(req.url == "/xmlrpc.php")
|| (req.url == "/wp-login.php")
|| (req.url.starts_with("/wp-config"))
|| (req.url.starts_with("/wp-admin") && (req.is_logging_in or req.is_logged_in))
```

Here, we fixed several wordpress security holes by blocking them. `xmlrpc.php` is only cared by malicious crawlers. `wp-login.php` is blocked, since I have moved the login entrance to somewhere else. `wp-config*` is certainly blocked. It may become `wp-config.php.txt` or `wp-config.php.bak` one day when you backup the config, and your password is exposed. `/wp-admin*` is certainly blocked. No wordpress plugin should access it, it is a design defect.

#### 2.4 WAF Rule: Block bots

```
(req.is_baidu)
|| (req.is_ahrefsbot)
|| (req.is_mj12bot)
```

Here, we block 3 crawlers. Actually only `Baidu` spider is required, it ignores `robots.txt`.

#### 2.5 WAF Rule: Block flood

```
(!req.url.is_wordpress_post_url and !req.url.is_one_of("css", "js", "gif", "jpg", "png", "woff"))
|| (req.url.is("php"))
```

This is a rate limiting rule. Only 1 rule can be used for a free Cloudflare plan. We limit malicious access to `php` and uncommon resource file types. Cloudflare does have DDOS protection in the free plan. I just add one more.

### 3. Cache Settings

#### 3.1 Configure Default Browser Cache TTL

In `Caching/Configuration`, set `Browser Cache TTL` to `Respect Existing Headers`.

#### 3.2 Cache Rule: Cache resources

Go to `Rules/Overview` to add a cache rule.

```
(req.url.extension.is_one_of("css", "js", "gif", "jpg", "png", "svg", "ico", "woff", "woff2"))
```

```
Cache eligibility: Eligible for cache
Edge TTL: Use cache-control header if present, cache request with Cloudflare's default TTL for the response status if not
Status code TTL: 401-404 --> 1month, 200 --> 1month
```

`Edge TTL` specifies how long Cloudflare should cache the response, distinguish from `Browser TTL`. Default TTL for 404 is 3m, while for 200 is 120m. See [here](https://developers.cloudflare.com/cache/how-to/configure-cache-status-code/#edge-ttl). Resource files in wordpress are request by a version parameter to invalidate themself. 120m is a too short duration for them. Cache control can also be configured in the original server. But I choose to adopt Cloudflare.

#### 3.3 Cache Rule: Cache major pages

```
(req.url.is_root)
|| (req.url.is_wordpress_post_url)
```

```
Cache eligibility: Eligible for cache
Edge TTL: Use cache-control header if present, cache request with Cloudflare's default TTL for the response status if not
Status code TTL: 401-404 --> 1month, 200 --> no-cache
```

Yes, we cache error pages, to offload the workload of original server. Major pages are defined as root page(/) and individual wordpress post pages. Cloudflare gives 512M cache space for a free plan, see [here](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/#cacheable-size-limits). Couldflare does not cache HTML by default, explicit configuration is required, see [here](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/#default-cached-file-extensions) (It does cache `robots.txt`). Cloudflare returns `cf-cache-status: DYNAMIC` response header by default. With our configuration, it returns `cf-cache-status: EXPIRED`. A bit strange, but this is my desired behavior. Explanation [here](https://www.debugbear.com/docs/cf-cache-status):

> `HIT`: The resource was served from the Cloudflare cache `MISS`: There was a cache miss and the resource was served from the origin server `DYNAMIC`: The resource was not eligible to be cached based on your Cloudflare cache rules `BYPASS`: The resource would normally be cached, by was the behavior was overridden by a cache-control header or because the origin server set a cookie `EXPIRED`: Cloudflare found a stale resource in the cache and had to fetch it again

`Custom filter expression` is selected for incoming requests matching. Since `All incoming requests` also matches `php` file, which is used by wordpress admin console. It will be a mess if all admin functions are cached.

#### 3.4 Cache Rule: Cache minor pages

```
(!req.url.is_root)
&& (!req.url.is_wordpress_post_url)
&& (req.url.extension.is_one_of("htm", "html", ""))
```

```
Cache eligibility: Eligible for cache
Edge TTL: Use cache-control header if present, cache request with Cloudflare's default TTL for the response status if not
Status code TTL: 401-404 --> 1month, 200 --> 7days
```

Error pages are also cached here. Minor pages are like `/tags/...` and `/category/...`. They are updated in 7 days.

### 4. Conclusion

With all configurations above, the cache hit rate is about 70% - 90% in average. All configurations are monitored and adjusted this week. Wordpress is a legacy monolithic application. It is all-purpose and it can do almost anything regarding content management with plugins. It mixes frontend and backend. It mixes content service and content administration. All those mess make it tricky to setup and tweak correctly.

Some alternatives are found:
- [Ghost](https://ghost.org): The most ideal one, with some drawbacks. a. It does not use html or markdown for contents. b. Plugin installation may require manual file operations. File overwrites are possible. c. Is a raw customized html page possible?
- [Kirby](https://getkirby.com/): It is lightweight, but I do not want php any more.
- [Strapi](https://strapi.io/) and other headless CMS: not so user friendly or costs time to adapt.

Maybe a simple SSG-based blog is the final destination. No more php, no more CDN, no more endless plugins, no more tricky config and hardening work.
