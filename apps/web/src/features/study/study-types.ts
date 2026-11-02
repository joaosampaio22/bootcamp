export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }
export interface SubjectOption { id: string; name: string; archivedAt?: string | null }
export interface Content {
  id: string; subjectId: string; title: string; notes: string; materialUrl: string | null;
  studiedOn: string; reviewEnabled: boolean; archivedAt: string | null;
  subject: SubjectOption;
  review: { id: string; status: 'ACTIVE' | 'SUSPENDED'; nextDueDate: string; stepIndex: number; version: number } | null;
}
export interface ReturnPoint {
  id: string; subjectId: string | null; contentId: string | null; context: string; nextAction: string;
  materialUrl: string | null; status: 'OPEN' | 'DONE'; updatedAt: string;
  subject: SubjectOption | null; content: { id: string; title: string; archivedAt: string | null } | null;
}
export function dateLabel(value: string): string { return value.slice(0,10).split('-').reverse().join('/'); }
export function today(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year','month','day'].map((type) => parts.find((p) => p.type === type)!.value).join('-');
}
