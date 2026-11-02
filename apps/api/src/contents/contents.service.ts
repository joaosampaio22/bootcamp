import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserTransactionService } from '../prisma/user-transaction.service.js';
import { ClockService } from '../common/clock.service.js';
import { localDate } from '../focus/focus.rules.js';
import type { Prisma, StudyContent } from '../generated/prisma/client.js';
import type { ContentQuery, CreateContentDto, UpdateContentDto } from './content.dto.js';

const include = { subject: { select: { id: true, name: true, archivedAt: true } }, review: true } as const;
export function tomorrow(now: Date, timeZone: string): Date {
  const result = localDate(now, timeZone); result.setUTCDate(result.getUTCDate() + 1); return result;
}
@Injectable()
export class ContentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(UserTransactionService) private readonly transactions: UserTransactionService, @Inject(ClockService) private readonly clock: ClockService) {}
  list(userId: string, query: ContentQuery) {
    const q = query.q.replace(/[\\%_]/g, '\\$&');
    const where: Prisma.StudyContentWhereInput = { userId,
      ...(query.archived === 'true' ? { OR: [{ archivedAt: { not: null } }, { subject: { archivedAt: { not: null } } }] } : { archivedAt: null, subject: { archivedAt: null } }),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(q ? { AND: [{ OR: [{ title: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } }] }] } : {}) };
    return this.prisma.$transaction(async (tx) => ({ items: await tx.studyContent.findMany({ where, include, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), total: await tx.studyContent.count({ where }), page: query.page, pageSize: query.pageSize }));
  }
  async get(userId: string, id: string) {
    const result = await this.prisma.studyContent.findFirst({ where: { id, userId }, include });
    if (!result) throw new NotFoundException(); return result;
  }
  private async syncReview(tx: Prisma.TransactionClient, content: StudyContent, now: Date) {
    const previous = await tx.reviewSchedule.findUnique({ where: { contentId: content.id } });
    const active = content.reviewEnabled && !content.archivedAt;
    if (!active) {
      if (previous?.status === 'ACTIVE') await tx.reviewSchedule.update({ where: { id: previous.id }, data: { status: 'SUSPENDED', version: { increment: 1 }, updatedAt: now } });
    } else if (!previous || previous.status === 'SUSPENDED') {
      const user = await tx.user.findUniqueOrThrow({ where: { id: content.userId }, select: { timeZone: true } });
      const nextDueDate = tomorrow(now, user.timeZone);
      if (previous) await tx.reviewSchedule.update({ where: { id: previous.id }, data: { status: 'ACTIVE', stepIndex: 0, nextDueDate, version: { increment: 1 }, updatedAt: now } });
      else await tx.reviewSchedule.create({ data: { userId: content.userId, contentId: content.id, nextDueDate, createdAt: now, updatedAt: now } });
    }
  }
  create(userId: string, dto: CreateContentDto) {
    return this.transactions.run(userId, async (tx) => {
      if (!await tx.subject.findFirst({ where: { id: dto.subjectId, userId, archivedAt: null } })) throw new NotFoundException('Disciplina não encontrada.');
      const now = this.clock.now();
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
      const content = await tx.studyContent.create({ data: { userId, subjectId: dto.subjectId, title: dto.title, notes: dto.notes, materialUrl: dto.materialUrl ?? null, reviewEnabled: dto.reviewEnabled, studiedOn: dto.studiedOn ? new Date(dto.studiedOn + 'T00:00:00Z') : localDate(now, user.timeZone), createdAt: now, updatedAt: now } });
      await this.syncReview(tx, content, now);
      return tx.studyContent.findFirstOrThrow({ where: { id: content.id, userId }, include });
    });
  }
  update(userId: string, id: string, dto: UpdateContentDto) {
    if (!Object.values(dto).some((v) => v !== undefined)) throw new BadRequestException('Informe ao menos uma alteração.');
    return this.transactions.run(userId, async (tx) => {
      const existing = await tx.studyContent.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException();
      if (dto.subjectId !== undefined && dto.subjectId !== existing.subjectId && !await tx.subject.findFirst({ where: { id: dto.subjectId, userId, archivedAt: null } })) throw new NotFoundException('Disciplina não encontrada.');
      const { archived, studiedOn, ...fields } = dto;
      const now = this.clock.now();
      const content = await tx.studyContent.update({ where: { id }, data: { ...fields, ...(studiedOn !== undefined ? { studiedOn: new Date(studiedOn + 'T00:00:00Z') } : {}), ...(archived !== undefined ? { archivedAt: archived ? now : null } : {}), updatedAt: now } });
      if (existing.subjectId !== content.subjectId) await tx.returnPoint.updateMany({ where: { userId, contentId: id, status: 'OPEN' }, data: { subjectId: content.subjectId, updatedAt: now } });
      await this.syncReview(tx, content, now);
      return tx.studyContent.findFirstOrThrow({ where: { id, userId }, include });
    });
  }
}
