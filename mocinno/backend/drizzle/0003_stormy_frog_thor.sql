ALTER TABLE "users" ADD COLUMN "node" text DEFAULT 'nest-prox-2';
ALTER TABLE "applications" ADD COLUMN "template" text NOT NULL DEFAULT 'Debian 13';