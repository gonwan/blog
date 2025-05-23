---
title: "Using WebDAV in Apache"
date: "2011-02-13"
categories: 
  - "tools"
tags: 
  - "apache"
  - "webdav"
---

From wikipedia [http://en.wikipedia.org/wiki/WebDAV](http://en.wikipedia.org/wiki/WebDAV):

**Web-based Distributed Authoring and Versioning** (**WebDAV**) is a set of methods based on the Hypertext Transfer Protocol (HTTP) that facilitates collaboration between users in editing and managing documents and files stored on World Wide Web servers. WebDAV was defined in RFC 4918 by a working group of the Internet Engineering Task Force (IETF).

The WebDAV protocol makes the Web a readable and writable medium, in line with Tim Berners-Lee's original vision. It provides a framework for users to create, change and move documents on a server (typically a web server or "web share"). The most important features of the WebDAV protocol include:

- locking ("overwrite prevention")
- properties (creation, removal, and querying of information about author, modified date et cetera);
- name space management (ability to copy and move Web pages within a server's namespace)
- collections (creation, removal, and listing of resources)

I used Apache to experience the WebDAV. The server was built and installed from source with:

```
# ./configure --prefix=/usr/local/apache2 --with-layout=Apache --with-mpm=prefork --enable-mods-shared=all --enable-ssl
# make
# sudo make install
```

The "prefix", "layout", "mpm" switch is not necessary, since these are the default values under Unix. Now modify the configure files to support WebDAV access:

```
# cd /usr/local/apache2
# sudo mkdir var uploads
# sudo chown -R daemon:daemon var uploads
# sudo bin/htdigest -c user.passwd DAV-upload user
# sudo bin/htdigest user.passwd DAV-upload admin
```

The "var" and "uploads" directory, the "DAV-upload" realm, "user.passwd" file, "user" and "admin" user account are referred by "conf/extra/webdav.conf". While the "daemon" user and group are referred by "conf/httpd.conf".

Then modify "httpd.conf" to include "webdav.conf" the apache server. It a single include directive. Now start the apache server by running:

```
# sudo bin/apachectl start
```

Our WebDAV directory is /uploads. So here's the address on how to access it: - In nautilus: dav://192.168.1.100/uploads - In konquer: webdav://192.168.1.100/uploads - In windows: Go to --> My Network Places --> Add a network place --> Internet or network address --> Enter (http://<user>:<password>@192.168.1.100/uploads) --> Finish!
