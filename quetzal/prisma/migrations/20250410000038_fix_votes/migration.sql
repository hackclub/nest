/*
  Warnings:

  - You are about to drop the `_ballotsTonominees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ballotsTonominees" DROP CONSTRAINT "_ballotsTonominees_A_fkey";

-- DropForeignKey
ALTER TABLE "_ballotsTonominees" DROP CONSTRAINT "_ballotsTonominees_B_fkey";

-- AlterTable
ALTER TABLE "ballots" ADD COLUMN     "nomineesId" INTEGER;

-- DropTable
DROP TABLE "_ballotsTonominees";

-- CreateTable
CREATE TABLE "votes" (
    "id" SERIAL NOT NULL,
    "ballotId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "ballotsId" INTEGER NOT NULL,
    "nomineesId" INTEGER NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_nomineesId_fkey" FOREIGN KEY ("nomineesId") REFERENCES "nominees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_ballotsId_fkey" FOREIGN KEY ("ballotsId") REFERENCES "ballots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_nomineesId_fkey" FOREIGN KEY ("nomineesId") REFERENCES "nominees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
