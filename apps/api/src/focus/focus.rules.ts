export const OPEN_STATUSES = ['RUNNING', 'PAUSED', 'NEEDS_RECONCILIATION'] as const;
export const GRACE_SECONDS = 900;

export interface Timing {
  status: string;
  activeSeconds: number;
  elapsedActiveSeconds: number;
  activeStartedAt: Date | null;
  plannedSeconds: number;
}

export function elapsedSeconds(session: Timing, now: Date): number {
  const delta = session.status === 'RUNNING' && session.activeStartedAt
    ? Math.max(0, Math.floor((now.getTime() - session.activeStartedAt.getTime()) / 1000)) : 0;
  return Math.min(session.plannedSeconds + GRACE_SECONDS + 1, session.elapsedActiveSeconds + delta);
}

export function needsReconciliation(session: Timing, now: Date): boolean {
  return session.status === 'RUNNING' && elapsedSeconds(session, now) > session.plannedSeconds + GRACE_SECONDS;
}

export function focusXp(activeSeconds: number, alreadyGranted: number): number {
  const minutes = Math.floor(activeSeconds / 60);
  return minutes < 5 ? 0 : Math.min(minutes, 60, Math.max(0, 180 - alreadyGranted));
}

export function localDate(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
}
