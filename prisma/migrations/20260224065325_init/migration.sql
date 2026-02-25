-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'HALFTIME', 'FINAL', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CLOSE_LATE', 'UPSET_BREWING', 'OVERTIME', 'LEAD_CHANGE_BURST');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "BetResult" AS ENUM ('OPEN', 'WIN', 'LOSS', 'PUSH');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" TEXT[],
    "conference" TEXT,
    "espnId" TEXT,
    "bartTorvikId" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "espnId" TEXT,
    "gameDate" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "tvNetwork" TEXT,
    "homeTeamRanking" INTEGER,
    "awayTeamRanking" INTEGER,
    "spread" DOUBLE PRECISION,
    "overUnder" DOUBLE PRECISION,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveGameState" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "period" INTEGER NOT NULL DEFAULT 1,
    "clockDisplay" TEXT,
    "leadChanges" INTEGER NOT NULL DEFAULT 0,
    "winProbHome" DOUBLE PRECISION,
    "possession" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveGameState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchScoreSnapshot" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factorContributions" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'watchscore_v1',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "suppressedReason" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvancedStatsTeam" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvancedStatsTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'RUNNING',
    "logs" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OddsSnapshot" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "book" TEXT,
    "moneylineHome" DOUBLE PRECISION,
    "moneylineAway" DOUBLE PRECISION,
    "spreadHome" DOUBLE PRECISION,
    "spreadAway" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "teamTotalHome" DOUBLE PRECISION,
    "teamTotalAway" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OddsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" TEXT NOT NULL,
    "marketType" TEXT NOT NULL,
    "selection" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "units" DOUBLE PRECISION NOT NULL,
    "result" "BetResult" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_canonicalName_key" ON "Team"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "Team_espnId_key" ON "Team"("espnId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_espnId_key" ON "Game"("espnId");

-- CreateIndex
CREATE INDEX "Game_gameDate_idx" ON "Game"("gameDate");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LiveGameState_gameId_key" ON "LiveGameState"("gameId");

-- CreateIndex
CREATE INDEX "WatchScoreSnapshot_gameId_computedAt_idx" ON "WatchScoreSnapshot"("gameId", "computedAt");

-- CreateIndex
CREATE INDEX "AlertEvent_gameId_type_idx" ON "AlertEvent"("gameId", "type");

-- CreateIndex
CREATE INDEX "AlertEvent_createdAt_idx" ON "AlertEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AdvancedStatsTeam_provider_asOfDate_idx" ON "AdvancedStatsTeam"("provider", "asOfDate");

-- CreateIndex
CREATE UNIQUE INDEX "AdvancedStatsTeam_teamId_provider_asOfDate_key" ON "AdvancedStatsTeam"("teamId", "provider", "asOfDate");

-- CreateIndex
CREATE INDEX "AgentRun_type_startedAt_idx" ON "AgentRun"("type", "startedAt");

-- CreateIndex
CREATE INDEX "OddsSnapshot_gameId_capturedAt_idx" ON "OddsSnapshot"("gameId", "capturedAt");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveGameState" ADD CONSTRAINT "LiveGameState_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchScoreSnapshot" ADD CONSTRAINT "WatchScoreSnapshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvancedStatsTeam" ADD CONSTRAINT "AdvancedStatsTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
