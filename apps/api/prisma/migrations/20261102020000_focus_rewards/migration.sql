-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('RUNNING', 'PAUSED', 'NEEDS_RECONCILIATION', 'COMPLETED', 'INTERRUPTED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "RewardSource" AS ENUM ('FOCUS_SESSION', 'REVIEW_ATTEMPT');

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID,
    "contentId" UUID,
    "plannedSeconds" INTEGER NOT NULL,
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    "elapsedActiveSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" "FocusStatus" NOT NULL DEFAULT 'RUNNING',
    "activeStartedAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusTransition" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "fromStatus" "FocusStatus",
    "toStatus" "FocusStatus" NOT NULL,
    "activeSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "FocusTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusAction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "key" UUID NOT NULL,
    "fingerprint" VARCHAR(64) NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sourceType" "RewardSource" NOT NULL,
    "sourceId" UUID NOT NULL,
    "xp" INTEGER NOT NULL,
    "localDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FocusSession_userId_startedAt_idx" ON "FocusSession"("userId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "FocusSession_userId_status_idx" ON "FocusSession"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FocusSession_id_userId_key" ON "FocusSession"("id", "userId");

-- CreateIndex
CREATE INDEX "FocusTransition_userId_sessionId_createdAt_idx" ON "FocusTransition"("userId", "sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FocusAction_userId_key_key" ON "FocusAction"("userId", "key");

-- CreateIndex
CREATE INDEX "RewardEvent_userId_localDate_sourceType_idx" ON "RewardEvent"("userId", "localDate", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "RewardEvent_sourceType_sourceId_key" ON "RewardEvent"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusTransition" ADD CONSTRAINT "FocusTransition_sessionId_userId_fkey" FOREIGN KEY ("sessionId", "userId") REFERENCES "FocusSession"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusAction" ADD CONSTRAINT "FocusAction_sessionId_userId_fkey" FOREIGN KEY ("sessionId", "userId") REFERENCES "FocusSession"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invariantes adicionais de domínio não expressáveis no schema Prisma.
CREATE UNIQUE INDEX "FocusSession_one_open_key" ON "FocusSession"("userId")
WHERE "status" IN ('RUNNING', 'PAUSED', 'NEEDS_RECONCILIATION');
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_duration_check"
CHECK ("plannedSeconds" BETWEEN 300 AND 7200 AND "plannedSeconds" % 60 = 0
  AND "activeSeconds" BETWEEN 0 AND "plannedSeconds"
  AND "elapsedActiveSeconds" BETWEEN "activeSeconds" AND "plannedSeconds" + 901 AND "version" >= 1);
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_state_check"
CHECK (("status" = 'RUNNING') = ("activeStartedAt" IS NOT NULL)
  AND ("status" IN ('COMPLETED','INTERRUPTED','DISCARDED')) = ("finishedAt" IS NOT NULL));
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_xp_check"
CHECK ("xp" >= 0 AND ("sourceType" <> 'FOCUS_SESSION' OR "xp" <= 60));
