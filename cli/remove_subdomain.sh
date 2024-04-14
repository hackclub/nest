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

# Check for existence of subdomain
if ! grep $FULL_SUBDOMAIN /etc/caddy/Caddyfile &> /dev/null; then
	echo "You don't have this subdomain ($FULL_SUBDOMAIN)!"
	exit 1
fi

# Set temp Caddyfile
cat /etc/caddy/Caddyfile > /var/nest-cli/root_caddyfile

# Remove configuration
sed -i "/^$FULL_SUBDOMAIN {/,/^    }/d" /var/nest-cli/root_caddyfile

# Validate Caddyfile
if ! caddy validate --config /var/nest-cli/root_caddyfile --adapter caddyfile &> /dev/null; then
	echo "Error in root Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

# Save Caddyfile
cat /var/nest-cli/root_caddyfile > /etc/caddy/Caddyfile
rm /var/nest-cli/root_caddyfile

# Format Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile

# Reload Caddy instance
systemctl reload caddy

echo "Removed $FULL_SUBDOMAIN! You may still need to remove it from your Caddy configuration at ~/Caddyfile"