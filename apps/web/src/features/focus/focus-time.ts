export interface FocusSnapshot {
  id: string; subjectId: string | null; subjectName: string | null;
  plannedSeconds: number; activeSeconds: number;
  status: 'RUNNING' | 'PAUSED' | 'NEEDS_RECONCILIATION' | 'COMPLETED' | 'INTERRUPTED' | 'DISCARDED';
  activeStartedAt: string | null; startedAt: string; finishedAt: string | null;
  serverNow: string; version: number; maxConfirmableSeconds: number | null;
}
export interface FinishedFocus extends FocusSnapshot { xpGranted: number; totalXp: number }
export interface FocusHistory {
  items: (FocusSnapshot & { reward: { id: string; xp: number; sourceId: string; localDate: string } | null })[];
  total: number; totalXp: number; page: number; pageSize: number;
}

// O relógio civil do dispositivo não calcula tempo persistido nem XP.
export function remainingSeconds(session: FocusSnapshot, monotonicElapsedMs: number): number {
  const delta = session.status === 'RUNNING' && session.activeStartedAt
    ? Math.max(0, Math.floor((Date.parse(session.serverNow) - Date.parse(session.activeStartedAt) + Math.max(0, monotonicElapsedMs)) / 1000)) : 0;
  return Math.max(0, session.plannedSeconds - session.activeSeconds - delta);
}
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
