-- CreateTable
CREATE TABLE "TeamNameMapping" (
    "id" TEXT NOT NULL,
    "externalName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamNameMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamNameMapping_provider_idx" ON "TeamNameMapping"("provider");

-- CreateIndex
CREATE INDEX "TeamNameMapping_teamId_idx" ON "TeamNameMapping"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamNameMapping_externalName_provider_key" ON "TeamNameMapping"("externalName", "provider");

-- AddForeignKey
ALTER TABLE "TeamNameMapping" ADD CONSTRAINT "TeamNameMapping_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
