import { describe, expect, it } from '@jest/globals';
import { academyProgress } from './academy.rules.js';

describe('academia / RN-061–063 / CA-016', () => {
  it.each([[0,1,0,100],[99,1,0,100],[100,2,100,350],[349,2,100,350],[350,3,350,800],[799,3,350,800],[800,4,800,null],[1500,4,800,null]] as const)('%i XP está no estágio %i', (xp,stage,start,next) => {
    expect(academyProgress(xp,0)).toMatchObject({ totalXp: xp, stage, stageStartXp: start, nextStageXp: next, assetUrl: `/academy/stage-${stage}.svg` });
  });
  it('soma origens, atravessa limiares diretamente e encerra progressão no quarto estágio', () => {
    expect(academyProgress(345,5)).toMatchObject({ totalXp: 350, focusXp: 345, reviewXp: 5, stage: 3, remainingXp: 450 });
    expect(academyProgress(800,100)).toMatchObject({ stage: 4, nextStageXp: null, nextStageName: null, remainingXp: 0 });
  });
});
