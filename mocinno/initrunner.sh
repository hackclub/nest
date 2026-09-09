#!/usr/bin/env bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER root WITH PASSWORD 'heythisisnotmeanttobeusedbyyoupubliclythebackendconnectsbyunixsocketsoapasswordisnotneeded';
	CREATE DATABASE mocinno OWNER=root;
	GRANT ALL PRIVILEGES ON DATABASE mocinno TO root;
EOSQL
