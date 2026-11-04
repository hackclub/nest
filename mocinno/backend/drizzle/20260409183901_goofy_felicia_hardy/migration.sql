ALTER TABLE "users" ALTER COLUMN "ssh_key" SET DATA TYPE text[] USING ARRAY["ssh_key"];
ALTER TABLE "users" RENAME COLUMN "ssh_key" TO "ssh_keys";