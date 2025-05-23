---
title: "MySQL with C++ and Python"
date: "2015-03-26 08:08:03"
categories: 
  - "database"
tags: 
  - "mysql"
---

Backup here:

#### 1\. C++

```
/*
 * # gcc test_mysql.c -o test_mysql -lmysqlclient -pedantic -Wall -Wextra
 */
#include 
#include 

int main()
{
    const char *host = "192.168.1.101";
    const char *user = "root";
    const char *pass = "111111";
    const char *dbname = "mysql";
    MYSQL mysql;
    MYSQL_RES *mysql_res;
    MYSQL_FIELD *mysql_field;
    MYSQL_ROW mysql_row;
    unsigned int num_fields;
    unsigned long num_rows;
    int i, rc;

    mysql_init(&mysql);
    /* connect */
    if (!mysql_real_connect(&mysql, host, user, pass, dbname, 0, NULL, 0)) {
        fprintf(stderr, "ERROR: %s\n", mysql_error(&mysql));
        return -1;
    }
    /* query */
    rc = mysql_query(&mysql, "SELECT * FROM user");
    if (rc) {
        fprintf(stderr, "ERROR: %s\n", mysql_error(&mysql));
        mysql_close(&mysql);
        return -1;
    }
    /* display */
    mysql_res = mysql_store_result(&mysql);
    if (!mysql_res) {
        fprintf(stderr, "ERROR: %s\n", mysql_error(&mysql));
        mysql_close(&mysql);
        return -1;
    }
    num_fields = mysql_num_fields(mysql_res);
    printf("fields: %u\n", num_fields);
    num_rows = (unsigned long)mysql_num_rows(mysql_res);
    printf("rows: %lu\n", num_rows);
    if (num_rows != 0) {
        num_fields = (num_fields <= 9) ? num_fields : 9;
        for (i = 0; i < (int)num_fields; i++) {
            mysql_field = mysql_fetch_field_direct(mysql_res, i);
            printf("%s\t", mysql_field->name);
        }
        printf("\n");
        while ((mysql_row = mysql_fetch_row(mysql_res)) != NULL) {
            for (i = 0; i < (int)num_fields; i++) {
                printf("%s\t",  mysql_row[i]);
            }
            printf("\n");
        }
    }
    mysql_free_result(mysql_res);
    mysql_close(&mysql);
    return 0;
}
```

#### 2\. Python

```
#!/usr/bin/python
# sudo apt-get install python-mysql.connector
# sudo apt-get install python3-mysql.connector
from __future__ import print_function
import mysql.connector

cur = None
con = None

try:
    con = mysql.connector.connect(host='192.168.1.101', user='root', password='111111', database='mysql')
    cur = con.cursor()
    cur.execute("SELECT * FROM user")
    num_fields = len(cur.column_names)
    print('fields: %d' % num_fields)
    if num_fields > 9:
        num_fields = 9
    rows = cur.fetchall()  # fetchall() before get rowcount
    print('rows: %d' % cur.rowcount)
    for i in range(num_fields):
        print('%s\t' % (cur.column_names[i]), end='')
    print()
    for row in rows:
        for i in range(num_fields):
            print('%s\t' % (row[i]), end='')
        print()
except mysql.connector.Error as e:
    print(e)
finally:
    if cur:
        cur.close()
    if con:
        con.close()
```
