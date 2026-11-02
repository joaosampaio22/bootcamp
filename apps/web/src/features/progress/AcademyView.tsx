import { Link } from 'react-router-dom';
import type { Academy } from './progress-types';

export function AcademyView({ academy, compact = false }: { academy: Academy; compact?: boolean }) {
  return <section className={'workspace-card academy-view' + (compact ? ' academy-compact' : '')} aria-label="Sua academia">
    <div className="academy-landscape"><img src={academy.assetUrl} alt={`Academia Viva, estágio ${academy.stage}: ${academy.stageName}`} width="960" height="600" /></div>
    <div className="academy-caption"><p className="eyebrow">ESTÁGIO {['I','II','III','IV'][academy.stage - 1]}</p><h2>{academy.stageName}</h2><p className="academy-xp">{academy.totalXp.toLocaleString('pt-BR')} <span>XP acumulados</span></p>
      {academy.nextStageXp !== null ? <><progress className="academy-progress" value={academy.totalXp - academy.stageStartXp} max={academy.nextStageXp - academy.stageStartXp} aria-label={'Progresso até ' + academy.nextStageName} /><p className="focus-caption">Faltam {academy.remainingXp} XP para {academy.nextStageName}.</p></> : <p className="review-status">Você chegou ao quarto estágio. Seu estudo continua sendo registrado.</p>}
      <p className="focus-caption">Sua academia evolui com suas sessões e revisões registradas. Dias de ausência não tiram seu progresso.</p>
      {compact && <Link className="text-button" to="/app/academy">Conhecer minha academia</Link>}
    </div>
  </section>;
}
