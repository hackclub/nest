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

The server runs [Proxmox VE](https://www.proxmox.com/en/proxmox-virtual-environment/overview) 8.1.3 over [Debian](https://www.debian.org/) 12 Bookworm. It has 2 VMs: the Nest VM (ID `secure`) and the Nest VM (ID `nest`).

### Nest VM

The Nest VM is the VM that users will access and host their stuff on. It runs Debian 12 Bookworm. It's configured with all 8 CPU cores and 52 GiB of RAM.

### Secure VM

The Secure VM is the VM that hosts all critical Nest services:

- [Authentik](https://goauthentik.io/) (https://identity.hacklub.app)
- [Headscale](https://headscale.net/)
- [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki) (https://guides.hackclub.app)
- Nest Bot DB

It runs NixOS 23.05. it's configured with 4 CPU cores and 6 GiB of RAM. Configuration files can be found in [the secure-vm directory](/secure-vm/).

## Networking

The Nest server has 3 IPV4 addresses:

- `37.27.51.33` (Secure VM)
- `37.27.51.34` (Nest VM)
- `37.27.51.35` (Proxmox)

as well as an IPV6 subnet, `2a01:4f9:3081:399c::/64`.

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

`/etc/network/interfaces`:

```
source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
allow-hotplug ens18
iface ens18 inet static
	address 37.27.51.34/32
	# dns-* options are implemented by the resolvconf package, if installed
	dns-nameservers 9.9.9.9
	gateway 37.27.51.35

iface ens18 inet6 static
	address 2a01:4f9:3081:399c::4/64
        gateway 2a01:4f9:3081:399c::2
```

The Nest VM is configured with fail2ban to combat spamming.

### Secure VM network config

The network configuration for the Secure VM can be found in [the networking.nix file](/secure-vm/networking.nix).

## Nest Services

With the exception of Nest Bot, all services run on the Secure VM in Docker containers, configured within a Docker Compose file contained within the `/opt/docker` directory on the Secure VM.

### Nest Bot

Nest Bot handles Nest account creation and management from Slack for easy access to users. Its code is at [cskartikey/nest-bot](https://github.com/cskartikey/nest-bot). Since it needs to run commands on the Nest VM, it runs there, under the `nest-internal` user and inside a `tmux` session named `nest-bot`. The repo is cloned in `/home/nest-internal/nest-bot`.

Nest Bot's database runs on the Secure VM. The Docker compose configuration for it is in `/opt/docker/nest-bot/compose.yml` - contents are in [nest-bot.yml](/secure-vm/docker/nest-bot.yml).

### Authentik

All authentication and user management for Nest is done through Nest's identity provider, Authentik, which runs in a Docker Compose project on the Secure VM (`/opt/docker/authentik`). The Docker Compose file is downloaded directory from Authentik. Authentik is configured with 4 providers:

- Headscale OIDC
- LDAP
- MediaWiki OIDC
- Proxmox OIDC

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

### MediaWiki

MediaWiki is used for all of Nest's documentation, with the exception of this document. It's maintained and written by Nest admins and the community, and contains guides and help for anyone using Nest. It is available at https://guides.hackclub.app. MediaWiki has its Docker compose configuration at `/opt/docker/mediawiki/compose.yml` - contents are in [compose.yml](/secure-vm/docker/mediawiki/compose.yml). MediaWiki's `LocalSettings.php` has the following appended to the auto-generated settings:

```
$wgGroupPermissions['*']['createaccount'] = false;
$wgGroupPermissions['sysop']['createaccount'] = true;

wfLoadExtension( 'PluggableAuth' );
wfLoadExtension( 'OpenIDConnect' );

$wgGroupPermissions['*']['autocreateaccount'] = true;

$wgPluggableAuth_Config[] = [
  'plugin' => 'OpenIDConnect',
  'buttonLabelMessage' => 'Login with Nest',
  'data' => [
    'providerURL' => 'https://identity.hackclub.app/application/o/mediawiki/',
    'clientID' => '',
    'clientsecret' => ''
  ],
  'groupsyncs' => [[
    'type' => 'mapped',
    'map' => [
      'sysop' => [ 'groups' => 'admins' ],
      'bureaucrat' => ['groups' => 'admins' ]
    ]
  ]]
];

wfLoadSkin('Citizen');
$wgDefaultSkin = 'Citizen';
$wgFavicon = '/skins/common/nest-logo.png';
```

The Docker compose configuration uses a custom MediaWiki image to add extensions (PluggableAuth and OpenIDConnect) and skins (Citizen). Files for the custom Docker image are in `/opt/docker/mediawiki/nest-mediawiki` - Dockerfile contents are in [Dockerfile](/secure-vm/docker/mediawiki/Dockerfile).

## Nest CLI

The Nest CLI is a collection of tools for Nest users. At the moment, its core use is in allowing users to edit the global Caddyfile and add their own domains. It also includes a command for getting a random port that you can bind your services to.

Nest CLI is written in Ruby using Thor (with the help of some bash scripts), and is located in the [cli](/cli/) directory. On the Nest VM, this Nest repo (including the Nest CLI) is cloned in the `/usr/local/nest` directory.

Nest CLI requires the `/var/nest-cli` directory to be created.