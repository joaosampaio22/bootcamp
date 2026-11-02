import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { focusXp, localDate } from '../focus/focus.rules.js';

@Injectable()
export class RewardsService {
  // O chamador mantém o lock da linha User durante toda a transação.
  async grantFocus(tx: Prisma.TransactionClient, userId: string, sessionId: string, activeSeconds: number, now: Date, timeZone: string) {
    const date = localDate(now, timeZone);
    const aggregate = await tx.rewardEvent.aggregate({ where: { userId, sourceType: 'FOCUS_SESSION', localDate: date }, _sum: { xp: true } });
    const xp = focusXp(activeSeconds, aggregate._sum.xp ?? 0);
    return tx.rewardEvent.create({ data: { userId, sourceType: 'FOCUS_SESSION', sourceId: sessionId, xp, localDate: date, createdAt: now } });
  }
  async total(tx: Prisma.TransactionClient, userId: string): Promise<number> {
    return (await tx.rewardEvent.aggregate({ where: { userId }, _sum: { xp: true } }))._sum.xp ?? 0;
  }
}
