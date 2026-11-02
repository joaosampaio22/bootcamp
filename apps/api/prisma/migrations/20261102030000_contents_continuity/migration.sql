-- CreateEnum
CREATE TYPE "ReviewScheduleStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ReturnPointStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "StudyContent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "materialUrl" TEXT,
    "studiedOn" DATE NOT NULL,
    "reviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StudyContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "nextDueDate" DATE NOT NULL,
    "status" "ReviewScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnPoint" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subjectId" UUID,
    "contentId" UUID,
    "context" TEXT NOT NULL DEFAULT '',
    "nextAction" VARCHAR(500) NOT NULL,
    "materialUrl" TEXT,
    "status" "ReturnPointStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReturnPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyContent_userId_subjectId_archivedAt_idx" ON "StudyContent"("userId", "subjectId", "archivedAt");

-- CreateIndex
CREATE INDEX "StudyContent_userId_studiedOn_idx" ON "StudyContent"("userId", "studiedOn");

-- CreateIndex
CREATE UNIQUE INDEX "StudyContent_id_userId_key" ON "StudyContent"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_contentId_key" ON "ReviewSchedule"("contentId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_status_nextDueDate_idx" ON "ReviewSchedule"("userId", "status", "nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_contentId_userId_key" ON "ReviewSchedule"("contentId", "userId");

-- CreateIndex
CREATE INDEX "ReturnPoint_userId_status_updatedAt_idx" ON "ReturnPoint"("userId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_id_userId_key" ON "Subject"("id", "userId");

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_contentId_userId_fkey" FOREIGN KEY ("contentId", "userId") REFERENCES "StudyContent"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyContent" ADD CONSTRAINT "StudyContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyContent" ADD CONSTRAINT "StudyContent_subjectId_userId_fkey" FOREIGN KEY ("subjectId", "userId") REFERENCES "Subject"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_contentId_userId_fkey" FOREIGN KEY ("contentId", "userId") REFERENCES "StudyContent"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnPoint" ADD CONSTRAINT "ReturnPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnPoint" ADD CONSTRAINT "ReturnPoint_subjectId_userId_fkey" FOREIGN KEY ("subjectId", "userId") REFERENCES "Subject"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnPoint" ADD CONSTRAINT "ReturnPoint_contentId_userId_fkey" FOREIGN KEY ("contentId", "userId") REFERENCES "StudyContent"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudyContent" ADD CONSTRAINT "StudyContent_text_check"
CHECK (char_length(btrim("title")) BETWEEN 1 AND 160 AND char_length("notes") <= 10000
 AND ("materialUrl" IS NULL OR "materialUrl" ~* '^https?://'));
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_step_check"
CHECK ("stepIndex" BETWEEN 0 AND 5 AND "version" >= 1);
ALTER TABLE "ReturnPoint" ADD CONSTRAINT "ReturnPoint_text_check"
CHECK (char_length(btrim("nextAction")) BETWEEN 1 AND 500 AND char_length("context") <= 2000
 AND ("materialUrl" IS NULL OR "materialUrl" ~* '^https?://'));
