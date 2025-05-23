---
title: "Coroutines in C++/Boost"
date: "2016-01-19"
categories: 
  - "cc"
tags: 
  - "asynchronous"
  - "boost"
  - "coroutine"
---

Starting with [1.56](http://www.boost.org/users/history/version_1_56_0.html), `boost/asio` provides `asio::spawn()` to work with coroutines. Just paste the sample code [here](http://www.boost.org/doc/libs/1_60_0/doc/html/boost_asio/example/cpp03/spawn/echo_server.cpp), with minor modifications:

```
#include 
#include 
#include 
#include 
#include 
#include 
using namespace std;
using boost::asio::ip::tcp;


class session: public boost::enable_shared_from_this
{
public:
    explicit session(boost::asio::io_service &io_service)
        : socket_(io_service), timer_(io_service), strand_(io_service)
    {
    }
    tcp::socket &socket()
    {
        return socket_;
    }
    void go()
    {
        boost::asio::spawn(strand_, boost::bind(&session::echo, shared_from_this(), _1));
        boost::asio::spawn(strand_, boost::bind(&session::timeout, shared_from_this(), _1));
    }
private:
    void echo(boost::asio::yield_context yield)
    {
        try {
            char data[128];
            while (true) {
                timer_.expires_from_now(boost::posix_time::seconds(10));
                size_t n = socket_.async_read_some(boost::asio::buffer(data), yield);
                boost::asio::async_write(socket_, boost::asio::buffer(data, n), yield);
            }
        } catch (exception &) {
            socket_.close();
            timer_.cancel();
        }
    }
    void timeout(boost::asio::yield_context yield)
    {
        while (socket_.is_open()) {
            boost::system::error_code ignored_ec;
            timer_.async_wait(yield[ignored_ec]);
            if (timer_.expires_from_now() <= boost::posix_time::seconds(0)) {
                socket_.close();
            }
        }
    }
    tcp::socket socket_;
    boost::asio::deadline_timer timer_;
    boost::asio::io_service::strand strand_;
};

void do_accept(boost::asio::io_service &io_service, unsigned short port, boost::asio::yield_context yield)
{
    tcp::acceptor acceptor(io_service, tcp::endpoint(tcp::v4(), port));
    while (true) {
        boost::system::error_code ec;
        boost::shared_ptr new_session(new session(io_service));
        acceptor.async_accept(new_session->socket(), yield[ec]);
        if (!ec) {
            new_session->go();
        }
    }
}

int main()
{
    try {
        boost::asio::io_service io_service;
        boost::asio::spawn(io_service, boost::bind(do_accept, boost::ref(io_service), 2222, _1));
        io_service.run();
    } catch (exception &e) {
        cerr << "Exception: " << e.what() << endl;
    }
    return 0;
}
```

The Python in my previous [article](http://www.gonwan.com/2016/01/11/coroutines-in-python/) can be used to work with the code above. I also tried to write a TCP server with only `boost::coroutines` classes. `select()` is used, since I want the code to be platform independent. **NOTE**: with coroutines, we have only \_one\_ thread.

```
#ifdef _WIN32
#include 
#include 
#include 
#pragma comment(lib, "ws2_32.lib")
#pragma warning(disable: 4996)
#define sock_send(s, str, len)      send(s, str, len, 0)
#define sock_close(s)               closesocket(s)
#else
#include 
#include 
#include 
#define sock_send(s, str, len)      send(s, str, len, MSG_NOSIGNAL)
#define sock_close(s)               close(s)
#endif
#include 
#include 
#include 
#include 
#include 
#include 
#include 
#include 
using namespace std;


#ifdef _WIN32
struct Win32SocketWrapper
{
    Win32SocketWrapper()
    {
        WSADATA wsaData;
        WSAStartup(0x0202, &wsaData);
    }
    ~Win32SocketWrapper()
    {
        WSACleanup();
    }
} g_win32_socket_wrapper;
#endif


class session
{
    typedef boost::coroutines::symmetric_coroutine coro_t;
public:
    explicit session(int sock)
        : socket_(sock)
    {
        echo_coro_ = coro_t::call_type(boost::bind(&session::echo, this, _1));
    }
    int socket()
    {
        return socket_;
    }
    void go()
    {
        echo_coro_();
    }
    void echo(coro_t::yield_type &yield)
    {
        int rc;
        char buffer[128];
        while (true) {
            memset(buffer, 0, sizeof(buffer));
            yield(); rc = recv(socket_, buffer, sizeof(buffer), 0);
            if (rc == 0 || rc == -1) { /* close or error */
                printf("socket[%d] closed, rc=%d..\n", socket_, rc);
                sock_close(socket_);
                socket_ = -1;
                /* do not release here, or the whole coroutine context will be invalid.. */
                break;
            } else {
                sock_send(socket_, buffer, rc);
            }
        }
    }
private:
    int socket_;
    coro_t::call_type echo_coro_;
};

void event_loop(int server_sock)
{
    list > session_list;
    int rc, maxfd, client_sock;
    fd_set rdset;
    struct sockaddr_in client_addr;
    size_t addr_size = sizeof(struct sockaddr_in);

    while (true) {
        FD_ZERO(&rdset);
        FD_SET(server_sock, &rdset);
        maxfd = server_sock;
        list >::iterator it = session_list.begin();
        while (it != session_list.end()) {
            if ((*it)->socket() == -1) {
                session_list.erase(it++);
            } else {
                FD_SET((*it)->socket(), &rdset);
                if (maxfd < (*it)->socket()) {
                    maxfd = (*it)->socket();
                }
                ++it;
            }
        }
        /* max fd value plus 1 */
        rc = select(maxfd+1, &rdset, 0, 0, NULL);
        if (rc == -1) {
            continue;
        } else {
            if (FD_ISSET(server_sock, &rdset)) {
                client_sock = (int)accept(server_sock, (struct sockaddr *)&client_addr, (socklen_t *)&addr_size);
                printf("socket[%d] accepted: %s:%d..\n", client_sock, inet_ntoa(client_addr.sin_addr), ntohs(client_addr.sin_port));
                boost::shared_ptr new_session(new session(client_sock));
                new_session->go(); /* go first */
                session_list.push_back(new_session);
            }
            for (list >::iterator it = session_list.begin(); it != session_list.end(); ++it) {
                if (FD_ISSET((*it)->socket(), &rdset)) {
                    (*it)->go();
                }
            }
        }
    }
}

int main() 
{
    int rc, server_sock;
    struct sockaddr_in server_addr;

    server_sock = (int)socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    server_addr.sin_port = htons(2222);
    rc = bind(server_sock, (struct sockaddr *)&server_addr, sizeof(struct sockaddr_in));
    if (rc < 0) {
        fprintf(stderr, "bind: %s.\n", strerror(errno));
        return -1;
    }
    listen(server_sock, 5);
    /* loop */
    event_loop(server_sock);
    sock_close(server_sock);
    return 0;
}
```
