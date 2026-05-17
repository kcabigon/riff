-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "emailMarketing" BOOLEAN NOT NULL DEFAULT true;
