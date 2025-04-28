-- CreateTable
CREATE TABLE "elections" (
    "id" SERIAL NOT NULL,
    "num_elected" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominees" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "usersId" INTEGER NOT NULL,
    "electionsId" INTEGER NOT NULL,

    CONSTRAINT "nominees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballots" (
    "id" SERIAL NOT NULL,
    "usersId" INTEGER NOT NULL,
    "electionsId" INTEGER NOT NULL,

    CONSTRAINT "ballots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ballotsTonominees" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ballotsTonominees_AB_unique" ON "_ballotsTonominees"("A", "B");

-- CreateIndex
CREATE INDEX "_ballotsTonominees_B_index" ON "_ballotsTonominees"("B");

-- AddForeignKey
ALTER TABLE "nominees" ADD CONSTRAINT "nominees_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominees" ADD CONSTRAINT "nominees_electionsId_fkey" FOREIGN KEY ("electionsId") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_electionsId_fkey" FOREIGN KEY ("electionsId") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ballotsTonominees" ADD CONSTRAINT "_ballotsTonominees_A_fkey" FOREIGN KEY ("A") REFERENCES "ballots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ballotsTonominees" ADD CONSTRAINT "_ballotsTonominees_B_fkey" FOREIGN KEY ("B") REFERENCES "nominees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
