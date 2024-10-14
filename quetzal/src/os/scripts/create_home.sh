#!/bin/bash

echo "Running create_home.sh"

# Init home directory
shopt -s dotglob
mkdir /home/$1
cp -r /etc/skel/* /home/$1

# Generate Caddy config
sed "s/<username>/$1/" /home/nest-internal/nest/quetzal/src/os/templates/user_caddyfile_config.txt > /home/$1/Caddyfile

# Set permissions (711 = rwx--x--x, x needed for caddy socket)
chown -R $1:$(id -u $1) /home/$1
chmod 711 /home/$1

# ssh permissions
chmod -R 700 /home/$1/.ssh

# Start Caddy
systemctl --user -M $1@ daemon-reload
systemctl --user -M $1@ start caddy