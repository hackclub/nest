# Nest Setup

This is an almost complete guide of how Nest is setup!

## Hardware

Nest is running on two [Hetzner AX162-R dedis](https://www.hetzner.com/dedicated-rootserver/ax162-r/), and one [Hetzner AX41-NVMe dedi](https://www.hetzner.com/dedicated-rootserver/ax41-nvme/), all located in Helsinki, Finland.

It runs with the following specs:

AX162-R * 2:
- AMD EPYC™ Genoa 9454P
- 256GB DDR5 RAM
- 2 x 1.92TB NVMe SSD (Datacenter Edition)
- Gigabit internet

AX41-NVMe * 1:
- AMD Ryzen™ 5 3600
- 64GB DDR4 RAM
- 2 x 512 GB NVMe SSD
- Gigabit internet

## Proxmox

The server runs [Proxmox VE](https://www.proxmox.com/en/proxmox-virtual-environment/overview) 9.1.9 over [Debian](https://www.debian.org/) 13 Trixie.
Each of the dedicated servers are added as a node to the PVE cluster.

User servers are LXC containers made on one of the each AX162-R dedis, and the AX41-NVMe is used as a management node, running things like the dashboard, forgejo and more.

### Resource Limits

Every user on Nest has resource limits setup to prevent abuse of Nest and to make sure there's enough resources for everyone. The default limits are:

- 2 vcores
- 2 GB memory
- 16 GB disk

## Backups (PBS)

We are running a Proxmox Backup Server (PBS) on its own Hetzner CPX22 VPS.
PBS is saving backups to a Hetzner Storage Box (1TB storage and PBS is, at the time of writing, projected to fill around 30 July 2026), running in the same region (Helsinki, Finland).

It's set to keep the 3 most recent backups plus 2 weekly snapshots, and backups of containers/vms are done once a day at 21:00 UTC.
The hosts are backed up every day at 2AM UTC.

## Networking

DNS is configured through [hackclub/dns](https://github.com/hackclub/dns/blob/main/hackclub.app.yaml).
A tailnet, coordinated through a Headscale instance on the logs.hackclub.app VPS, is used to access Proxmox. Inbound traffic to port :8006, :22 and :111 is blocked via the Hetzner firewall.

The network configuration files are as follows:

### nest-prox-1 config

`/etc/network/interfaces`:

```
auto lo
iface lo inet loopback

iface nic0 inet manual

iface nic1 inet manual

iface nic2 inet manual

auto vmbr0
iface vmbr0 inet static
        address 135.181.209.89/32
        gateway 135.181.209.65
        bridge-ports nic0
        bridge-stp off
        bridge-fd 0
        #post-up ip addr add 135.181.209.88/32 dev vmbr0
        #post-down ip addr del 135.181.209.88/32 dev vmbr0
        post-up ip addr add 135.181.209.81/32 dev vmbr0
        post-down ip addr del 135.181.209.81/32 dev vmbr0
        post-up echo 1 > /proc/sys/net/ipv4/ip_forward
        post-up iptables -t nat -A POSTROUTING -s 10.254.0.0/24 -o vmbr0 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 10.254.10.0/24 -o vmbr0 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 10.60.0.0/16 -o vmbr0 -j MASQUERADE
        post-up iptables -t raw -I PREROUTING -i fwbr+ -j CT --zone 1
        post-down iptables -t raw -D PREROUTING -i fwbr+ -j CT --zone 1
        post-up iptables -A INPUT -d 135.181.209.89 -p tcp -m multiport --dports 22,8006,111 -j DROP

iface vmbr0 inet6 static
        address 2a01:4f9:3a:276e::1/64
        gateway fe80::1
        post-up /usr/local/bin/restore-ndp.sh
        post-up sysctl -w net.ipv6.conf.all.forwarding=1

# --- VLAN 4000: hosts only---
auto nic0.4000
iface nic0.4000 inet manual
        vlan-raw-device nic0

auto vmbr4000
iface vmbr4000 inet static
        address 10.254.0.1/24
        bridge-ports nic0.4000
        bridge-stp off
        bridge-fd 0

# --- VLAN 4010: infra only---
auto nic0.4010
iface nic0.4010 inet manual
        vlan-raw-device nic0

auto vmbr4010
iface vmbr4010 inet static
        address 10.254.10.2/24
        bridge-ports nic0.4010
        bridge-stp off
        bridge-fd 0

# --- VLAN 4030: users only---
auto nic0.4030
iface nic0.4030 inet manual
        vlan-raw-device nic0

auto vxlan4030
iface vxlan4030 inet manual
    pre-up ip link add vxlan4030 type vxlan id 4030 dstport 4789 local 10.254.0.1 learning
    up ip link set vxlan4030 up
    post-up bridge fdb append 00:00:00:00:00:00 dev vxlan4030 dst 10.254.0.2
    post-up bridge fdb append 00:00:00:00:00:00 dev vxlan4030 dst 10.254.0.3
    pre-down ip link del vxlan4030

auto vmbr4030
iface vmbr4030 inet static
        address 10.60.0.2/16
        bridge-ports vxlan4030
        bridge-stp off
        bridge-fd 0

iface vmbr4030 inet6 static
        address fe80::f4dd:e5ff:fe24:82a4/64

source /etc/network/interfaces.d/*
```

`$ iptables -S`:

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
-A INPUT -d 135.181.209.89/32 -p tcp -m multiport --dports 22,8006,111 -j DROP
```

`$ ip6tables -S`:

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
```

### nest-prox-2 config

`/etc/network/interfaces`:

```
auto lo
iface lo inet loopback

iface nic0 inet manual

source /etc/network/interfaces.d/*

auto nic0.4000
iface nic0.4000 inet manual

auto nic0.4010
iface nic0.4010 inet manual

iface enp193s0f1np1 inet manual

auto nic0.4030
iface nic0.4030 inet manual

iface enx125b0a6b9d2d inet manual

auto vmbr0
iface vmbr0 inet static
        address 37.27.51.35/32
        gateway 37.27.51.1
        bridge-ports nic0
        bridge-stp off
        bridge-fd 0
        post-up echo 1 > /proc/sys/net/ipv4/ip_forward
        post-up iptables -t nat -A POSTROUTING -s 10.254.0.0/24 -o vmbr0 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 10.254.10.0/24 -o vmbr0 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 10.60.0.0/16 -o vmbr0 -j MASQUERADE
        post-up iptables -t raw -I PREROUTING -i fwbr+ -j CT --zone 1
        post-down iptables -t raw -D PREROUTING -i fwbr+ -j CT --zone 1
        post-up iptables -A INPUT -d 37.27.51.35 -p tcp -m multiport --dports 22,8006,111 -j DROP

iface vmbr0 inet6 static
        address 2a01:4f9:3081:399c::1/64
        gateway fe80::1
        post-up /usr/local/bin/restore-ndp.sh
        post-up sysctl -w net.ipv6.conf.all.forwarding=1

auto vmbr4000
iface vmbr4000 inet static
        address 10.254.0.2/24
        bridge-ports nic0.4000
        bridge-stp off
        bridge-fd 0

auto vmbr4010
iface vmbr4010 inet static
        address 10.254.10.3/24
        bridge-ports nic0.4010
        bridge-stp off
        bridge-fd 0

auto vxlan4030
iface vxlan4030 inet manual
    pre-up ip link add vxlan4030 type vxlan id 4030 dstport 4789 local 10.254.0.2 learning
    up ip link set vxlan4030 up
    post-up bridge fdb append 00:00:00:00:00:00 dev vxlan4030 dst 10.254.0.1
    post-up bridge fdb append 00:00:00:00:00:00 dev vxlan4030 dst 10.254.0.3
    pre-down ip link del vxlan4030

auto vmbr4030
iface vmbr4030 inet static
        address 10.60.0.3/16
        bridge-ports vxlan4030
        bridge-stp off
        bridge-fd 0

iface vmbr4030 inet6 static
        address fe80::9e6b:ff:fe4e:8737/64

source /etc/network/interfaces.d/*
```

`$ iptables -S`:

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
-A INPUT -d 37.27.51.35/32 -p tcp -m multiport --dports 22,8006,111 -j DROP
```

`$ ip6tables -S`:

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
```

### nest-prox-3 config

`/etc/network/interfaces`:

```
auto lo
iface lo inet loopback

iface nic0 inet manual

auto nic0.4000
iface nic0.4000 inet manual

auto nic0.4010
iface nic0.4010 inet manual

auto nic0.4030
iface nic0.4030 inet manual

auto vmbr0
iface vmbr0 inet static
        address 65.108.74.52/32
        gateway 65.108.74.1
        bridge-ports nic0
        bridge-stp off
        bridge-fd 0
        post-up ip addr add 65.108.74.29/32 dev vmbr0
        post-down ip addr del 65.108.74.29/32 dev vmbr0
        post-up echo 1 > /proc/sys/net/ipv4/ip_forward
        post-up iptables -t nat -A POSTROUTING -s 10.254.0.0/24 -o vmbr0 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 10.254.10.0/24 -o vmbr0 -j MASQUERADE
        post-up iptables -t nat -A POSTROUTING -s 10.60.0.0/16 -o vmbr0 -j MASQUERADE
        post-up iptables -t raw -I PREROUTING -i fwbr+ -j CT --zone 1
        post-down iptables -t raw -D PREROUTING -i fwbr+ -j CT --zone 1
        post-up iptables -A INPUT -d 65.108.74.52 -p tcp -m multiport --dports 22,8006,111 -j DROP

iface vmbr0 inet6 static
        address 2a01:4f9:6b:4a05::1/64
        gateway fe80::1
        post-up /usr/local/bin/restore-ndp.sh
        post-up sysctl -w net.ipv6.conf.all.forwarding=1

auto vmbr4000
iface vmbr4000 inet static
        address 10.254.0.3/24
        bridge-ports nic0.4000
        bridge-stp off
        bridge-fd 0

auto vmbr4010
iface vmbr4010 inet static
        address 10.254.10.4/24
        bridge-ports nic0.4010
        bridge-stp off
        bridge-fd 0

auto vxlan4030
iface vxlan4030 inet manual
        pre-up ip link add vxlan4030 type vxlan id 4030 dstport 4789 local 10.254.0.3 learning
        up ip link set vxlan4030 up
        post-up bridge fdb append 00:00:00:00:00:00 dev vxlan4030 dst 10.254.0.1
        post-up bridge fdb append 00:00:00:00:00:00 dev vxlan4030 dst 10.254.0.2
        pre-down ip link del vxlan4030

auto vmbr4030
iface vmbr4030 inet static
        address 10.60.0.4/16
        bridge-ports vxlan4030
        bridge-stp off
        bridge-fd 0

iface vmbr4030 inet6 static
        address fe80::2863:f7ff:fe4a:a73/64

source /etc/network/interfaces.d/*
```

`$ iptables -S`:

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
-A INPUT -d 65.108.74.52/32 -p tcp -m multiport --dports 22,8006,111 -j DROP
```

`$ ip6tables -S`:

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
```

## Nest Services

Forgejo, the dashboard + reverse proxy (caddy), guides and umami (primarily for admins) are running as separate LXC containers on nest-prox-3, with the exception of forgejo which is a VM.
Uptimekuma and nephthys (slack support bot) are running on the logs.hackclub.app VPS

### Forgejo

Forgejo (https://forgejo.org/) is Nest's public Git server, available at https://git.hackclub.app.

### Headscale

Headscale is used for administering Nest. All Nest admins can connect to it, and it is the only way through which one can access Proxmox directly, due to firewall configurations. It is running on the logs.hackclub.app Hetzner VPS.

### Guides

https://guides.hackclub.app (MediaWiki) is used for all of Nest's documentation, with the exception of this document. It's maintained and written by Nest admins and the community, and contains guides and help for anyone using Nest. It is running on nest-prox-3 as a LXC container.

### Uptime Kuma

[Uptime Kuma](https://github.com/louislam/uptime-kuma) monitors Nest's services and infrastructure, and alerts in Slack (#nest-status channel) when anything goes down. It's running on the logs.hackclub.app Hetzner VPS.

At the moment, it is setup to monitor 13 services:

- The dashboard
- The SSH bastion
- The nest website
- The site for exporting old nest data
- The guides
- Nephthys
- nest-prox-1, nest-prox-2, and nest-prox-3
- ts-router-1, ts-router-2 and ts-router-3
- Our Proxmox Backup Server

### ts-router-1/2/3

todo

### Nephthys

todo

