# mocinno

The new Nest provisioner.

Hiya! Welcome to mocinno.

## Name origins

This may not be important but the name comes from the Resplendent quetzal (Pharomachrus mocinno). Quetzal is a dinosaur? Something like that.

## Contributing without a proxmox install

I came across a [mock api on github](https://github.com/jrjsmrtn/mock-pve-api/) that should help with this

## What changed?

| What changed         | Description                                                                                        | New Nest                               | Old Nest                                 |
| -------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| Reverse Proxy        | This allows \*.username.hackclub.app and other custom domains to reach your services               | Web Dashboard                          | Caddy                                    |
| SSL certificates     | Needed for said reverse proxy                                                                      | ZeroSSL (Bun)                          | ZeroSSL (Caddy)                          |
| ID verification      | Used to prove you are a student at the time of signup (you can still use Nest after you graduate!) | auth.hackclub.com Oauth2 flow          | E-mail check against auth.hackclub.com   |
| Applications         | Last admin approval sanity check                                                                   | Web Dashboard                          | Quetzal (slack bot)                      |
| Underlying Structure | What Nest ran on                                                                                   | Individual LXC containers per user     | Individual accounts on a Debian VM       |
| How you login        | How you logged into Nest                                                                           | You → Nest sshd → root on your account | You → your user account on the shared VM |
| Backups              | How Nest stored your data                                                                          | Rolling backups of each container      | Whole disk backups                       |
