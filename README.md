# Hack As A Service

Goal: Free backend hosting provided by Hack Club HQ for every teenager in the world, but especially Hack Clubbers.

Basic problem for us to solve: many teenagers literally can't deploy any backend services right now because they don't have credit cards or income and most hosting free tiers have disappeared (looking at you Heroku 😔). We want to change that! As a public good!

_Revamp of Hack As a Service ([v0](https://github.com/hackclub/hack-as-a-service-v0), [v1](https://github.com/hack-as-a-service))_

# Initial Set of Goals

- 10 people running with a subdomain of hackclub.app with their own apps (ex. zrl.hackclub.app)
- Supports static and backend hosting (using PORT file)
- Available domains of USER.hackclub.app (auto DNS), APP.USER.hackclub.app (auto DNS), and custom domains
- Weekly working calls in public
- Signup flow to create an account in #hack-as-a-service-signup

### User experience

Main URL is hackclub.app

    $ ssh zrl@hackclub.app

https://zrl.hackclub.app

Hosting a static site:

    $ ssh zrl@hackclub.com
    
    # There is a folder called "public" auto created in every user account
    
    # For your main site
    $ cd public
    $ mkdir zrl.hackclub.app
    $ cd zrl.hackclub.app
    $ cat "Hello, world!" > index.html
    $ curl https://zrl.hackclub.app -> "Hello, world!"
    
    # For sub-sites
    $ cd public
    $ mkdir my-static-site.zrl.hackclub.app
    $ cd my-static-site.zrl.hackclub.app
    $ cat "Hello, subdomain!" > index.html
    $ curl https://my-static-site.zrl.hackclub.app -> "Hello, subdomain!"
    
    # For non-hackclub.app domains
    $ cd public
    $ mkdir zachlatta.com
    $ cd zachlatta.com
    $ cat "Hello, different website!" > index.html
    $ curl https://zachlatta.com -> "Hello, different website!"
    
For dynamic sites:

    $ ssh zrl@hackclub.app
    
    # For your main site
    $ cd public
    $ mkdir zrl.hackclub.app
    $ generate-port-file
    
    Generating... done! Please have your web server listen on port 43829.
    
    If you're not sure how to do this, please Google "how to change port" for your framework.
    
    Common examples:

      Ruby on Rails: $ rails serve -P 43829
      
      Many Node.js servers: $ PORT=43829 node index.js

    If you ever forget which port, you can run `cat ~/pub/zrl.hackclub.app/PORT` to remind you that the port for zrl.hackclub.app is 43829.
    
    You can get more help on this at https://hackclub.app/backend-hosting.
    
    $ daemonize (systemd unit generator)

      what is the command to run your application?
      > PORT=43829 node index.js
      does your app have any dependencies?
      > mariadb
      ~/.config/systemd/user/zrl.hackclub.app generated
      systemctl --user status|stop|restart|start zrl.hackclub.app
      haas='systemctl --user'
      
    $ haas start
    $ haas ls
    helpful error messages / healthcheck ping
    
    $ curl https://zrl.hackclub.app -> Backend service returns reply
    
    ## The above steps also work for foo.zrl.hackclub.app and zachlatta.com ##

---

shell account on hackclub.app
cli to find open port (over 1024, not in `/home/*/PORT`)
`~/pub/my.custom.domain`
PORT file -> proxy_pass
inotify service `/home/*/pub/*/PORT` adjust configs and reload
SOCKET `~/pub/site/SOCKET`
deny all .env and .git paths
caddy?
signup
write(1) if you are trying to use a subdomain that doesn't match your username



Working title for Hack Club HQ's revamp of #hack-as-a-service. Hack Club tilde server, anyone?

[@benharri](https://github.com/benharri) leading the project.

This needs to serve 3 types of teenagers:

1. I know how to write HTML and CSS and just wrote my first ever backend and need to host it. Completely unfamiliar with SSH, Linux, and traditional deployments through flows like Heroku. Probably has heard of Vercel for frontend hosting. Likely coding on repl.it. I do not know what a port or a reverse proxy is.

2. I have deployed backend services to places like Railway, but am deeply frustrated with their limits because I am a teenager and I don't have a credit card or income to pay for the paid tiers. I can't even sign up for Heroku because I don't have a credit card. I like giving a Procfile or Dockerfile and need a place to host it with a Postgres database that is reliable and won't go down. I don't need it to be "production grade", this is more for personal projects or semi-professional projects that don't have high volume. I need some kind of secrets management for environment variables. I know what a port is, but I don't know what a reverse proxy is.

3. I am a homelab guru, highly technical, "do you know that I run Arch / NixOS?", strongly opinioned on distros, watches DistroTube, etc. I don't use vim, I use neovim. I don't use neovim, I use a custom editor that I wrote for myself in Rust! I usually deploy my own services on my homelab, but it constantly goes down so I want something more reliable for my Slack and Discord bots / etc. I know what a reverse proxy is and have strong opinions around them.

---

## Proxmox

### installation

basic installation over plain debian
https://pve.proxmox.com/wiki/Install_Proxmox_VE_on_Debian_11_Bullseye

### proxmox networking

network configs derived from:
https://community.hetzner.com/tutorials/install-and-configure-proxmox_ve

`sysctl -w net.ipv4.ip_forward=1`
`sysctl -w net.ipv6.conf.all.forwarding=1`

#### proxmox host `/etc/network/interfaces`
```
source /etc/network/interfaces.d/*

auto lo
iface lo inet loopback
iface lo inet6 loopback

auto eno1
iface eno1 inet static
        address 78.46.86.74/27
        gateway 78.46.86.65
        up route add -net 78.46.86.64 netmask 255.255.255.224 gw 78.46.86.65 dev eno1
iface eno1 inet6 static
        address 2a01:4f8:120:144a::2/128
        gateway fe80::1

auto vmbr0
iface vmbr0 inet static
        address 78.46.86.74/32
        bridge-ports none
        bridge-stp off
        bridge-fd 0
        pre-up brctl addbr vmbr0
        up ip route add 188.40.159.192/29 dev vmbr0
        down ip route del 188.40.159.192/29 dev vmbr0
        post-down brctl delbr vmbr0

iface vmbr0 inet6 static
        address 2a01:4f8:120:144a::2/64
```
The important bits here are sysctl forwarding and routing our guest subnet to vmbr0.

Also need to `systemctl disable --now rpcbind.socket` per Hetzner rules.

#### debian guest config

Subnet:	188.40.159.192/29

```
auto ens18
iface ens18 inet static
    address 188.40.159.192/32
    # or address 162.55.142.X/32
    gateway 78.46.86.74

iface ens18 inet6 static
    address 2a01:4f8:120:144a::x/64
    gateway 2a01:4f8:120:144a::2

```

#### `/etc/apt/sources.list`
```
deb http://mirror.hetzner.de/debian/packages bullseye main
deb http://mirror.hetzner.de/debian/packages bullseye-updates main
deb http://mirror.hetzner.de/debian/packages bullseye-backports main
deb http://mirror.hetzner.de/debian/security bullseye-security main

deb http://security.debian.org bullseye-security main
```

#### `/etc/resolv.conf`
```
nameserver 213.133.100.100
nameserver 213.133.98.98
nameserver 213.133.99.99
nameserver 2a01:4f8:0:1::add:1010
nameserver 2a01:4f8:0:1::add:9999
nameserver 2a01:4f8:0:1::add:9898
```


