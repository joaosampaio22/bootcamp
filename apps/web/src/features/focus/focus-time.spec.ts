import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatTime, remainingSeconds } from './focus-time';
import type { FocusSnapshot } from './focus-time';

export const fixture: FocusSnapshot = { id: 'focus-fixture', subjectId: null, subjectName: null, plannedSeconds: 1500, activeSeconds: 300, status: 'RUNNING', activeStartedAt: '2026-11-02T12:00:00Z', startedAt: '2026-11-02T11:55:00Z', finishedAt: null, serverNow: '2026-11-02T12:05:00Z', version: 3, maxConfirmableSeconds: null };
afterEach(() => { vi.restoreAllMocks(); });
describe('exibição reconciliada do cronômetro', () => {
  it('usa timestamps do servidor mais tempo monotônico desde a resposta', () => {
    expect(remainingSeconds(fixture, 0)).toBe(900);
    expect(remainingSeconds(fixture, 65000)).toBe(835);
  });
  it('pausa congela o tempo e o contador nunca fica negativo', () => {
    expect(remainingSeconds({ ...fixture, status: 'PAUSED', activeStartedAt: null }, 999999)).toBe(1200);
    expect(remainingSeconds(fixture, 999999999)).toBe(0);
  });
  it('alterar o relógio civil do computador não muda o cálculo', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2099-01-01T00:00:00Z'));
    expect(remainingSeconds(fixture, 1000)).toBe(899);
    expect(formatTime(899)).toBe('14:59');
  });
});
