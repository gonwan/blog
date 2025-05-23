---
title: "CDT Indexer Change History in Eclipse"
date: "2012-10-15 04:55:00"
categories: 
  - "cc"
tags: 
  - "eclipse"
---

First, here's the original indexer preference page of eclipse 3.5 (CDT 6.0):

![eclipse35_cdt60](../../images/2012/eclipse35_cdt60.jpg)

In eclipse 3.6 (CDT 7.0), the full indexer is [removed](https://bugs.eclipse.org/bugs/show_bug.cgi?id=294864) in favour of the fast indexer.

![eclipse36_cdt70](../../images/2012/eclipse36_cdt70.jpg)

And in eclipse 3.7 (CDT 8.0), there seems to be no big changes, "Index source and header files opened in editor" is added and set to false by default:

![eclipse37_cdt80](../../images/2012/eclipse37_cdt80.jpg)

Now, here's the indexer preference page of eclipse 3.8/4.2 (CDT 8.1). Two changes: 1) [Bug 197989](https://bugs.eclipse.org/bugs/show_bug.cgi?id=197989) - Headers included in different variants are not supported. 2) [Bug 377992](https://bugs.eclipse.org/bugs/show_bug.cgi?id=377992) - Enable the "Index unused headers" preference by default. In addition, option to parse files up-front from UI is [removed](http://git.eclipse.org/c/cdt/org.eclipse.cdt.git/commit/?id=0fb12d7d561551926f0dfa07fc5d8803407efb35).

![eclipse38_cdt81](../../images/2012/eclipse38_cdt81.jpg)

I just want to read source code of [apr](http://apr.apache.org/) and [glib](http://developer.gnome.org/glib/stable/), to learn from them. When I created a C project and imported all files into it, some symbols were unresolved or wrongly resolved. In eclipse 3.7/3.8 (CDT 8.0/8.1), I managed to work it out by importing only unix-specific source files.

There's a [performance issue](https://bugs.eclipse.org/bugs/show_bug.cgi?id=385272) in eclipse Juno 4.2, but Juno 3.8 is not affected. So I strongly suggest to use [3.8](http://download.eclipse.org/eclipse/downloads/eclipse3x.html) version. Since there's no all-in-one package for 3.8. It is suggested to download the platform package (not the huge SDK package), and install CDT online.
