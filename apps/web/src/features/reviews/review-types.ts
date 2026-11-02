import type { Page, SubjectOption } from '../study/study-types';

export type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export const ratings: { value: Rating; label: string; explanation: string }[] = [
  { value: 'AGAIN', label: 'Não lembrei', explanation: 'Voltar ao primeiro intervalo' },
  { value: 'HARD', label: 'Com dificuldade', explanation: 'Manter o intervalo atual' },
  { value: 'GOOD', label: 'Lembrei bem', explanation: 'Avançar um intervalo' },
  { value: 'EASY', label: 'Muito fácil', explanation: 'Avançar dois intervalos' }
];
export const ratingLabel = (rating: Rating) => ratings.find((item) => item.value === rating)!.label;
export interface Review {
  id: string; contentId: string; status: 'ACTIVE' | 'SUSPENDED'; stepIndex: number; nextDueDate: string; version: number;
  today: string; overdueDays: number; canAttempt: boolean;
  content: { id: string; title: string; notes?: string; materialUrl: string | null; reviewEnabled: boolean; archivedAt: string | null; subject: SubjectOption };
}
export interface ReviewQueue extends Page<Review> { today: string }
export interface ReviewReceipt {
  attemptId: string; scheduleId: string; contentId: string; rating: Rating; oldStepIndex: number; newStepIndex: number;
  oldDueDate: string; nextDueDate: string; version: number; xpGranted: number; totalXp: number; createdAt: string;
}
export interface Attempt {
  id: string; rating: Rating; oldStepIndex: number; newStepIndex: number; oldDueDate: string; newDueDate: string; createdAt: string;
  reward: { id: string; sourceId: string; sourceType: 'REVIEW_ATTEMPT'; xp: number; localDate: string } | null;
}
