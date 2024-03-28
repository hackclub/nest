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
if grep $FULL_SUBDOMAIN /etc/caddy/Caddyfile &> /dev/null; then
	echo "You already have this subdomain ($FULL_SUBDOMAIN)!"
	exit 1
fi

# Set temp Caddyfiles
cat /etc/caddy/Caddyfile > /tmp/root_caddyfile
cat /home/$NEST_USER/Caddyfile > /tmp/user_caddyfile

# Append configurations
NEW_ROOT_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest-cli/root_subdomain_template.txt | sed "s/<subdomain>/$SUBDOMAIN/g")"
echo "$NEW_ROOT_BLOCK" >> /tmp/root_caddyfile

NEW_USER_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest-cli/user_subdomain_template.txt | sed "s/<subdomain>/$SUBDOMAIN/g")"
echo "$NEW_USER_BLOCK" >> /tmp/user_caddyfile

# Validate Caddyfiles
if ! caddy validate --config /tmp/root_caddyfile &> /dev/null; then
	echo "Error in root Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

if ! caddy validate --config /tmp/user_caddyfile &> /dev/null; then
	echo "Error in user Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

# Save Caddyfiles
cat /tmp/root_caddyfile > /etc/caddy/Caddyfile
cat /tmp/user_caddyfile > /home/$NEST_USER/Caddyfile
rm /tmp/root_caddyfile /tmp/user_caddyfile

# Reload Caddy instances
systemctl reload caddy
systemctl --user -M $NEST_USER@ reload caddy

echo "Added $FULL_SUBDOMAIN! A new block has been added to your Caddy configuration at ~/Caddyfile"