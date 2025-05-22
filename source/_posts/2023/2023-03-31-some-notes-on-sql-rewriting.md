---
title: "Notes on SQL Rewriting"
date: "2023-03-31"
categories: 
  - "java"
tags: 
  - "database-sharding"
  - "hibernate"
  - "spring-boot"
  - "sql"
---

Read documents of Apache [shardingsphere](https://shardingsphere.apache.org/) several years ago, and used to think it is the best database sharding library in client side. After trying to use it in a real-world application, problems reveal. First, the ecosystem has grown so large. Even a demo spring boot application can reference lots of dependencies. Second, when loading large data set from multiple shards, multi-threading is not used. I still have to manually implement it myself to improve load time.

Actually, what I need is the ability for selecting a database shard implicitly. When I write `select t_user from...`, it is rewritten to `select t_user[0-7] from...`. Here's some alternative options I found:

### 1\. hibernate interceptor

Refer to javadoc of `StatementInspector` class.

```
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return (properties) -> {
            properties.put(AvailableSettings.STATEMENT_INSPECTOR, (StatementInspector) sql -> {
                return sql.replace("t_user", "t_user01");
            });
        };
    }

```

### 2\. datasource proxy

See: [https://jdbc-observations.github.io/datasource-proxy/docs/current/user-guide/#built-in-support](https://jdbc-observations.github.io/datasource-proxy/docs/current/user-guide/#built-in-support)

```
    public ProxyDataSourceInterceptor(DataSource dataSource) {
        this.dataSource = ProxyDataSourceBuilder.create(dataSource)
                .logQueryBySlf4j(SLF4JLogLevel.INFO)
                .queryTransformer(transformInfo -> {
                    return transformInfo.getQuery().replace("t_user", "t_user01");
                })
                .build();
    }

```

### 3\. spring boot 3

See: [https://spring.io/blog/2022/05/02/ever-wanted-to-rewrite-a-query-in-spring-data-jpa](https://spring.io/blog/2022/05/02/ever-wanted-to-rewrite-a-query-in-spring-data-jpa)

But spring boot 3 requires java 17 and it only applies to jpa repository.
