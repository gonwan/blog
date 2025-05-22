---
title: "Benchmark for Web Frameworks (2)"
date: "2023-06-02"
categories: 
  - "cc"
tags: 
  - "benchmark"
  - "framework"
---

Actually a simple note to the [previous article](https://www.gonwan.com/2021/05/08/benchmark-for-web-frameworks/).

\- C: libevent seems to give best performance, but also low level. - C++: drogon has websocket support, but no sse. async. - C++: poco is sync. - C++: workflow is low level, hard to use. wfrest has convenient apis, sse support in trunk. - C++: boost/beast has poor performance, and cannot utilize multi-core cpu. - C++: oatpp is async, but complex framework. - Better use high level languages like Java or Go if running a web application.
