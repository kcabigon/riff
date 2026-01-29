-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('NAME', 'CLUB_CHOICE', 'INVITE', 'COMPLETED');

-- AlterTable
ALTER TABLE "club_members" ADD COLUMN     "lastViewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "bannerImage" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastActiveClubId" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" "OnboardingStep",
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "username" DROP NOT NULL;

-- CreateTable
CREATE TABLE "club_invites" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_invites_token_key" ON "club_invites"("token");

-- CreateIndex
CREATE INDEX "club_invites_token_idx" ON "club_invites"("token");

-- CreateIndex
CREATE INDEX "club_invites_clubId_idx" ON "club_invites"("clubId");

-- CreateIndex
CREATE INDEX "club_members_userId_lastViewedAt_idx" ON "club_members"("userId", "lastViewedAt");

-- AddForeignKey
ALTER TABLE "club_invites" ADD CONSTRAINT "club_invites_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invites" ADD CONSTRAINT "club_invites_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
