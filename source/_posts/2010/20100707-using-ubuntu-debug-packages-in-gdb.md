---
title: "Using Ubuntu Debug Packages in GDB"
date: "2010-07-07 03:05:00"
categories: 
  - "linux"
tags: 
  - "debugging"
  - "gdb"
  - "ubuntu"
---

I will use openssl library as example. Here's a simplest source:

```
#include 
int main() {
    SSL_library_init();
    return 0;
}
```

Now build and start your GDB, note the '-g' option is necessary:

```
# gcc -g testopenssl.c -o testopenssl -lssl
# gdb ./testopenssl
GNU gdb 6.8-debian
...
(gdb) b 3
Breakpoint 1 at 0x8048495: file testopenssl.c, line 3.
(gdb) r
Starting program: /home/binson/testgdb/testopenssl
Breakpoint 1, main () at testopenssl.c:3
3       SSL_library_init();
(gdb) s
4       return 0;
(gdb)
```

GDB cannot step into openssl source code, since there's no debug symbol found. In Ubuntu, we can install it using apt-get. I'm using Hardy(8.04):

```
# sudo apt-get install libssl0.9.8-dbg
```

Launch our GDB again:

```
# gdb ./testopenssl
GNU gdb 6.8-debian
...
(gdb) b 3
Breakpoint 1 at 0x8048495: file testopenssl.c, line 3.
(gdb) r
Starting program: /home/binson/testgdb/testopenssl
Breakpoint 1, main () at testopenssl.c:3
3       SSL_library_init();
(gdb) s
SSL_library_init () at ssl_algs.c:68
68  ssl_algs.c: No such file or directory.
    in ssl_algs.c
(gdb)
```

Symbols are found, GDB prompt for missing source files! We can install by typing:

```
# sudo apt-get source libssl0.9.8
```

The source files will be downloaded and extracted in openssl-0.9.8g folder. Now we wanna attach the source files when debugging.

```
# gdb ./testopenssl
GNU gdb 6.8-debian
...
(gdb) dir openssl-0.9.8g/ssl/
Source directories searched: /home/binson/testgdb/openssl-0.9.8g/ssl:$cdir:$cwd
(gdb) b 3
Breakpoint 1 at 0x8048495: file testopenssl.c, line 3.
(gdb) r
Starting program: /home/binson/testgdb/testopenssl
Breakpoint 1, main () at testopenssl.c:3
3       SSL_library_init();
(gdb) s
SSL_library_init () at ssl_algs.c:68
68      EVP_add_cipher(EVP_des_cbc());
(gdb) bt
#0  SSL_library_init () at ssl_algs.c:68
#1  0x0804849a in main () at testopenssl.c:3
(gdb) 
```

Oh! Everything works!
