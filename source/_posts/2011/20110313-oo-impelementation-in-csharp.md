---
title: "OO Impelementation in C#"
date: "2011-03-13 11:09:00"
categories: 
  - "net"
tags: 
  - "oop"
---

Finally, we comes with the C# language. C# supports all OO features mentioned in previous articles in language level. So, our implementation is quite straight forward. Just check the source code in my skydrive: [http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO](http://cid-481cbe104492a3af.office.live.com/browse.aspx/share/dev/TestOO). In the TestCSObject-{date}.zip file.

Lastly, I drew a simple table to compare and summarize the OO supports in the four leading languages:

<table style="text-align: center; width: 660px;" border="1" cellspacing="0" cellpadding="0"><tbody><tr><td style="width: 120px;"></td><td style="width: 130px;">C/gtk+</td><td style="width: 170px;">C++/Qt</td><td style="width: 130px;">Java</td><td style="width: 170px;">C#</td></tr><tr><td></td><td colspan="4">Basic Features</td></tr><tr><td>Encapsulation</td><td style="background-color: #ffc000;">library</td><td style="background-color: red;">good design</td><td style="background-color: #92d050;">Y</td><td style="background-color: #92d050;">Y</td></tr><tr><td>Inheritance</td><td style="background-color: #ffc000;">library</td><td style="background-color: #92d050;">Y</td><td style="background-color: #92d050;">Y</td><td style="background-color: #92d050;">Y</td></tr><tr><td>Polymorphism</td><td style="background-color: red;">function pointer</td><td style="background-color: #92d050;">Y</td><td style="background-color: #92d050;">Y</td><td style="background-color: #92d050;">Y</td></tr><tr><td></td><td colspan="4">Advanced Features</td></tr><tr><td>Property</td><td style="background-color: #ffc000;">library</td><td style="background-color: #ffc000;">library</td><td style="background-color: red;">reflection feature</td><td style="background-color: #92d050;">Y</td></tr><tr><td>Meta Info</td><td style="background-color: #ffc000;">library</td><td style="background-color: #ffc000;">library</td><td style="background-color: #92d050;">annotations</td><td style="background-color: #92d050;">attributes</td></tr><tr><td>Event Driven</td><td style="background-color: #ffc000;">library(signals)</td><td style="background-color: #ffc000;">library(signals/slots)</td><td style="background-color: #92d050;">events/listeners</td><td style="background-color: #92d050;">delegates/events/handlers</td></tr><tr><td></td><td colspan="4">Measurements (Using a test application to demostrate above 5 features)</td></tr><tr><td>Compiler</td><td>mingw32-gcc/3.4</td><td>mingw32-g++/3.4</td><td>JDK/1.6.20</td><td>VC#/2005</td></tr><tr><td>Library</td><td>gtk+/2.16.6</td><td>Qt/4.3.5</td><td>Java/6.0</td><td>.NET/2.0</td></tr><tr><td>Source Size</td><td>19.09 KB</td><td>7.28 KB (+10.17 KB) *</td><td>13.18 KB</td><td>6.28 KB</td></tr><tr><td>Binary Size</td><td>32.69 KB</td><td>34.00 KB</td><td>9.48 KB</td><td>5.50 KB</td></tr><tr><td>Runtime Size</td><td>1.46 MB</td><td>2.00 MB</td><td>15.54 MB</td><td>23.84 MB</td></tr><tr><td style="text-align: left;" colspan="5"></td></tr><tr><td style="text-align: left;" colspan="5">* Generated source</td></tr></tbody></table>

Here's the complete list of all articles regarding OO implementation in C, C++, Java & C#:- [OOP Using GObject (1) - A Fundamental Type](http://www.gonwan.com/2011/03/11/oop-using-gobject-1-a-fundamental-type/)
- [OOP Using GObject (2) - A Classed Type](http://www.gonwan.com/2011/03/11/oop-using-gobject-2-a-classed-type/)
- [OOP Using GObject (3) - An Instantiatable Class](http://www.gonwan.com/2011/03/11/oop-using-gobject-3-an-instantiatable-class/)
- [OOP Using GObject (4) - An Inheritable Class](http://www.gonwan.com/2011/03/11/oop-using-gobject-4-an-inheritable-class/)
- [OOP Using GObject (5) - Private Members](http://www.gonwan.com/2011/03/11/oop-using-gobject-5-private-members/)
- [OOP Using GObject (6) - Properties](http://www.gonwan.com/2011/03/11/oop-using-gobject-6-properties/)
- [OOP Using GObject (7) - Signals](http://www.gonwan.com/2011/03/11/oop-using-gobject-7-signals/)
- [OOP Using GObject (8) - An interface](http://www.gonwan.com/2011/03/11/oop-using-gobject-8-an-interface/)
- [OOP Using GObject (9) - A Dynamic Type](http://www.gonwan.com/2011/03/12/oop-using-gobject-9-a-dynamic-type/)
- [OO Impelementation in C++](http://www.gonwan.com/2011/03/13/oo-impelementation-in-cpp/)
- [OO Impelementation in Java](http://www.gonwan.com/2011/03/13/oo-impelementation-in-java/)
- [OO Impelementation in C#](http://www.gonwan.com/2011/03/13/oo-impelementation-in-csharp/)
