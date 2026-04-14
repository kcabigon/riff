-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'RIFF_DEADLINE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'ALL_PIECES_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_MEMBER_JOINED';
