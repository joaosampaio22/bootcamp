-- CreateEnum
CREATE TYPE "ReviewRating" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateTable
CREATE TABLE "ReviewAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "scheduleVersionBefore" INTEGER NOT NULL,
    "rating" "ReviewRating" NOT NULL,
    "oldStepIndex" INTEGER NOT NULL,
    "newStepIndex" INTEGER NOT NULL,
    "oldDueDate" DATE NOT NULL,
    "newDueDate" DATE NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "fingerprint" VARCHAR(64) NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewAttempt_userId_scheduleId_createdAt_idx" ON "ReviewAttempt"("userId", "scheduleId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAttempt_scheduleId_scheduleVersionBefore_key" ON "ReviewAttempt"("scheduleId", "scheduleVersionBefore");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAttempt_userId_idempotencyKey_key" ON "ReviewAttempt"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_id_contentId_userId_key" ON "ReviewSchedule"("id", "contentId", "userId");

-- AddForeignKey
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_contentId_userId_fkey" FOREIGN KEY ("contentId", "userId") REFERENCES "StudyContent"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_scheduleId_contentId_userId_fkey" FOREIGN KEY ("scheduleId", "contentId", "userId") REFERENCES "ReviewSchedule"("id", "contentId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_steps_check"
CHECK ("scheduleVersionBefore" >= 1 AND "oldStepIndex" BETWEEN 0 AND 5 AND "newStepIndex" BETWEEN 0 AND 5);
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_review_xp_check"
CHECK ("sourceType" <> 'REVIEW_ATTEMPT' OR "xp" <= 5);

