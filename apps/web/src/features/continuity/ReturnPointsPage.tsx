import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useRemote } from '../study/use-remote';
import type { Page, ReturnPoint } from '../study/study-types';
import { MaterialLink } from '../study/MaterialLink';

export function ReturnPointsPage() {
  const { call } = useAuth(); const [params, setParams] = useSearchParams();
  const done = params.get('status') === 'DONE'; const page = Math.max(1, Number(params.get('page')) || 1);
  const resource = useRemote<Page<ReturnPoint>>(`/return-points?status=${done ? 'DONE' : 'OPEN'}&page=${page}`);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function toggle(point: ReturnPoint) {
    if (busy) return; setBusy(true); setError('');
    try { await call('/return-points/' + point.id, { method: 'PATCH', body: JSON.stringify({ status: point.status === 'OPEN' ? 'DONE' : 'OPEN' }) }); resource.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar.'); }
    finally { setBusy(false); }
  }
  return <><header className="workspace-heading"><p className="eyebrow">CONTINUE SEM RECOMEÇAR DO ZERO</p><h1>Onde você parou?</h1><p>Guarde uma próxima ação concreta. Um ponto de retorno pode existir sem disciplina ou conteúdo.</p><Link className="primary-link" to="/app/continue/new">Salvar ponto de retorno</Link></header>
    <section className="workspace-card"><div className="list-heading"><h2>Seus pontos de retorno</h2><div className="subject-filters"><button aria-pressed={!done} onClick={() => setParams({ status: 'OPEN' })}>Abertos</button><button aria-pressed={done} onClick={() => setParams({ status: 'DONE' })}>Concluídos</button></div></div>
      {error && <p className="form-error" role="alert">{error}</p>}{resource.loading ? <p role="status" className="empty-state">Carregando pontos de retorno…</p> : resource.error ? <div className="form-error"><p role="alert">{resource.error}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div> : resource.data && (resource.data.items.length ? <ul className="return-list">{resource.data.items.map((point) => <li key={point.id}>
        {(point.subject || point.content) && <p className="eyebrow">{point.subject?.name}{point.content ? ' · ' + point.content.title : ''}</p>}
        <h3>{point.nextAction}</h3>{point.context && <p className="study-notes">{point.context}</p>}{(point.subject?.archivedAt || point.content?.archivedAt) && <p className="focus-caption">O vínculo está arquivado; seu ponto de retorno continua salvo.</p>}<MaterialLink url={point.materialUrl} />
        <div className="form-actions"><Link className="text-button" to={`/app/continue/${point.id}/edit`}>Editar ponto de retorno</Link><button className="text-button" disabled={busy} onClick={() => void toggle(point)}>{done ? 'Reabrir ponto' : 'Marcar como concluído'}</button></div>
      </li>)}</ul> : <div className="empty-state"><h3>{done ? 'Nenhum ponto concluído por aqui.' : 'Deixe o próximo passo preparado.'}</h3><p>Uma frase sobre onde parou pode facilitar sua próxima sessão.</p></div>)}
      {resource.data && resource.data.total > 20 && <div className="pagination"><button className="text-button" disabled={page === 1} onClick={() => setParams({ status: done ? 'DONE' : 'OPEN', page: String(page - 1) })}>Anterior</button><span>Página {page}</span><button className="text-button" disabled={page * 20 >= resource.data.total} onClick={() => setParams({ status: done ? 'DONE' : 'OPEN', page: String(page + 1) })}>Próxima</button></div>}
    </section></>;
}
