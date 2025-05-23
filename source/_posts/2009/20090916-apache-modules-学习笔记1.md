---
title: "Apache Modules 学习笔记(1)"
date: "2009-09-16 02:54:00"
categories: 
  - "windows"
tags: 
  - "apache"
---

最近看了这本<<The Apache Modules Book>>: [http://www.amazon.com/gp/product/B000SEGRM8/](http://www.amazon.com/gp/product/B000SEGRM8/), 记录一下.

每次我们学一个新的东西的时候, 似乎都会写一个程序叫做"hello world", 今天的目的也在于此. 看这本书的目的主要是为了了解Apache 的扩展性到底是如何做到的. Apache 主要提供了hook, filter, provider 等机制. 其次, 就是Apache 的跨平台和平台相关的优化. 本人对这些东西的了解还比较粗浅, 本书感觉也只是在大量的贴Apache 的源码, 所以还是要看Apache 的manual. 最后, Apache 的源码确实写的非常有参考价值, 很多东西我都不知道原来能那么用的.

好了, 进正题, 我们要写的是一个"hello world" 的generator module. 运行的结果如图:

[![apache_1_1](http://farm4.staticflickr.com/3161/3925163160_13f2cb7e0d_z.jpg?zz=1)](http://www.flickr.com/photos/gonwan1985/3925163160 "apache_1_1 by Binhao Qian, on Flickr")

然后是代码, 有点长:

```cpp
#include <httpd.h>
#include <http_protocol.h>
#include <http_config.h>


static int print_item(void* rec, const char* key, const char* value)
{
  /* rec is a user data pointer */
  request_rec* r = rec;
  ap_rprintf(r, "<tr><th>%s</th><td>%s</td></tr>",
      ap_escape_html(r->pool, key), ap_escape_html(r->pool, value));
  /* 0 would stop iterating, any other return value continues */
  return 1;
}

static void print_table(request_rec* r, apr_table_t* t,
                      const char* keyhead, const char* valhead)
{
  /* table header */
  ap_rputs("<table>", r) ;
  ap_rprintf(r, 
      "<thead><tr><th>%s</th><th>%s</th></tr></thead>", 
      keyhead, valhead);
  /* table data */
  ap_rputs("<tbody>", r);
  apr_table_do(print_item, r, t, NULL);
  ap_rputs("</tbody>", r);
  /* table footer */
  ap_rputs("</table>", r);
}

static int helloworld_handler(request_rec* r)
{
  /* r->handler is specified in configure file */
  if (!r->handler || strcmp(r->handler, "helloworld")) {
      return DECLINED;
  }
  if (r->method_number != M_GET) {
      return HTTP_METHOD_NOT_ALLOWED;
  }
  /* generate html header */
  ap_set_content_type(r, "text/html; charset=ascii");
  ap_rputs("<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\">", r);
  ap_rputs("<html>", r);
  ap_rputs("<head><title>Apache HelloWorld Module</title></head>", r);
  ap_rputs("<body>", r);
  ap_rputs("<h1>Hello World!</h1>", r);
  ap_rputs("<p>This is the Apache HelloWorld module!</p>", r) ;
  /* print the request headers */
  print_table(r, r->headers_in, "Header", "Value") ;
  ap_rputs("</body>", r);
  ap_rputs("</html>", r);
  return OK;
}

static void helloworld_hooks(apr_pool_t* pool)
{
  ap_hook_handler(helloworld_handler, NULL, NULL, APR_HOOK_MIDDLE) ;
}

module AP_MODULE_DECLARE_DATA helloworld_module =
{
  STANDARD20_MODULE_STUFF,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  helloworld_hooks
};
```

这个module 的用途是打印接受到的request 的header 信息. 需要知道的有两部分: module 的声明, module 的hook 函数. Apache 模块的都是通过"module" 这个struct 来声明导出的, 在这个struct 中会初始化这个模块的各个函数指针. 在我们的代码中, 中间5 个值都是NULL, 它们是用来安装配置文件相关的hook 的, 暂时不用. 最后一个hook 则指向一个相当于运行时的hook 函数, 在这个函数, 即"helloworld_hooks" 中, 我们指定Apache 的那些处理过程会被我们hook 到. 这里我们使用了ap_hook_handler 这个函数, 它表明我们的模块是一个generator handler. 它的参数helloworld_handler 依然是一个函数指针, 表示具体的处理过程. 其它的代码都是html 的生成, 先随便看看吧.

接下来是编译的问题. 如果用VC 的话, 那么就是简单的把apache, apr, apr-util 的include 和lib 的路径加进去, 基本就通过编译了. 不过有的module 可能会依赖其它module, 个么这个也自己加. 我写了一个简单的Makefile 来编译, 如下:

```makefile
APACHE=httpd-2.2.13


CC          = cl
DEFINESD    = /DWIN32 /D_DEBUG
DEFINES     = /DWIN32
CFLAGSD     = /nologo /ZI /Od /MDd /LDd
CFLAGS      = /nologo /Zi /O2 /MD /LD
INCPATH     = -I$(APACHE)\include  \
        -I$(APACHE)\srclib\apr\include  \
        -I$(APACHE)\srclib\apr-util\include 
LINK        = link
LFLAGSD     = /DLL
LFLAGS      = /DLL
LIBSD       = $(APACHE)\Debug\libhttpd.lib  \
        $(APACHE)\srclib\apr\Debug\libapr-1.lib  \
        $(APACHE)\srclib\apr-util\Debug\libaprutil-1.lib
LIBS        = $(APACHE)\Release\libhttpd.lib  \
        $(APACHE)\srclib\apr\Release\libapr-1.lib  \
        $(APACHE)\srclib\apr-util\Release\libaprutil-1.lib


debug:
    $(CC) $(DEFINESD) $(CFLAGSD) $(INCPATH) mod_helloworld.c /link $(LFLAGSD) $(LIBSD) /OUT:mod_helloworldd.so

release:
    $(CC) $(DEFINES) $(CFLAGS) $(INCPATH) mod_helloworld.c /link $(LFLAGS) $(LIBSD) /OUT:mod_helloworld.so
```

vs2005, vs2008 皆可通过编译. vs 的-I 选项似乎不支持绝对路径, 所以编译之前请修改$(APACHE) 变量. 另外, 发现一个问题就是, debug 编译的Apache 不能加载release 编译的module. 后来发现是vs2005/2008 的CRT dll的SxS 的问题. 所以, Apache 和module 的编译器最好是同一版本和配置, 这样CRT 才能被正确加载进来. 或者就是静态链接到CRT.

把编译出来的\*.so 文件拷贝到Apache 的modules 文件夹下. 最后来修改配置文件. 打开httpd.conf, 添加如下代码:

```apache
LoadModule helloworld_module modules/mod_helloworld.so
<Location /helloworld>
    SetHandler helloworld
</Location>
```

LoadModule 指令用来加载模块, 第一个参数是在代码中导出(export) 的模块名, 第二个参数是模块的路径. 然后来设置映射关系, 凡是URL 是/helloworld 开头的, 都用helloworld 这个handle 来处理, 而helloworld 这个handle, 实际上只是我们在代码中字符串比较用的, 参见helloworld_handler 这个函数.

以上.
