/*
  Warnings:

  - A unique constraint covering the columns `[pk]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pk" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "users_pk_key" ON "users"("pk");
