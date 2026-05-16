-- AlterEnum
ALTER TYPE "RiffStatus" ADD VALUE 'REVEALED';

-- CreateTable
CREATE TABLE "piece_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "riffId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piece_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "piece_reads_userId_pieceId_riffId_key" ON "piece_reads"("userId", "pieceId", "riffId");

-- AddForeignKey
ALTER TABLE "piece_reads" ADD CONSTRAINT "piece_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_reads" ADD CONSTRAINT "piece_reads_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piece_reads" ADD CONSTRAINT "piece_reads_riffId_fkey" FOREIGN KEY ("riffId") REFERENCES "riffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
