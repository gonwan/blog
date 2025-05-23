---
title: "Using vcpkg for C++ Package Management"
date: "2022-09-28 09:05:58"
categories: 
  - "cc"
  - "linux"
tags: 
  - "centos"
  - "cmake"
  - "vcpkg"
---

Verified on CentOS7 and Windows 10.

### 1. Install v2ray and run proxy

```bash
$ nohup ./v2ray run config.json &
$ export http_proxy="socks5://localhost:xxxxx"
$ export https_proxy="socks5://localhost:xxxxx"
```

v2ray unblocks github access from mainland China. Install v2ray clients and set IE proxy **only** on Windows, bootstrap.bat & vcpkg.exe picks it automatically.

### 2. Download vcpkg from github and bootstrap

Download from: [https://github.com/microsoft/vcpkg/releases](https://github.com/microsoft/vcpkg/releases)

```bash
$ cd vcpkg-2022.08.15
$ ./bootstrap-vcpkg.sh
```

Export `vcpkg-2022.08.15` directory as `${VCPKG_ROOT}`.

### 3. Install drogon framework for demo

The drogon framework is a high performance application framework, including client & server supports. vcpkg builds static(\*.a) library by default, use `x64-linux-dynamic` for dynamic(\*.so) library. The repo version requires g++-8 to build, install from CentOS SCL:

```bash
$ yum install centos-release-scl
$ yum install devtoolset-8
$ echo '. /opt/rh/devtoolset-8/enable' | tee -a /etc/profile
$ . /etc/profile
$ # export CC=/opt/rh/devtoolset-8/root/usr/bin/gcc
$ # export CXX=/opt/rh/devtoolset-8/root/usr/bin/g++
```

To build with g++-7, manually install `boost-filesystem` package in vcpkg, and edit `${VCPKG_ROOT}/ports/drogon/portfile.cmake` and comment out:

```
...
    #-DCMAKE_DISABLE_FIND_PACKAGE_Boost=ON
...
```

On Windows, open the command line for Visual Studio develop environment.

```bash
$ ./vcpkg search drogon
# linux, drogon[postgres] dynamic build is not well supported on linux
$ ./vcpkg install drogon[ctl,mysql,orm,redis] --triplet=x64-linux-dynamic
# windows
$ vcpkg install drogon[ctl,mysql,orm,redis] --triplet=x64-windows
```

If openssl build fails, run:

```bash
$ yum install perl-IPC-Cmd perl-Data-Dumper
```

If other errors, try to update to recent github ports. In my case, `libmariadb` build failed, that have been [fixed](https://github.com/microsoft/vcpkg/pull/26704) in master.

### 4. Export drogon framework

```bash
$ ./vcpkg export drogon:x64-linux-dynamic --zip
# Zip archive exported at: ${VCPKG_ROOT}/vcpkg-export-20220928-102415.zip
# To use the exported libraries in CMake projects use:
#    -DCMAKE_TOOLCHAIN_FILE=[...]/scripts/buildsystems/vcpkg.cmake
```

### 5. Add a demo program

```cpp
// drogon_server.cpp
#include <drogon/drogon.h>
using namespace drogon;

int main()
{
    app().registerHandler(
        "/text",
        [](const HttpRequestPtr &,
           std::function<void(const HttpResponsePtr &)> &&callback) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setBody("Hello World!");
            callback(resp);
        },
        {Get});
    app().registerHandler(
        "/json",
        [](const HttpRequestPtr &,
           std::function<void(const HttpResponsePtr &)> &&callback) {
            Json::Value json;
            json["Message"] = "Hello World!";
            auto resp = HttpResponse::newHttpJsonResponse(json);
            callback(resp);
        },
        {Get});
    LOG_INFO << "Server running on 0.0.0.0:8099";
    app().addListener("0.0.0.0", 8099)
         .setThreadNum(24)
         .enableServerHeader(false)
         .enableDateHeader(false)
         //.enableRunAsDaemon()
         .run();
}
```

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.15)
project(drogon_server CXX)
set(CMAKE_CXX_STANDARD 17)
message("Got CMAKE_PREFIX_PATH: ${CMAKE_PREFIX_PATH}")
find_package(Drogon CONFIG REQUIRED)
add_executable(drogon_server drogon_server.cpp)
target_link_libraries(drogon_server PRIVATE Drogon::Drogon)
```

Linux dynamic build is community supported, invoke cmake with:

```bash
# linux
$ cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake -DVCPKG_TARGET_TRIPLET=x64-linux-dynamic
# windows
$ cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake -DVCPKG_TARGET_TRIPLET=x64-windows
```

Now build with make or Visual Studio.

### 6. Stick to a specific version

add a `vcpkg.json` file:

```json
{
  "name": "drogon-server",
  "version-string": "0.1.0",
  "dependencies": [
    { "name": "drogon", "version>=": "1.7.5", "features": [ "ctl", "mysql", "orm", "redis" ] },
    "openssl"
  ],
  "overrides": [
    { "name": "drogon", "version": "1.8.0" },
    { "name": "openssl", "version-string": "1.1.1n#1" }
  ],
  "builtin-baseline": "4e73d1b47a7e5428e2ea9dbec43b136a6632a7cb"
}
```

It sticks to drogon 1.8.0 and openssl 1.1.1n. `${VCPKG_ROOT}` now required to be a git repository. In your project directory, install specific versions of libraries by running:

```bash
# linux
$ ./vcpkg --feature-flags="versions" install --triplet=x64-linux-dynamic
# windows
$ vcpkg --feature-flags="versions" install --triplet=x64-windows
```

Run cmake:

```bash
# linux
$ cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake -DVCPKG_TARGET_TRIPLET=x64-linux-dynamic
# windows
$ cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake -DVCPKG_TARGET_TRIPLET=x64-windows
$ cd build
$ make
```

Now ldd output shows openssl 1.1 (default build is 3.0):

```bash
$ ldd drogon_server
        linux-vdso.so.1 =>  (0x00007ffc1bf9c000)
        libdrogon.so.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libdrogon.so.1 (0x00007fbbd2329000)
        libtrantor.so.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libtrantor.so.1 (0x00007fbbd1ea0000)
        libpthread.so.0 => /lib64/libpthread.so.0 (0x00007fbbd1c84000)
        libjsoncpp.so.25 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libjsoncpp.so.25 (0x00007fbbd19ed000)
        libstdc++.so.6 => /lib64/libstdc++.so.6 (0x00007fbbd16e5000)
        libm.so.6 => /lib64/libm.so.6 (0x00007fbbd13e3000)
        libgcc_s.so.1 => /lib64/libgcc_s.so.1 (0x00007fbbd11cd000)
        libc.so.6 => /lib64/libc.so.6 (0x00007fbbd0dff000)
        libdl.so.2 => /lib64/libdl.so.2 (0x00007fbbd0bfb000)
        libmariadb.so.3 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libmariadb.so.3 (0x00007fbbd098d000)
        libz.so.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libz.so.1 (0x00007fbbd0769000)
        libssl.so.1.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libssl.so.1.1 (0x00007fbbd04d1000)
        libcrypto.so.1.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libcrypto.so.1.1 (0x00007fbbcffd7000)
        libbrotlidec.so.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libbrotlidec.so.1 (0x00007fbbcfdb6000)
        libbrotlienc.so.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libbrotlienc.so.1 (0x00007fbbcf85c000)
        libbrotlicommon.so.1 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libbrotlicommon.so.1 (0x00007fbbcf63a000)
        libhiredis.so.1.0.0 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libhiredis.so.1.0.0 (0x00007fbbcf424000)
        /lib64/ld-linux-x86-64.so.2 (0x00007fbbd2ebc000)
        libcares.so.2 => ./vcpkg_installed/x64-linux-dynamic/debug/lib/libcares.so.2 (0x00007fbbcf205000)
```

The only difference is the existence of `vcpkg.json` file, when using versioning.

### 7. Binary caching

If you change the root path of vcpkg, better clean up the cache, or build may fail. It's `$HOME/.cache/vcpkg/archives` under Linux, and `%LOCALAPPDATA%\vcpkg\archives` under Windows.
