-- CreateTable
CREATE TABLE "email_queue" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "clubId" TEXT,
    "riffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_queue_processedAt_createdAt_idx" ON "email_queue"("processedAt", "createdAt");

-- CreateIndex
CREATE INDEX "email_queue_recipientId_pieceId_processedAt_idx" ON "email_queue"("recipientId", "pieceId", "processedAt");

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
