---
title: "Setting up Pretty Printers in GDB"
date: "2014-07-02 09:21:30"
categories: 
  - "cpp"
tags: 
  - "debugging"
  - "gdb"
---

There's an official page on gcc website: [https://sourceware.org/gdb/wiki/STLSupport](https://sourceware.org/gdb/wiki/STLSupport). And here is how to set up it under Ubuntu.

Under Ubuntu 12.04(Precise), simply install the libstdc++6 debug package. It includes the python script for pretty printers:

```bash
$ sudo apt-get install libstdc++6-4.6-dbg
```

Create a `.gdbinit` file in your home directory, with the content:

```
python
import sys
sys.path.insert(0, '/usr/share/gcc-4.6/python')
from libstdcxx.v6.printers import register_libstdcxx_printers
register_libstdcxx_printers (None)
end
```

My test program looks like:

```cpp
#include <string>
#include <vector>
using namespace std;

int main()
{
    string s = "test";
    vector<int> vi;
    vi.push_back(1);
    vi.push_back(2);
    vi.push_back(3);
    return 0;
}
```

Build it with debugging enabled(-g):

```bash
$ g++ -g test.cpp -o test
```

Debug it with GDB:

```bash
# gdb -q test 
Reading symbols from /home/gonwan/test...done.
(gdb) b 12
Breakpoint 1 at 0x8048842: file test.cpp, line 12.
(gdb) r
Starting program: /home/gonwan/test 

Breakpoint 1, main () at test.cpp:12
12	    return 0;
(gdb) p s
$1 = "test"
(gdb) p vi
$2 = std::vector of length 3, capacity 4 = {1, 2, 3}
(gdb) 
```

Without pretty printers, the output is tedious and hard to understand:

```bash
$ gdb -q test
Reading symbols from /home/gonwan/test...done.
(gdb) set print pretty
(gdb) b 12
Breakpoint 1 at 0x8048842: file test.cpp, line 12.
(gdb) r
Starting program: /home/gonwan/test 

Breakpoint 1, main () at test.cpp:12
12	    return 0;
(gdb) p s
$1 = {
  static npos = , 
  _M_dataplus = {
    > = {
      <__gnu_cxx::new_allocator> = {}, }, 
    members of std::basic_string, std::allocator >::_Alloc_hider: 
    _M_p = 0x804c014 "test"
  }
}
(gdb) p vi
$2 = {
   >> = {
    _M_impl = {
      > = {
        <__gnu_cxx::new_allocator> = {}, }, 
      members of std::_Vector_base >::_Vector_impl: 
      _M_start = 0x804c040, 
      _M_finish = 0x804c04c, 
      _M_end_of_storage = 0x804c050
    }
  }, }
(gdb) 
```

Under Ubuntu 14.04(Trusty), the 4.8 version of debug package should be installed:

```bash
$ sudo apt-get install libstdc++6-4.8-dbg
```

There's an additional step. Since GDB in Trusty is built with python3, not python2, and the python scripts for pretty printers are in python2 syntax. A simple conversion is required:

```bash
$ sudo 2to3 -w /usr/share/gcc-4.8/python/libstdcxx/v6/printers.py
```

Backup it before conversion if neccessary.
