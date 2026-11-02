import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useRemote } from '../study/use-remote';
import { dateLabel } from '../study/study-types';
import type { Page } from '../study/study-types';
import { ratingLabel } from './review-types';
import type { Attempt } from './review-types';

export function ReviewHistoryPage() {
  const { id } = useParams(); const [params, setParams] = useSearchParams();
  const { session } = useAuth();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const resource = useRemote<Page<Attempt>>(`/reviews/${encodeURIComponent(id ?? '')}/history?page=${page}`);
  const data = resource.data;
  return <><header className="workspace-heading"><p className="eyebrow">SEU CAMINHO REGISTRADO</p><h1>Histórico de revisões</h1><p>Cada avaliação preserva a data anterior, a nova agenda e o XP concedido.</p><Link className="text-button" to={'/app/reviews/' + id}>Voltar ao agendamento</Link></header><section className="workspace-card">
    {resource.loading ? <p role="status">Carregando histórico…</p> : resource.error ? <div className="form-error"><p role="alert">{resource.error}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div> : data && (data.items.length ? <ul className="review-history">{data.items.map((attempt) => <li key={attempt.id}><p className="eyebrow">{new Date(attempt.createdAt).toLocaleString('pt-BR', { timeZone: session?.user.timeZone ?? 'America/Sao_Paulo' })}</p><h2>{ratingLabel(attempt.rating)}</h2><p>Antes: {dateLabel(attempt.oldDueDate)} · Próxima: {dateLabel(attempt.newDueDate)}</p><p className="focus-caption">{attempt.reward?.xp ?? 0} XP concedidos · Autoavaliação</p></li>)}</ul> : <div className="empty-state"><h2>Sua primeira revisão ainda vem.</h2><p>Abrir o conteúdo ou revelar notas não registra uma tentativa nem concede XP.</p></div>)}
    {data && data.total > data.pageSize && <div className="pagination"><button className="text-button" disabled={page === 1} onClick={() => setParams({ page: String(page - 1) })}>Anterior</button><span>Página {page}</span><button className="text-button" disabled={page * data.pageSize >= data.total} onClick={() => setParams({ page: String(page + 1) })}>Próxima página</button></div>}
    </section></>;
}
