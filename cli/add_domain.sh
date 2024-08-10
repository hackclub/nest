#!/bin/bash

# Strip the subdomain of whitespace
DOMAIN=$(echo "$1" | xargs)

# Validate the domain
if ! grep -P '^((?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}\.?)+$' <<< $DOMAIN &> /dev/null; then
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
	NEEDED_A="37.27.51.34"
	NEEDED_AAAA="2a01:4f9:3081:399c::4"

	REAL_A=$(dig +short -t A "$DOMAIN")
	REAL_AAAA=$(dig +short -t AAAA "$DOMAIN")

	if [ "$REAL_A" != "$NEEDED_A" ] || [ "$REAL_AAAA" != "$NEEDED_AAAA" ]; then
		echo "The domain $DOMAIN does not have the correct CNAME or A/AAAA. Check valid records at https://guides.hackclub.app/index.php/Subdomains_and_Custom_Domains."
		exit 1
	fi

	HASH=$(echo "$DOMAIN;$NEST_USER" | md5sum | awk '{print $1}')

	NEEDED_TXT="nest-verification=$HASH"
	REAL_TXT=$(dig +short -t TXT "$DOMAIN")

	if !(echo "$REAL_TXT" | grep -q "$NEEDED_TXT"); then
		echo "Add the following TXT record to $DOMAIN and then retry. (You might have to wait a bit for the record to propagate!)"
		echo "nest-verification=$HASH"
		exit 1
	fi
fi

# Check for existance of domain
if grep "^$DOMAIN {$" /etc/caddy/Caddyfile &> /dev/null; then
	echo "You already have this custom domain ($DOMAIN)!"
	exit 1
fi

# Check for Caddyfile symlink
if readlink /home/$NEST_USER/Caddyfile &> /dev/null; then
	echo "Symlinked Caddyfiles are not supported."
	exit 1
fi

# Set temp Caddyfiles
cat /etc/caddy/Caddyfile > /var/nest-cli/root_caddyfile
cat /home/$NEST_USER/Caddyfile > /var/nest-cli/user_caddyfile

# Append configurations
NEW_ROOT_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest/cli/root_domain_template.txt | sed "s/<domain>/$DOMAIN/g")"
echo "$NEW_ROOT_BLOCK" >> /var/nest-cli/root_caddyfile

NEW_USER_BLOCK="$(sed "s/<nest_user>/$NEST_USER/g" /usr/local/nest/cli/user_domain_template.txt | sed "s/<domain>/$DOMAIN/g")"
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

echo "Added $DOMAIN! A new block has been added to your Caddy configuration at ~/Caddyfile"
