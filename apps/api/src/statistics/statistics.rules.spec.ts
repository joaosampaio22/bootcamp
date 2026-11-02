import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { statisticsRange } from './statistics.rules.js';
import { StatisticsQuery } from './statistics.dto.js';
import { RewardQuery } from '../academy/academy.dto.js';

describe('período civil das estatísticas', () => {
  const now = new Date('2026-11-03T01:00:00Z');
  it('padrão inclui sete dias até hoje local, mesmo quando UTC já virou o dia', () => {
    expect(statisticsRange({},now,'America/Sao_Paulo')).toEqual({ from: '2026-10-27', to: '2026-11-02', days: 7 });
  });
  it.each([
    ['2026-03-07','2026-03-09',3],['2026-10-31','2026-11-02',3],['2024-01-01','2024-12-31',366],['2026-12-31','2027-01-01',2],['2026-11-02','2026-11-02',1]
  ] as const)('período %s a %s tem %i dias civis', (from,to,days) => {
    expect(statisticsRange({ from,to },now,'America/New_York')).toEqual({ from,to,days });
  });
  it.each([{ from: '2026-11-02' },{ to: '2026-11-02' },{ from: '2026-02-30', to: '2026-03-01' },{ from: '2026-11-03', to: '2026-11-02' },{ from: '2025-01-01', to: '2026-01-02' },{ from: '2026-1-01', to: '2026-01-01' },{ from: '2026-11-02T00:00:00Z', to: '2026-11-03' }])('recusa período incompleto, inválido ou excessivo', (query) => {
    expect(() => statisticsRange(query,now,'UTC')).toThrow();
  });
  it('DTO recusa identidade, fuso e paginação forjados', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    for (const query of [{ userId: 'alheio' },{ timeZone: 'UTC' },{ from: 2026 }]) await expect(pipe.transform(query,{ type: 'query', metatype: StatisticsQuery })).rejects.toThrow();
    await expect(pipe.transform({ sourceType: 'ADMIN', pageSize: 101 },{ type: 'query', metatype: RewardQuery })).rejects.toThrow();
  });
});
