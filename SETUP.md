# Nest Setup

This is a complete and comprehensive guide of how Nest is setup!

## Hardware

Nest is running on a [Hetzner EX44 dedicated server](https://www.hetzner.com/dedicated-rootserver/ex44/), located in Helsinki, Finland.
It runs with the following specs:

- [Intel® Core™ i5-13500](https://ark.intel.com/content/www/us/en/ark/products/230580/intel-core-i5-13500-processor-24m-cache-up-to-4-80-ghz.html)
- 64 GB DDR4 RAM
- 2 x 512GB NVMe SSD in software RAID 1
- Gigabit internet

## Proxmox

The server runs [Proxmox VE](https://www.proxmox.com/en/proxmox-virtual-environment/overview) 8.1.3 over [Debian](https://www.debian.org/) 12 Bookworm. It has 2 VMs: the Secure VM (ID `secure`, #102) and the Nest VM (ID `nest` #103).

### Nest VM

The Nest VM is the VM that users will access and host their stuff on. It runs Debian 12 Bookworm. It's configured with all 20 CPU threads, 52 GiB of RAM, and 650GB of storage.

#### Resource Limits

Every user on Nest has resource limits setup to prevent abuse of Nest and to make sure there's enough resources for everyone. The default limits are:

- 10% (total, technically it's 200% since there's 20 cores) CPU time
- 2G memory (2G high, 2500M max)
- 15G disk (hard quota)

CPU time and memory are configured through SystemD & CGroups. These default limits are defined in `/etc/systemd/system/user-.slice.d/limit.conf`, and can be overridden for users in `/etc/systemd/system/user-<id>.slice.d/limit.conf`. User overrides override the **entire** configuration - so if you want to increase the max memory for a user, you must specify the high memory and CPU quota in the file as well.

`/etc/systemd/system/user-.slice.d/limit.conf`:
```
[Slice]
MemoryHigh=2G
MemoryMax=2500M
CPUQuota=200%
```
(see https://www.freedesktop.org/software/systemd/man/latest/systemd.resource-control.html and https://www.kernel.org/doc/Documentation/cgroup-v2.txt for reference)

Note that to apply changes to either the CPU time or memory limits, you must run `systemctl daemon-reload`. You can verify that a limit is applied by checking the appropriate file in `/sys/fs/cgroup/user.slice/user-<id>.slice` (ex. memory.max for MemoryMax).

Disk space limits are configured through `quota`. The following command is run by Nest Bot to set the default disk space limit:

```sh
setquota -u <user> 15G 15G 0 0 /
```

### Secure VM

The Secure VM is the VM that hosts all critical Nest services:

- [Authentik](https://goauthentik.io/) (https://identity.hacklub.app)
- [Guides](https://www.mediawiki.org/wiki/MediaWiki) (https://guides.hackclub.app)
- Nest Bot's database

In addition to some admin-only services:
- [Headscale](https://headscale.net/)
- [Vaultwarden](https://github.com/dani-garcia/vaultwarden)
- [Wazuh](https://wazuh.com/)

It runs NixOS 23.05. it's configured with 20 CPU cores and 8 GiB of RAM. Configuration files can be found in [the secure-vm directory](/secure-vm/).

## Networking

The Nest server has 3 IPv4 addresses:

- `37.27.51.33` (Secure VM)
- `37.27.51.34` (Nest VM)
- `37.27.51.35` (Proxmox)

as well as an IPv6 subnet, `2a01:4f9:3081:399c::/64`. IPv6 addresses are the subnet + the last digit of their IPv4 address, for simplicity. Exceptions are Proxmox (::2) and the Backup VM, which does not have an IPv4 address and only has its ::6 IPv6 address.

DNS is configured through [hackclub/dns](https://github.com/hackclub/dns/blob/main/hackclub.app.yaml).
A tailnet, coordinated through a Headscale instance on the Secure VM, is used to access Proxmox and the Secure VM. All other inbound traffic is blocked on these hosts, as seen in the firewall configurations below.

The network configuration files are as follows:

### Proxmox network config

`sysctl -w net.ipv4.ip_forward=1`

`sysctl -w net.ipv6.conf.all.forwarding=1`

`/etc/network/interfaces`:

```
source /etc/network/interfaces.d/*

auto lo
iface lo inet loopback

iface lo inet6 loopback

auto enp5s0
iface enp5s0 inet static
	address 37.27.51.35/26
	gateway 37.27.51.1
	up route add -net 37.27.51.0 netmask 255.255.255.192 gw 37.27.51.1 dev enp5s0
# route 37.27.51.0/26 via 37.27.51.1

iface enp5s0 inet6 static
	address 2a01:4f9:3081:399c::2/128
	gateway fe80::1

auto vmbr0
iface vmbr0 inet static
	address 37.27.51.35/32
	bridge-ports none
	bridge-stp off
	bridge-fd 0

iface vmbr0 inet6 static
	address 2a01:4f9:3081:399c::2/64
```

`/etc/network/interfaces.d/vm-routes`:

```
iface vmbr0 inet static
        up ip route add 37.27.51.34/32 dev vmbr0
        up ip route add 37.27.51.33/32 dev vmbr0
iface vmbr0 inet6 static
        up ip -6 route add 2a01:4f9:3081:399c::3/64 dev vmbr0
        up ip -6 route add 2a01:4f9:3081:399c::4/64 dev vmbr0
```

`ufw status verbose`:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), allow (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
Anywhere on tailscale0     ALLOW IN    Anywhere
Anywhere on vmbr0          ALLOW IN    Anywhere
Anywhere (v6) on tailscale0 ALLOW IN    Anywhere (v6)
Anywhere (v6) on vmbr0     ALLOW IN    Anywhere (v6)

Anywhere                   ALLOW OUT   Anywhere on vmbr0
Anywhere (v6)              ALLOW OUT   Anywhere (v6) on vmbr0

Anywhere on vmbr0          ALLOW FWD   Anywhere on enp5s0
Anywhere on enp5s0         ALLOW FWD   Anywhere on vmbr0
Anywhere (v6) on vmbr0     ALLOW FWD   Anywhere (v6) on enp5s0
Anywhere (v6) on enp5s0    ALLOW FWD   Anywhere (v6) on vmbr0
```

### Nest VM network config

`systemd-networkd` is used on the Nest VM instead of the standard `networking` service.

`/etc/systemd/network/ens18.network`:
```
[Match]
Name=ens18

[Network]
DHCP=false
IPv6AcceptRA=false

[Address]
Address=37.27.51.34/32
Peer=37.27.51.35/32

[Route]
Destination=0.0.0.0/0
Gateway=37.27.51.35

[Address]
Address=2a01:4f9:3081:399c::4/64

[Route]
Destination=::/0
Gateway=2a01:4f9:3081:399c::2

# de2.g-load.eu (dn42)
[Route]
Destination=2a01:4f8:c2c:3b65::1/128
Gateway=2a01:4f9:3081:399c::2

# helsinki.dn42.immibis.com aka hcl.immibis.com (dn42)
[Route]
Destination=2a01:4f9:c010:b12b::1/128
Gateway=2a01:4f9:3081:399c::2

# sto.peer.highdef.network (dn42)
[Route]
Destination=2a0e:dc0:2:7fa1::1/128
Gateway=2a01:4f9:3081:399c::2

# de1.dn42.ni.sb (dn42)
[Route]
Destination=2603:c020:8012:a322::cd17/128
Gateway=2a01:4f9:3081:399c::2

# mikrus.catgirls.systems (dn42)
[Route]
Destination=2a01:4f9:4a:5029::103/128
Gateway=2a01:4f9:3081:399c::2

# Secure VM (IPv4)
[Route]
Destination=37.27.51.33/32
Gateway=37.27.51.35
```

The Nest VM is configured with fail2ban to combat spamming.

### Secure VM network config

The network configuration for the Secure VM can be found in [the networking.nix file](/secure-vm/networking.nix).

### Backup VM network config

`/etc/network/interfaces`:

```
auto lo
iface lo inet loopback

auto ens18
iface ens18 inet static
	address 192.168.100.2/24
	gateway 192.168.100.1


source /etc/network/interfaces.d/*

iface ens18 inet6 static
	address 2a01:4f9:3081:399c::6/64
	gateway 2a01:4f9:3081:399c::2
	dns-nameservers 2606:4700:4700::1111
```

## Nest Services

With the exception of Gotify, Nest Bot, Prometheus/node_exporter, Forgejo, and Uptime Kuma, all services run on the Secure VM in Docker containers, configured within a Docker Compose file contained within the `/opt/docker` directory on the Secure VM.

### Authentik

All authentication and user management for Nest is done through Nest's identity provider, Authentik, which runs in a Docker Compose project on the Secure VM (`/opt/docker/authentik`). The Docker Compose file is downloaded directory from Authentik. Authentik is configured with 6 providers:

- Headscale OIDC
- LDAP
- MediaWiki OIDC
- Proxmox OIDC
- Uptime Kuma
- Provider for Forgejo

and their respective applications. The LDAP provider is bound to an LDAP outpost (ak-outpost-ldap), managed by Authentik through a local Docker connection.

A Slack OAuth source has been configured to allow logging into Authentik through the Hack Club Slack as well.

Authentik has a few groups configured:

- `authentik Admins` (compatibility reasons)
- `admins` (main Nest admins)
- `nest-users` (allowed to access Nest VM)

#### LDAP

LDAP is configured on both the Secure VM and Nest VM for user management. For the Secure VM, LDAP configuration is in [`/etc/nixos/users.nix`](/secure-vm/nixos/users.nix). For the Nest VM, SSSD is used - its configuration is at [`/etc/sssd/sssd.conf`](/nest-vm/sssd.conf).

For SSH authentication, the SSH `AuthorizedKeysCommand` configuration option is used in combination with [a short script](ldap_script.sh).

LDAP Details:

- **Hostname**: `ldap://identity.hackclub.app` (plaintext) or `ldaps://identity.hackclub.app` (StartTLS - you must install the certificate named `identity.hackclub.app` on the machine for it to work).
- **Base DN**: `dc=ldap,dc=secure,dc=vm,dc=hackclub,dc=app`
- **Users Organizational Unit**: `ou=users`
- **Groups Organizational Unit**: `ou=groups`

### DN42

// todo

### Forgejo

Forgejo (https://forgejo.org/) is Nest's public Git server, available at https://git.hackclub.app. It's on the Nest VM inside `/srv/git/forgejo`, running as the `git` user.

### Gotify

Gotify is setup on the Nest VM to handle notifications from services such as Proxmox, in a Docker container in `/root/gotify`. It is in the process of being moved to the Secure VM. It is available at https://gotify.hackclub.app

### Headscale

Headscale is used for administering Nest. All Nest admins can connect to it, and it is the only way through which one can access Proxmox or the Secure VM directly, due to firewall configurations. It is configured in `/opt/docker/headscale/compose.yml` - contents are included in [headscale.yml](/secure-vm/docker/headscale.yml). Configuration is default, except for OIDC configuration added at the end:

```
oidc:
  only_start_if_oidc_is_available: false
  issuer: "https://identity.hackclub.app/application/o/headscale/"
  client_id:
  client_secret:
  scope: ["openid", "profile"]
```

### Guides

https://guides.hackclub.app (MediaWiki) is used for all of Nest's documentation, with the exception of this document. It's maintained and written by Nest admins and the community, and contains guides and help for anyone using Nest. MediaWiki has its Docker compose configuration at `/opt/docker/guides/compose.yml` - contents are in [compose.yml](/secure-vm/docker/guides/compose.yml).


The Docker compose configuration uses a custom FrankenPHP image to host the PHP application, located in `/opt/docker/guides/mediawiki`. The Dockerfile contents are in [Dockerfile](/secure-vm/docker/guides/Dockerfile), and the Caddyfile configuration is in [Caddyfile](/secure-vm/docker/guides/Caddyfile).

MediaWiki's configuration file is also documented here at [LocalSettings.php](/secure-vm/docker/guides/mediawiki/LocalSettings.php).

### Nest Bot

Nest Bot handles Nest account creation and management from Slack for easy access to users. Its code is in the directory [nest-bot](/nest-bot/). Since it needs to run commands on the Nest VM, it runs there, under the `nest-internal` user and inside a `tmux` session named `nest-bot`. This repo is cloned in `/home/nest-internal/nest`.

Nest Bot's database runs on the Secure VM. The Docker compose configuration for it is in `/opt/docker/nest-bot/compose.yml` - contents are in [nest-bot.yml](/secure-vm/docker/nest-bot.yml).

### Prometheus / node_exporter

[Prometheus](https://prometheus.io/) and [node_exporter](https://github.com/prometheus/node_exporter) have been setup on the Nest VM (nest-internal user, `/home/nest-internal`) to monitor the Nest VM's statistics and resources as well as report metrics from Nest Bot. All data is collected in Hack Club's [Grafana](https://grafana.com/) instance.

### Uptime Kuma

[Uptime Kuma](https://github.com/louislam/uptime-kuma) monitors Nest's services and infrastructure, and alerts in Slack (#nest-meta channel) when anything goes down. It's setup on a Docker container on the Nest VM (so that it can monitor Nest VM Docker containers), in `/root/uptime`.

At the moment, it is setup to monitor 6 services:

- Authentik
- Nest Postgres
- sshd
- Forgejo
- bird-lg
- bird-lgproxy

### Vaultwarden

[Vaultwarden](https://github.com/dani-garcia/vaultwarden) has been setup on the Secure VM to manage shared passwords, secrets, and failsafes for the Nest Admins. Vaultwarden has its Docker compose configuration at `/opt/docker/vaultwarden/compose.yml` - contents are in [compose.yml](/secure-vm/docker/vaultwarden/compose.yml). Users are manually managed by Vaultwarden as it does not fully support LDAP/OIDC.

## Nest CLI

The Nest CLI is a collection of tools for Nest users. At the moment, its core use is in allowing users to edit the global Caddyfile and add their own domains. It also includes a command for getting a random port that you can bind your services to.

Nest CLI is written in Ruby using Thor (with the help of some bash scripts), and is located in the [cli](/cli/) directory. On the Nest VM, this Nest repo (including the Nest CLI) is cloned in the `/usr/local/nest` directory.

Nest CLI requires the `/var/nest-cli` directory to be created.

## Failsafes

The Nest admins take great care to make sure that all Nest services are as secure as possible, which involves using proper authentication and firewalls when appropriate. However, this relies upon critical services such as Authentik and Headscale, meaning that Nest admins could be prevented from fixing issues if such services go down. For this reason, a series of failsafes has been created to ensure that force reboots are never required.

These failsafes are:

- Access to root@proxmox and root@secure-vm through SSH keys and cryptograhically random passwords.
- Shared TOTP token for root@pam on the Proxmox Web UI
- A multi-use, non-expiring preauth token for Headscale

These failsafes should be stored safely and securely by all Nest admins (now through [Vaultwarden](#vaultwarden)), and they are only to be used in case of emergency to ensure proper security and auditing.
