-- CreateTable
CREATE TABLE "pet_logs" (
    "id" SERIAL NOT NULL,
    "petid" INTEGER NOT NULL,
    "logdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "size" DOUBLE PRECISION,
    "mood" INTEGER,
    "wellbeing" INTEGER,
    "behavior" TEXT,
    "vet_inspection" BOOLEAN NOT NULL DEFAULT false,
    "parasite_treatment" BOOLEAN NOT NULL DEFAULT false,
    "vitamins_medication" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pet_logs_petid_logdate_key" ON "pet_logs"("petid", "logdate");

-- CreateIndex
CREATE INDEX "pet_logs_petid_logdate_idx" ON "pet_logs"("petid", "logdate");

-- AddForeignKey
ALTER TABLE "pet_logs" ADD CONSTRAINT "pet_logs_petid_fkey" FOREIGN KEY ("petid") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

