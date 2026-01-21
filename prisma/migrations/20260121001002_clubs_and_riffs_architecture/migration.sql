/*
  Warnings:

  - You are about to drop the `circle_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `circles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `piece_shares` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "RiffStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('CLUB', 'RIFF', 'INDIVIDUAL', 'PUBLIC');

-- AlterEnum
ALTER TYPE "CollectionType" ADD VALUE 'CLUB';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CLUB_INVITATION';
ALTER TYPE "NotificationType" ADD VALUE 'RIFF_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'RIFF_INVITATION';
ALTER TYPE "NotificationType" ADD VALUE 'RIFF_STARTED';
ALTER TYPE "NotificationType" ADD VALUE 'RIFF_DEADLINE_APPROACHING';
ALTER TYPE "NotificationType" ADD VALUE 'RIFF_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'PIECE_SUBMITTED_TO_RIFF';

-- DropForeignKey
ALTER TABLE "circle_members" DROP CONSTRAINT "circle_members_circleId_fkey";

-- DropForeignKey
ALTER TABLE "circle_members" DROP CONSTRAINT "circle_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "circle_prompts" DROP CONSTRAINT "circle_prompts_circleId_fkey";

-- DropForeignKey
ALTER TABLE "circles" DROP CONSTRAINT "circles_createdById_fkey";

-- DropForeignKey
ALTER TABLE "collections" DROP CONSTRAINT "collections_circleId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_circleId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_circleId_fkey";

-- DropForeignKey
ALTER TABLE "piece_shares" DROP CONSTRAINT "piece_shares_circleId_fkey";

-- DropForeignKey
ALTER TABLE "piece_shares" DROP CONSTRAINT "piece_shares_pieceId_fkey";

-- DropForeignKey
ALTER TABLE "piece_shares" DROP CONSTRAINT "piece_shares_promptId_fkey";

-- DropForeignKey
ALTER TABLE "piece_shares" DROP CONSTRAINT "piece_shares_versionId_fkey";

-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "clubId" TEXT;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "clubId" TEXT,
ADD COLUMN     "riffId" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "clubId" TEXT,
ADD COLUMN     "riffId" TEXT;

-- DropTable
DROP TABLE "circle_members";

-- DropTable
DROP TABLE "circles";

-- DropTable
DROP TABLE "piece_shares";

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT NOT NULL,
    "moderatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles_deprecated" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circles_deprecated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_members" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riffs" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "RiffStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riff_participants" (
    "id" TEXT NOT NULL,
    "riffId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "riff_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_members_deprecated" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CircleMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_members_deprecated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piece_riffs" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "riffId" TEXT NOT NULL,
    "versionId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piece_riffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "shareType" "ShareType" NOT NULL,
    "clubId" TEXT,
    "riffId" TEXT,
    "sharedWithId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piece_shares_deprecated" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "promptId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "piece_shares_deprecated_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_members_clubId_userId_key" ON "club_members"("clubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "riff_participants_riffId_userId_key" ON "riff_participants"("riffId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "circle_members_deprecated_circleId_userId_key" ON "circle_members_deprecated"("circleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "piece_riffs_pieceId_riffId_key" ON "piece_riffs"("pieceId", "riffId");

-- CreateIndex
CREATE UNIQUE INDEX "piece_shares_deprecated_pieceId_circleId_key" ON "piece_shares_deprecated"("pieceId", "circleId");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circles_deprecated" ADD CONSTRAINT "circles_deprecated_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riffs" ADD CONSTRAINT "riffs_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riffs" ADD CONSTRAINT "riffs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riff_participants" ADD CONSTRAINT "riff_participants_riffId_fkey" FOREIGN KEY ("riffId") REFERENCES "riffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riff_participants" ADD CONSTRAINT "riff_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members_deprecated" ADD CONSTRAINT "circle_members_deprecated_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles_deprecated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members_deprecated" ADD CONSTRAINT "circle_members_deprecated_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_prompts" ADD CONSTRAINT "circle_prompts_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles_deprecated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_riffs" ADD CONSTRAINT "piece_riffs_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_riffs" ADD CONSTRAINT "piece_riffs_riffId_fkey" FOREIGN KEY ("riffId") REFERENCES "riffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_riffs" ADD CONSTRAINT "piece_riffs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "piece_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "piece_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_riffId_fkey" FOREIGN KEY ("riffId") REFERENCES "riffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_shares_deprecated" ADD CONSTRAINT "piece_shares_deprecated_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_shares_deprecated" ADD CONSTRAINT "piece_shares_deprecated_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles_deprecated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_shares_deprecated" ADD CONSTRAINT "piece_shares_deprecated_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "piece_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_shares_deprecated" ADD CONSTRAINT "piece_shares_deprecated_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "circle_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_riffId_fkey" FOREIGN KEY ("riffId") REFERENCES "riffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles_deprecated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles_deprecated"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_riffId_fkey" FOREIGN KEY ("riffId") REFERENCES "riffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles_deprecated"("id") ON DELETE CASCADE ON UPDATE CASCADE;
