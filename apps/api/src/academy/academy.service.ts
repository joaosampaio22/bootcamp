import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { academyProgress } from './academy.rules.js';
import type { RewardQuery } from './academy.dto.js';

@Injectable()
export class AcademyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async get(userId: string) {
    const groups = await this.prisma.rewardEvent.groupBy({ by: ['sourceType'], where: { userId }, _sum: { xp: true } });
    return academyProgress(groups.find((item) => item.sourceType === 'FOCUS_SESSION')?._sum.xp ?? 0, groups.find((item) => item.sourceType === 'REVIEW_ATTEMPT')?._sum.xp ?? 0);
  }
  events(userId: string, query: RewardQuery) {
    return this.prisma.$transaction(async (tx) => {
      const where = { userId, ...(query.sourceType ? { sourceType: query.sourceType } : {}) };
      const rows = await tx.rewardEvent.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize, select: { id: true, sourceType: true, sourceId: true, xp: true, localDate: true, createdAt: true } });
      const sessions = await tx.focusSession.findMany({ where: { userId, id: { in: rows.filter((row) => row.sourceType === 'FOCUS_SESSION').map((row) => row.sourceId) } }, select: { id: true, content: { select: { title: true } }, subject: { select: { name: true } } } });
      const attempts = await tx.reviewAttempt.findMany({ where: { userId, id: { in: rows.filter((row) => row.sourceType === 'REVIEW_ATTEMPT').map((row) => row.sourceId) } }, select: { id: true, scheduleId: true, content: { select: { title: true } } } });
      return { items: rows.map((row) => {
        const session = sessions.find((item) => item.id === row.sourceId);
        const attempt = attempts.find((item) => item.id === row.sourceId);
        return { ...row, title: row.sourceType === 'FOCUS_SESSION' ? session?.content?.title ?? session?.subject?.name ?? 'Foco livre' : attempt?.content.title ?? 'Revisão de conteúdo', historyPath: attempt ? `/app/reviews/${attempt.scheduleId}/history` : '/app/focus' };
      }), total: await tx.rewardEvent.count({ where }), page: query.page, pageSize: query.pageSize };
    }, { isolationLevel: 'RepeatableRead' });
  }
}
