import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useOptions, useRemote } from '../study/use-remote';
import type { Content, ReturnPoint, SubjectOption } from '../study/study-types';

export function ReturnPointEditor() {
  const { id } = useParams(); const [params] = useSearchParams();
  const resource = useRemote<ReturnPoint>(id ? '/return-points/' + encodeURIComponent(id) : null);
  const contentId = params.get('contentId') ?? '';
  const subjectId = params.get('subjectId') ?? '';
  const linkedContent = useRemote<Content>(!id && contentId ? '/contents/' + encodeURIComponent(contentId) : null);
  const linkedSubject = useRemote<SubjectOption>(!id && !contentId && subjectId ? '/subjects/' + encodeURIComponent(subjectId) : null);
  const preset = contentId ? linkedContent : linkedSubject;
  if (!id && (contentId || subjectId) && preset.loading) return <p role="status" className="app-loading">Carregando vínculo…</p>;
  if (!id && (contentId || subjectId) && (preset.error || !preset.data)) return <div className="form-error"><p role="alert">{preset.error || 'Vínculo indisponível.'}</p><button className="text-button" onClick={preset.reload}>Tentar novamente</button><Link to="/app/continue/new">Criar sem vínculo</Link></div>;
  if (id && resource.loading) return <p role="status" className="app-loading">Carregando ponto de retorno…</p>;
  if (id && (resource.error || !resource.data)) return <div className="form-error"><p role="alert">{resource.error || 'Ponto indisponível.'}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div>;
  return <PointForm key={id ?? 'new'} point={id ? resource.data! : undefined} contentId={contentId} subjectId={linkedContent.data?.subjectId ?? subjectId} linkedContent={linkedContent.data} linkedSubject={linkedContent.data?.subject ?? linkedSubject.data} />;
}
function PointForm({ point, contentId, subjectId, linkedContent, linkedSubject }: { point?: ReturnPoint; contentId: string; subjectId: string; linkedContent: Content | null; linkedSubject: SubjectOption | null }) {
  const { call } = useAuth(); const navigate = useNavigate();
  const subjects = useOptions<SubjectOption>('/subjects'); const contents = useOptions<Content>('/contents');
  const [selectedSubject, setSelectedSubject] = useState(point?.subjectId ?? subjectId);
  const [selectedContent, setSelectedContent] = useState(point?.contentId ?? contentId);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const fallbackSubject = point?.subject ?? linkedSubject;
  const fallbackContent = point?.content ?? linkedContent;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try {
      await call(point ? '/return-points/' + point.id : '/return-points', { method: point ? 'PATCH' : 'POST', body: JSON.stringify({ subjectId: selectedSubject || null, contentId: selectedContent || null, context: data.get('context'), nextAction: data.get('nextAction'), materialUrl: data.get('materialUrl') || null }) });
      navigate('/app/continue');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }
  return <><header className="workspace-heading"><p className="eyebrow">UM CONVITE PARA CONTINUAR</p><h1>{point ? 'Editar ponto de retorno' : 'Deixe seu próximo passo pronto.'}</h1><p>Só a próxima ação é obrigatória. O restante ajuda você a reencontrar o contexto.</p></header><section className="workspace-card editor-card"><form className="app-form" onSubmit={save}>
    <label>Disciplina (opcional)<select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedContent(''); }}><option value="">Sem disciplina</option>{fallbackSubject && !subjects.items.some((s) => s.id === fallbackSubject.id) && <option value={fallbackSubject.id}>{fallbackSubject.name}</option>}{subjects.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {subjects.hasMore && <button className="text-button" type="button" onClick={() => void subjects.more()} disabled={subjects.busy}>Carregar mais disciplinas</button>}
    <label>Conteúdo (opcional)<select value={selectedContent} onChange={(e) => { setSelectedContent(e.target.value); const content = contents.items.find((c) => c.id === e.target.value); if (content) setSelectedSubject(content.subjectId); }}><option value="">Sem conteúdo</option>{fallbackContent && !contents.items.some((c) => c.id === fallbackContent.id) && <option value={fallbackContent.id}>{fallbackContent.title}</option>}{contents.items.filter((c) => !selectedSubject || c.subjectId === selectedSubject).map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}</select></label>
    {contents.hasMore && <button className="text-button" type="button" onClick={() => void contents.more()} disabled={contents.busy}>Carregar mais conteúdos</button>}{(subjects.error || contents.error) && <p className="focus-caption">Você pode salvar sem vínculos. {subjects.error || contents.error}</p>}
    <label>Onde parei (opcional)<textarea name="context" rows={4} maxLength={2000} defaultValue={point?.context ?? ''} /></label><label>Minha próxima ação<input name="nextAction" required maxLength={500} defaultValue={point?.nextAction ?? ''} placeholder="Ex.: abrir o projeto e executar o exemplo" /></label><label>Link do material (opcional)<input name="materialUrl" type="url" defaultValue={point?.materialUrl ?? ''} placeholder="https://…" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="app-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar ponto'}</button><Link className="text-button" to="/app/continue">Cancelar</Link></div>
  </form></section></>;
}
