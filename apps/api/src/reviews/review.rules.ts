import { localDate } from '../focus/focus.rules.js';

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] as const;
export const REVIEW_RATINGS = ['AGAIN', 'HARD', 'GOOD', 'EASY'] as const;
export type Rating = typeof REVIEW_RATINGS[number];

export function nextStep(current: number, rating: Rating): number {
  switch (rating) {
    case 'AGAIN': return 0;
    case 'HARD': return current;
    case 'GOOD': return Math.min(current + 1, 5);
    case 'EASY': return Math.min(current + 2, 5);
  }
}

export function reviewDueDate(now: Date, timeZone: string, step: number): Date {
  const date = localDate(now, timeZone);
  date.setUTCDate(date.getUTCDate() + REVIEW_INTERVALS[step]!);
  return date;
}

export function reviewXp(alreadyGranted: number): number {
  return Math.min(5, Math.max(0, 50 - alreadyGranted));
}
