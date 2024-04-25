#!/bin/bash

# Strip the subdomain of whitespace
DOMAIN=$(echo "$1" | xargs)

# Validate the domain
if ! grep -P '^((?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}\.?)+$' <<<$DOMAIN &>/dev/null; then
	echo "Invalid domain!"
	exit 1
fi

# "who am i" responds correctly even with sudo
NEST_USER=$(who am i | awk '{print $1}')

# We should validate the domain.
FQDN_REGEX='^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$'

if [[ ! $DOMAIN =~ $FQDN_REGEX ]]; then
	echo "Invalid FQDN"
	exit 1
fi

if [ "$NEST_USER" = "root" ]; then
	echo "Command cannot be run as root!"
	exit 1
fi

NEEDED_CNAME="$NEST_USER.hackclub.app."
REAL_CNAME=$(dig +short -t CNAME "$DOMAIN")

REAL_CNAME=${REAL_CNAME:-"None"} # Weird hack to get "None" printed instead of a blank line

if [ "$NEEDED_CNAME" != "$REAL_CNAME" ]; then
	echo "The domain $DOMAIN does not have the correct CNAME. Expected: $NEEDED_CNAME, Actual: $REAL_CNAME"
	echo "Falling back to TXT record checking..."
	NEST_DOMAIN_VERIFICATION=$(dig +short -t TXT _nest_domain_verification.$DOMAIN | tr -d '"')
	NEST_DOMAIN_VERIFICATION=${NEST_DOMAIN_VERIFICATION:-"None"}
	if [ "$NEST_DOMAIN_VERIFICATION" != "$NEST_USER" ]; then
		echo "The domain $DOMAIN does not have the correct TXT record. Expected: $NEST_USER, Actual: $NEST_DOMAIN_VERIFICATION"
		exit 1
	else
		echo "TXT record verification succeeded."
	fi
else
	echo "CNAME record verification succeeded."
fi

# Check for existance of domain
if grep "^$DOMAIN {$" /etc/caddy/Caddyfile &>/dev/null; then
	echo "You already have this custom domain ($DOMAIN)!"
	exit 1
fi

# Check for Caddyfile symlink
if readlink /home/$NEST_USER/Caddyfile &> /dev/null; then
	echo "Symlinked Caddyfiles are not supported."
	exit 1
fi

# Set temp Caddyfiles
cat /etc/caddy/Caddyfile >/tmp/root_caddyfile
cat /home/$NEST_USER/Caddyfile >/tmp/user_caddyfile

# Append configurations
NEW_ROOT_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest/cli/root_domain_template.txt | sed "s/<domain>/$DOMAIN/g")"
echo "$NEW_ROOT_BLOCK" >>/tmp/root_caddyfile

NEW_USER_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest/cli/user_domain_template.txt | sed "s/<domain>/$DOMAIN/g")"
echo "$NEW_USER_BLOCK" >>/tmp/user_caddyfile

# Validate Caddyfiles
if ! caddy validate --config /tmp/root_caddyfile --adapter caddyfile &>/dev/null; then
	echo "Error in root Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

if ! caddy validate --config /tmp/user_caddyfile --adapter caddyfile &>/dev/null; then
	echo "Error in user Caddyfile! Please contact the Nest admins (@nestadmins) in #nest"
	exit 1
fi

# Save Caddyfiles
cat /tmp/root_caddyfile >/etc/caddy/Caddyfile
cat /tmp/user_caddyfile >/home/$NEST_USER/Caddyfile
rm /tmp/root_caddyfile /tmp/user_caddyfile

# Format Caddyfiles
caddy fmt --overwrite /etc/caddy/Caddyfile
caddy fmt --overwrite /home/$NEST_USER/Caddyfile

# Reload Caddy instances
systemctl reload caddy
systemctl --user -M $NEST_USER@ reload caddy

echo "Added $DOMAIN! A new block has been added to your Caddy configuration at ~/Caddyfile"
