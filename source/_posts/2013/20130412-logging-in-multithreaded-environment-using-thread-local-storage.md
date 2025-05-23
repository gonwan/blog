---
title: "Logging in Multithreaded Environment Using Thread-Local Storage"
date: "2013-04-12 09:25:00"
categories: 
  - "cc"
tags: 
  - "boost"
  - "multithreading"
  - "tls"
---

Generally, A logger is a singleton class. The declaration may look like:

```
#ifndef _LOGGER_H
#define _LOGGER_H

#include 

class Logger
{
private:
    Logger() { }
public:
    static void Init(const std::string &name);
    static Logger *GetInstance();
    void Write(const char *format, ...);
private:
    static std::string ms_name;
    static Logger *ms_this_logger;
};

#endif
```

The `Init` function is used to set log name or maybe other configuration information. And We can use the `Write` function to write logs.

Well, in a multithreaded environment, locks must be added to prevent concurrent issues and keep the output log in order. And sometimes we want to have separate log configurations. How can we implement it without breaking the original interfaces?

One easy way is to maintain a list of all available `Logger` instances, so that we can find and use a unique `Logger` in each thread. The approach is somehow like the one used in [log4j](http://logging.apache.org/log4j/1.2/). But log4j reads configuration files to initialize loggers, while our configuration information is set in runtime.

Another big issue is that we must add a new parameter to the `GetInstance` function to tell our class which Logger to return. The change breaks interfaces.

By utilizing TLS (thread-local storage), we can easily solve the above issues. Every logger will be thread-local, say every thread has its own logger instance which is stored in its thread context. Here comes the declaration for our new `Logger` class, `boost::thread_specific_ptr` from [boost](http://www.boost.org/) library is used to simplify our TLS operations:

```
#ifndef _LOGGER2_H
#define _LOGGER2_H

#include 
#include 

class Logger
{
private:
    Logger() { }
public:
    static void Init(const std::string &name);
    static Logger *GetInstance();
    void Write(const char *format, ...);
private:
    static boost::thread_specific_ptr ms_name;
    static boost::thread_specific_ptr ms_this_logger;
};

#endif
```

Simply use `boost::thread_specific_ptr` to wrap the original 2 static variables, and they will be in TLS automatically, that's all. The implementation:

```
#include "logger2.h"
#include 
#include 
#include 

using namespace std;

boost::thread_specific_ptr Logger::ms_name;
boost::thread_specific_ptr Logger::ms_this_logger;

void Logger::Init(const string &name)
{
    if (!name.empty()) {
        ms_name.reset(new std::string(name));
    }
}

Logger *Logger::GetInstance()
{
    if (ms_this_logger.get() == NULL) {
        ms_this_logger.reset(new Logger);
    }
    return ms_this_logger.get();
}

void Logger::Write(const char *format, ...)
{
    va_list arglist;
    char buffer[1024];
    va_start(arglist, format);
    memset(buffer, 0, sizeof(buffer));
    vsnprintf(buffer, sizeof(buffer), format, arglist);
    va_end(arglist);
    printf("[%s] %s\n", ms_name.get()->c_str(), buffer);
}
```

Our test code:

```
#include 
#include 
/*
 * actually, we do not matter which header file to include,
 * since they have compatible public interface, compatible ABI.
 */
//#include "logger.h"
#include "logger2.h"

using namespace std;

class Thread
{
public:
    Thread(const char *name) : m_name(name) { }
    void operator()()
    {
        /* set logger name in thread */
        Logger::Init(m_name);
        /* call GetInstance() and Write() in other functions with thread-local enabled */
        Logger *logger = Logger::GetInstance();
        for (int i = 0; i < 3; i++) {
            logger->Write("Hello %d", i);
            boost::this_thread::sleep(boost::posix_time::seconds(1));
        }
    }
private:
    string m_name;
};

int main()
{
    boost::thread t1(Thread("name1"));
    boost::thread t2(Thread("name2"));
    t1.join();
    t2.join();
    return 0;
}
```

Output when using the original `Logger` may look like:

```
[name1] Hello 0
[name2] Hello 0
[name2] Hello 1
[name2] Hello 1
[name2] Hello 2
[name2] Hello 2
```

When using the TLS version, it may look like:

```
[name1] Hello 0
[name2] Hello 0
[name1] Hello 1
[name2] Hello 1
[name1] Hello 2
[name2] Hello 2
```

Everything is in order now. You may want to know what OS API boost uses to achieve TLS. I'll show you the details in boost 1.43:

```
# windows implementation
boost::thread_specific_ptr::reset()
  --> boost::detail::set_tss_data()
  --> boost::detail::get_or_make_current_thread_data()
  --> boost::detail::get_current_thread_data()
  --> ::TlsGetValue()
# see:
# ${BOOST}/boost/thread/tss.hpp
# ${BOOST}/lib/thread/src/win32/thread.cpp
```

```
# *nix implementation
boost::thread_specific_ptr::reset()
  --> boost::detail::set_tss_data()
  --> boost::detail::add_new_tss_node()
  --> boost::detail::get_or_make_current_thread_data()
  --> boost::detail::get_current_thread_data()
  --> ::pthread_getspecific()
# see:
# ${BOOST}/boost/thread/tss.hpp
# ${BOOST}/lib/thread/src/pthread/thread.cpp
```

The underlying API is `TlsGetValue` under windows and `pthread_getspecific` under \*nix platforms.
