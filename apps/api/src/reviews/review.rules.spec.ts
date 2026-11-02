import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { nextStep, reviewDueDate, reviewXp } from './review.rules.js';
import type { Rating } from './review.rules.js';
import { AttemptDto, ReviewQueueQuery } from './review.dto.js';

describe('revisões / RN-042–048 / TR-03–07/14', () => {
  const decisions: Record<Rating, number[]> = { AGAIN: [0,0,0,0,0,0], HARD: [0,1,2,3,4,5], GOOD: [1,2,3,4,5,5], EASY: [2,3,4,5,5,5] };
  it.each((Object.keys(decisions) as Rating[]).flatMap((rating) => decisions[rating].map((expected,step) => ({ rating, step, expected }))))('$rating no índice $step resulta em $expected', ({ rating, step, expected }) => {
    expect(nextStep(step,rating)).toBe(expected);
  });
  it.each([
    ['2026-11-03T01:00:00Z','America/Sao_Paulo',0,'2026-11-03'],
    ['2026-03-08T06:59:00Z','America/New_York',1,'2026-03-11'],
    ['2026-03-08T07:01:00Z','America/New_York',1,'2026-03-11'],
    ['2026-11-01T05:30:00Z','America/New_York',2,'2026-11-08'],
    ['2026-12-31T23:00:00Z','UTC',1,'2027-01-03'],
    ['2028-02-28T12:00:00Z','UTC',0,'2028-02-29'],
    ['2026-11-02T10:30:00Z','Pacific/Kiritimati',0,'2026-11-04']
  ] as const)('calendário civil %s em %s', (instant, zone, step, expected) => {
    expect(reviewDueDate(new Date(instant),zone,step).toISOString()).toBe(expected + 'T00:00:00.000Z');
  });
  it.each([[0,5],[45,5],[48,2],[50,0],[55,0]])('limita XP com %i já concedidos', (previous,expected) => {
    expect(reviewXp(previous)).toBe(expected);
  });
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  it.each([{ rating: 'GOOD' },{ rating: 'CORRECT', expectedVersion: 1 },{ rating: 'GOOD', expectedVersion: 0 },{ rating: 'GOOD', expectedVersion: 1.2 },{ rating: 'GOOD', expectedVersion: '1' },{ rating: 'GOOD', expectedVersion: 1, xp: 500 },{ rating: 'GOOD', expectedVersion: 1, userId: 'forjado' }])('recusa avaliação inválida ou campos forjados', async (body) => {
    await expect(pipe.transform(body,{ type: 'body', metatype: AttemptDto })).rejects.toThrow();
  });
  it('aceita avaliação/versão e valida paginação e vínculo de filtro', async () => {
    await expect(pipe.transform({ rating: 'GOOD', expectedVersion: 2 },{ type: 'body', metatype: AttemptDto })).resolves.toMatchObject({ rating: 'GOOD', expectedVersion: 2 });
    await expect(pipe.transform({ page: '2', pageSize: '50' },{ type: 'query', metatype: ReviewQueueQuery })).resolves.toMatchObject({ page: 2, pageSize: 50 });
    await expect(pipe.transform({ pageSize: 101 },{ type: 'query', metatype: ReviewQueueQuery })).rejects.toThrow();
  });
});
