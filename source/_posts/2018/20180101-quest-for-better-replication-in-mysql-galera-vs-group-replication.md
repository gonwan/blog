---
title: "Quest for Better Replication in MySQL: Galera vs. Group Replication"
date: "2018-01-01 09:00:21"
categories: 
  - "database"
tags: 
  - "gelera"
  - "ha"
  - "mysql"
  - "paxos"
  - "percona"
---

Original post: [https://www.percona.com/blog/2017/02/24/battle-for-synchronous-replication-in-mysql-galera-vs-group-replication/](https://www.percona.com/blog/2017/02/24/battle-for-synchronous-replication-in-mysql-galera-vs-group-replication/)

**UPDATE**: Some of the language in the original post was considered overly-critical of Oracle by some community members. This was not my intent, and I’ve modified the language to be less so. I’ve also changed term “synchronous” (which the use of is inaccurate and misleading) to “virtually synchronous.” This term is more accurate and already used by both technologies’ founders, and should be less misleading.

I also wanted to thank Jean-François Gagné for pointing out the incorrect sentence about multi-threaded slaves in Group Replication, which I also corrected accordingly.

In today’s blog post, I will briefly compare two major virtually synchronous replication technologies available today for MySQL.

### More Than Asynchronous Replication

Thanks to the Galera plugin, founded by the Codership team, we’ve had the choice between asynchronous and virtually synchronous replication in the MySQL ecosystem for quite a few years already. Moreover, we can choose between at least three software providers: Codership, MariaDB and Percona, each with its own Galera implementation.

The situation recently became much more interesting when MySQL Group Replication went into [GA (stable) stage in December 2016](http://mysqlhighavailability.com/mysql-group-replication-its-in-5-7-17-ga/).

Oracle, the upstream MySQL provider, introduced its own replication implementation that is very similar in concept. Unlike the others mentioned above, it isn’t based on Galera. Group Replication was built from the ground up as a new solution. MySQL Group Replication shares many very similar concepts to Galera. This post doesn’t cover MySQL Cluster, another and fully-synchronous solution, that existed much earlier then Galera — it is a much different solution for different use cases.

In this post, I will point out a couple of interesting differences between Group Replication and Galera, which hopefully will be helpful to those considering switching from one to another (or if they are planning to test them).

This is certainly not a full list of all the differences, but rather things I found interesting during my explorations.

It is also important to know that Group Replication has evolved a lot before it went GA (its whole cluster layer was replaced). I won’t mention how things looked before the GA stage, and will just concentrate on latest available 5.7.17 version. I will not spend too much time on how Galera implementations looked in the past, and will use Percona XtraDB Cluster 5.7 as a reference.

### Multi-Master vs. Master-Slave

Galera has always been multi-master by default, so it does not matter to which node you write. Many users use a single writer due to workload specifics and multi-master limitations, but Galera has no single master mode per se.

Group Replication, on the other hand, promotes just one member as primary (master) by default, and other members are put into read-only mode automatically. This is what happens if we try to change data on non-master node:

```
mysql> truncate test.t1;
ERROR 1290 (HY000): The MySQL server is running with the --super-read-only option so it cannot execute this statement
```

To change from single primary mode to multi-primary (**multi-master**), you have to start group replication with the `group_replication_single_primary_mode` variable disabled. Another interesting fact is you do not have any influence on which cluster member will be the master in single primary mode: the cluster auto-elects it. You can only check it with a query:

```
mysql> SELECT * FROM performance_schema.global_status WHERE VARIABLE_NAME like 'group_replication%';
+----------------------------------+--------------------------------------+
| VARIABLE_NAME                    | VARIABLE_VALUE                       |
+----------------------------------+--------------------------------------+
| group_replication_primary_member | 329333cd-d6d9-11e6-bdd2-0242ac130002 |
+----------------------------------+--------------------------------------+
1 row in set (0.00 sec)
```

Or just:

```
mysql> show status like 'group%';
+----------------------------------+--------------------------------------+
| Variable_name                    | Value                                |
+----------------------------------+--------------------------------------+
| group_replication_primary_member | 329333cd-d6d9-11e6-bdd2-0242ac130002 |
+----------------------------------+--------------------------------------+
1 row in set (0.01 sec)
```

To show the hostname instead of UUID, here:

```
mysql> select member_host as "primary master" from performance_schema.global_status join performance_schema.replication_group_members where variable_name='group_replication_primary_member' and member_id=variable_value;
+----------------+
| primary master |
+----------------+
| f18ff539956d   |
+----------------+
1 row in set (0.00 sec)
```

### Replication: Majority vs. All

Galera delivers write transactions synchronously to **ALL** nodes in the cluster. (Later, applying happens asynchronously in both technologies.) However, Group Replication needs just a majority of the nodes confirming the transaction. This means a transaction commit on the writer succeeds and returns to the client even if a minority of nodes still have not received it.

In the example of a three-node cluster, if one node crashes or loses the network connection, the two others continue to accept writes (or just the primary node in Single-Primary mode) even before a faulty node is removed from the cluster.

If the separated node is the primary one, it denies writes due to the lack of a quorum (it will report the error `ERROR 3101 (HY000): Plugin instructed the server to rollback the current transaction.`). If one of the nodes receives a quorum, it will be elected to primary after the faulty node is removed from the cluster, and will then accept writes.

With that said, the “majority” rule in Group Replication means that there isn’t a guarantee that you won’t lose any data if the majority nodes are lost. There is a chance these could apply some transactions that aren’t delivered to the minority at the moment they crash.

In Galera, a single node network interruption makes the others wait for it, and pending writes can be committed once either the connection is restored or the faulty node removed from cluster after the timeout. So the chance of losing data in a similar scenario is lower, as transactions always reach all nodes. Data can be lost in Percona XtraDB Cluster only in a really bad luck scenario: a network split happens, the remaining majority of nodes form a quorum, the cluster reconfigures and allows new writes, and then shortly after the majority part is damaged.

### Schema Requirements

For both technologies, one of the requirements is that all tables must be InnoDB and have a primary key. This requirement is now enforced by default in both Group Replication and [Percona XtraDB Cluster 5.7](https://www.percona.com/doc/percona-xtradb-cluster/5.7/features/pxc-strict-mode.html). Let’s look at the differences. **Percona XtraDB Cluster**:

```
mysql> create table nopk (a char(10));
Query OK, 0 rows affected (0.08 sec)

mysql> insert into nopk values ("aaa");
ERROR 1105 (HY000): Percona-XtraDB-Cluster prohibits use of DML command on a table (test.nopk) without an explicit primary key with pxc_strict_mode = ENFORCING or MASTER

mysql> create table m1 (id int primary key) engine=myisam;
Query OK, 0 rows affected (0.02 sec)

mysql> insert into m1 values(1);
ERROR 1105 (HY000): Percona-XtraDB-Cluster prohibits use of DML command on a table (test.m1) that resides in non-transactional storage engine with pxc_strict_mode = ENFORCING or MASTER

mysql> set global pxc_strict_mode=0;
Query OK, 0 rows affected (0.00 sec)

mysql> insert into nopk values ("aaa");
Query OK, 1 row affected (0.00 sec)

mysql> insert into m1 values(1);
Query OK, 1 row affected (0.00 sec)
```

Before Percona XtraDB Cluster 5.7 (or in other Galera implementations), there were no such enforced restrictions. Users unaware of these requirements often ended up with problems.

**Group Replication**:

```
mysql> create table nopk (a char(10));
Query OK, 0 rows affected (0.04 sec)

mysql> insert into nopk values ("aaa");
ERROR 3098 (HY000): The table does not comply with the requirements by an external plugin.

2017-01-15T22:48:25.241119Z 139 [ERROR] Plugin group_replication reported: 'Table nopk does not have any PRIMARY KEY. This is not compatible with Group Replication'

mysql> create table m1 (id int primary key) engine=myisam;
ERROR 3161 (HY000): Storage engine MyISAM is disabled (Table creation is disallowed).
```

I am not aware of any way to disable these restrictions in Group Replication.

### GTID

Galera has it’s [own Global Transaction ID](http://galeracluster.com/documentation-webpages/architecture.html#global-transaction-id), which has existed since MySQL 5.5, and is independent from MySQL’s GTID feature introduced in MySQL 5.6. If MySQL’s GTID is enabled on a Galera-based cluster, both numerations exist with their own sequences and UUIDs.

Group Replication is based on a native MySQL GTID feature, and relies on it. Interestingly, a separate sequence block range (initially 1M) is [pre-assigned](http://dev.mysql.com/doc/refman/5.7/en/group-replication-options.html#sysvar_group_replication_gtid_assignment_block_size) for each cluster member.

### WAN Support

The MySQL Group Replication documentation isn’t very optimistic on WAN support, claiming that both _“Low latency, high bandwidth network connections are a requirement”_ and _“Group Replication is designed to be deployed in a cluster environment where server instances are very close to each other, and is impacted by both network latency as well as network bandwidth.”_ These statements are found [here](http://dev.mysql.com/doc/refman/5.7/en/group-replication-frequently-asked-questions.html) and [here](http://dev.mysql.com/doc/refman/5.7/en/group-replication-requirements.html). However there is network traffic optimization: [Message Compression](http://dev.mysql.com/doc/refman/5.7/en/group-replication-message-compression.html).

I don’t see group communication level tunings available yet, as we find in the Galera [evs.\* series](http://galeracluster.com/documentation-webpages/configurationtips.html?highlight=wan#wan-replication) of `wsrep_provider_options`.

Galera founders actually [encourage trying it in geo-distributed environments](http://galeracluster.com/2015/07/geo-distributed-database-clusters-with-galera), and some WAN-dedicated settings are available (the most important being [WAN segments](https://www.percona.com/blog/2013/12/19/automatic-replication-relaying-galera-3/)).

But both technologies need a reliable network for good performance.

### State Transfers

Galera has two types of state transfers that allow syncing data to nodes when needed: incremental (IST) and full (SST). Incremental is used when a node has been out of a cluster for some time, and once it rejoins the other nodes has the missing write sets still in Galera cache. Full SST is helpful if incremental is not possible, especially when a new node is added to the cluster. SST automatically provisions the node with fresh data taken as a snapshot from one of the running nodes (donor). The most common SST method is using Percona XtraBackup, which takes a fast and non-blocking binary data snapshot (hot backup).

In Group Replication, state transfers are fully based on binary logs with GTID positions. If there is no donor with all of the binary logs (included the ones for new nodes), a DBA has to first provision the new node with initial data snapshot. Otherwise, the joiner will fail with a very familiar error:

```
2017-01-16T23:01:40.517372Z 50 [ERROR] Slave I/O for channel 'group_replication_recovery': Got fatal error 1236 from master when reading data from binary log: 'The slave is connecting using CHANGE MASTER TO MASTER_AUTO_POSITION = 1, but the master has purged binary logs containing GTIDs that the slave requires.', Error_code: 1236
```

[The official documentation mentions](http://dev.mysql.com/doc/refman/5.7/en/group-replication-usage-advice-and-limitations-of-distributed-recovery.html) that provisioning the node before adding it to the cluster may speed up joining (the recovery stage). Another difference is that in the case of state transfer failure, a Galera joiner will abort after the first try, and will shutdown its mysqld instance. The Group Replication joiner will then fall-back to another donor in an attempt to succeed. Here I found something slightly annoying: if no donor can satisfy joiner demands, it will still keep trying **the same** donors over and over, for a [fixed number of attempts](http://dev.mysql.com/doc/refman/5.7/en/group-replication-options.html#sysvar_group_replication_recovery_retry_count):

```
[root@cd81c1dadb18 /]# grep 'Attempt' /var/log/mysqld.log | tail
2017-01-16T22:57:38.329541Z 12 [Note] Plugin group_replication reported: 'Establishing group recovery connection with a possible donor. Attempt 1/10'
2017-01-16T22:57:38.539984Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 2/10'
2017-01-16T22:57:38.806862Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 3/10'
2017-01-16T22:58:39.024568Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 4/10'
2017-01-16T22:58:39.249039Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 5/10'
2017-01-16T22:59:39.503086Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 6/10'
2017-01-16T22:59:39.736605Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 7/10'
2017-01-16T23:00:39.981073Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 8/10'
2017-01-16T23:00:40.176729Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 9/10'
2017-01-16T23:01:40.404785Z 12 [Note] Plugin group_replication reported: 'Retrying group recovery connection with another donor. Attempt 10/10'
```

After the last try, even though it fails, [mysqld keeps running](https://bugs.mysql.com/bug.php?id=84728) and allows client connections…

### Auto Increment Settings

Galera adjusts the auto\_increment\_increment and auto\_increment\_offset values according to the number of members in a cluster. So, for a 3-node cluster, `auto_increment_increment` will be “3” and `auto_increment_offset` from “1” to “3” (depending on the node). If a number of nodes change later, these are updated immediately. This feature can be disabled using the `wsrep_auto_increment_control` setting. If needed, these settings can be set manually.

Interestingly, in Group Replication the `auto_increment_increment` seems to be fixed at 7, and only `auto_increment_offset` is set differently on each node. This is the case even in the default Single-Primary mode! this seems like a waste of available IDs, so make sure that you adjust the `group_replication_auto_increment_increment` setting to a saner number before you start using Group Replication in production.

### Multi-Threaded Slave Side Applying

Galera developed its own multi-threaded slave feature, even in 5.5 versions, for workloads that include tables in the same database. It is controlled with the [wsrep\_slave\_threads](https://www.percona.com/doc/percona-xtradb-cluster/5.6/wsrep-system-index.html#wsrep_slave_threads) variable. Group Replication uses a feature introduced in MySQL 5.7, where the number of applier threads is controlled with [slave\_parallel\_workers](http://dev.mysql.com/doc/refman/5.7/en/replication-options-slave.html#sysvar_slave_parallel_workers). Galera will do multi-threaded replication based on potential conflicts of changed/locked rows. Group Replication parallelism is based on an improved LOGICAL\_CLOCK scheduler, which uses information from writesets dependencies. This can allow it to achieve much better results than in normal asynchronous replication MTS mode. More details can be found here: [http://mysqlhighavailability.com/zooming-in-on-group-replication-performance/](http://mysqlhighavailability.com/zooming-in-on-group-replication-performance/)

### Flow Control

Both technologies use a technique to throttle writes when nodes are slow in applying them. Interestingly, the default size of the allowed applier queue in both is much different:

[gcs.fc\_limit](https://www.percona.com/doc/percona-xtradb-cluster/5.7/wsrep-provider-index.html#gcs.fc_limit) (Galera) = 16 (the limit is increased automatically based on number of nodes, i.e. to 28 in 3-node cluster) [group\_replication\_flow\_control\_applier\_threshold](https://dev.mysql.com/doc/refman/5.7/en/group-replication-options.html#sysvar_group_replication_flow_control_applier_threshold) (Group Replication) = 25000. Moreover, Group Replication provides separate certifier queue size, also eligible for the Flow Control trigger: `group_replication_flow_control_certifier_threshold`. One thing I found difficult, is checking the actual applier queue size, as the only exposed one via [performance\_schema.replication\_group\_member\_stats](http://dev.mysql.com/doc/refman/5.7/en/group-replication-replication-group-member-stats.html) is the `Count_Transactions_in_queue` (which only shows the certifier queue).

### Network Hiccup/Partition Handling

In Galera, when the network connection between nodes is lost, those who still have a quorum will form a new cluster view. Those who lost a quorum keep trying to re-connect to the primary component. Once the connection is restored, separated nodes will sync back using IST and rejoin the cluster automatically.

This doesn’t seem to be the case for Group Replication. Separated nodes that lose the quorum will be expelled from the cluster, and [won’t join back automatically](https://bugs.mysql.com/bug.php?id=84784) once the network connection is restored. In its error log we can see:

```
2017-01-17T11:12:18.562305Z 0 [ERROR] Plugin group_replication reported: 'Member was expelled from the group due to network failures, changing member status to ERROR.'
2017-01-17T11:12:18.631225Z 0 [Note] Plugin group_replication reported: 'getstart group_id ce427319'
2017-01-17T11:12:21.735374Z 0 [Note] Plugin group_replication reported: 'state 4330 action xa_terminate'
2017-01-17T11:12:21.735519Z 0 [Note] Plugin group_replication reported: 'new state x_start'
2017-01-17T11:12:21.735527Z 0 [Note] Plugin group_replication reported: 'state 4257 action xa_exit'
2017-01-17T11:12:21.735553Z 0 [Note] Plugin group_replication reported: 'Exiting xcom thread'
2017-01-17T11:12:21.735558Z 0 [Note] Plugin group_replication reported: 'new state x_start'
```

Its status changes to:

```
mysql> SELECT * FROM performance_schema.replication_group_members;
+---------------------------+--------------------------------------+--------------+-------------+--------------+
| CHANNEL_NAME              | MEMBER_ID                            | MEMBER_HOST  | MEMBER_PORT | MEMBER_STATE |
+---------------------------+--------------------------------------+--------------+-------------+--------------+
| group_replication_applier | 329333cd-d6d9-11e6-bdd2-0242ac130002 | f18ff539956d | 3306        | ERROR        |
+---------------------------+--------------------------------------+--------------+-------------+--------------+
1 row in set (0.00 sec)
```

It seems the only way to bring it back into the cluster is to **manually** restart Group Replication:

```
mysql> START GROUP_REPLICATION;
ERROR 3093 (HY000): The START GROUP_REPLICATION command failed since the group is already running.
mysql> STOP GROUP_REPLICATION;
Query OK, 0 rows affected (5.00 sec)

mysql> START GROUP_REPLICATION;
Query OK, 0 rows affected (1.96 sec)

mysql> SELECT * FROM performance_schema.replication_group_members;
+---------------------------+--------------------------------------+--------------+-------------+--------------+
| CHANNEL_NAME              | MEMBER_ID                            | MEMBER_HOST  | MEMBER_PORT | MEMBER_STATE |
+---------------------------+--------------------------------------+--------------+-------------+--------------+
| group_replication_applier | 24d6ef6f-dc3f-11e6-abfa-0242ac130004 | cd81c1dadb18 | 3306        | ONLINE       |
| group_replication_applier | 329333cd-d6d9-11e6-bdd2-0242ac130002 | f18ff539956d | 3306        | ONLINE       |
| group_replication_applier | ae148d90-d6da-11e6-897e-0242ac130003 | 0af7a73f4d6b | 3306        | ONLINE       |
+---------------------------+--------------------------------------+--------------+-------------+--------------+
3 rows in set (0.00 sec)
```

Note that in the above output, after the network failure, Group Replication did not stop. It waits in an error state. Moreover, in Group Replication a partitioned node keeps serving **dirty reads** as if nothing happened (for non-super users):

```
cd81c1dadb18 {test} ((none)) > SELECT * FROM performance_schema.replication_group_members;
+---------------------------+--------------------------------------+--------------+-------------+--------------+
| CHANNEL_NAME              | MEMBER_ID                            | MEMBER_HOST  | MEMBER_PORT | MEMBER_STATE |
+---------------------------+--------------------------------------+--------------+-------------+--------------+
| group_replication_applier | 24d6ef6f-dc3f-11e6-abfa-0242ac130004 | cd81c1dadb18 | 3306        | ERROR        |
+---------------------------+--------------------------------------+--------------+-------------+--------------+
1 row in set (0.00 sec)

cd81c1dadb18 {test} ((none)) > select * from test1.t1;
+----+-------+
| id | a     |
+----+-------+
| 1  | dasda |
| 3  | dasda |
+----+-------+
2 rows in set (0.00 sec)

cd81c1dadb18 {test} ((none)) > show grants;
+-------------------------------------------------------------------------------+
| Grants for test@%                                                             |
+-------------------------------------------------------------------------------+
| GRANT SELECT, INSERT, UPDATE, DELETE, REPLICATION CLIENT ON *.* TO 'test'@'%' |
+-------------------------------------------------------------------------------+
1 row in set (0.00 sec)
```

A privileged user can disable `super_read_only`, but then it won’t be able to write:

```
cd81c1dadb18 {test} ((none)) > insert into test1.t1 set a="split brain";
ERROR 3100 (HY000): Error on observer while running replication hook 'before_commit'.

cd81c1dadb18 {root} ((none)) > select * from test1.t1;
+----+-------+
| id | a     |
+----+-------+
| 1 | dasda  |
| 3 | dasda  |
+----+-------+
2 rows in set (0.00 sec)
```

I found an interesting thing here, which I consider to be a [bug](http://bugs.mysql.com/bug.php?id=84574). In this case, a partitioned node can actually perform DDL, despite the error:

```
cd81c1dadb18 {root} ((none)) > show tables in test1;
+-----------------+
| Tables_in_test1 |
+-----------------+
| nopk            |
| t1              |
+-----------------+
2 rows in set (0.01 sec)

cd81c1dadb18 {root} ((none)) > create table test1.split_brain (id int primary key);
ERROR 3100 (HY000): Error on observer while running replication hook 'before_commit'.

cd81c1dadb18 {root} ((none)) > show tables in test1;
+-----------------+
| Tables_in_test1 |
+-----------------+
| nopk            |
| split_brain     |
| t1              |
+-----------------+
3 rows in set (0.00 sec)
```

In a Galera-based cluster, you are automatically protected from that, and a partitioned node refuses to allow both reads and writes. It throws an error: `ERROR 1047 (08S01): WSREP has not yet prepared node for application use`. You can force dirty reads using the `wsrep_dirty_reads` variable.

There many more subtle (and less subtle) differences between these technologies – but this blog post is long enough already. Maybe next time 🙂
