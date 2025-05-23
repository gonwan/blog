---
title: "Coroutines in Python"
date: "2016-01-11"
categories: 
  - "python"
tags: 
  - "asynchronous"
  - "coroutine"
---

Python 3.5 added native support for coroutines. Actually, there were several steps towards the current implementation. See [Wikipedia](https://en.wikipedia.org/wiki/Coroutine#Implementations_for_Python), and it seems a bit messy to me:

- Python 2.5 implements better support for coroutine-like functionality, based on extended generators ([PEP 342](https://www.python.org/dev/peps/pep-0342/)).
- Python 3.3 improves this ability, by supporting delegating to a subgenerator ([PEP 380](https://www.python.org/dev/peps/pep-0380/)).
- Python 3.4 introduces a comprehensive asynchronous I/O framework as standardized in [PEP 3156](https://www.python.org/dev/peps/pep-3156/), which includes coroutines that leverage subgenerator delegation.
- Python 3.5 introduces explicit support for coroutines with async/await syntax ([PEP 0492](https://www.python.org/dev/peps/pep-0492/)).

Before Python 2.5, there were only generators.

In Python 2.5, `yield` was refined to be an expression rather than a statement, which gave the possibility to implement a simple coroutine. But still a lot of work left for programmers to use it. For instance, a simple conroutine scheduler was required.

In Python 3.3, `yield from` was added to support subgenerators. Nothing to do with coroutines.

In Python 3.4, the Father of Python (_Guido van Rossum_) wrote a PEP himself to add an `asyncio` module to simplify coroutine usage in Python. An official scheduler was added. We can use `@asyncio.coroutine` to decorate a function. We can use `yield from` expressions to yield to a specific coroutine.

In Python 3.5, `async`/`await` syntax was added, borrowed from C#. The newest PEP made coroutines a native Python language feature, and clearly separated them from generators. A **native** coroutine now declares with `async def` syntax, and `yield from` is replaced with `await` expression. This removes generator/coroutine ambiguity. So in Python 3.5, coroutines used with `asyncio` may be implemented using the `async def` statement, or by using generators. Generator-based coroutines should be decorated with `@asyncio.coroutine`, although this is not strictly enforced. The decorator enables compatibility with `async def` coroutines, and also serves as documentation. See Python documents [here](https://docs.python.org/3.5/library/asyncio-task.html).

The implementation can be found in this [commit](https://hg.python.org/cpython/rev/eeeb666a5365).

I wrote a echo server/client sample to try corutines. Server code first:

```
#!/usr/bin/python3
import asyncio

@asyncio.coroutine
def start_server():
    yield from asyncio.start_server(client_connected_handler, '127.0.0.1', 2222)

@asyncio.coroutine
def client_connected_handler(client_reader, client_writer):
    peer = client_writer.get_extra_info('peername')
    print('Connected..%s:%s' % (peer[0], peer[1]))
    while True:
        data = yield from client_reader.read(1024)
        if not data:
            print('Disconnected..%s:%s\n' % (peer[0], peer[1]))
            break
        print(data.decode(), end='')
        client_writer.write(data)

loop = asyncio.get_event_loop()
server = loop.run_until_complete(start_server())
try:
    loop.run_forever()
except KeyboardInterrupt:
    pass

server.close()
loop.run_until_complete(server.wait_closed())
loop.close()
```

Client code here, or you can simply use `telnet` command:

```
#!/usr/bin/python3
import asyncio

@asyncio.coroutine
def tcp_echo_client():
    reader, writer = yield from asyncio.open_connection('127.0.0.1', 2222)
    writer.write(b'first line\n')
    writer.write(b'second line\n')
    writer.write(b'third line\n')
    writer.write(b'EOF\n')
    print("Lines received..")
    while True:
        line = yield from reader.readline()
        if not line:
            break
        line = line.decode()
        print(line, end='')
        if line == 'EOF\n':
            break
    writer.close()

loop = asyncio.get_event_loop()
loop.run_until_complete(tcp_echo_client())
loop.close()
```

Server output:

```
Connected..127.0.0.1:27643
first line
second line
third line
EOF
Disconnected..127.0.0.1:27643
```

Client output:

```
Lines received..
first line
second line
third line
EOF
```

With Python 3.5 on Ubuntu 16.04, we can also use `async`/`await`:

```
#!/usr/bin/python3
import asyncio

async def start_server():
    await asyncio.start_server(client_connected_handler, '127.0.0.1', 2222)

async def client_connected_handler(client_reader, client_writer):
    peer = client_writer.get_extra_info('peername')
    print('Connected..%s:%s' % (peer[0], peer[1]))
    while True:
        data = await client_reader.read(1024)
        if not data:
            print('Disconnected..%s:%s\n' % (peer[0], peer[1]))
            break
        print(data.decode(), end='')
        client_writer.write(data)

loop = asyncio.get_event_loop()
server = loop.run_until_complete(start_server())
try:
    loop.run_forever()
except KeyboardInterrupt:
    pass

server.close()
loop.run_until_complete(server.wait_closed())
loop.close()
```
