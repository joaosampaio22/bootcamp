import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useRemote } from '../study/use-remote';
import { dateLabel } from '../study/study-types';
import type { Content } from '../study/study-types';
import { MaterialLink } from '../study/MaterialLink';

export function ContentDetail() {
  const { id } = useParams(); const { call } = useAuth();
  const resource = useRemote<Content>('/contents/' + id);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const content = resource.data;
  async function archive() {
    if (!content || busy) return; setBusy(true); setError('');
    try { await call('/contents/' + content.id, { method: 'PATCH', body: JSON.stringify({ archived: !content.archivedAt }) }); resource.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar.'); }
    finally { setBusy(false); }
  }
  if (resource.loading) return <p className="app-loading" role="status">Carregando conteúdo…</p>;
  if (resource.error || !content) return <div className="form-error"><p role="alert">{resource.error || 'Conteúdo indisponível.'}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div>;
  const active = !content.archivedAt && !content.subject.archivedAt;
  return <><header className="workspace-heading"><p className="eyebrow">{content.subject.name}</p><h1>{content.title}</h1><p>Estudado em {dateLabel(content.studiedOn)}{content.archivedAt ? ' · Conteúdo arquivado' : ''}{content.subject.archivedAt ? ' · Disciplina arquivada' : ''}</p></header><section className="workspace-card"><h2>Minhas anotações</h2><p className="study-notes">{content.notes || 'Você ainda não adicionou anotações. O título e o material já ajudam a retomar.'}</p><MaterialLink url={content.materialUrl} />
    <p className="review-status">{content.review?.status === 'ACTIVE' && active ? 'Revisão agendada para ' + dateLabel(content.review.nextDueDate) : 'Sem revisão na fila ativa.'}</p>
    <div className="form-actions"><Link className="app-button" to={`/app/contents/${content.id}/edit`}>Editar conteúdo</Link>{active && <Link className="app-button secondary-button" to={`/app/focus?contentId=${content.id}`}>Estudar este conteúdo</Link>}<Link className="text-button" to={`/app/continue/new?contentId=${content.id}&subjectId=${content.subjectId}`}>Salvar ponto de retorno</Link><button className="text-button" onClick={() => void archive()} disabled={busy}>{content.archivedAt ? 'Restaurar conteúdo' : 'Arquivar conteúdo'}</button></div>{error && <p className="form-error" role="alert">{error}</p>}
    </section></>;
}
