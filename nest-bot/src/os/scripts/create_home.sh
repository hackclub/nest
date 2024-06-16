#!/bin/bash

# Init home directory
shopt -s dotglob
cp -r /etc/skel/* /home/$1

# Generate Caddy config
sed "s/<username>/$1/" /home/nest-internal/nest/nest-bot/src/os/templates/user_caddyfile_config.txt > /home/$1/Caddyfile

# Set permissions (711 = rwx--x--x, x needed for caddy socket)
chown -R $1:$(id -u $1) /home/$1
chmod 711 /home/$1

# Start Caddy
systemctl --user -M $1@ daemon-reload
systemctl --user -M $1@ start caddy