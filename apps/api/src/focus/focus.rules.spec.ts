import { describe, expect, it } from '@jest/globals';
import { elapsedSeconds, focusXp, localDate, needsReconciliation } from './focus.rules.js';

describe('foco e XP / RN-023–027, RN-065', () => {
  it.each([[0,0],[299,0],[300,5],[359,5],[720,12],[1500,25],[5400,60],[7200,60]])('tempo %i gera XP %i antes do teto diário', (seconds, expected) => {
    expect(focusXp(seconds, 0)).toBe(expected);
  });
  it('respeita saldo restante do dia inclusive depois de atingir o teto', () => {
    expect(focusXp(1500, 175)).toBe(5);
    expect(focusXp(1500, 180)).toBe(0);
    expect(focusXp(1500, 181)).toBe(0);
  });
  const base = { status: 'RUNNING', activeSeconds: 300, elapsedActiveSeconds: 300, plannedSeconds: 1500, activeStartedAt: new Date('2026-11-02T12:00:00Z') };
  it('ignora tempo de pausa e relógio anterior ao início do segmento', () => {
    expect(elapsedSeconds({ ...base, status: 'PAUSED', activeStartedAt: null }, new Date('2026-11-03T12:00:00Z'))).toBe(300);
    expect(elapsedSeconds(base, new Date('2026-11-02T11:59:00Z'))).toBe(300);
    expect(elapsedSeconds(base, new Date('2026-11-02T12:05:00Z'))).toBe(600);
  });
  it('exige recuperação somente além do planejado + 15 minutos ativos', () => {
    expect(needsReconciliation(base, new Date('2026-11-02T12:35:00Z'))).toBe(false);
    expect(needsReconciliation(base, new Date('2026-11-02T12:35:01Z'))).toBe(true);
    expect(elapsedSeconds(base, new Date('2030-01-01T00:00:00Z'))).toBe(2401);
  });
  it.each([
    ['2026-11-03T01:00:00Z','America/Sao_Paulo','2026-11-02'],
    ['2026-11-03T03:00:00Z','America/Sao_Paulo','2026-11-03'],
    ['2026-03-08T06:59:00Z','America/New_York','2026-03-08'],
    ['2026-03-08T07:01:00Z','America/New_York','2026-03-08']
  ])('identifica dia civil em %s, %s', (instant, zone, expected) => {
    expect(localDate(new Date(instant), zone).toISOString().slice(0,10)).toBe(expected);
  });
});
