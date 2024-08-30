/*
  Warnings:

  - You are about to drop the column `ssh_public_key` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "ssh_public_key";
