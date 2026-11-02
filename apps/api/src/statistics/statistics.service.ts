import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClockService } from '../common/clock.service.js';
import { statisticsRange } from './statistics.rules.js';
import type { StatisticsQuery } from './statistics.dto.js';

interface DailyRow { date: string; focusSeconds: bigint; finishedSessions: bigint; completedSessions: bigint; interruptedSessions: bigint; reviewCount: bigint; studied: boolean }

@Injectable()
export class StatisticsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(ClockService) private readonly clock: ClockService) {}
  summary(userId: string, query: StatisticsQuery) {
    return this.prisma.$transaction(async (tx) => {
      const { timeZone } = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
      const range = statisticsRange(query,this.clock.now(),timeZone);
      const rows = await tx.$queryRaw<DailyRow[]>`
        WITH bounds AS (
          SELECT (${range.from}::date::timestamp AT TIME ZONE ${timeZone}) AS start_at,
                 ((${range.to}::date + 1)::timestamp AT TIME ZONE ${timeZone}) AS end_at
        ), focus_days AS (
          SELECT ("finishedAt" AT TIME ZONE ${timeZone})::date AS day,
                 SUM("activeSeconds") AS seconds, COUNT(*) AS finished,
                 COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
                 COUNT(*) FILTER (WHERE status = 'INTERRUPTED') AS interrupted,
                 BOOL_OR("activeSeconds" >= 300) AS studied
          FROM "FocusSession", bounds
          WHERE "userId" = ${userId}::uuid AND status IN ('COMPLETED','INTERRUPTED')
            AND "finishedAt" >= bounds.start_at AND "finishedAt" < bounds.end_at
          GROUP BY 1
        ), review_days AS (
          SELECT ("createdAt" AT TIME ZONE ${timeZone})::date AS day, COUNT(*) AS reviews
          FROM "ReviewAttempt", bounds
          WHERE "userId" = ${userId}::uuid AND "createdAt" >= bounds.start_at AND "createdAt" < bounds.end_at
          GROUP BY 1
        ), days AS (
          SELECT ${range.from}::date + offset_value AS day
          FROM generate_series(0, ${range.days - 1}::int) AS offset_value
        )
        SELECT TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
               COALESCE(focus_days.seconds,0)::bigint AS "focusSeconds",
               COALESCE(focus_days.finished,0)::bigint AS "finishedSessions",
               COALESCE(focus_days.completed,0)::bigint AS "completedSessions",
               COALESCE(focus_days.interrupted,0)::bigint AS "interruptedSessions",
               COALESCE(review_days.reviews,0)::bigint AS "reviewCount",
               COALESCE(focus_days.studied,false) AS studied
        FROM days LEFT JOIN focus_days USING (day) LEFT JOIN review_days USING (day)
        ORDER BY days.day`;
      const daily = rows.map((row) => ({ date: row.date, focusSeconds: Number(row.focusSeconds), finishedSessions: Number(row.finishedSessions), completedSessions: Number(row.completedSessions), interruptedSessions: Number(row.interruptedSessions), reviewCount: Number(row.reviewCount), studied: row.studied }));
      const metrics = daily.reduce((total,day) => ({ focusSeconds: total.focusSeconds + day.focusSeconds, finishedSessions: total.finishedSessions + day.finishedSessions, completedSessions: total.completedSessions + day.completedSessions, interruptedSessions: total.interruptedSessions + day.interruptedSessions, reviewCount: total.reviewCount + day.reviewCount, daysWithStudy: total.daysWithStudy + Number(day.studied) }), { focusSeconds: 0, finishedSessions: 0, completedSessions: 0, interruptedSessions: 0, reviewCount: 0, daysWithStudy: 0 });
      return { timeZone, range: { from: range.from, to: range.to }, metrics, daily };
    }, { isolationLevel: 'RepeatableRead' });
  }
}
