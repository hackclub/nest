#!/bin/bash

# Strip the subdomain of whitespace
SUBDOMAIN=$(echo "$1" | xargs)

# "who am i" responds correctly even with sudo
NEST_USER=$(who am i | awk '{print $1}')

if [ "$NEST_USER" = "root" ]; then
	echo "Command cannot be run as root!"
	exit 1
fi

FULL_SUBDOMAIN="$SUBDOMAIN.$NEST_USER.hackclub.app"

# Check for existance of subdomain
if ! grep $FULL_SUBDOMAIN /etc/caddy/Caddyfile &> /dev/null; then
	echo "You don't have this subdomain ($FULL_SUBDOMAIN)!"
	exit 1
fi

# Remove configuration
sed -i "/^$FULL_SUBDOMAIN {/,/^    }/d" /etc/caddy/Caddyfile

# Reload Caddy instance
systemctl reload caddy

echo "Removed $FULL_SUBDOMAIN! You may still need to remove it from your Caddy configuration at ~/Caddyfile"