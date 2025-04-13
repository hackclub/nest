/*
  Warnings:

  - You are about to drop the column `nomineesId` on the `ballots` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ballots" DROP CONSTRAINT "ballots_nomineesId_fkey";

-- AlterTable
ALTER TABLE "ballots" DROP COLUMN "nomineesId";
