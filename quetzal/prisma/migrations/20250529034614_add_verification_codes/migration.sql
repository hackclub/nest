-- CreateTable
CREATE TABLE "codes" (
    "id" SERIAL NOT NULL,
    "generated_by_id" INTEGER NOT NULL,
    "generated_on" TIMESTAMPTZ(6) NOT NULL DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "expiry" TIMESTAMP(3),
    "one_time" BOOLEAN NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "codes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
