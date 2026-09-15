/*
  Warnings:

  - The values [CIRCLE] on the enum `CollectionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CollectionType_new" AS ENUM ('PERSONAL', 'GROUP', 'CLUB');
ALTER TABLE "collections" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "collections" ALTER COLUMN "type" TYPE "CollectionType_new" USING ("type"::text::"CollectionType_new");
ALTER TYPE "CollectionType" RENAME TO "CollectionType_old";
ALTER TYPE "CollectionType_new" RENAME TO "CollectionType";
DROP TYPE "CollectionType_old";
ALTER TABLE "collections" ALTER COLUMN "type" SET DEFAULT 'PERSONAL';
COMMIT;
