---
title: "Hacking QTerm"
date: "2010-07-13"
categories: 
  - "cc"
tags: 
  - "qt"
  - "qterm"
---

I read source code in [QTerm](http://www.qterm.org/) and [FQTerm](http://code.google.com/p/fqterm/) today. Since I want to find reference for Ascii rendering control in my [QAnsiEditor](http://code.google.com/p/qansieditor/) project. After hours of tracing and debugging, I was able to use the rendering control in simplest code. Here's the patch in src/main.cpp:

```
# diff -ruN qterm-0.5.7/src/main.cpp qterm-0.5.7-1/src/main.cpp
--- qterm-0.5.7/src/main.cpp 2009-06-14 23:09:32.000000000 +0800
+++ qterm-0.5.7-1/src/main.cpp 2010-07-14 09:53:06.000000000 +0800
@@ -16,6 +16,9 @@
 #include "qtermconfig.h"
 #include "qtermglobal.h"
 #include "qterm.h"
+#include "qtermparam.h"
+#include "qtermwindow.h"
+#include "qtermscreen.h"
 
 #include 
 #include 
@@ -139,12 +142,27 @@
         return -1;
     }
 
- QTerm::Frame * mw = new QTerm::Frame();
- mw->setWindowTitle( "QTerm "+QString(QTERM_VERSION) );
- mw->setWindowIcon( QPixmap(Global::instance()->pathLib()+"pic/qterm.png") );
- mw->show();
- a.connect( &a, SIGNAL(lastWindowClosed()), &a, SLOT(quit()) );
- int res = a.exec();
+    //QTerm::Frame * mw = new QTerm::Frame();
+    //mw->setWindowTitle( "QTerm "+QString(QTERM_VERSION) );
+    //mw->setWindowIcon( QPixmap(Global::instance()->pathLib()+"pic/qterm.png") );
+    //mw->show();
+    //a.connect( &a, SIGNAL(lastWindowClosed()), &a, SLOT(quit()) );
+    //int res = a.exec();
+
+    using namespace QTerm;
+    Global::instance()->setScrollPosition(Global::Hide);
+    Param param;
+    param.m_BBSCode = "GBK";
+    param.m_nDispCode = 0;
+    param.m_strAddr = "bbs.yanxi.org";
+    //param.m_nProxyType = 4;
+    //param.m_strProxyHost = "gsopanel";
+    //param.m_uProxyPort = 8000;
+    Window *win = new QTerm::Window(0, param);
+    win->setAttribute(Qt::WA_DeleteOnClose);
+    win->setMinimumSize(600, 400);
+    win->show();
 
+    int res = a.exec();
     return res;
 }
```

The screenshot of standalone mode:

[![qterm057_1](images/4791037730_4246bd8302_z.jpg)](http://www.flickr.com/photos/gonwan1985/4791037730 "qterm057_1 by Binhao Qian, on Flickr")

The complete patch and patched source can be found here:

[http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/QAnsiEditor](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/QAnsiEditor)
