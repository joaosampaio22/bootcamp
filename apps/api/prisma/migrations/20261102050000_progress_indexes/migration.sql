CREATE INDEX "FocusSession_userId_finishedAt_idx" ON "FocusSession"("userId", "finishedAt" DESC);
CREATE INDEX "ReviewAttempt_userId_createdAt_idx" ON "ReviewAttempt"("userId", "createdAt" DESC);
CREATE INDEX "RewardEvent_userId_createdAt_idx" ON "RewardEvent"("userId", "createdAt" DESC);
