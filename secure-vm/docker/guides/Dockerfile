FROM dunglas/frankenphp

RUN install-php-extensions \
	dom \
	intl \
	mbstring \
	xml \
	xmlreader \
	apcu \
	curl \
	pdo_mysql \
	mysqli

# Be sure to replace "your-domain-name.example.com" by your domain name
ENV SERVER_NAME=localhost
# If you want to disable HTTPS, use this value instead:
#ENV SERVER_NAME=:80

# Enable PHP production settings
#RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Copy the PHP files of your project in the public directory
COPY mediawiki /app/public
# If you use Symfony or Laravel, you need to copy the whole project instead:
#COPY . /app

COPY Caddyfile /etc/caddy/Caddyfile