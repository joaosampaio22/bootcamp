import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ApiError } from '../../lib/http';
import { FocusTimer } from './FocusTimer';
import type { FinishedFocus, FocusHistory, FocusSnapshot } from './focus-time';
import { useOptions } from '../study/use-remote';
import type { Content } from '../study/study-types';

interface Pending { path: string; body: object; key: string }
interface SubjectPage { items: { id: string; name: string }[]; page: number; pageSize: number; total: number }
const labels = { RUNNING: 'Em andamento', PAUSED: 'Pausada', NEEDS_RECONCILIATION: 'Aguardando confirmação', COMPLETED: 'Concluída', INTERRUPTED: 'Interrompida', DISCARDED: 'Descartada' };

export function FocusPage() {
  const { call, session: auth } = useAuth();
  const [params] = useSearchParams();
  const initialContentId = params.get('contentId');
  const contents = useOptions<Content>('/contents');
  const [contentId, setContentId] = useState('');
  const [presetContent, setPresetContent] = useState<Content | null>(null);
  const [prefilling, setPrefilling] = useState(!!initialContentId);
  const [timed, setTimed] = useState<{ session: FocusSnapshot; receivedAt: number } | null>(null);
  const [history, setHistory] = useState<FocusHistory | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FinishedFocus | null>(null);
  const [minutes, setMinutes] = useState(25);
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<SubjectPage | null>(null);
  const [subjectError, setSubjectError] = useState('');
  const [confirmedMinutes, setConfirmedMinutes] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  const acting = useRef(false);
  const recoverySeen = useRef('');
  const active = timed?.session ?? null;
  const invalidate = useCallback(() => { generation.current++; }, []);

  const receive = useCallback((value: FocusSnapshot | null) => {
    setTimed(value ? { session: value, receivedAt: performance.now() } : null);
    const recovery = value?.status === 'NEEDS_RECONCILIATION' ? `${value.id}:${value.version}` : '';
    if (recovery && recovery !== recoverySeen.current) setConfirmedMinutes(Math.floor((value!.maxConfirmableSeconds ?? 0) / 60));
    recoverySeen.current = recovery;
    setResult((previous) => value && previous?.id !== value.id ? null : previous);
  }, []);

  const refresh = useCallback((includeHistory = true) => {
    const epoch = generation.current;
    return Promise.all([
        call<FocusSnapshot | null>('/focus-sessions/active'),
        includeHistory ? call<FocusHistory>(`/focus-sessions?page=${page}&pageSize=10`) : Promise.resolve(null)
      ]).then(([current, log]) => {
      if (mounted.current && generation.current === epoch) {
        receive(current); if (log) setHistory(log); setLoaded(true);
      }
    }).catch((reason: unknown) => { if (mounted.current && generation.current === epoch) setError(reason instanceof Error ? reason.message : 'Não foi possível recuperar a sessão.'); })
      .finally(() => { if (mounted.current && generation.current === epoch) setLoading(false); });
  }, [call, page, receive]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const poll = setInterval(() => { if (!acting.current) void refresh(false); }, 15000);
    const visible = () => { if (document.visibilityState === 'visible' && !acting.current) void refresh(); };
    window.addEventListener('focus', visible); document.addEventListener('visibilitychange', visible);
    return () => { mounted.current = false; invalidate(); clearInterval(poll); window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible); };
  }, [refresh, invalidate]);

  useEffect(() => {
    let alive = true;
    call<SubjectPage>('/subjects?pageSize=100').then((data) => { if (alive) setSubjects(data); })
      .catch(() => { if (alive) setSubjectError('Você pode iniciar sem disciplina. Não foi possível carregar a lista.'); });
    return () => { alive = false; };
  }, [call]);

  useEffect(() => {
    if (!initialContentId) return;
    let alive = true;
    call<Content>('/contents/' + encodeURIComponent(initialContentId)).then((value) => {
      if (!alive) return;
      if (value.archivedAt || value.subject.archivedAt) { setError('Este conteúdo está arquivado. Você pode iniciar um foco livre.'); return; }
      setPresetContent(value); setContentId(value.id); setSubjectId(value.subjectId);
    }).catch(() => { if (alive) setError('Não foi possível vincular esse conteúdo. Você pode escolher outro ou iniciar livre.'); })
      .finally(() => { if (alive) setPrefilling(false); });
    return () => { alive = false; };
  }, [initialContentId, call]);

  async function moreSubjects() {
    if (!subjects || busy) return;
    setBusy(true); setSubjectError('');
    try { const data = await call<SubjectPage>(`/subjects?pageSize=100&page=${subjects.page + 1}`); setSubjects({ ...data, items: [...subjects.items, ...data.items] }); }
    catch { setSubjectError('Não foi possível carregar outras disciplinas. Tente novamente.'); }
    finally { setBusy(false); }
  }

  async function transition(path: string, body: object) {
    if (acting.current || pendingRef.current) return;
    acting.current = true; generation.current++; setBusy(true); setError('');
    try { receive(await call<FocusSnapshot>(path, { method: 'POST', body: JSON.stringify(body) })); setResult(null); setLoaded(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'A operação não foi confirmada.'); await refresh(); }
    finally { acting.current = false; setBusy(false); }
  }

  async function critical(operation: Pending) {
    if (acting.current) return;
    acting.current = true; generation.current++; setBusy(true); setError(''); pendingRef.current = operation;
    try {
      const confirmed = await call<FinishedFocus>(operation.path, { method: 'POST', body: JSON.stringify(operation.body), headers: { 'Idempotency-Key': operation.key } });
      pendingRef.current = null; setPending(null); receive(null); setResult(confirmed); await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'A conclusão não foi confirmada.');
      if (reason instanceof ApiError && reason.status >= 400 && reason.status < 500) {
        pendingRef.current = null; setPending(null); await refresh();
      } else { setPending(operation); }
    } finally { acting.current = false; setBusy(false); }
  }

  function finish(outcome: 'COMPLETED' | 'INTERRUPTED' | 'DISCARDED', reconcile = false) {
    if (!active) return;
    const op = pendingRef.current ?? {
      path: `/focus-sessions/${active.id}/${reconcile ? 'reconcile' : 'finish'}`, key: crypto.randomUUID(),
      body: { outcome, expectedVersion: active.version, ...(reconcile && outcome !== 'DISCARDED' ? { confirmedActiveSeconds: confirmedMinutes * 60 } : {}) }
    };
    void critical(op);
  }
  function start(event: FormEvent) { event.preventDefault(); void transition('/focus-sessions', { plannedMinutes: minutes, subjectId: subjectId || null, contentId: contentId || null }); }
  const disabled = busy || !!pending || prefilling;
  const contentOptions = presetContent && !contents.items.some((c) => c.id === presetContent.id) ? [presetContent, ...contents.items] : contents.items;
  const linkedSubject = contentOptions.find((c) => c.id === contentId)?.subject;
  const subjectOptions = linkedSubject && !subjects?.items.some((s) => s.id === linkedSubject.id) ? [linkedSubject, ...(subjects?.items ?? [])] : subjects?.items ?? [];

  return <>
    <header className="workspace-heading"><p className="eyebrow">UM PASSO DE CADA VEZ</p><h1>Um espaço para agora.</h1><p>Escolha seu tempo. Estude o que quiser.</p></header>
    {error && <div className="form-error"><p role="alert">{error}</p><button className="text-button" onClick={() => { setError(''); void refresh(); }} disabled={busy}>Consultar estado da sessão</button></div>}
    {pending && <section className="workspace-card"><h2>Conclusão ainda não confirmada</h2><p>Reenviar a mesma operação é seguro: sua recompensa não será duplicada.</p><button className="app-button" disabled={busy} onClick={() => void critical(pending)}>Tentar confirmar novamente</button></section>}
    {loading ? <p role="status" className="empty-state">Recuperando seu foco…</p> : !loaded ? <div className="workspace-card"><p>Precisamos consultar o servidor antes de iniciar.</p><button className="app-button" onClick={() => { setLoading(true); setError(''); void refresh(); }}>Tentar novamente</button></div> : active?.status === 'NEEDS_RECONCILIATION' ? <section className="workspace-card recovery-card">
      <p className="eyebrow">VAMOS RETOMAR COM CLAREZA</p><h2>Quanto tempo você estudou?</h2><p>A sessão ficou aberta além do tempo previsto. Nenhum XP foi concedido. Confirme o período estudado ou descarte esta sessão para começar outra.</p>
      <form onSubmit={(event) => { event.preventDefault(); finish('COMPLETED', true); }} className="app-form"><label>Minutos de estudo que você confirma<input type="number" min={0} max={Math.floor((active.maxConfirmableSeconds ?? 0) / 60)} step={1} required value={confirmedMinutes} disabled={disabled} onChange={(e) => setConfirmedMinutes(Number(e.target.value))} /></label><small>Até {Math.floor((active.maxConfirmableSeconds ?? 0) / 60)} minutos, conforme o limite registrado no servidor. Este tempo é autodeclarado.</small><div className="focus-actions"><button className="app-button" disabled={disabled}>Confirmar e concluir</button><button className="text-button" type="button" disabled={disabled} onClick={() => finish('INTERRUPTED', true)}>Confirmar como interrompida</button></div></form>
      <button className="text-button" disabled={disabled} onClick={() => finish('DISCARDED', true)}>Descartar sem recompensa</button>
    </section> : active && timed ? <section className="workspace-card focus-stage" aria-label="Sessão de foco">
      <p className="eyebrow">{active.status === 'PAUSED' ? 'PAUSA' : 'SEU MOMENTO DE FOCO'}</p><h2>{active.contentTitle ?? active.subjectName ?? 'Foco livre'}</h2><FocusTimer session={active} receivedAt={timed.receivedAt} />
      <div className="focus-actions"><button className="app-button" disabled={disabled} onClick={() => void transition(`/focus-sessions/${active.id}/${active.status === 'RUNNING' ? 'pause' : 'resume'}`, { expectedVersion: active.version })}>{active.status === 'RUNNING' ? 'Pausar' : 'Retomar'}</button><button className="app-button secondary-button" disabled={disabled} onClick={() => finish('COMPLETED')}>Concluir sessão</button></div>
      <button className="text-button" disabled={disabled} onClick={() => finish('INTERRUPTED')}>Encerrar como interrompida</button>
    </section> : <>
      {result && <section className="workspace-card focus-result" aria-label="Resultado da sessão"><p className="eyebrow">SESSÃO REGISTRADA</p><h2>{result.status === 'DISCARDED' ? 'Tudo bem recomeçar.' : 'Mais um passo no seu caminho.'}</h2><p>{Math.floor(result.activeSeconds / 60)} minutos registrados · <strong>{result.xpGranted} XP concedidos</strong></p><p className="focus-caption">{result.status === 'DISCARDED' ? 'A sessão foi descartada sem recompensa.' : result.xpGranted === 0 ? 'O registro foi salvo. XP exige pelo menos 5 minutos e respeita os limites por sessão e por dia.' : 'Recompensa por estudo registrado, sem avaliação da qualidade da concentração.'}</p><div className="form-actions"><Link className="text-button" to={result.contentId ? '/app/contents/' + result.contentId : '/app/contents/new' + (result.subjectId ? '?subjectId=' + result.subjectId : '')}>{result.contentId ? 'Ver conteúdo' : 'Registrar conteúdo (opcional)'}</Link><Link className="text-button" to={'/app/continue/new?' + new URLSearchParams({ ...(result.subjectId ? { subjectId: result.subjectId } : {}), ...(result.contentId ? { contentId: result.contentId } : {}) })}>Salvar ponto de retorno (opcional)</Link><Link className="text-button" to="/app">Voltar ao início</Link></div></section>}
      <section className="workspace-card"><h2>Prepare seu próximo passo</h2><p className="focus-caption">Nenhuma disciplina ou conteúdo precisa estar cadastrado para começar.</p>
        <form onSubmit={start} className="app-form focus-setup"><div className="duration-presets" aria-label="Durações sugeridas">{[10,25,50].map((value) => <button type="button" key={value} aria-pressed={minutes === value} onClick={() => setMinutes(value)}>{value} min</button>)}</div><label>Duração prevista em minutos<input type="number" min={5} max={120} step={1} required value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} disabled={disabled} /></label><label>Disciplina (opcional)<select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setContentId(''); }} disabled={disabled}><option value="">Foco livre — sem disciplina</option>{subjectOptions.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <label>Conteúdo (opcional)<select value={contentId} disabled={disabled} onChange={(e) => { setContentId(e.target.value); const content = contentOptions.find((c) => c.id === e.target.value); if (content) setSubjectId(content.subjectId); }}><option value="">Sem conteúdo</option>{contentOptions.filter((c) => !subjectId || c.subjectId === subjectId).map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}</select></label>{contents.hasMore && <button className="text-button" type="button" disabled={contents.busy || disabled} onClick={() => void contents.more()}>Carregar mais conteúdos</button>}
          {subjectError && <p role="status" className="focus-caption">{subjectError}</p>}{subjects && subjects.items.length < subjects.total && <button type="button" className="text-button" onClick={() => void moreSubjects()} disabled={disabled}>Carregar mais disciplinas</button>}
          <small>Entre 5 e 120 minutos. XP: mínimo de 5 minutos, até 60 por sessão e 180 por dia no seu fuso.</small><button className="app-button" disabled={disabled}>Iniciar foco</button></form>
      </section>
      {history && <section className="workspace-card"><div className="list-heading"><h2>Suas sessões</h2><span className="focus-caption">{history.totalXp} XP acumulados</span></div>{history.items.length === 0 ? <p className="empty-state">Seu histórico começa com a primeira sessão.</p> : <ul className="focus-history">{history.items.map((entry) => <li key={entry.id}><div><strong>{entry.subjectName ?? 'Foco livre'}</strong><p>{labels[entry.status]} · {new Date(entry.finishedAt ?? entry.startedAt).toLocaleDateString('pt-BR', { timeZone: auth?.user.timeZone ?? 'America/Sao_Paulo' })}</p></div><span>{Math.floor(entry.activeSeconds / 60)} min · {entry.reward?.xp ?? 0} XP</span></li>)}</ul>}{history.total > 10 && <div className="pagination"><button className="text-button" disabled={page === 1} onClick={() => { setLoading(true); setPage((v) => v - 1); }}>Anterior</button><span>Página {page}</span><button className="text-button" disabled={page * 10 >= history.total} onClick={() => { setLoading(true); setPage((v) => v + 1); }}>Próxima</button></div>}</section>}
    </>}
  </>;
}
