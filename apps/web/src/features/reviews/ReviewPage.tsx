import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ApiError } from '../../lib/http';
import { useRemote } from '../study/use-remote';
import { dateLabel } from '../study/study-types';
import { MaterialLink } from '../study/MaterialLink';
import { ratings } from './review-types';
import type { Rating, Review, ReviewReceipt } from './review-types';

interface Pending { key: string; body: { rating: Rating; expectedVersion: number } }
export function ReviewPage() {
  const { id } = useParams();
  const resource = useRemote<Review>('/reviews/' + encodeURIComponent(id ?? ''));
  if (resource.loading) return <p role="status" className="app-loading">Preparando sua revisão…</p>;
  if (resource.error || !resource.data) return <div className="form-error"><p role="alert">{resource.error || 'Revisão indisponível.'}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div>;
  return <ReviewCard key={resource.data.id + ':' + resource.data.version} review={resource.data} reload={resource.reload} />;
}

function ReviewCard({ review, reload }: { review: Review; reload: () => void }) {
  const { call } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [receipt, setReceipt] = useState<ReviewReceipt | null>(null);
  const acting = useRef(false);
  async function submit(operation: Pending) {
    if (acting.current) return;
    acting.current = true; setBusy(true); setError('');
    try {
      const result = await call<ReviewReceipt>(`/reviews/${review.id}/attempts`, { method: 'POST', body: JSON.stringify(operation.body), headers: { 'Idempotency-Key': operation.key } });
      setReceipt(result); setPending(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível confirmar.');
      if (reason instanceof ApiError && reason.status >= 400 && reason.status < 500) { setPending(null); setConflict(true); }
      else setPending(operation);
    } finally { acting.current = false; setBusy(false); }
  }
  function rate(rating: Rating) {
    if (busy || pending || conflict || receipt) return;
    void submit({ key: crypto.randomUUID(), body: { rating, expectedVersion: review.version } });
  }
  const archived = !!review.content.archivedAt || !!review.content.subject.archivedAt;
  return <><header className="workspace-heading"><p className="eyebrow">{review.content.subject.name}</p><h1>{review.content.title}</h1><p>Agendada para {dateLabel(review.nextDueDate)} · Sua lembrança, sua avaliação.</p></header>
    {receipt ? <section className="workspace-card review-result" role="status"><p className="eyebrow">REVISÃO REGISTRADA</p><h2>Mais um encontro com o que você aprendeu.</h2><p className="review-status">Próxima revisão: <strong>{dateLabel(receipt.nextDueDate)}</strong></p><p><strong>{receipt.xpGranted} XP concedidos</strong>{receipt.xpGranted === 0 ? ' · O limite diário de 50 XP por revisões foi atingido. Sua revisão foi salva.' : ''}</p><p className="focus-caption">Esta é uma autoavaliação, sem correção objetiva ou garantia de retenção.</p><div className="form-actions"><Link className="app-button" to="/app/reviews">Voltar às revisões</Link><Link className="text-button" to={`/app/reviews/${review.id}/history`}>Ver histórico</Link><Link className="text-button" to="/app">Voltar ao início</Link></div></section> : <section className="workspace-card review-card">
      <p className="eyebrow">TENTE LEMBRAR</p><h2>O que você consegue lembrar sobre esse assunto?</h2><p className="focus-caption">Tente recuperar as ideias antes de consultar suas notas ou abrir o material. Você pode avaliar mesmo sem notas.</p>
      <button className="app-button secondary-button" onClick={() => setRevealed((value) => !value)} aria-expanded={revealed} aria-controls="review-notes">{revealed ? 'Ocultar minhas anotações' : 'Ver minhas anotações'}</button>
      {revealed && <div id="review-notes" className="review-notes"><h3>Minhas anotações</h3><p className="study-notes">{review.content.notes || 'Você não adicionou notas. Pode tentar lembrar pelo título ou consultar seu próprio material.'}</p></div>}
      <div className="review-material"><MaterialLink url={review.content.materialUrl} /></div>
      {!review.canAttempt && <p className="review-status">{archived ? 'O conteúdo ou a disciplina está arquivado. O histórico continua salvo.' : review.status !== 'ACTIVE' || !review.content.reviewEnabled ? 'A revisão está suspensa. Você pode reativá-la no conteúdo.' : 'Esta revisão está agendada para uma data futura. Volte a partir do dia indicado.'}</p>}
      <h3 className="rating-heading">Como foi sua lembrança?</h3><p className="focus-caption">Escolha uma autoavaliação. Não há resposta certa ou errada verificada pelo app.</p>
      <div className="review-ratings">{ratings.map((rating) => <button className="rating-button" key={rating.value} disabled={!review.canAttempt || busy || !!pending || conflict} onClick={() => rate(rating.value)}><strong>{rating.label}</strong><span>{rating.explanation}</span></button>)}</div>
      {busy && <p role="status">Confirmando sua revisão…</p>}{error && <p role="alert" className="form-error">{error}</p>}
      {pending && <div className="review-pending"><h3>Revisão ainda não confirmada</h3><p>Reenviar a mesma avaliação é seguro. Sua recompensa não será duplicada.</p><button className="app-button" disabled={busy} onClick={() => void submit(pending)}>Tentar confirmar novamente</button></div>}
      {conflict && <button className="app-button" onClick={reload} disabled={busy}>Atualizar revisão</button>}
      <div className="form-actions"><Link className="text-button" to={`/app/reviews/${review.id}/history`}>Ver histórico</Link><Link className="text-button" to={'/app/contents/' + review.contentId}>Ver conteúdo</Link><Link className="text-button" to="/app/reviews">Voltar à lista</Link></div>
    </section>}
  </>;
}
