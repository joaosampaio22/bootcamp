import { Link } from 'react-router-dom';
import { useRemote } from '../study/use-remote';
import type { ReturnPoint } from '../study/study-types';
import type { FocusSnapshot } from '../focus/focus-time';
import { MaterialLink } from '../study/MaterialLink';
import { AcademyView } from '../progress/AcademyView';
import type { Academy } from '../progress/progress-types';

export function DashboardPage() {
  const resource = useRemote<{ activeSession: FocusSnapshot | null; nextReturnPoint: ReturnPoint | null; dueReviewCount: number; academy: Academy | null }>('/dashboard');
  if (resource.loading) return <p role="status" className="app-loading">Preparando seu próximo passo…</p>;
  if (resource.error || !resource.data) return <div className="form-error"><p role="alert">{resource.error || 'Não foi possível carregar.'}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div>;
  const { activeSession, nextReturnPoint, dueReviewCount, academy } = resource.data;
  return <><header className="workspace-heading"><p className="eyebrow">BOM TER VOCÊ POR AQUI</p><h1>Continue no seu ritmo.</h1><p>Você não precisa planejar tudo. Um próximo passo já ajuda.</p></header>
    {activeSession && <section className="workspace-card dashboard-primary"><p className="eyebrow">{activeSession.status === 'NEEDS_RECONCILIATION' ? 'UMA SESSÃO PRECISA DE VOCÊ' : 'SEU FOCO ESTÁ SALVO'}</p><h2>{activeSession.status === 'NEEDS_RECONCILIATION' ? 'Vamos confirmar seu tempo de estudo?' : 'Sua sessão continua de onde parou.'}</h2><p>Nenhuma recompensa é concedida automaticamente por deixar o timer aberto.</p><Link className="app-button" to="/app/focus">{activeSession.status === 'NEEDS_RECONCILIATION' ? 'Resolver sessão pendente' : 'Voltar ao foco'}</Link></section>}
    {nextReturnPoint ? <section className="workspace-card dashboard-primary"><p className="eyebrow">CONTINUE DE ONDE PAROU</p><h2>{nextReturnPoint.nextAction}</h2>{nextReturnPoint.context && <p className="study-notes">{nextReturnPoint.context}</p>}<MaterialLink url={nextReturnPoint.materialUrl} /><div className="form-actions"><Link className="app-button" to={'/app/continue/' + nextReturnPoint.id + '/edit'}>Ver meu ponto de retorno</Link><Link className="text-button" to="/app/focus">Começar um foco</Link></div></section> : !activeSession && <section className="workspace-card dashboard-primary"><h2>Você pode começar agora.</h2><p>Não é preciso cadastrar disciplina ou conteúdo antes de estudar.</p><Link className="primary-link" to="/app/focus">Começar uma sessão de foco</Link></section>}
    {typeof dueReviewCount === 'number' && <section className="workspace-card"><p className="eyebrow">UM POUCO DE CADA VEZ</p><h2>{dueReviewCount > 0 ? `${dueReviewCount} ${dueReviewCount === 1 ? 'conteúdo para revisitar' : 'conteúdos para revisitar'}` : 'Suas revisões estão em dia.'}</h2><p className="focus-caption">Você pode revisar quando fizer sentido, sem perder progresso por atraso.</p><div className="form-actions"><Link className="text-button" to="/app/reviews">Ver revisões</Link></div></section>}
    {!activeSession && academy && <AcademyView academy={academy} compact />}
    <section className="workspace-card"><h2>Guarde o que importa</h2><p className="focus-caption">Depois do estudo, registre um assunto ou deixe uma próxima ação preparada. Os dois são opcionais.</p><div className="form-actions"><Link className="app-button secondary-button" to="/app/contents/new">Registrar conteúdo</Link><Link className="text-button" to="/app/continue/new">Salvar ponto de retorno</Link></div></section>
  </>;
}
