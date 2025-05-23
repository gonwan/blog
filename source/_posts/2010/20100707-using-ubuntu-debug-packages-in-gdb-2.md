---
title: "Using Ubuntu Debug Packages in GDB (2)"
date: "2010-07-07"
categories: 
  - "linux"
tags: 
  - "debugging"
  - "gdb"
  - "qt"
  - "ubuntu"
---

From last blog, I've demostrated the usage of Ubuntu \*-dbg packages. However, not all \*-dbg packages seem to work as libssl0.9.8-dbg. For instance, libcurl3-dbg and libqt4-dbg packages do not work. I'm afraid some debug info are missing in these two packages. I'm not sure.

I googled a lot, but was not able to find a solution. So I decided to build the debug version of the two library myself. Here are steps for libcurl:

```
# sudo apt-get source libcurl3-dbg
# cd curl-7.19.7/
# ./configure --prefix=/usr/local --enable-debug --enable-static=0
# make
```

After all, the compiled binary is located in /home/gonwan/testgdb/curl-7.19.7/lib/.libs/. **Note**, this is a hidden folder.

Here comes our test code:

```
#include 
int main() {
    curl_easy_init();
    return 0;
}
```

Build commands:

```
# gcc -g testcurl.c -o testcurl /usr/lib/libcurl.so.4
```

I use /usr/lib/libcurl.so.4 instead of lcurl, since lcurl will link the binary to /usr/lib/libcurl-gnutls.so.4. But I currently cannot afford it :(. Last, start our GDB:

```
# LD_LIBRARY_PATH=/home/gonwan/testgdb/curl-7.19.7/lib/.libs/ gdb ./testcurl
GNU gdb (GDB) 7.1-ubuntu
...
Reading symbols from /home/gonwan/testgdb/testcurl...done.
(gdb) b 3
Breakpoint 1 at 0x8048572: file testcurl.c, line 3.
(gdb) r
Starting program: /home/gonwan/testgdb/testcurl
[Thread debugging using libthread_db enabled]
Breakpoint 1, main () at testcurl.c:3
3           curl_easy_init();
(gdb) s
curl_easy_init () at easy.c:372
372         if(!initialized) {
(gdb) bt
#0  curl_easy_init () at easy.c:372
#1  0x08048577 in main () at testcurl.c:3
(gdb)
```

It prints the backtrace now, though I'm not so accustomed to console debugging. I add the LD\_LIBRARY\_PATH environment to let our test program find our homemade version of libcurl.so.4. In fact, we can run ldd like following lines. You see the re-direction?

```
# ldd ./testcurl | grep libcurl
    libcurl.so.4 => /usr/lib/libcurl.so.4 (0x00943000)
# LD_LIBRARY_PATH=/home/gonwan/testgdb/curl-7.19.7/lib/.libs/ ldd ./testcurl | grep libcurl
    libcurl.so.4 => /home/gonwan/testgdb/curl-7.19.7/lib/.libs/libcurl.so.4 (0x00318000)
```

Later, I successfully made it possible to debug Qt source code in IDE. I chose QtCreator, since it has both windows and linux version, and it's easy to install and configure. I also built my homemade version of Qt:

```
# sudo apt-get source libqt4-dbg
# cd qt4-x11-4.6.2/
# ./configure -prefix /usr/local -debug-and-release -no-qt3support -no-webkit -no-script -no-scripttools -no-xmlpatterns -no-phonon -no-multimedia -no-declarative -make libs -nomake tools -nomake examples -nomake demos -nomake docs -nomake translations -fast
# make
```

I only built the most common modules, excluding webkit, script, xmlpatterns, phonon, multimedia and declarative modules. It took only 25 minutes to finish (An entire build under windows may take 3 - 4 hours.). After all, start your QtCreator, create a Qt console project with the source below:

```
#include 
int main() {
    QString s = "1234567";
    int i = s.indexOf('3');
    return i != 2;
}
```

Build the project in debug mode. And now, here's the magic: Go to Project tab --> Run Settings --> Run Environment, append our homemade Qt library path to LD\_LIBRARY\_PATH. In my example, it's /home/gonwan/testgdb/qt4-x11-4.6.2/lib. Ok, you're almost done! Go back to the Edit tab, set a breakpoint at line 4 (or line 3 as you like), press F5 to start debugging the project. Then continue pressing F11, you will find GDB has stepped into Qt source code! Let me take a screenshot:

[![qtcreator_qt4debug](images/4771327153_243000e8de_z.jpg)](http://www.flickr.com/photos/gonwan1985/4771327153 "qtcreator_qt4debug by Binhao Qian, on Flickr")

In order to load our homemade \*.so, we can also run "make install".
