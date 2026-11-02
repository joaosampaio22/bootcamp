import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserTransactionService } from '../prisma/user-transaction.service.js';
import { ClockService } from '../common/clock.service.js';
import { RewardsService } from '../rewards/rewards.service.js';
import { localDate } from '../focus/focus.rules.js';
import { nextStep, reviewDueDate } from './review.rules.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { AttemptDto, ReviewPageQuery, ReviewQueueQuery } from './review.dto.js';

const summary = { content: { select: { id: true, title: true, materialUrl: true, reviewEnabled: true, archivedAt: true, subject: { select: { id: true, name: true, archivedAt: true } } } } } as const;
const detail = { content: { select: { ...summary.content.select, notes: true } } } as const;
type Schedule = Prisma.ReviewScheduleGetPayload<{ include: typeof summary }>;

function eligible(schedule: Schedule): boolean {
  return schedule.status === 'ACTIVE' && schedule.content.reviewEnabled && !schedule.content.archivedAt && !schedule.content.subject.archivedAt;
}
function state<T extends Schedule>(schedule: T, today: Date) {
  return { ...schedule, today: today.toISOString().slice(0,10), canAttempt: eligible(schedule) && schedule.nextDueDate <= today, overdueDays: Math.max(0, Math.round((today.getTime() - schedule.nextDueDate.getTime()) / 86400000)) };
}

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(UserTransactionService) private readonly transactions: UserTransactionService,
    @Inject(ClockService) private readonly clock: ClockService,
    @Inject(RewardsService) private readonly rewards: RewardsService
  ) {}

  private activeWhere(userId: string): Prisma.ReviewScheduleWhereInput {
    return { userId, status: 'ACTIVE', content: { reviewEnabled: true, archivedAt: null, subject: { archivedAt: null } } };
  }
  private async today(tx: Prisma.TransactionClient, userId: string) {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
    return localDate(this.clock.now(), user.timeZone);
  }
  queue(userId: string, upcoming: boolean, query: ReviewQueueQuery) {
    return this.prisma.$transaction(async (tx) => {
      const today = await this.today(tx, userId);
      const where: Prisma.ReviewScheduleWhereInput = { ...this.activeWhere(userId), nextDueDate: upcoming ? { gt: today } : { lte: today }, ...(query.subjectId ? { content: { reviewEnabled: true, archivedAt: null, subject: { id: query.subjectId, archivedAt: null } } } : {}) };
      const rows = await tx.reviewSchedule.findMany({ where, include: summary, orderBy: [{ nextDueDate: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
      return { items: rows.map((row) => state(row, today)), total: await tx.reviewSchedule.count({ where }), page: query.page, pageSize: query.pageSize, today: today.toISOString().slice(0,10) };
    });
  }
  dueCount(userId: string) {
    return this.prisma.$transaction(async (tx) => tx.reviewSchedule.count({ where: { ...this.activeWhere(userId), nextDueDate: { lte: await this.today(tx, userId) } } }));
  }
  get(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.reviewSchedule.findFirst({ where: { id, userId }, include: detail });
      if (!schedule) throw new NotFoundException();
      return state(schedule, await this.today(tx, userId));
    });
  }
  history(userId: string, id: string, query: ReviewPageQuery) {
    return this.prisma.$transaction(async (tx) => {
      if (!await tx.reviewSchedule.findFirst({ where: { id, userId }, select: { id: true } })) throw new NotFoundException();
      const where = { userId, scheduleId: id };
      const rows = await tx.reviewAttempt.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize, select: { id: true, contentId: true, scheduleId: true, scheduleVersionBefore: true, rating: true, oldStepIndex: true, newStepIndex: true, oldDueDate: true, newDueDate: true, createdAt: true } });
      const rewards = await tx.rewardEvent.findMany({ where: { userId, sourceType: 'REVIEW_ATTEMPT', sourceId: { in: rows.map((row) => row.id) } }, select: { id: true, sourceId: true, sourceType: true, xp: true, localDate: true } });
      return { items: rows.map((row) => ({ ...row, reward: rewards.find((r) => r.sourceId === row.id) ?? null })), total: await tx.reviewAttempt.count({ where }), page: query.page, pageSize: query.pageSize };
    });
  }
  attempt(userId: string, id: string, dto: AttemptDto, key: string | undefined) {
    if (!key || !isUUID(key, '4')) throw new BadRequestException('Envie Idempotency-Key como UUID válido.');
    const scheduleId = id.toLowerCase(); const idempotencyKey = key.toLowerCase();
    const fingerprint = createHash('sha256').update(JSON.stringify({ scheduleId, rating: dto.rating, expectedVersion: dto.expectedVersion })).digest('hex');
    return this.transactions.run(userId, async (tx) => {
      const previous = await tx.reviewAttempt.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } });
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new ConflictException('Esta chave de idempotência já foi usada para outra operação.');
        return previous.response;
      }
      const schedule = await tx.reviewSchedule.findFirst({ where: { id: scheduleId, userId }, include: summary });
      if (!schedule) throw new NotFoundException();
      const now = this.clock.now();
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
      const today = localDate(now, user.timeZone);
      const current = state(schedule, today);
      if (schedule.version !== dto.expectedVersion || !current.canAttempt) throw new ConflictException({ code: 'REVIEW_UNAVAILABLE', message: 'Esta revisão mudou ou ainda não está disponível. Atualize antes de continuar.', details: { schedule: current } });
      const newStepIndex = nextStep(schedule.stepIndex, dto.rating);
      const newDueDate = reviewDueDate(now, user.timeZone, newStepIndex);
      await tx.reviewSchedule.update({ where: { id: scheduleId }, data: { stepIndex: newStepIndex, nextDueDate: newDueDate, version: { increment: 1 }, updatedAt: now } });
      const attemptId = randomUUID();
      const reward = await this.rewards.grantReview(tx, userId, attemptId, now, user.timeZone);
      const response = { attemptId, scheduleId, contentId: schedule.contentId, rating: dto.rating, oldStepIndex: schedule.stepIndex, newStepIndex, oldDueDate: schedule.nextDueDate.toISOString(), nextDueDate: newDueDate.toISOString(), version: schedule.version + 1, xpGranted: reward.xp, totalXp: await this.rewards.total(tx, userId), createdAt: now.toISOString() };
      await tx.reviewAttempt.create({ data: { id: attemptId, userId, contentId: schedule.contentId, scheduleId, scheduleVersionBefore: schedule.version, rating: dto.rating, oldStepIndex: schedule.stepIndex, newStepIndex, oldDueDate: schedule.nextDueDate, newDueDate, idempotencyKey, fingerprint, response, createdAt: now } });
      return response;
    });
  }
}
