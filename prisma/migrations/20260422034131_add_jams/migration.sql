-- CreateTable
CREATE TABLE "jams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jam_reads" (
    "id" TEXT NOT NULL,
    "jamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jam_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jams_userId_idx" ON "jams"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "jam_reads_jamId_userId_key" ON "jam_reads"("jamId", "userId");

-- AddForeignKey
ALTER TABLE "jams" ADD CONSTRAINT "jams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jam_reads" ADD CONSTRAINT "jam_reads_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "jams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jam_reads" ADD CONSTRAINT "jam_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
