-- AlterTable
ALTER TABLE "reminders" ADD COLUMN "frequency_type" TEXT,
ADD COLUMN "frequency_interval" INTEGER,
ADD COLUMN "frequency_unit" TEXT,
ADD COLUMN "notification_type" TEXT,
ADD COLUMN "notification_value" INTEGER,
ADD COLUMN "notification_unit" TEXT;

