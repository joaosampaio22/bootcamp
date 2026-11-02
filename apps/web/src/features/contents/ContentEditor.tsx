import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useOptions, useRemote } from '../study/use-remote';
import { today } from '../study/study-types';
import type { Content, SubjectOption } from '../study/study-types';

export function ContentEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const subjectId = params.get('subjectId') ?? '';
  const resource = useRemote<Content>(id ? '/contents/' + encodeURIComponent(id) : null);
  const preset = useRemote<SubjectOption>(!id && subjectId ? '/subjects/' + encodeURIComponent(subjectId) : null);
  if (!id && subjectId && preset.loading) return <p role="status" className="app-loading">Carregando disciplina…</p>;
  if (!id && subjectId && (preset.error || !preset.data)) return <div className="form-error"><p role="alert">{preset.error || 'Disciplina indisponível.'}</p><button className="text-button" onClick={preset.reload}>Tentar novamente</button><Link to="/app/contents/new">Escolher outra disciplina</Link></div>;
  if (id && resource.loading) return <p role="status" className="app-loading">Carregando conteúdo…</p>;
  if (id && (resource.error || !resource.data)) return <div className="form-error"><p role="alert">{resource.error || 'Conteúdo indisponível.'}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div>;
  return <ContentForm key={id ?? 'new'} content={id ? resource.data! : undefined} subjectId={subjectId} presetSubject={preset.data} />;
}
function ContentForm({ content, subjectId, presetSubject }: { content?: Content; subjectId: string; presetSubject: SubjectOption | null }) {
  const auth = useAuth(); const navigate = useNavigate();
  const options = useOptions<SubjectOption>('/subjects');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [review, setReview] = useState(content?.reviewEnabled ?? true);
  const [selectedSubject, setSelectedSubject] = useState(content?.subjectId ?? subjectId);
  const fallbackSubject = content?.subject ?? presetSubject;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try {
      const result = await auth.call<Content>(content ? '/contents/' + content.id : '/contents', { method: content ? 'PATCH' : 'POST', body: JSON.stringify({ subjectId: data.get('subjectId'), title: data.get('title'), notes: data.get('notes'), materialUrl: data.get('materialUrl') || null, studiedOn: data.get('studiedOn'), reviewEnabled: review }) });
      navigate('/app/contents/' + result.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }
  return <><header className="workspace-heading"><p className="eyebrow">UM LEMBRETE PARA REVISITAR</p><h1>{content ? 'Editar conteúdo' : 'O que você estudou?'}</h1><p>Um título já basta. As anotações e o material são opcionais.</p></header><section className="workspace-card editor-card"><form onSubmit={save} className="app-form">
    <label>Disciplina<select name="subjectId" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required disabled={busy}><option value="">Escolha uma disciplina</option>{fallbackSubject && !options.items.some((s) => s.id === fallbackSubject.id) && <option value={fallbackSubject.id}>{fallbackSubject.name}{fallbackSubject.archivedAt ? ' (arquivada)' : ''}</option>}{options.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {options.error && <p className="form-error" role="alert">{options.error}</p>}{options.hasMore && <button className="text-button" type="button" disabled={options.busy} onClick={() => void options.more()}>Carregar mais disciplinas</button>}<Link className="text-button" to="/app/subjects">Criar uma disciplina</Link>
    <label>Título do assunto<input name="title" required maxLength={160} defaultValue={content?.title ?? ''} placeholder="Ex.: Herança em Java" /></label>
    <label>Minhas anotações (opcional)<textarea name="notes" maxLength={10000} rows={6} defaultValue={content?.notes ?? ''} /></label>
    <label>Link do material (opcional)<input name="materialUrl" type="url" defaultValue={content?.materialUrl ?? ''} placeholder="https://…" /></label>
    <label>Data em que estudei<input name="studiedOn" type="date" required defaultValue={content?.studiedOn.slice(0,10) ?? today(auth.session?.user.timeZone ?? 'America/Sao_Paulo')} /></label>
    <label className="check-label"><input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} /> Quero revisar periodicamente este conteúdo</label><small>{review ? 'Ao habilitar, a primeira revisão é agendada para amanhã no seu fuso. A realização das revisões chega na próxima etapa.' : 'O assunto será salvo sem revisão ativa. Você pode habilitar depois.'}</small>
    {error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><button className="app-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar conteúdo'}</button><Link className="text-button" to={content ? '/app/contents/' + content.id : '/app/contents'}>Cancelar</Link></div>
  </form></section></>;
}
