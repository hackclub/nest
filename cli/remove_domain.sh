#!/bin/bash

# Strip the domain of whitespace
FULL_DOMAIN=$(echo "$1" | xargs)

# "who am i" responds correctly even with sudo
NEST_USER=$(who am i | awk '{print $1}')

if [ "$NEST_USER" = "root" ]; then
	echo "Command cannot be run as root!"
	exit 1
fi

# Check for existence of domain
if ! grep $FULL_DOMAIN /etc/caddy/Caddyfile &> /dev/null; then
	echo "This domain ($FULL_DOMAIN) isn't in the Caddyfile!"
	exit 1
fi

# Check for user ownership of domain (JANK ALERT)
DOMAIN_BLOCK="$(grep -Pzo "(?s)$FULL_DOMAIN {.*?}\n" /etc/caddy/Caddyfile)"
if ! grep "/home/$NEST_USER/" <<< $DOMAIN_BLOCK &> /dev/null; then
	echo "You don't own this domain ($FULL_DOMAIN)!"
	exit 1
fi

# Set temp Caddyfile
cat /etc/caddy/Caddyfile > /var/nest-cli/root_caddyfile

# Remove configuration
sed -i "/^$FULL_DOMAIN {/,/^    }/d" /var/nest-cli/root_caddyfile

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

echo "Removed $FULL_DOMAIN! You may still need to remove it from your Caddy configuration at ~/Caddyfile"