---
title: "File Encodings in Vim"
date: "2011-05-30"
categories: 
  - "linux"
tags: 
  - "lucid"
  - "ubuntu"
  - "vim"
---

By default, You need to guide Vim to decode double-byte encodings like GBK and Big5. The default Vim configuration only works well with Unicode encodings including utf-8, utf-16, utf-16be etc..Edit your .vimrc file, add line like:

```
set fileencodings=ucs-bom,utf-8,gbk,big5,latin1
```

Now Vim is able to detect and decode GBK and Big5 encodings automatically. And according my experience, Vim respects utf-16 and utf-16be files only they have BOM byes. Otherwise, these files are wrongly decoded. In this case, you may want to manually reopen the file using a correct encoding. The Vim command like:

```
:e ++enc=
```

And Vim does not store BOM when saving by default. To enable/disable BOM saving, use:

```
:set bomb
:set nobomb
```

I've attached a series of text files to learn the usage. These text file all contains string "123你好", but saved in different encodings. Let's list their code points first:

<table><tbody align="center"><tr><td></td><td>1</td><td>2</td><td>3</td><td>你</td><td>好</td></tr><tr><td>GBK</td><td>0x31</td><td>0x32</td><td>0x33</td><td>0xc4e3</td><td>0xbac3</td></tr><tr><td>Big5</td><td>0x31</td><td>0x32</td><td>0x33</td><td>0xa741</td><td>0xa66e</td></tr><tr><td>Unicode</td><td>0x31</td><td>0x32</td><td>0x33</td><td>0x4f60</td><td>0x597d</td></tr><tr><td>UTF-8 encoded</td><td>0x31</td><td>0x32</td><td>0x33</td><td>0xe4bda0</td><td>0xe5a5bd</td></tr></tbody></table>

And our hexdump's here, note the byte order:

```
# hexdump -C test_gbk.txt
00000000  31 32 33 c4 e3 ba c3                              |123....|
00000007
# hexdump -C test_big5.txt
00000000  31 32 33 a7 41 a6 6e                              |123.A.n|
00000007
# hexdump -C test_ucs2be.txt
00000000  00 31 00 32 00 33 4f 60  59 7d                    |.1.2.3O`Y}|
0000000a
# hexdump -C test_ucs2be_bom.txt
00000000  fe ff 00 31 00 32 00 33  4f 60 59 7d              |...1.2.3O`Y}|
0000000c
# hexdump -C test_ucs2le.txt
00000000  31 00 32 00 33 00 60 4f  7d 59                    |1.2.3.`O}Y|
0000000a
# hexdump -C test_ucs2le_bom.txt
00000000  ff fe 31 00 32 00 33 00  60 4f 7d 59              |..1.2.3.`O}Y|
0000000c
# hexdump -C test_utf8.txt
00000000  31 32 33 e4 bd a0 e5 a5  bd                       |123......|
00000009
# hexdump -C test_utf8_bom.txt
00000000  ef bb bf 31 32 33 e4 bd  a0 e5 a5 bd              |...123......|
0000000c
```

My test text files are [here](http://cid-481cbe104492a3af.office.live.com/self.aspx/share/dev/encodings.tar.gz). More info:

```
:help encoding
:help fileencoding
:help fileencodings
:help encoding-names
:help bomb
```
