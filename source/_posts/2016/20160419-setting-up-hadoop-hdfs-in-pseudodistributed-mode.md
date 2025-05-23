---
title: "Setting up Hadoop HDFS in Pseudodistributed Mode"
date: "2016-04-19 10:11:19"
categories: 
  - "java"
tags: 
  - "hadoop"
  - "hdfs"
---

Well, new to the big data world.

Following Appendix A in the book _[Hadoop: The Definitive Guide, 4th Ed](http://www.amazon.com/Hadoop-Definitive-Guide-Tom-White/dp/1491901632/)_, just get it to work. I'm running Ubuntu 14.04.

1\. Download and unpack the hadoop package, and set environment variables in your `~/.bashrc`.

```
export JAVA_HOME=/usr/lib/jvm/java-7-openjdk-amd64
export HADOOP_HOME=~/hadoop-2.5.2
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin
```

Verify with:

```
# hadoop version
Hadoop 2.5.2
Subversion https://git-wip-us.apache.org/repos/asf/hadoop.git -r cc72e9b000545b86b75a61f4835eb86d57bfafc0
Compiled by jenkins on 2014-11-14T23:45Z
Compiled with protoc 2.5.0
From source with checksum df7537a4faa4658983d397abf4514320
This command was run using /home/gonwan/hadoop-2.5.2/share/hadoop/common/hadoop-common-2.5.2.jar
```

The 2.5.2 distribution package is build in 64bit for `*.so` files, use the 2.4.1 package if you want 32bit ones.

2\. Edit config files in `$HADOOP_HOME/etc/hadoop`:

```



  
    fs.defaultFS
    hdfs://localhost/
  

```

```



  
    dfs.replication
    1
  

```

3\. Config SSH: Hadoop needs to start daemons on hosts of a cluster via SSH connection. A public key is generated to avoid password input.

```
# ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
# cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

Verify with:

```
# ssh localhost
```

4\. Format HDFS filesystem:

```
# hdfs namenode -format
```

5\. Start HDFS:

```
# start-dfs.sh
Starting namenodes on [localhost]
localhost: starting namenode, logging to /home/gonwan/hadoop-2.5.2/logs/hadoop-gonwan-namenode-gonwan-mate17.out
localhost: starting datanode, logging to /home/gonwan/hadoop-2.5.2/logs/hadoop-gonwan-datanode-gonwan-mate17.out
Starting secondary namenodes [0.0.0.0]
0.0.0.0: starting secondarynamenode, logging to /home/gonwan/hadoop-2.5.2/logs/hadoop-gonwan-secondarynamenode-gonwan-mate17.out
```

Verify running with `jps` command:

```
# jps
2535 NameNode
2643 DataNode
2931 Jps
2828 SecondaryNameNode
```

6\. Some tests:

```
# hadoop fs -ls /
# hadoop fs -mkdir /test
# hadoop fs -put ~/.bashrc /
# hadoop fs -ls /
Found 2 items
-rw-r--r-- 1 gonwan supergroup        215 2016-04-19 16:07 /.bashrc
drwxr-xr-x   - gonwan supergroup          0 2016-04-19 16:06 /test
```

7\. Stop HDFS:

```
# stop-dfs.sh
```

8\. If there is an error like:

```
Error: JAVA_HOME is not set and could not be found.
```

Just edit `$HADOOP_HOME/etc/hadoop/hadoop-env.sh` and export `JAVA_HOME` explicitly again here. It does happen under Debian. Not knowing why the environment variable is not passed over SSH.

9\. You can also set `HADOOP_CONF_DIR` to use a separate config directory for convenience. But make sure you have the whole directory copied from the Hadoop package. Otherwise, nasty errors may occur.
