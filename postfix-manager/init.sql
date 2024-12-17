-- We intentionally allow duplicate ip:port mappings, because a user could serve multiple domains on a single server.
BEGIN;
CREATE TABLE IF NOT EXISTS relay_domains(
    hostname TEXT NOT NULL CONSTRAINT no_repeat_hostnames UNIQUE PRIMARY KEY,
    username TEXT NOT NULL,
    ip TEXT DEFAULT '127.0.0.1' NOT NULL,
    port INTEGER NOT NULL,
    CONSTRAINT port_is_not_too_small CHECK port > 0,
    CONSTRAINT port_is_not_too_big CHECK port < 65536
  );
COMMIT;
