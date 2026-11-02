export const ACADEMY_STAGES = [
  { stage: 1, name: 'Fundação', startXp: 0, assetUrl: '/academy/stage-1.svg' },
  { stage: 2, name: 'Campus', startXp: 100, assetUrl: '/academy/stage-2.svg' },
  { stage: 3, name: 'Universidade', startXp: 350, assetUrl: '/academy/stage-3.svg' },
  { stage: 4, name: 'Cidade do Conhecimento', startXp: 800, assetUrl: '/academy/stage-4.svg' }
] as const;

export function academyProgress(focusXp: number, reviewXp: number) {
  const totalXp = focusXp + reviewXp;
  const current = [...ACADEMY_STAGES].reverse().find((item) => totalXp >= item.startXp)!;
  const next = ACADEMY_STAGES.find((item) => item.stage === current.stage + 1);
  return { totalXp, focusXp, reviewXp, stage: current.stage, stageName: current.name, assetUrl: current.assetUrl, stageStartXp: current.startXp, nextStageXp: next?.startXp ?? null, nextStageName: next?.name ?? null, remainingXp: next ? next.startXp - totalXp : 0, stages: ACADEMY_STAGES };
}
