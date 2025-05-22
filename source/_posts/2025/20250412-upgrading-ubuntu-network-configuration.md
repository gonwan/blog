---
title: "Upgrading Ubuntu 24.04 Network Configuration"
date: "2025-04-12"
categories: 
  - "linux"
tags: 
  - "almalinux"
  - "netplan"
  - "network"
  - "rhel"
  - "rockylinux"
  - "ubuntu"
---

Debian/Ubuntu and RHEL/AlmaLinux have different network configuration utilities. RHEL 9 has [deprecated](https://www.redhat.com/en/blog/rhel-9-networking-say-goodbye-ifcfg-files-and-hello-keyfiles) ifcfg-files, and adopted NetworkManager. There is no `ifup` or `ifdown` any more after a fresh installation. Since my server was first installed using Ubuntu 14.04, it still uses these scripts. Time to move on.

### 1. ifupdown

[Netplan](https://ubuntu.com/blog/netplan-configuration-across-desktop-server-cloud-and-iot) is used to configure networking in Ubuntu 18.04 and later. Ubuntu Server is packaged with systemd-networkd as the backend for Netplan, while NetworkManager is used as the Netplan backend in Ubuntu Desktop. Install by:

```
# sudo apt-get install netplan.io
```

Get current network status by:

```bash
$ sudo netplan status
...
●  1: lo ethernet UNKNOWN/UP (unmanaged)
      MAC Address: 00:00:00:00:00:00
...
●  3: eth0 ethernet UP (unmanaged)
      MAC Address: f2:3c:91:6e:3b:e1 (Red Hat, Inc.)
...
```

`eth0` is unmanaged, since `ifupdown` is used. The config file is `/etc/network/interfaces`.

```
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto eth0
iface eth0 inet dhcp
```

### 2. networkd

Create a config file `/etc/netplan/50-cloud-init.yaml`

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
```

This file is create by [cloud-init](https://cloud-init.io/) if fresh installed. I kept the name. `networkd` comes with `systemd`, no need to install it again. Apply it by:

```bash
$ sudo netplan generate
$ sudo netplan try
```

Now, `eth0` should be managed by `networkd`:

```bash
$ sudo netplan status
...
●  1: lo ethernet UNKNOWN/UP (unmanaged)
      MAC Address: 00:00:00:00:00:00
...
●  3: eth0 ethernet UP (networkd: eth0)
      MAC Address: f2:3c:91:6e:3b:e1 (Red Hat, Inc.)
...
```

The generated config file can be found in `/run/systemd/network/10-netplan-eth0.network`. System config files located in `/etc/systemd/networkd.conf` & `/usr/lib/systemd/network/`.

### 3. NetworkManager

`NetworkManager` can also be used for servers. Install by:

```bash
$ sudo apt-get install network-manager network-manager-config-connectivity-ubuntu
```

Create a config file `/etc/netplan/01-network-manager-all.yaml`.

```yaml
# Let NetworkManager manage all devices on this system
network:
  version: 2
  renderer: NetworkManager
```

This file is create by Ubuntu installer if fresh installed. I kept the name. Verify the merged config by running:

```bash
$ sudo netplan get
network:
  version: 2
  renderer: NetworkManager
  ethernets:
    eth0:
      dhcp4: true
```

**NOTE**, one additional step need to be performed, `/etc/network/interfaces` must **not** exist. `NetworkManager` has a plugin to parse the file. Backup it, so that you can roll back to `ifupdown` if something goes wrong. Apply it by:

```bash
$ sudo netplan generate
$ sudo netplan try
```

Now, `eth0` should be managed by `NetworManager`:

```bash
$ sudo netplan status
...
●  1: lo ethernet UNKNOWN/UP (unmanaged)
      MAC Address: 00:00:00:00:00:00
...
●  3: eth0 ethernet UP (NetworManager: eth0)
      MAC Address: f2:3c:91:6e:3b:e1 (Red Hat, Inc.)
...
```

The generated config file can be found in `/run/NetworkManager/system-connections/netplan-eth0.nmconnection`. System config files located in `/etc/NetworkManager/NetworkManager.conf` & `/usr/lib/NetworkManager/`. On systems before RHEL 9, `/run` may be `/var/run`. When `NetworkManager` starts and finds no connection for a device it might create an [in-memory connection](https://unix.stackexchange.com/questions/267605/networkmanager-not-creating-in-memory-connections). No config file is created. The `no-auto-default` configuration disables that behavior. Check systemd log for details:

```bash
$ sudo journalctl -u NetworkManager
...
ifcfg-rh: add connection in-memory (a05d8c6f-fa6f-34c9-bee0-09b029470893,"Wired connection 1")
...
```

More info can be found in Debian [documents](https://wiki.debian.org/NetworkManager). Useful commands include: `NetworkManager --print-config`, `nmcli device` & `nmcli connection`.

### 4. Clean ups

Now, you can safely remove `ifupdown`, and the `networking` systemd service will be removed too.

```bash
$ sudo apt-get purge ifupdown
```

### 5. iptables

An `ifupdown` script was add to persist `iptables` rules.

```bash
$ cat /etc/network/if-pre-up.d/firewall 
sudo /usr/sbin/iptables-restore < /etc/iptables.firewall.rules
```

This can be migrated by installing `iptables-persistent`:

```bash
$ sudo apt-get install iptables-persistent
```
