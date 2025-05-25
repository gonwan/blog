---
title: "Using CIMPLE with OpenPegasus CIM Server"
date: "2011-09-12 18:13:00"
categories: 
  - "cc"
tags: 
  - "centos"
  - "cim"
---

This post just walk through the usage of [CIMPLE](http://simplewbem.org/) and [OpenPegasus](http://www.openpegasus.org/) in CentOS 5.x. For background knowledge, please refer to wikipedia.

In CentOS 5.x, just install OpenPegasus(2.9.1) from yum:

```bash
$ yum install tog-pegasus tog-pegasus-devel
```

We install the devel package since CIMPLE needs to build against it. I used CIMPLE 1.2.4. Before build it, we should fix broken symbolic links of OpenPegasus package, otherwise link error occurs:

```bash
$ ln -s /usr/lib/libpegconfig.so.1 /usr/lib/libpegconfig.so
$ ln -s /usr/lib/libpeglistener.so.1 /usr/lib/libpeglistener.so
$ ln -s /usr/lib/libpegprm.so.1 /usr/lib/libpegprm.so
$ ln -s /usr/lib/libpegprovidermanager.so.1 /usr/lib/libpegprovidermanager.so
```

There's also a trivial bug which prevent CIMPLE from generating CMPI version of makefiles. Edit `${CIMPLE}/src/tools/genmak/main.cpp`, find line "case 'c'", and change to "case 'C'". Now configure and make:

```bash
$ ./configure --prefix=/usr --with-pegasus=/usr --with-cmpi=/usr/include/Pegasus/Provider/CMPI
$ make
$ make install
```

Aha!! Another annoying bug: wrong permissions in `*.tar.gz` source package. Fix with:

```bash
$ chmod 644 /usr/share/cimple/mak/*.mak
$ chmod 755 /usr/share/cimple/mak/*.sh
```

Demo code refers to CIMPLE official tutorial. It can be found in source package. A repository.mof file is created first:

```
class President
{
    [Key] uint32 Number;
    string First;
    string Last;
};
class VicePresident
{
    [Key] uint32 Number;
    string First;
    string Last;
};
```

Run `genproj` to generate class files, provider files, and module files:

```bash
$ genproj President President VicePresident
```

Generate makefiles using `genmak`. First line is for OpenPegasus adapter, while second line for CMPI adapter:

```bash
$ genmak President *.cpp
$ genmak -C President *.cpp
```

We implemented `President::get_instance()` and `President::enum_instance()` in our code:

```cpp
Get_Instance_Status President_Provider::get_instance(
    const President* model,
    President*& instance)
{
    /* return GET_INSTANCE_UNSUPPORTED;  */

    if (model->Number.value == 1)
    {
        instance = President::create(true);
        instance->Number.set(1);
        instance->First.set("George");
        instance->Last.set("Washington");
        return GET_INSTANCE_OK;
    }
    else if (model->Number.value == 2)
    {
        instance = President::create(true);
        instance->Number.set(2);
        instance->First.set("John");
        instance->Last.set("Adams");
        return GET_INSTANCE_OK;
    }
    else if (model->Number.value == 3)
    {
        instance = President::create(true);
        instance->Number.set(3);
        instance->First.set("Thomas");
        instance->Last.set("Jefferson");
        return GET_INSTANCE_OK;
    }

    return GET_INSTANCE_NOT_FOUND;
}

Enum_Instances_Status President_Provider::enum_instances(
    const President* model,
    Enum_Instances_Handler* handler)
{
    President* instance;

    instance = President::create(true);
    instance->Number.set(1);
    instance->First.set("George");
    instance->Last.set("Washington");
    handler->handle(instance);

    instance = President::create(true);
    instance->Number.set(2);
    instance->First.set("John");
    instance->Last.set("Adams");
    handler->handle(instance);

    instance = President::create(true);
    instance->Number.set(3);
    instance->First.set("Thomas");
    instance->Last.set("Jefferson");
    handler->handle(instance);
    
    return ENUM_INSTANCES_OK;
}
```

If `get_instance()` returns `GET_INSTANCE_UNSUPPORTED`, the adapter satisﬁes the request by calling `enum_instances()` and searching for a matching instances. It is recommend to leave `get_instance()` unsupported when the total number of instances is small.

After making your module, a registration is required for OpenPegasus CIM server. Start your server and register. The shared library should also be copied to OpenPegasus's providers folder manually:

```bash
$ cp libPresident.so /usr/lib/Pegasus/providers
$ /etc/init.d/tog-pegasus start
$ regmod -c ./libPresident.so
Using Pegasus C++ provider interface
Creating class VicePresident (root/cimv2)
Creating class President (root/cimv2)
Registering VicePresident_Provider (class VicePresident)
Registering President_Provider (class President)
```

To unregister this provider, run:

```bash
$ regmod -u -c ./libPresident.so
Using Pegasus C++ provider interface
Unregistering VicePresident_Provider (class VicePresident)
Deleted class VicePresident
Unregistering President_Provider (class President)
Deleted class President
```

You may want to dump MOF registration instance for your provide:

```bash
$ regmod -d ./libPresident.so
instance of PG_ProviderModule
{
    Name = "President_Module";
    Vendor = "Pegasus";
    Version = "2.5.0";
    InterfaceType = "C++Default";
    InterfaceVersion = "2.5.0";
    Location = "President";
};

instance of PG_Provider
{
    Name = "VicePresident_Provider";
    ProviderModuleName = "President_Module";
};

instance of PG_ProviderCapabilities
{
    CapabilityID = "VicePresident";
    ProviderModuleName = "President_Module";
    ProviderName = "VicePresident_Provider";
    ClassName = "VicePresident";
    Namespaces = {"root/cimv2"};
    ProviderType = {2};
    supportedProperties = NULL;
    supportedMethods = NULL;
};

instance of PG_Provider
{
    Name = "President_Provider";
    ProviderModuleName = "President_Module";
};

instance of PG_ProviderCapabilities
{
    CapabilityID = "President";
    ProviderModuleName = "President_Module";
    ProviderName = "President_Provider";
    ClassName = "President";
    Namespaces = {"root/cimv2"};
    ProviderType = {2};
    supportedProperties = NULL;
    supportedMethods = NULL;
};
```

Install command line utilities and test OpenPegasus server:

```bash
$ yum install sblim-wbemcli
$ yum install sblim-cmpi-base
$ wbemcli ecn https://:@localhost:5989/root/cimv2
$ wbemcli -nl ei https://:@localhost:5989/root/cimv2:Linux_Processor
```

Test our President provider:

```bash
$ wbemcli ei https://:@localhost:5989/root/cimv2:President
localhost:5989/root/cimv2:President.Number=1 Number=1,First="George",Last="Washington"
localhost:5989/root/cimv2:President.Number=2 Number=2,First="John",Last="Adams"
localhost:5989/root/cimv2:President.Number=3 Number=3,First="Thomas",Last="Jefferson"
$ wbemcli gi https://:@localhost:5989/root/cimv2:President.Number=1
localhost:5989/root/cimv2:President.Number="1" Number=1,First="George",Last="Washington"
```

All code can be found in my skydrive here:

<iframe style="background-color: #fcfcfc; height: 115px; padding: 0pt; width: 98px;" title="Preview" src="https://skydrive.live.com/embedicon.aspx/share/dev/cmpi.tar.gz?cid=481cbe104492a3af&amp;sc=documents" width="300" height="150" frameborder="0" marginwidth="0" marginheight="0" scrolling="no"></iframe>
