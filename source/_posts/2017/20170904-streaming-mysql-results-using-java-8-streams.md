---
title: "Streaming MySQL Results Using Java 8 Streams"
date: "2017-09-04 07:17:16"
categories: 
  - "java"
tags: 
  - "java8"
  - "performance"
  - "restful"
  - "spring"
---

The article is inspired by the posts [here](https://www.airpair.com/java/posts/spring-streams-memory-efficiency) and [here](https://knes1.github.io/blog/2015/2015-10-19-streaming-mysql-results-using-java8-streams-and-spring-data.html).

There is a RESTful service as the infrastructure for data access in our team. It is based on Jersey/JAX-RS and runs fast. However, it consumes large memory when constructing large data set as response. Since it builds the entire response in memory before sending it.

As suggested in the above posts. Streaming is the solution. They integrated Hibernate or Spring Data for easy adoption. But I need a general purpose RESTful service, say, I do not know the schema of a table. So I decided to implement it myself using raw JDBC interface.

My class is so-called `MysqlStreamTemplate`:

- It does not extend `JdbcTemplate`, since there is only one interface for streaming, not one series. I'm not writing a general purpose library.
- It is MySQL only, I have no time to verify with other relation databases.
- It does accept a `DataSource` as the parameter of the its constructor.
- Staff like Hibernate session is not concerned, since it maintains `Statement` & `Connection` by itself.
- Staff like `@Transcational` is not concerned, since we do not care about transactions. Actually, MySQL gives `HOLD_CURSORS_OVER_COMMIT` in `StatementImpl#getResultSetHoldability()` in its JDBC driver, saying that our `ResultSet` survives after commit.

So, here is my class. **NOTE**: closing our `Statement` & `Connection` requires explicit invoke of `Stream#close()`:

```java
import javax.sql.DataSource;
import java.io.Closeable;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.function.Consumer;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

public class MysqlStreamTemplate {

    private DataSource dataSource;

    public MysqlStreamTemplate(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Stream<Map> query(String sql) throws SQLException {
        return new MysqlStreamQuery().stream(sql);
    }

    class MysqlStreamQuery implements Closeable {

        private Connection connection;
        private Statement statement;

        public Stream<Map> stream(String sql) throws SQLException {
            connection = dataSource.getConnection();
            /*
             * MySQL ResultSets are completely retrieved and stored in memory (com.mysql.jdbc.RowDataStatic). Or
             * - Set useCursorFetch=true&defaultFetchSize=nnn in connection string (com.mysql.jdbc.RowDataCursor).
             * - Set resultSetType/resultSetConcurrency and fetchSize (Integer.MIN_VALUE) when creating statements (com.mysql.jdbc.RowDataDynamic).
             * See: https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-reference-implementation-notes.html
             */
            /*
             * MySQL documents say nothing about cursor holdability, so not use it explicitly.
             */
            statement = connection.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
            statement.setFetchSize(Integer.MIN_VALUE);
            /* begin query */
            ResultSet rs = statement.executeQuery(sql);
            int columns = rs.getMetaData().getColumnCount();
            Map resultMap = new HashMap(columns);
            /* NOTE: Manually invoking of Stream.close() is required to close the MySQL statement and connection. */
            Stream<Map> resultStream = StreamSupport.stream(new Spliterators.AbstractSpliterator<Map>(Long.MAX_VALUE, Spliterator.ORDERED | Spliterator.NONNULL | Spliterator.IMMUTABLE) {
                @Override
                public boolean tryAdvance(Consumer<? super Map> action) {
                    try {
                        if (!rs.next()) {
                            return false;
                        }
                        resultMap.clear();
                        for (int i = 1; i <= columns; i++) {
                            resultMap.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i));
                        }
                        action.accept(resultMap);
                        return true;
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                }
            }, false).onClose(() -> close());
            return resultStream;
        }

        @Override
        public void close() {
            if (statement != null) {
                try {
                    statement.close();
                } catch (SQLException e) {
                }
                statement = null;
            }
            if (connection != null) {
                try {
                    connection.close();
                } catch (SQLException e) {
                }
                connection = null;
            }
        }
    }

}
```

Read inline comments for additional details. Now the response entry and controller mapping:

```java
import java.util.Map;
import java.util.stream.Stream;

public class ApiStreamResponse extends Response {

    /* requires jackson-datatype-jdk8 2.9.0 */
    private Stream<Map> result;

    public ApiStreamResponse(Stream<Map> result) {
        this.result = result;
    }

    public Stream<Map> getResult() {
        return result;
    }

    public void setResult(Stream<Map> result) {
        this.result = result;
    }

}
```

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.Callable;
import java.util.stream.Stream;

@RequestMapping(path = "/api")
@RestController
public class ApiController {

    private static final Logger logger = LoggerFactory.getLogger(ApiController.class);

    @Autowired
    private MysqlClient mysqlClient;

    @RequestMapping(path = "/v1", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public Callable<ApiResponse> getV1() {
        return () -> {
            String r = mysqlClient.executeToJson(MysqlClient.SQL).getLeft();
            return new ApiResponse(r);
        };
    }

    @RequestMapping(path = "/v2", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public Callable<ApiStreamResponse> getV2() {
        return () -> {
            Stream<Map> r = mysqlClient.executeToStream(MysqlClient.SQL);
            return new ApiStreamResponse(r);
        };
    }

}
```

Complete code can be find on my GitHub [repository](https://github.com/gonwan/restful/tree/benchmark).

My simple benchmark script looks like:

```bash
$ ab -c 30 -n 3000 http://localhost:5050/api
```

Dramatic improvements in memory usage as shown in jconsole, especially Old Gen: ![all_memory](images/all_memory.png) ![old_gen_memory](images/old_gen_memory.png)

Some raw data from jmap:

- Jersey

```
Heap Usage:
PS Young Generation
Eden Space:
   capacity = 1529348096 (1458.5MB)
   used     = 28027008 (26.7286376953125MB)
   free     = 1501321088 (1431.7713623046875MB)
   1.8326114292295166% used
From Space:
   capacity = 124780544 (119.0MB)
   used     = 36331368 (34.648292541503906MB)
   free     = 88449176 (84.3517074584961MB)
   29.116212219751183% used
To Space:
   capacity = 127926272 (122.0MB)
   used     = 0 (0.0MB)
   free     = 127926272 (122.0MB)
   0.0% used
PS Old Generation
   capacity = 1499987968 (1430.5MB)
   used     = 946428384 (902.5844421386719MB)
   free     = 553559584 (527.9155578613281MB)
   63.09573171189597% used

12833 interned Strings occupying 1401840 bytes.
```

- Spring Boot

```
Heap Usage:
PS Young Generation
Eden Space:
   capacity = 1494745088 (1425.5MB)
   used     = 611063008 (582.7550964355469MB)
   free     = 883682080 (842.7449035644531MB)
   40.88075036377039% used
From Space:
   capacity = 135266304 (129.0MB)
   used     = 135146784 (128.88601684570312MB)
   free     = 119520 (0.113983154296875MB)
   99.91164096566133% used
To Space:
   capacity = 156762112 (149.5MB)
   used     = 0 (0.0MB)
   free     = 156762112 (149.5MB)
   0.0% used
PS Old Generation
   capacity = 1534066688 (1463.0MB)
   used     = 525509264 (501.16468811035156MB)
   free     = 1008557424 (961.8353118896484MB)
   34.25595954274447% used

21280 interned Strings occupying 2592280 bytes.
```

- Spring Boot with Streams

```
Heap Usage:
PS Young Generation
Eden Space:
   capacity = 1787297792 (1704.5MB)
   used     = 127132192 (121.24270629882812MB)
   free     = 1660165600 (1583.2572937011719MB)
   7.1130951187344165% used
From Space:
   capacity = 1048576 (1.0MB)
   used     = 557056 (0.53125MB)
   free     = 491520 (0.46875MB)
   53.125% used
To Space:
   capacity = 1048576 (1.0MB)
   used     = 0 (0.0MB)
   free     = 1048576 (1.0MB)
   0.0% used
PS Old Generation
   capacity = 1515192320 (1445.0MB)
   used     = 34598904 (32.99608612060547MB)
   free     = 1480593416 (1412.0039138793945MB)
   2.2834661675159493% used

21326 interned Strings occupying 2597800 bytes.
```
