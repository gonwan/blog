---
title: "ping Using a Raw Socket"
date: "2013-04-21 10:49:00"
categories: 
  - "cc"
tags: 
  - "icmp"
  - "ping"
  - "socket"
---

A ping utility is used to check the availability of a remote host. I wanted to implement the function in my project. But it is not so easy as I had expected. Since administrator/root privilege is required to create a raw socket under windows/linux, and this is not what I want.

Finally, I chose to utilize system's ping via `CreateProcess()`/`execve()` function. Under windows, ping may used `IcmpSendEcho()` API to wrap the creation of a raw socket, and this does not require administrator privilege. But it is still not working when logged in as a guest. Under linux, ping is a +s(setuid) utility, which means it is always run with root privilege. Anyway, I still tried to implement ping by using raw socket and sending raw ICMP(Internet Control Message Protocol) messages.

A raw ICMP echo request message has a ICMP header, while a raw ICMP echo reply message has an additional IP header in front of the ICMP header. Say:

```
ICMP echo request = ICMP header + ICMP custom data
ICMP echo reply   = IP header + ICMP header + ICMP custom data
```

There are several ICMP message types defined in RFC 792, but we only care about the echo type. So here's our definition of a IP header and a ICMP header:

```
/* RFC 791, 20 bytes */
typedef struct _ip_header_t {
    u_char  vihl;      /* version & header length */
    u_char  tos;       /* type of service */
    u_short tot_len;   /* total length */
    u_short id;        /* identification */
    u_short frag_off;  /* fragment offset */
    u_char  ttl;       /* time to live */
    u_char  protocol;  /* protocol */
    u_short check;     /* header checksum */
    u_int   saddr;     /* source address */
    u_int   daddr;     /* destination address */
} ip_header_t;
/* RFC 792, 8 bytes */
typedef struct _icmp_header_t {
    u_char  type;      /* type */
    u_char  code;      /* code */
    u_short checksum;  /* checksum */
    /* echo only */
    u_short id;        /* identifier */
    u_short sequence;  /* sequence number */
} icmp_header_t;
```

Our customized ICMP echo request/reply definition with self-defined data field:

```
/* data length */
#define DATALEN 64
/* ICMP Echo Request */
typedef struct _icmp_echo_request_t {
    icmp_header_t icmp_hd;
    /* self-defined data field */
    struct {
#ifdef _WIN32
        DWORD tick;
        char pattern[DATALEN-sizeof(icmp_header_t)-sizeof(DWORD)];
#endif
#ifdef __linux__
        struct timeval tv;
        char pattern[DATALEN-sizeof(icmp_header_t)-sizeof(struct timeval)];
#endif
    } data;
} icmp_echo_request_t;
/* ICMP Echo Reply */
typedef struct _icmp_echo_reply_t {
    ip_header_t ip_hd;
    icmp_echo_request_t request;
} icmp_echo_reply_t;
```

The raw socket is created with:

```
sock = (int)socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
```

Sending a ICMP echo request:

```
#define ICMP_ECHO       8
/* send echo request */
int send_echo_request(/*in*/ int sock, /*in*/ struct sockaddr_in *sockaddr, /*in*/ int seq, /*int*/ const char* pattern)
{
    icmp_echo_request_t request;
    int rc;

    /* fill in request */
    request.icmp_hd.type = ICMP_ECHO;
    request.icmp_hd.code = 0;
    request.icmp_hd.checksum = 0;
    request.icmp_hd.id = getpid();
    request.icmp_hd.sequence = seq;
#ifdef _WIN32
    request.data.tick = GetTickCount();
#endif
#ifdef __linux__
    gettimeofday(&request.data.tv, NULL);
#endif
    memcpy(request.data.pattern, pattern, sizeof(request.data.pattern));
    /* calculate checksum */
    request.icmp_hd.checksum = in_cksum((u_short *)&request, sizeof(icmp_echo_request_t));
    /* send request */
    rc = sendto(sock, (char *)&request, sizeof(icmp_echo_request_t),
        0, (struct sockaddr *)sockaddr, sizeof(struct sockaddr_in));
    if (rc == -1) {
        fprintf(stderr, "sendto() error.\n");
        return -1;
    }
    return 0;
}
```

We simply use the checksum algorithm found in the original ping program from Mike Muuss.

```
u_short in_cksum(u_short *addr, int len)
{
    register int nleft = len;
    register u_short *w = addr;
    register u_short answer;
    register int sum = 0;
    /*
     * Our algorithm is simple, using a 32 bit accumulator (sum),
     * we add sequential 16 bit words to it, and at the end, fold
     * back all the carry bits from the top 16 bits into the lower
     * 16 bits.
     */
    while (nleft > 1) {
        sum += *w++;
        nleft -= 2;
    }
    /* mop up an odd byte, if necessary */
    if(nleft == 1) {
        u_short u = 0;
        *(u_char *)(&u) = *(u_char *)w;
        sum += u;
    }
    /*
     * add back carry outs from top 16 bits to low 16 bits
     */
    sum = (sum >> 16) + (sum & 0xffff); /* add hi 16 to low 16 */
    sum += (sum >> 16);         /* add carry */
    answer = ~sum;              /* truncate to 16 bits */
    return answer;
}
```

Now, receiving a ICMP echo reply:

```
int recv_echo_reply(/*in*/ int sock, /*in*/ int use_icmp_socket, /*out*/ int *ttl, /*out*/ icmp_echo_request_t *reply)
{
    int rc;

    if (!use_icmp_socket) {
        icmp_echo_reply_t rep;
        rc = recvfrom(sock, (char *)&rep, sizeof(icmp_echo_reply_t), 0, NULL, NULL);
        if (rc == -1) {
            fprintf(stderr, "recvfrom() error.\n");
            return -1;
        }
        if (rep.ip_hd.protocol != IPPROTO_ICMP) {
            return -1;
        }
        *ttl = rep.ip_hd.ttl;
        memcpy(reply, &rep.request, sizeof(icmp_echo_request_t));
    } else {
#ifdef __linux__
        icmp_echo_request_t rep;
        struct iovec iov;
        struct msghdr msg;
        struct cmsghdr *cmsg;
        char raw_data[1024];
        iov.iov_base = (char *)&rep;
        iov.iov_len = sizeof(rep);
        memset(&msg, 0, sizeof(msg));
        msg.msg_iov = &iov;
        msg.msg_iovlen = 1;
        msg.msg_control = raw_data;
        msg.msg_controllen = sizeof(raw_data);
        memset(raw_data, 0, sizeof(raw_data));
        rc = recvmsg(sock, &msg, 0);
        if (rc == -1) {
            fprintf(stderr, "recvmsg() error.\n");
            return -1;
        }
        *ttl = 0;
        memcpy(reply, &rep, sizeof(icmp_echo_request_t));
        for (cmsg = CMSG_FIRSTHDR(&msg); cmsg; cmsg = CMSG_NXTHDR(&msg, cmsg)) {
            if (cmsg->cmsg_level != SOL_IP) {
                continue;
            }
            if (cmsg->cmsg_type == IP_TTL) {
                if (cmsg->cmsg_len < sizeof(int)) {
                    continue;
                }
                *ttl = *(int *)CMSG_DATA(cmsg);
            }
        }
#endif
    }
    return 0;
}
```

You may have noticed the if/else clause in the receive function. The `use_icmp_socket` flag is used to tell which socket type is used when sending a ICMP message. In linux kernel 3.0, a new socket type is introduced to reduce the possibility to use a raw socket that only send ICMP echo messages. Thus, the classic ping utility can be no longer a +s(setuid) one. A ICMP socket can be created with:

```
/* icmp socket available in kernel 3.0 */
/* # echo 1000 1000 | sudo tee -a /proc/sys/net/ipv4/ping_group_range */
sock = (int)socket(AF_INET, SOCK_DGRAM, IPPROTO_ICMP);
```

Note the difference in the second parameter. A kernel parameter(`/proc/sys/net/ipv4/ping_group_range`) in comment above should be set to indicate which UID range is allowed to use a ICMP socket.

When using a raw socket, the TTL value is in the IP header. While, the TTL value is in the socket ancillary data when using a ICMP socket, the reply data does not contain IP header any more. And we must set a socket option explicitly to retrieve the TTL value:

```
int hold = 1;
if (setsockopt(sock, SOL_IP, IP_RECVTTL, (char *)&hold, sizeof(hold))) {
    fprintf(stderr, "setsockopt(IP_RECVTTL) error.\n");
}
```

Let's put them all together:

```
#define ICMP_ECHOREPLY  0
#define ICMP_UNREACH    3

#ifdef _WIN32
#define my_sleep(milsec)        Sleep(milsec)
#define sock_close(s)           closesocket(s)
#endif
#ifdef __linux__
#define my_sleep(milsec)        usleep(milsec*1000)
#define sock_close(s)           close(s)
#endif

int ping(const char *host, int loop)
{
    int sock, use_icmp_socket, i, ttl, maxdiff, mindiff, alldiff, allreceive;
    char *ip, raw[DATALEN];
    struct sockaddr_in dst_addr, *sockaddr;
    struct timeval wait_timeout;
    struct addrinfo *result;
    fd_set readfds;
#ifdef _WIN32
    WSADATA WSAData;
    if (WSAStartup(MAKEWORD(2, 2), &WSAData) != 0) {
        return -1;
    }
#endif
    /* find ip */
    if (getaddrinfo(host, NULL, NULL, &result) != 0) {
        fprintf(stderr, "getaddrinfo() error.\n");
        return -1;
    }
    /* use the first result */
    sockaddr = (struct sockaddr_in *)result->ai_addr;
    ip = strdup(inet_ntoa(sockaddr->sin_addr));
    freeaddrinfo(result);
    /* address */
    dst_addr.sin_family = AF_INET;
    dst_addr.sin_port = 0;
    dst_addr.sin_addr.s_addr = inet_addr(ip);
    for (i = 0; i < DATALEN; i++) {
        raw[i] = ' ' + (char)i;
    }
    /* socket */
    use_icmp_socket = 0;
    sock = -1;
#ifdef __linux__
    /* icmp socket available in kernel 3.0 */
    /* # echo 1000 1000 | sudo tee -a /proc/sys/net/ipv4/ping_group_range */
    sock = (int)socket(AF_INET, SOCK_DGRAM, IPPROTO_ICMP);
    if (sock != -1) {
        int hold = 1;
        use_icmp_socket = 1;
        if (setsockopt(sock, SOL_IP, IP_RECVTTL, (char *)&hold, sizeof(hold))) {
            fprintf(stderr, "setsockopt(IP_RECVTTL) error.\n");
        }
    }
#endif
    if (sock == -1) {
        sock = (int)socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
        if (sock == -1) {
            fprintf(stderr, "socket() error.\n");
            free(ip);
            return -1;
        }
    }
    /* loop */
    maxdiff = mindiff = alldiff = allreceive = 0;
    printf("PING %s (%s) %d(%d) bytes of data.\n", host, ip, DATALEN-8, sizeof(icmp_echo_reply_t));
    for (i = 0; i < loop; i++) {
        send_echo_request(sock, &dst_addr, i, raw);
        /* select */
        FD_ZERO(&readfds);
        FD_SET(sock, &readfds);
        wait_timeout.tv_sec = 3;
        wait_timeout.tv_usec = 0;
        if (select(sock+1, &readfds, NULL, NULL, &wait_timeout) <= 0) {
            printf("Request timed out.\n");
        } else {
            int diff;
            icmp_echo_request_t reply;
#ifdef _WIN32
            if (recv_echo_reply(sock, use_icmp_socket, &ttl, &reply) == -1) {
                continue;
            }
            diff = GetTickCount() - reply.data.tick;
#endif
#ifdef __linux__
            struct timeval cur_tv;
            if (recv_echo_reply(sock, use_icmp_socket, &ttl, &reply) == -1) {
                continue;
            }
            gettimeofday(&cur_tv, NULL);
            diff = (cur_tv.tv_sec-reply.data.tv.tv_sec)*1000*1000 + (cur_tv.tv_usec-reply.data.tv.tv_usec);
            diff /= 1000;
#endif
            if (reply.icmp_hd.type == ICMP_UNREACH) {
                /* ??? */
            } else if (reply.icmp_hd.type == ICMP_ECHOREPLY) {
                allreceive++;
                alldiff += diff;
                maxdiff = (diff > maxdiff) ? diff : maxdiff;
                if (mindiff == 0) {
                    mindiff = diff;
                } else {
                    mindiff = (diff < mindiff) ? diff : mindiff;
                }
                printf("%d bytes from %s (%s): icmp_req=%d ttl=%d time=%d ms\n",
                    DATALEN, host, ip, reply.icmp_hd.sequence, ttl, diff);
            }
        }
        my_sleep(1000);
    }
    /* statistic */
    printf("\n--- %s ping statistics ---\n", host);
    printf("%d packets transmitted, %d received, %d%% packet loss, time %d ms\n",
        loop, allreceive, (loop-allreceive)*100/loop, alldiff);
    if (allreceive != 0) {
        printf("rtt min/avg/max = %d/%d/%d ms\n", mindiff, alldiff/allreceive, maxdiff);
    }
    printf("\n");
    free(ip);
    sock_close(sock);
#ifdef WIN32
    WSACleanup();
#endif
    return 0;
}
```

All code compiles and works under Ubuntu 12.04(gcc4.6), Windows XP(VS2005) and Windows 7(VS2010) with administrator/root privilege. After enabling the ICMP socket parameter, root privilege is not required under linux. The output may look like:

```
gonwan@gonwan-precise:~/eclipse/workspace/ping$ ./ping www.google.com
PING www.google.com (74.125.31.99) 56(84) bytes of data.
Request timed out.
64 bytes from www.google.com (74.125.31.99): icmp_req=1 ttl=46 time=62 ms
64 bytes from www.google.com (74.125.31.99): icmp_req=2 ttl=46 time=66 ms

--- www.google.com ping statistics ---
3 packets transmitted, 2 received, 33% packet loss, time 128 ms
rtt min/avg/max = 62/64/66 ms


```

**Reference**: - RFC 791: [http://tools.ietf.org/html/rfc791](http://tools.ietf.org/html/rfc791) - RFC 792: [http://tools.ietf.org/html/rfc792](http://tools.ietf.org/html/rfc792) - Implement ping in C: [http://www.ibm.com/developerworks/cn/linux/network/ping/](http://www.ibm.com/developerworks/cn/linux/network/ping/) - Raw Socket and ICMP: [http://courses.cs.vt.edu/cs4254/fall04/slides/raw_6.pdf](http://courses.cs.vt.edu/cs4254/fall04/slides/raw_6.pdf) - Linux Kernel 3.0: [http://kernelnewbies.org/Linux_3.0](http://kernelnewbies.org/Linux_3.0) - IPv4: Add ICMP Socket Kind: [http://lwn.net/Articles/420800/](http://lwn.net/Articles/420800/) - Patch for Userspace ping: [ftp://ftp.intelib.org/pub/segoon/iputils-ss020927-pingsock.diff](ftp://ftp.intelib.org/pub/segoon/iputils-ss020927-pingsock.diff) - Wine Implementation: [http://fossies.org/dox/wine-1.4.1/icmp_8c_source.html](http://fossies.org/dox/wine-1.4.1/icmp_8c_source.html)
