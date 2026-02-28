---
title: "Benchmark for Web Frameworks (3)"
date: "2026-02-28 20:06:42"
categories: 
  - "linux"
tags: 
  - "libevent"
  - "drogon"
  - "gin"
  - "gofiber"
  - "spring-webmvc"
  - "spring-webflux"
  - "netty"
---

Refer to [the project page](https://github.com/gonwan/webframework-benchmark). Also see my previous articles: [1](https://www.gonwan.com/2021/05/08/benchmark-for-web-frameworks), [2](https://www.gonwan.com/2023/06/02/benchmark-for-web-frameworks-2).

See [Techempower](https://www.techempower.com/benchmarks/). This repository contains homemade benchmarks for Http servers. Only a single text response is considered, since some servers do not have their builtin Json implementation. Basically, I am benchmarking event loops, with Http implementation.

All server applications are running in a 4C docker environment, while I use [`wrk`](https://github.com/wg/wrk) as the client.

```bash
# benchmark plaintext
$ wrk -c 1000 -t 10 -d 30s http://127.0.0.1:90xx/text
```

### Environment
- Server: 4C docker
- Client: 12C host machine, AMD 7840HS, LinuxMint 22.3 / Ubuntu 24.04.
- All applications are tweaked to work with 4C.
- All Java applications are properly warmed up before benchmark.
- The userland proxy of docker is disabled to eliminate the networking bottleneck. In `/etc/docker/daemon.json`, set the value and restart docker.

```json
{
    "userland-proxy": false
}
```

### Benchmark Result

| Server | Language | Version | Throughput |
| ------------------- | ---- | ---: | ---: |
| [nginx](https://nginx.org/) | C              | 1.28.2        | 102k /s |
| [libevhtp](https://github.com/Yellow-Camper/libevhtp) ([libevent](https://github.com/libevent/libevent)) | C | 1.2.18 / 2.1.12 | 254k /s |
| [drogon](https://github.com/drogonframework/drogon) | C++           | 1.8.7     | 315k /s |
| [beast](https://www.boost.org/doc/libs/latest/libs/beast/doc/html/index.html) | C++ | 1.83 | 215k /s |
| [gin](https://github.com/go-gin/gin) | Go | 1.10.1 | 92k /s |
| [gofiber](https://github.com/gofiber/fiber) | Go | 2.52.12 | 138k /s |
| [hertz](https://github.com/cloudwego/hertz) | Go | 0.10.4 | 138k /s |
| [spring-webflux](https://github.com/spring-projects/spring-boot) ([netty](https://netty.io/)) | Java | 3.5.10 / 4.1.130 | 170k /s |
| [spring-webmvc](https://github.com/spring-projects/spring-boot) ([tomcat](https://tomcat.apache.org/)) | Java | 3.5.10 / 10.1.50 | 47k /s |
| [spring-webmvc](https://github.com/spring-projects/spring-boot) ([tomcat](https://tomcat.apache.org/) with virtual thread) | Java | 3.5.10 / 10.1.50 | 68k /s |
| [spring-webmvc-undertow](https://github.com/undertow-io/undertow) | Java | 3.5.10 / 2.3.22 | 61k /s |

It is a surprise to me, that `drogon` is the best one. It is also an application level framework. `nginx` is here for reference. `libevhtp` is not actively maintained and somehow hard to use, still it get the 2nd place. `beast` is the 3rd. In my previous benchmark, I can remember it did not scale well and got a much lower throughput. It had the same performance running in a 4C and 24C Linux machine. Not knowing why, maybe It was running on an outdated CPU and OS(CentOS 7).

In the Go world, all 3 frameworks give competitive throughput.

In the Java world, `spring-webmvc` still gives the worst performance by default. It does get better when switching to use `undertow` or the virtual thread feature introduce in Java 21, but no so much. There is no big difference when running under Java 21 and Java 25 in this case, regarding [JEP 491](https://openjdk.org/jeps/491)(Synchronize Virtual Threads without Pinning). `spring-weblux` gives the best performance. The `netty`-based solution works even better than the Go frameworks. The drawback is that, it is hard to write and debug reactive code. The Java world seems to have chosen virtual thread, say stackful coroutine, as their future of non-blocking programming. Even Spring has deprecated their [`reactor-kafka`](https://spring.io/blog/2025/05/20/reactor-kafka-discontinued) component.

As a developer, `spring-webmvc` or Go frameworks can still be the first choice, as they are easier to get started.

