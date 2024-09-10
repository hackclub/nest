#!/bin/bash

echo "Running setup.sh"

# Refresh LDAP
sss_cache -u $1

# Add process lingering
touch /var/lib/systemd/linger/$1

# Enable caddy
export XDG_RUNTIME_DIR=/run/user/$(id -u $1)
systemctl --user -M $1@ daemon-reload
systemctl --user -M $1@ enable caddy

# Limits
setquota -u $1 15G 15G 0 0 /

# PostgreSQL user & db
sudo -u postgres createuser $1
sudo -u postgres createdb -O $1 $1
