---
title: "Database Access Layer in C++"
date: "2015-04-15 08:03:07"
categories: 
  - "cc"
tags: 
  - "mysql"
  - "oracle"
  - "soci"
---

We have JDBC in Java... and [SOCI](http://soci.sourceforge.net/) in C++... Well, it's not so easy as it should be. To build with cmake:

```bash
$ mkdir ../build
$ cd ../build
$ set ORACLE_HOME=C:\oraclexe\app\oracle\product\10.2.0\server
$ cmake -G "Visual Studio 9 2008" -DMYSQL_INCLUDE_DIR="C:\Program Files\MySQL\MySQL Server 5.5\include" -DMYSQL_LIBRARIES="C:\Program Files\MySQL\MySQL Server 5.5\lib\libmysql.lib" ../soci-3.2.3
```

The documents seem outdated, many options do not work. Just managed to figure out from the \*.cmake source files. You can also download the oracle instant client SDK, and re-arrange the directory structure for build.

Code snippet I extracted from its unit tests:

```cpp
#include "soci.h"
#include "soci-mysql.h"
//#include "soci-oracle.h"
#include <ctime>
#include <string>
#include <iostream>
#include <sstream>
using namespace std;

int main()
{
    try {
        soci::session sql(soci::mysql, "host=192.168.1.101 db=mysql user=root password=111111");
        //soci::session sql(soci::oracle, "service=192.168.1.102/ORCL user=sys password=111111");
        soci::row v;
        /* comma operator is overloaded here.. */
        soci::statement st = (sql.prepare << "SELECT * FROM user", into(v));
        //soci::statement st = (sql.prepare << "SELECT * FROM SYS.USER$", into(v));
        st.execute(true);  /* with data exchange */
        unsigned int num_fields = v.size();
        cout << "fields: " << num_fields << endl;
        num_fields = (num_fields <= 9) ? num_fields : 9;
        unsigned long num_rows = (unsigned long)st.get_affected_rows();
        cout << "rows: " << num_rows << endl;
        for (size_t i = 0; i < num_fields; ++i) {
            const soci::column_properties &props = v.get_properties(i);
            cout << props.get_name() << '\t';
        }
        cout << endl;
        do {
            stringstream ss;
            for (size_t i = 0; i < num_fields; ++i) {
                if (v.get_indicator(i) == soci::i_null) {
                    ss << "NULL";
                    break;
                }
                const soci::column_properties &props = v.get_properties(i);
                switch (props.get_data_type()) {
                case soci::dt_string:
                    ss << v.get<string>(i);
                    break;
                case soci::dt_double:
                    ss << v.get<double>(i);
                    break;
                case soci::dt_integer:
                    ss << v.get<int>(i);
                    break;
                case soci::dt_long_long:
                    ss << v.get<long long>(i);
                    break;
                case soci::dt_unsigned_long_long:
                    ss << v.get<unsigned long long>(i);
                    break;
                case soci::dt_date:
                    tm dt = v.get<tm>(i);
                    ss << asctime(&dt);
                    break;
                }
                ss << '\t';
            }
            cout << ss.str() << endl;
        } while (st.fetch());
    } catch (soci::soci_error &e) {
        cerr << "Error: " << e.what() << endl;
    }
    return 0;
}
```

**Updated Apr 20, 2015**:

1. Under RHEL5/CentOS5, I got errors like:

```
./test_oracle: error while loading shared libraries: /home/gonwan/oracle11_64/lib/libnnz11.so: cannot restore segment prot after reloc: Permission denied
```

It's due to SELinux security feature. Simply workaround it with:

```bash
$ chcon -t texrel_shlib_t *.so*
```

2. Oracle uses `oraociei11.dll` or `libociei.so` for client data. They are both large files(110+MB), since they support multiple languages. Instead, you can use `oraociicus11.dll`(30+MB) or `libociicus.so`(10-MB). These files contain only English support.
