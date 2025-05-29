/*
  Warnings:

  - You are about to drop the `ballots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `elections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nominees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `votes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ballots" DROP CONSTRAINT "ballots_electionsId_fkey";

-- DropForeignKey
ALTER TABLE "ballots" DROP CONSTRAINT "ballots_usersId_fkey";

-- DropForeignKey
ALTER TABLE "nominees" DROP CONSTRAINT "nominees_electionsId_fkey";

-- DropForeignKey
ALTER TABLE "nominees" DROP CONSTRAINT "nominees_usersId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_ballotsId_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_nomineesId_fkey";

-- DropTable
DROP TABLE "ballots";

-- DropTable
DROP TABLE "elections";

-- DropTable
DROP TABLE "nominees";

-- DropTable
DROP TABLE "votes";
