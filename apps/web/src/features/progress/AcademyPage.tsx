import { Link, useSearchParams } from 'react-router-dom';
import { useRemote } from '../study/use-remote';
import { dateLabel } from '../study/study-types';
import type { Page } from '../study/study-types';
import { AcademyView } from './AcademyView';
import type { Academy, Reward } from './progress-types';

export function AcademyPage() {
  const resource = useRemote<Academy>('/academy');
  if (resource.loading) return <p className="app-loading" role="status">Reunindo seu progresso…</p>;
  if (resource.error || !resource.data) return <div className="form-error"><p role="alert">{resource.error || 'Não foi possível consultar sua academia.'}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div>;
  const academy = resource.data;
  return <><header className="workspace-heading"><p className="eyebrow">UM LUGAR PARA O SEU PROGRESSO</p><h1>Sua Academia Viva</h1><p>Cada encontro com o estudo deixa uma marca. Sem pressa, sem perder o que já foi construído.</p></header>
    <AcademyView academy={academy} />
    <div className="progress-metrics academy-sources"><article className="workspace-card"><p>XP de foco</p><strong>{academy.focusXp.toLocaleString('pt-BR')}</strong><span>Por tempo elegível registrado</span></article><article className="workspace-card"><p>XP de revisões</p><strong>{academy.reviewXp.toLocaleString('pt-BR')}</strong><span>Por autoavaliações concluídas</span></article></div>
    <section className="workspace-card"><h2>Um caminho, quatro estágios</h2><ol className="academy-stages">{academy.stages.map((stage) => <li key={stage.stage} aria-current={stage.stage === academy.stage ? 'step' : undefined} className={stage.stage <= academy.stage ? 'stage-reached' : ''}><span>{['I','II','III','IV'][stage.stage - 1]}</span><div><strong>{stage.name}</strong><p>{stage.startXp} XP · {stage.stage === academy.stage ? 'Estágio atual' : stage.stage < academy.stage ? 'Alcançado' : 'Mais adiante'}</p></div></li>)}</ol><p className="focus-caption">A evolução é automática e decorativa. XP registra prática; não mede domínio de conteúdo ou qualidade da atenção.</p></section>
    <RewardHistory />
  </>;
}

function RewardHistory() {
  const [params,setParams] = useSearchParams();
  const source = params.get('source'); const sourceType = source === 'FOCUS_SESSION' || source === 'REVIEW_ATTEMPT' ? source : '';
  const page = Math.max(1,Number(params.get('page')) || 1);
  const resource = useRemote<Page<Reward>>(`/academy/events?page=${page}${sourceType ? '&sourceType=' + sourceType : ''}`);
  const data = resource.data;
  return <section className="workspace-card"><div className="list-heading"><h2>De onde veio seu XP</h2><label className="ledger-filter">Mostrar<select aria-label="Filtrar origem do XP" value={sourceType} onChange={(e) => setParams(e.target.value ? { source: e.target.value } : {})}><option value="">Tudo</option><option value="FOCUS_SESSION">Foco</option><option value="REVIEW_ATTEMPT">Revisões</option></select></label></div>
    {resource.loading ? <p role="status">Carregando registros…</p> : resource.error ? <div className="form-error"><p role="alert">{resource.error}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div> : data && (data.items.length ? <ul className="xp-ledger">{data.items.map((reward) => <li key={reward.id}><div><p className="eyebrow">{reward.sourceType === 'FOCUS_SESSION' ? 'FOCO' : 'REVISÃO'} · {dateLabel(reward.localDate)}</p><h3>{reward.title}</h3><Link className="text-button" to={reward.historyPath}>Consultar histórico</Link></div><span className="ledger-xp">{reward.xp} XP</span></li>)}</ul> : <div className="empty-state"><h3>Seu caminho começa no próximo passo.</h3><p>Sessões e revisões concluídas aparecerão aqui, inclusive quando o teto diário de XP for atingido.</p><Link className="text-button" to="/app/focus">Começar um foco</Link></div>)}
    {data && data.total > data.pageSize && <div className="pagination"><button className="text-button" disabled={page === 1} onClick={() => setParams({ source: sourceType, page: String(page - 1) })}>Anterior</button><span>Página {page}</span><button className="text-button" disabled={page * data.pageSize >= data.total} onClick={() => setParams({ source: sourceType, page: String(page + 1) })}>Próxima página</button></div>}
  </section>;
}
