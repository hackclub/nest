#!/bin/bash

# Strip the subdomain of whitespace
SUBDOMAIN=$(echo "$1" | xargs)

# "who am i" responds correctly even with sudo
NEST_USER=$(who am i | awk '{print $1}')

if [ "$NEST_USER" = "root" ]; then
	echo "Command cannot be run as root!"
	exit 1
fi

FULL_SUBDOMAIN="$SUBDOMAIN.$NEST_USER.hackclub.dn42"

# Check for existance of subdomain
if ! grep $FULL_SUBDOMAIN /etc/caddy/Caddyfile &> /dev/null; then
	echo "You don't have this subdomain ($FULL_SUBDOMAIN)!"
	exit 1
fi

# Set temp Caddyfile
cat /etc/caddy/Caddyfile > /tmp/root_caddyfile

# Remove configuration
sed -i "/^$FULL_SUBDOMAIN {/,/^    }/d" /tmp/root_caddyfile

# Validate Caddyfile
if ! caddy validate --config /tmp/root_caddyfile --adapter caddyfile &> /dev/null; then
	echo "Error in root Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

# Save Caddyfile
cat /tmp/root_caddyfile > /etc/caddy/Caddyfile
rm /tmp/root_caddyfile

# Format Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile

# Reload Caddy instance
systemctl reload caddy

echo "Removed $FULL_SUBDOMAIN! You may still need to remove it from your Caddy configuration at ~/Caddyfile"