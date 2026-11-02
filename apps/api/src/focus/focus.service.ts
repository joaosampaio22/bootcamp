import { BadRequestException, ConflictException, HttpException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClockService } from '../common/clock.service.js';
import { RewardsService } from '../rewards/rewards.service.js';
import type { FocusSession, FocusStatus, Prisma } from '../generated/prisma/client.js';
import type { FinishFocusDto, ReconcileFocusDto, StartFocusDto, TransitionDto } from './focus.dto.js';
import { elapsedSeconds, needsReconciliation, OPEN_STATUSES } from './focus.rules.js';

type Session = FocusSession & { subject?: { name: string } | null };

@Injectable()
export class FocusService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ClockService) private readonly clock: ClockService,
    @Inject(RewardsService) private readonly rewards: RewardsService
  ) {}

  private async locked<T>(userId: string, work: (tx: Prisma.TransactionClient, now: Date) => Promise<T | HttpException>): Promise<T> {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId}::uuid FOR UPDATE`;
      return work(tx, this.clock.now());
    }, { maxWait: 10000, timeout: 10000 });
    // Conflitos depois de detectar abandono devem preservar NEEDS_RECONCILIATION.
    if (result instanceof HttpException) throw result;
    return result;
  }

  private snapshot(session: Session, now: Date) {
    return {
      id: session.id, subjectId: session.subjectId, subjectName: session.subject?.name ?? null, contentId: session.contentId,
      plannedSeconds: session.plannedSeconds, activeSeconds: session.activeSeconds, status: session.status,
      activeStartedAt: session.activeStartedAt?.toISOString() ?? null, startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt?.toISOString() ?? null, version: session.version, serverNow: now.toISOString(),
      maxConfirmableSeconds: session.status === 'NEEDS_RECONCILIATION' ? Math.min(session.plannedSeconds, session.elapsedActiveSeconds) : null
    };
  }

  private conflict(session: Session, now: Date, message = 'A sessão mudou. Atualize para continuar.') {
    return new ConflictException({ code: 'FOCUS_INVALID_TRANSITION', message, details: { session: this.snapshot(session, now) } });
  }

  private async transition(tx: Prisma.TransactionClient, previous: Session, now: Date, status: FocusStatus, data: Prisma.FocusSessionUpdateInput = {}) {
    const session = await tx.focusSession.update({ where: { id: previous.id }, data: { ...data, status, version: { increment: 1 } }, include: { subject: { select: { name: true } } } });
    await tx.focusTransition.create({ data: { userId: session.userId, sessionId: session.id, fromStatus: previous.status, toStatus: status, activeSeconds: session.activeSeconds, createdAt: now } });
    return session;
  }

  private async refresh(tx: Prisma.TransactionClient, session: Session, now: Date) {
    if (!needsReconciliation(session, now)) return session;
    return this.transition(tx, session, now, 'NEEDS_RECONCILIATION', {
      activeSeconds: Math.min(session.plannedSeconds, elapsedSeconds(session, now)),
      elapsedActiveSeconds: elapsedSeconds(session, now), activeStartedAt: null
    });
  }

  private async own(tx: Prisma.TransactionClient, userId: string, id: string, now: Date) {
    const session = await tx.focusSession.findFirst({ where: { id, userId }, include: { subject: { select: { name: true } } } });
    if (!session) throw new NotFoundException();
    return this.refresh(tx, session, now);
  }

  async active(userId: string) {
    return this.locked(userId, async (tx, now) => {
      const session = await tx.focusSession.findFirst({ where: { userId, status: { in: [...OPEN_STATUSES] } }, include: { subject: { select: { name: true } } } });
      return session ? this.snapshot(await this.refresh(tx, session, now), now) : null;
    });
  }

  async start(userId: string, dto: StartFocusDto) {
    return this.locked(userId, async (tx, now) => {
      const existing = await tx.focusSession.findFirst({ where: { userId, status: { in: [...OPEN_STATUSES] } }, include: { subject: { select: { name: true } } } });
      if (existing) return this.conflict(await this.refresh(tx, existing, now), now, 'Você já tem uma sessão aberta. Retome ou resolva essa sessão.');
      if (dto.contentId) throw new UnprocessableEntityException('O vínculo com conteúdos estará disponível na etapa de conteúdos.');
      if (dto.subjectId && !await tx.subject.findFirst({ where: { id: dto.subjectId, userId, archivedAt: null } })) throw new NotFoundException('Disciplina não encontrada.');
      const session = await tx.focusSession.create({ data: { userId, subjectId: dto.subjectId ?? null, plannedSeconds: dto.plannedMinutes * 60, startedAt: now, activeStartedAt: now }, include: { subject: { select: { name: true } } } });
      await tx.focusTransition.create({ data: { userId, sessionId: session.id, fromStatus: null, toStatus: 'RUNNING', activeSeconds: 0, createdAt: now } });
      return this.snapshot(session, now);
    });
  }

  async change(userId: string, id: string, action: 'pause' | 'resume', dto: TransitionDto) {
    return this.locked(userId, async (tx, now) => {
      const session = await this.own(tx, userId, id, now);
      if ((dto.expectedVersion !== undefined && dto.expectedVersion !== session.version) || session.status !== (action === 'pause' ? 'RUNNING' : 'PAUSED')) return this.conflict(session, now);
      const updated = action === 'pause'
        ? await this.transition(tx, session, now, 'PAUSED', { activeSeconds: Math.min(session.plannedSeconds, elapsedSeconds(session, now)), elapsedActiveSeconds: elapsedSeconds(session, now), activeStartedAt: null })
        : await this.transition(tx, session, now, 'RUNNING', { activeStartedAt: now });
      return this.snapshot(updated, now);
    });
  }

  async finish(userId: string, id: string, kind: 'finish' | 'reconcile', dto: FinishFocusDto | ReconcileFocusDto, key: string | undefined) {
    if (!key || !isUUID(key, '4')) throw new BadRequestException('Envie Idempotency-Key como UUID válido.');
    const normalizedId = id.toLowerCase();
    const normalizedKey = key.toLowerCase();
    const seconds = 'confirmedActiveSeconds' in dto ? dto.confirmedActiveSeconds : undefined;
    const fingerprint = createHash('sha256').update(JSON.stringify({ id: normalizedId, kind, outcome: dto.outcome, seconds: seconds ?? null, version: dto.expectedVersion ?? null })).digest('hex');
    return this.locked(userId, async (tx, now) => {
      const cached = await tx.focusAction.findUnique({ where: { userId_key: { userId, key: normalizedKey } } });
      if (cached) {
        if (cached.fingerprint !== fingerprint) return new ConflictException('Esta chave de idempotência já foi usada para outra operação.');
        return cached.response;
      }
      const session = await this.own(tx, userId, normalizedId, now);
      const validStatus = kind === 'finish' ? session.status === 'RUNNING' || session.status === 'PAUSED' : session.status === 'NEEDS_RECONCILIATION';
      if (!validStatus || (dto.expectedVersion !== undefined && dto.expectedVersion !== session.version)) return this.conflict(session, now);
      let activeSeconds = Math.min(session.plannedSeconds, elapsedSeconds(session, now));
      if (kind === 'reconcile') {
        if (dto.outcome === 'DISCARDED') {
          if (seconds !== undefined && seconds !== 0) return new UnprocessableEntityException('Descartar não permite confirmar tempo.');
          activeSeconds = 0;
        } else {
          if (seconds === undefined || seconds > activeSeconds) return new UnprocessableEntityException('O tempo confirmado ultrapassa o limite registrado pelo servidor.');
          activeSeconds = seconds;
        }
      }
      const updated = await this.transition(tx, session, now, dto.outcome, { activeSeconds, elapsedActiveSeconds: elapsedSeconds(session, now), activeStartedAt: null, finishedAt: now });
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
      const reward = dto.outcome === 'DISCARDED' ? null : await this.rewards.grantFocus(tx, userId, session.id, activeSeconds, now, user.timeZone);
      const response = { ...this.snapshot(updated, now), xpGranted: reward?.xp ?? 0, totalXp: await this.rewards.total(tx, userId) };
      await tx.focusAction.create({ data: { userId, sessionId: session.id, key: normalizedKey, fingerprint, response, createdAt: now } });
      return response;
    });
  }

  async history(userId: string, page: number, pageSize: number) {
    return this.locked(userId, async (tx, now) => {
      const rows = await tx.focusSession.findMany({ where: { userId }, orderBy: [{ startedAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize, include: { subject: { select: { name: true } } } });
      const sessions = await Promise.all(rows.map((row) => this.refresh(tx, row, now)));
      const rewards = await tx.rewardEvent.findMany({ where: { userId, sourceType: 'FOCUS_SESSION', sourceId: { in: sessions.map((s) => s.id) } }, select: { id: true, sourceId: true, sourceType: true, xp: true, localDate: true } });
      return { items: sessions.map((s) => ({ ...this.snapshot(s, now), reward: rewards.find((r) => r.sourceId === s.id) ?? null })), page, pageSize, total: await tx.focusSession.count({ where: { userId } }), totalXp: await this.rewards.total(tx, userId) };
    });
  }
}
