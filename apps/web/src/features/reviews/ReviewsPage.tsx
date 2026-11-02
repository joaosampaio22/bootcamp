import { Link, useSearchParams } from 'react-router-dom';
import { useRemote } from '../study/use-remote';
import { dateLabel } from '../study/study-types';
import type { ReviewQueue } from './review-types';

export function ReviewsPage() {
  const [params, setParams] = useSearchParams();
  const upcoming = params.get('view') === 'upcoming';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const resource = useRemote<ReviewQueue>(`/reviews/${upcoming ? 'upcoming' : 'due'}?page=${page}`);
  const data = resource.data;
  return <><header className="workspace-heading"><p className="eyebrow">UM CONVITE PARA RELEMBRAR</p><h1>Revisite o que você estudou.</h1><p>Uma revisão por conteúdo, no seu ritmo. Atrasos não tiram seu progresso.</p></header>
    <section className="workspace-card"><div className="list-heading"><h2>{upcoming ? 'Próximas revisões' : 'Para revisar'}</h2><div className="subject-filters"><button aria-pressed={!upcoming} onClick={() => setParams({ view: 'due' })}>Hoje e anteriores</button><button aria-pressed={upcoming} onClick={() => setParams({ view: 'upcoming' })}>Próximas</button></div></div>
      {resource.loading ? <p role="status" className="empty-state">Carregando revisões…</p> : resource.error ? <div className="form-error"><p role="alert">{resource.error}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div> : data && (data.items.length ? <><p className="focus-caption">{data.total} {data.total === 1 ? 'conteúdo nesta lista' : 'conteúdos nesta lista'} · Hoje: {dateLabel(data.today)}</p><ul className="study-list review-queue">{data.items.map((review) => <li key={review.id}><div><p className="eyebrow">{review.content.subject.name}</p><h3>{review.content.title}</h3><p>{review.nextDueDate.slice(0,10) === review.today ? 'Agendada para hoje' : 'Agendada para ' + dateLabel(review.nextDueDate)}</p></div><Link className="app-button secondary-button" to={'/app/reviews/' + review.id}>{upcoming ? 'Ver agendamento' : 'Tentar lembrar'}</Link></li>)}</ul></> : <div className="empty-state"><h3>{upcoming ? 'Sem revisões futuras por aqui.' : 'Tudo em dia por aqui.'}</h3><p>{upcoming ? 'Habilite a revisão de um conteúdo para agendar o próximo encontro com ele.' : 'Você pode estudar algo novo ou consultar as próximas datas.'}</p><Link className="text-button" to="/app/contents">Ver meus conteúdos</Link></div>)}
      {data && data.total > data.pageSize && <div className="pagination"><button className="text-button" disabled={page === 1} onClick={() => setParams({ view: upcoming ? 'upcoming' : 'due', page: String(page - 1) })}>Anterior</button><span>Página {page}</span><button className="text-button" disabled={page * data.pageSize >= data.total} onClick={() => setParams({ view: upcoming ? 'upcoming' : 'due', page: String(page + 1) })}>Próxima página</button></div>}
    </section></>;
}
