---
title: "Batch Insert with MySQL"
date: "2017-12-27"
categories: 
  - "database"
tags: 
  - "hibernate"
  - "mariadb"
  - "mysql"
  - "spring"
---

Adopting to using Spring Data JPA these day, there is a [post](https://vladmihalcea.com/2017/10/17/9-high-performance-tips-when-using-mysql-with-jpa-and-hibernate/) saying: _IDENTITY generator disables JDBC batch inserts_. To figure out the impact, create a table with 10 data fields and an auto-increment id for testing. I am using MySQL 5.7.20 / MariaDB 10.3.3 / Spring Data JPA 1.11.8 / Hibernate 5.0.12.

```
CREATE TABLE `t_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field1` varchar(255) DEFAULT NULL,
  `field2` varchar(255) DEFAULT NULL,
  `field3` varchar(255) DEFAULT NULL,
  `field4` varchar(255) DEFAULT NULL,
  `field5` varchar(255) DEFAULT NULL,
  `field6` varchar(255) DEFAULT NULL,
  `field7` varchar(255) DEFAULT NULL,
  `field8` varchar(255) DEFAULT NULL,
  `field9` varchar(255) DEFAULT NULL,
  `field10` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

And generate the persistence entity, add `@GeneratedValue` annotation:

```
package com.gonwan.spring.generated;

import javax.persistence.*;

@Entity
@Table(name = "t_user", schema = "test", catalog = "")
public class TUser {
    private int id;
    private String field1;
    private String field2;
    private String field3;
    private String field4;
    private String field5;
    private String field6;
    private String field7;
    private String field8;
    private String field9;
    private String field10;

    @Id
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    /* mysql / table */
    //@GeneratedValue(strategy = GenerationType.TABLE, generator = "tableGenerator")
    //@TableGenerator(name = "tableGenerator", allocationSize = 100, table = "t_generator", pkColumnName = "gen_name", valueColumnName = "gen_value", pkColumnValue = "SEQ_USER")
    /* mariadb / sequence  */
    //@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    //@SequenceGenerator(name = "sequenceGenerator", allocationSize = 100, sequenceName = "s_user")
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    /* field getters/setters omitted. */

}
```

My benchmark runs to batch insert 2000 records in 1/2/4/8/16/32 concurrent threads.

### 1\. IDENTITY

When using `GenerationType.IDENTITY`, result looks like:

```
Finished: threads=1, records_per_threads=2000, duration_in_ms=823
Finished: threads=2, records_per_threads=2000, duration_in_ms=609
Finished: threads=4, records_per_threads=2000, duration_in_ms=1188
Finished: threads=8, records_per_threads=2000, duration_in_ms=2329
Finished: threads=16, records_per_threads=2000, duration_in_ms=4577
Finished: threads=32, records_per_threads=2000, duration_in_ms=9579
```

As mentioned, Hibernate/JPA disables batch insert when using IDENTITY. Look into `org.hibernate.event.internal.AbstractSaveEventListener#saveWithGeneratedId()` for details. To make it clear, it DOES run faster when insert multiple entities in one transaction than in separated transactions. It saves transaction overhead, not round-trip overhead.

The generated key is eventually retrieved from `java.sql.Statement#getGeneratedKeys()`. And [datasource-proxy](https://github.com/ttddyy/datasource-proxy) is used to display the underlining SQL generated.

### 2\. TABLE

Now switch to `GenerationType.TABLE`. Just uncomment the corresponding `@GeneratedValue` and `@TableGenerator` annotation. Result looks like:

```
Finished: threads=1, records_per_threads=2000, duration_in_ms=830
Finished: threads=2, records_per_threads=2000, duration_in_ms=854
Finished: threads=4, records_per_threads=2000, duration_in_ms=1775
Finished: threads=8, records_per_threads=2000, duration_in_ms=3479
Finished: threads=16, records_per_threads=2000, duration_in_ms=6542
Finished: threads=32, records_per_threads=2000, duration_in_ms=13768
```

To fix Hibernate deprecation warning and get better performance, add the line to `application.properties`:

```
spring.jpa.hibernate.use-new-id-generator-mappings=true
```

I began to think that was the whole story for batch, and the `datasource-proxy` interceptor also traced down the batch SQL. But after I looked into dumped TCP packages using [wireshark](https://www.wireshark.org/), I found the final SQL was still not in batch format. Say, they were in:

```
insert into `t_user` (field1, ...) values ('value1_1', ...);
insert into `t_user` (field1, ...) values ('value1_2', ...);
insert into `t_user` (field1, ...) values ('value1_3', ...);
```

Instead of:

```
insert into `t_user` (field1, ...) values ('value1_1', ...), ('value1_2', ...), ('value1_3', ...);
```

The latter one saves client/server round-trips and is [recommended](https://dev.mysql.com/doc/refman/5.7/en/insert-optimization.html) by MySQL. After adding `rewriteBatchedStatements=true` to my connection string, MySQL generated batch statements and result was much improved:

```
Finished: threads=1, records_per_threads=2000, duration_in_ms=433
Finished: threads=2, records_per_threads=2000, duration_in_ms=409
Finished: threads=4, records_per_threads=2000, duration_in_ms=708
Finished: threads=8, records_per_threads=2000, duration_in_ms=1566
Finished: threads=16, records_per_threads=2000, duration_in_ms=2926
Finished: threads=32, records_per_threads=2000, duration_in_ms=6388
```

### 3\. SEQUENCE

Last switch to `GenerationType.SEQUENCE`. [Sequence](https://mariadb.com/kb/en/library/sequences/) is a new feature added in MariaDB 10.3 series. Create a sequence in MariaDB with:

```
CREATE SEQUENCE `s_user` START WITH 1 INCREMENT BY 100;
```

Generally, the increment should match the one specified in `@SequenceGenerator`, at least >= `allocationSize`. See `org.hibernate.id.enhanced.PooledOptimizer#generate()`.

Hibernate apparently does not support the new feature, I dealt with it by adding a new dialect:

```
package com.gonwan.spring;

import org.hibernate.dialect.MySQL5Dialect;

/*
 * Copied from org.hibernate.dialect.PostgreSQL81Dialect.
 */
public class MariaDB103Dialect extends MySQL5Dialect {

    @Override
    public boolean supportsSequences() {
        return true;
    }

    @Override
    public boolean supportsPooledSequences() {
        return true;
    }

    @Override
    public String getSequenceNextValString(String sequenceName) {
        return "select " + getSelectSequenceNextValString(sequenceName);
    }

    @Override
    public String getSelectSequenceNextValString(String sequenceName) {
        return "nextval (`" + sequenceName + "`)";
    }

}
```

And add configuration:

```
spring.jpa.properties.hibernate.dialect=com.gonwan.spring.MariaDB103Dialect
```

`supportsSequences()` adds the sequence support. `supportsPooledSequences()` adds some pool-like optimization both supported by MariaDB and Hibernate. Otherwise, Hibernate uses tables to mimic sequences. Refer to `org.hibernate.id.enhanced.SequenceStyleGenerator#buildDatabaseStructure()`. Result with and without batch:

```
# without batch
Finished: threads=1, records_per_threads=2000, duration_in_ms=723
Finished: threads=2, records_per_threads=2000, duration_in_ms=615
Finished: threads=4, records_per_threads=2000, duration_in_ms=1147
Finished: threads=8, records_per_threads=2000, duration_in_ms=2195
Finished: threads=16, records_per_threads=2000, duration_in_ms=4687
Finished: threads=32, records_per_threads=2000, duration_in_ms=9312
# with batch
Finished: threads=1, records_per_threads=2000, duration_in_ms=298
Finished: threads=2, records_per_threads=2000, duration_in_ms=155
Finished: threads=4, records_per_threads=2000, duration_in_ms=186
Finished: threads=8, records_per_threads=2000, duration_in_ms=356
Finished: threads=16, records_per_threads=2000, duration_in_ms=695
Finished: threads=32, records_per_threads=2000, duration_in_ms=1545
```

Dramatically improved when compared to the table generator. A sequence generator uses cache in memory(default 1000), and is optimized to eliminate lock when generating IDs.

### 4\. Summary

|  | 1 thread | 2 threads | 4 threads | 8 threads | 16 threads | 32 threads |
| --- | --- | --- | --- | --- | --- | --- |
| IDENTITY | 823 | 609 | 1188 | 2329 | 4577 | 9579 |
| TABLE | 830 | 854 | 1775 | 3479 | 6542 | 13768 |
| TABLE with batch | 433 | 409 | 708 | 1566 | 2926 | 6388 |
| SEQUENCE | 723 | 615 | 1147 | 2195 | 4687 | 9312 |
| SEQUENCE with batch | 298 | 155 | 186 | 356 | 695 | 1545 |

From the summary table, `IDENTITY` is simplest. `TABLE` is a compromise to support batch insert. And `SEQUENCE` yields the best performance. Find the entire project in [Github](https://github.com/gonwan/toys/tree/master/idgen).
