---
title: "Comparison among Distributed Transaction Frameworks"
date: "2022-07-25"
categories: 
  - "java"
tags: 
  - "distributed-systems"
  - "dtm"
  - "mysql"
  - "seata"
---

Just got time to investigate and summarize them. Actually I started from the [Microservices](https://microservices.io/) book, it introduced Saga & transactional outbox pattern. The sample code is too complex, abstracted too well, and hard to trace. After finished reading the book, I still have no option about how to deploy disturbed transactions to my services, without the [author's framework](https://github.com/eventuate-tram/eventuate-tram-sagas). And many details are messed up for me. For instance, what's the difference between Saga, TCC & XA? How to handle partial failures? What if it fails in rollback/cancel phase? How about the latency of Saga? the consistency? I cannot find the precise answer, it is just a book for students, not for engineers.

I investigated several frameworks:

### 1. Seata

[Seata](https://github.com/seata/seata)/Alibaba is the most famous one. It runs in XA, Saga, TCC, and an additional AT(Auto Transaction?) mode. AT mode is actually an application-level XA, which is business-agnostic. Seata manages and generates rollback SQLs for you, but there are limitations. I am most interested in TCC, which is easy to understand, and is the most complete solution to distributed transactions. Also, it requires most effort to implement. From the recent release notes, there are still fundamental bugs, and documents are hard to read, which make me wonder its usability.

### 2. Hmily

[Hmily](https://github.com/dromara/hmily)(How Much I Love You)/JD is the second one, since it's in Java. From the point of an end user, it very easy to integrate. It provides annotations to simplify TCC implementation. But one critical design bug(via quick scan of its code): It saves its transaction logs asynchronously via disruptor, which makes it much easier to lost transactions and lead to an inconsistent status.

### 3. DTM

[dtm](https://github.com/dtm-labs/dtm)/(Bytedance? Tencent?) should be one with most potentialities so far. It clears most of my uncertainty. It has most informative documents, and helps me to [choose](https://en.dtm.pub/practice/choice.html) between all distributed transaction modes. When talking about consistency: XA > TCC > 2-phase message > Saga. And Saga is most useful in long transactions.

One innovation(and patent?): it introduced [subtransaction barriers](https://en.dtm.pub/practice/barrier.html). The mechanism perfectly handles repeated request, dangling action, dangling compensation in TCC automatically, without user attention.

And the only drawback is: it is written in golang(I even learned go programming meanwhile). Hopefully, it provides lightweight restful APIs.

### 4. ByteCC

[ByteCC](https://github.com/liuyangming/ByteTCC). Not investigated. Seems not actively maintained.

### 5. EasyTransaction

[EasyTransaction](https://github.com/QNJR-GROUP/EasyTransaction). Not investigated, [here](https://www.cnblogs.com/skyesx/p/10041923.html) is a review(In Chinese) from the author.
