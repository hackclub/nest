#!/bin/bash

# Strip the subdomain of whitespace
SUBDOMAIN=$(echo "$1" | xargs)

# Validate the subdomain
if ! grep -P '^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$' <<< $SUBDOMAIN &> /dev/null; then
    echo "Invalid subdomain!"
    exit 1
fi

# "who am i" responds correctly even with sudo
NEST_USER=$(who am i | awk '{print $1}')

if [ "$NEST_USER" = "root" ]; then
	echo "Command cannot be run as root!"
	exit 1
fi

FULL_SUBDOMAIN="$SUBDOMAIN.$NEST_USER.hackclub.dn42"

# Check for existance of subdomain
if grep $FULL_SUBDOMAIN /etc/caddy/Caddyfile &> /dev/null; then
	echo "You already have this subdomain ($FULL_SUBDOMAIN)!"
	exit 1
fi

# Set temp Caddyfiles
cat /etc/caddy/Caddyfile > /var/nest-cli/root_caddyfile
cat /home/$NEST_USER/Caddyfile > /var/nest-cli/user_caddyfile

# Append configurations
NEW_ROOT_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest/cli/root42_subdomain_template.txt | sed "s/<subdomain>/$SUBDOMAIN/g")"
echo "$NEW_ROOT_BLOCK" >> /var/nest-cli/root_caddyfile

NEW_USER_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest/cli/user42_subdomain_template.txt | sed "s/<subdomain>/$SUBDOMAIN/g")"
echo "$NEW_USER_BLOCK" >> /var/nest-cli/user_caddyfile

# Validate Caddyfiles
if ! caddy validate --config /var/nest-cli/root_caddyfile --adapter caddyfile &> /dev/null; then
	echo "Error in root Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

if [ "$2" != "no_validate" ]; then
	if ! caddy validate --config /var/nest-cli/user_caddyfile --adapter caddyfile &> /dev/null; then
		echo "Error in user Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
		exit 1
	fi
fi

# Save Caddyfiles
cat /var/nest-cli/root_caddyfile > /etc/caddy/Caddyfile
cat /var/nest-cli/user_caddyfile > /home/$NEST_USER/Caddyfile
rm /var/nest-cli/root_caddyfile /var/nest-cli/user_caddyfile

# Format Caddyfiles
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy fmt --overwrite /home/$NEST_USER/Caddyfile

# Reload Caddy instances
systemctl reload caddy
systemctl --user -M $NEST_USER@ reload caddy

echo "Added $FULL_SUBDOMAIN! A new block has been added to your Caddy configuration at ~/Caddyfile"