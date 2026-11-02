export interface AcademyStage { stage: 1 | 2 | 3 | 4; name: string; startXp: number; assetUrl: string }
export interface Academy {
  totalXp: number; focusXp: number; reviewXp: number; stage: 1 | 2 | 3 | 4; stageName: string; assetUrl: string;
  stageStartXp: number; nextStageXp: number | null; nextStageName: string | null; remainingXp: number; stages: AcademyStage[];
}
export interface Reward {
  id: string; sourceType: 'FOCUS_SESSION' | 'REVIEW_ATTEMPT'; sourceId: string; xp: number; localDate: string;
  createdAt: string; title: string; historyPath: string;
}
export interface DailyActivity { date: string; focusSeconds: number; finishedSessions: number; completedSessions: number; interruptedSessions: number; reviewCount: number; studied: boolean }
export interface Statistics {
  timeZone: string; range: { from: string; to: string };
  metrics: { focusSeconds: number; finishedSessions: number; completedSessions: number; interruptedSessions: number; reviewCount: number; daysWithStudy: number };
  daily: DailyActivity[];
}
export function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60); const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}
