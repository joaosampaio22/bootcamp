import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '../generated/prisma/client.js';
import { localDate } from '../focus/focus.rules.js';

export const DEMO_EMAIL = 'demo@estudo-em-dia.example.test';
const timeZone = 'America/Sao_Paulo';
export async function seedDemo(prisma: PrismaClient, email: string, passwordHash: string, now: Date) {
  try {
    return await prisma.$transaction(async (tx) => {
      const previous = await tx.user.findUnique({ where: { emailNormalized: email } });
      if (previous) {
        if (!previous.isDemo) throw new Error('A conta existente não é de demonstração. Nenhum dado foi alterado.');
        return { id: previous.id, created: false };
      }
      const userId = randomUUID(); const historyId = randomUUID(); const englishId = randomUUID();
      const old = new Date(now.getTime() - 3 * 86400000); const yesterday = new Date(now.getTime() - 86400000);
      const today = localDate(now,timeZone);
      const overdue = new Date(today); overdue.setUTCDate(overdue.getUTCDate() - 2);
      const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      await tx.user.create({ data: { id: userId, name: 'Pessoa de demonstração', emailNormalized: email, passwordHash, timeZone, isDemo: true, createdAt: old } });
      await tx.subject.createMany({ data: [{ id: historyId, userId, name: 'História', normalizedName: 'história' },{ id: englishId, userId, name: 'Inglês', normalizedName: 'inglês' }] });
      const history = await tx.studyContent.create({ data: { userId, subjectId: historyId, title: 'Renascimento: arte e ciência', notes: 'Dados fictícios para demonstração.\nA perspectiva linear usa linhas que convergem para um ponto de fuga.\nPróximo passo: comparar duas obras e anotar minhas observações.', materialUrl: 'https://example.org/meu-material', studiedOn: localDate(old,timeZone), createdAt: old } });
      const english = await tx.studyContent.create({ data: { userId, subjectId: englishId, title: 'Apresentações em inglês', notes: 'Exemplo fictício: praticar uma apresentação curta sobre meus interesses.', studiedOn: today, createdAt: now } });
      await tx.reviewSchedule.createMany({ data: [{ userId, contentId: history.id, nextDueDate: overdue, createdAt: old },{ userId, contentId: english.id, nextDueDate: tomorrow, createdAt: now }] });
      await tx.returnPoint.create({ data: { userId, subjectId: historyId, contentId: history.id, context: 'Parei antes da comparação das obras. Este é um cenário fictício.', nextAction: 'Comparar duas obras e anotar minhas observações.', createdAt: now, updatedAt: now } });
      let start = new Date(yesterday.getTime() - 95 * 60000);
      for (const minutes of [60,35]) {
        const end = new Date(start.getTime() + minutes * 60000);
        const session = await tx.focusSession.create({ data: { userId, subjectId: historyId, contentId: history.id, plannedSeconds: minutes * 60, activeSeconds: minutes * 60, elapsedActiveSeconds: minutes * 60, status: 'COMPLETED', activeStartedAt: null, startedAt: start, finishedAt: end, version: 2, createdAt: start } });
        await tx.focusTransition.createMany({ data: [{ userId, sessionId: session.id, fromStatus: null, toStatus: 'RUNNING', activeSeconds: 0, createdAt: start },{ userId, sessionId: session.id, fromStatus: 'RUNNING', toStatus: 'COMPLETED', activeSeconds: minutes * 60, createdAt: end }] });
        await tx.rewardEvent.create({ data: { userId, sourceType: 'FOCUS_SESSION', sourceId: session.id, xp: minutes, localDate: localDate(end,timeZone), createdAt: end } });
        start = end;
      }
      return { id: userId, created: true };
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      const user = await prisma.user.findUnique({ where: { emailNormalized: email } });
      if (user?.isDemo) return { id: user.id, created: false };
    }
    throw error;
  }
}
