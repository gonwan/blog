---
title: "Feature Matrix of NoSQL Databases"
date: "2015-01-21 16:13:24"
categories: 
  - "database"
tags: 
  - "hbase"
  - "mongodb"
  - "nosql"
  - "redis"
  - "sql"
---

Feature matrix of NoSQL databases, listed in Appendix of [Seven Databases in Seven Weeks](http://www.amazon.com/Seven-Databases-Weeks-Modern-Movement/dp/1934356921/):

|   | MongoDB | CouchDB | Riak | Redis | PostgreSQL | Neo4j | HBase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Genre | Document | Document | Key-value | Key-value | Relational | Graph | Columnar |
| Version | 2.0 | 1.1 | 1.0 | 2.4 | 9.1 | 1.7 | 0.90.3 |
| Datatypes | Typed | Typed | Blob | Semi-typed | Predefined and typed | Untyped | Predefined and typed |
| Data Relations | None | None | Ad hoc (Links) | None | Predefined | Ad hoc (Edges) | None |
| Standard Object | JSON | JSON | Text | String | Table | Hash | Columns |
| Written in Language | C++ | Erlang | Erlang | C/C++ | C | Java | Java |
| Interface Protocol | Custom over TCP | HTTP | HTTP, protobuf | Simple text over TCP | Custom over TCP | HTTP | Thrift, HTTP |
| HTTP/REST | Simple | Yes | Yes | No | No | Yes | Yes |
| Ad Hoc Query | Commands, mapreduce | Temporary views | Weak support, Lucene | Commands | SQL | Graph walking, Cypher, search | Weak |
| Mapreduce | JavaScript | JavaScript | JavaScript, Erlang | No | No | No (in the distributed sense) | Hadoop |
| Scalable | Datacenter | Datacenter (via BigCouch) | Datacenter | Cluster (via master-slave) | Cluster (via add-ons) | Cluster (via HA) | Datacenter |
| Durability | Write-ahead journaling, Safe mode | Crash-only | Durable write quorum | Append-only log | ACID | ACID | Write-ahead logging |
|   | MongoDB | CouchDB | Riak | Redis | PostgreSQL | Neo4j | HBase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Secondary Indexes | Yes | Yes | Yes | No | Yes | Yes (via Lucene) | No |
| Versioning | No | Yes | Yes | No | No | No | Yes |
| Bulk Load | mongoimport | Bulk Doc API | No | No | COPY command | No | No |
| Very Large Files | GridFS | Attachments | Lewak (deprecated) | No | BLOBs | No | No |
| Requires Compaction | No | File rewrite | No | Snapshot | No | No | No |
| Replication | Master-slave (via replica sets) | Master-master | Peer-based, master-master | Master-slave | Master-slave | Master-slave (in Enterprise Edition) | Master-slave |
| Sharding | Yes | Yes (with filters in BigCouch) | Yes | Add-ons (e.g., client) | Add-ons (e.g., PL/Proxy) | No | Yes via HDFS |
| Concurrency | Write lock | Lock-free MVCC | Vector-clocks | None | Table/row writer lock | Write lock | Consistent per row |
| Transactions | No | No | No | Multi operation queues | ACID | ACID | Yes (when enabled) |
| Triggers | No | Update validation or Changes API | Pre/post-commits | No | Yes | Transaction event handlers | No |
| Security | Users | Users | None | Passwords | Users/groups | None | Kerberos via Hadoop security |
| Multitenancy | Yes | Yes | No | No | Yes | No | No |
| Main Differentiator | Easily query Big Data | Durable and embeddable clusters | Highly available | Very, very fast | Best of OSS RDBMS model | Flexible graph | Very large-scale, Hadoop infrasturcture |
| Weaknesses | Embed-ability | Query-ability | Query-ability | Complex data | Distributed availability | BLOBs or terabyte scale | Flexible growth, query-ability |
