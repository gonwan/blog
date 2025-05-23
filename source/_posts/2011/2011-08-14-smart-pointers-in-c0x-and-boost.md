---
title: "Smart Pointers in C++0x and Boost"
date: "2011-08-14"
categories: 
  - "cc"
tags: 
  - "boost"
  - "c0x"
---

Let clarify some concepts first. What is **C++0x**? Wikipedia gives some overview [here](http://en.wikipedia.org/wiki/C++0x):

> C++0x is intended to replace the existing C++ standard, ISO/IEC 14882, which was published in 1998 and updated in 2003. These predecessors are informally but commonly known as C++98 and C++03. The new standard will include several additions to the core language and will extend the C++ standard library, incorporating most of the C++ Technical Report 1 (TR1) libraries — with the exception of the library of mathematical special functions.

Then why it is called C++0x? As [Bjarne Stroustrup](http://www.research.att.com/~bs/homepage.html) addressed [here](http://www2.research.att.com/~bs/bs_faq.html#When-next-standard):

> The aim is for the 'x' in C++0x to become '9': C++09, rather than (say) C++0xA (hexadecimal :-).

You may also noticed TR1, also refer [here](http://en.wikipedia.org/wiki/C++_Technical_Report_1) in Wikipedia:

> C++ Technical Report 1 (TR1) is the common name for ISO/IEC TR 19768, C++ Library Extensions, which is a document proposing additions to the C++ standard library. The additions include regular expressions, smart pointers, hash tables, and random number generators. TR1 is not a standard itself, but rather a draft document. However, most of its proposals are likely to become part of the next official standard.

You got the relationship? C++0x is the standard adding features to both language and standard library. A large set of TR1 libraries and some additional libraries. For instance, `unique_ptr` is not defined in TR1, but is included in C++0x.

As of 12 August 2011, the C++0x specification has been approved by the ISO.

Another notable concept is the [Boost](http://www.boost.org/) library. It can be regarded as a portable, easy-to-use extension to the current C++03 standard library. And some libraries like smart pointers, regular expressions have already been included in TR1. You can find license headers regarding the donation of the boost code in libstdc++ source files. While in TR2, some more boost code are to be involved.

TR1 libraries can be accessed using `std::tr1` namespace. More info on Wikipedia [here](http://en.wikipedia.org/wiki/C++0x#C.2B.2B_standard_library_changes):

> Various full and partial implementations of TR1 are currently available using the namespace std::tr1. For C++0x they will be moved to namespace std. However, as TR1 features are brought into the C++0x standard library, they are upgraded where appropriate with C++0x language features that were not available in the initial TR1 version. Also, they may be enhanced with features that were possible under C++03, but were not part of the original TR1 specification.
> 
> The committee intends to create a second technical report (called TR2) after the standardization of C++0x is complete. Library proposals which are not ready in time for C++0x will be put into TR2 or further technical reports.

The article seems to be a bit too long so far, I decide to give my snippets in a later post.
