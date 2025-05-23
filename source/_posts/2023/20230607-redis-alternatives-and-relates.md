---
title: "Redis Alternatives and Relates"
date: "2023-06-07 07:33:48"
categories: 
  - "database"
  - "tools"
tags: 
  - "keydb"
  - "redis"
  - "rocksdb"
  - "tendis"
---

### 1. Tendis

From Tencent, based on RocksDB as persistent storage. Binlog to support resuming transport when running replication.

### 2. Kvrocks

Apache project, poor document. Have seen no advantage over Tendis so far. Also based on RocksDB.

### 3. KeyDB

Redis fork, multi-threading adopted.

### 4. Codis

A Redis proxy, clients are not required to know the cluster protocol.

### 5. redis-cluster-proxy

A Redis proxy, clients are not required to know the cluster protocol.

### 6. RedisShake

Redis data synchronization(Cross DC). Launch multiple process if sync source is a cluster setup. Used for one-shot full sync scenario, not recommanded for long-time incremental sync.
