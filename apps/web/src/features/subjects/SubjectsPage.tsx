import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/auth-context';

interface Subject { id: string; name: string; archivedAt: string | null }
interface SubjectList { items: Subject[]; total: number; page: number; pageSize: number }

export function SubjectsPage() {
  const { call, session } = useAuth();
  const [data, setData] = useState<SubjectList | null>(null);
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    call<SubjectList>(`/subjects?archived=${archived}&page=${page}`, { signal: controller.signal })
      .then((value) => { if (active) setData(value); })
      .catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Não foi possível carregar suas disciplinas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [archived, page, revision, call]);

  function reload() { setError(''); setLoading(true); setRevision((value) => value + 1); }
  function filter(value: boolean) { setArchived(value); setPage(1); setData(null); setLoading(true); setEditing(null); setError(''); }
  async function mutate(path: string, body: object, message: string, method = 'PATCH') {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await call(path, { method, body: JSON.stringify(body) });
      if (method === 'POST') { setName(''); setArchived(false); setPage(1); }
      setEditing(null); setNotice(message); reload();
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }
  function create(event: FormEvent) { event.preventDefault(); void mutate('/subjects', { name }, 'Disciplina criada.', 'POST'); }

  return <>
    <header className="workspace-heading"><p className="eyebrow">SEU ESPAÇO DE ESTUDO</p><h1>O que você quer aprender{session?.user.name ? ', ' + session.user.name.split(' ')[0] : ''}?</h1><p>Crie suas disciplinas. Qualquer assunto tem lugar aqui.</p></header>
    <section className="workspace-card" aria-labelledby="new-subject"><h2 id="new-subject">Uma nova disciplina</h2>
      <form onSubmit={create} className="subject-create"><label>Nome da disciplina<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: História da Arte" maxLength={80} required disabled={busy} /></label><button className="app-button" disabled={busy || !name.trim()}>Adicionar disciplina</button></form>
    </section>
    <section className="workspace-card" aria-labelledby="your-subjects"><div className="list-heading"><h2 id="your-subjects">Suas disciplinas</h2><div className="subject-filters" aria-label="Filtrar disciplinas"><button aria-pressed={!archived} onClick={() => filter(false)}>Ativas</button><button aria-pressed={archived} onClick={() => filter(true)}>Arquivadas</button></div></div>
      {notice && <p className="form-success" role="status">{notice}</p>}
      {error && <div className="form-error"><p role="alert">{error}</p><button className="text-button" onClick={reload}>Tentar novamente</button></div>}
      {loading ? <p role="status" className="empty-state">Carregando disciplinas…</p> : !data ? null : !data.items.length ? <div className="empty-state"><span aria-hidden="true">◇</span><h3>{archived ? 'Nenhuma disciplina arquivada.' : 'Seu próximo aprendizado começa aqui.'}</h3><p>{archived ? 'As disciplinas que você arquivar aparecerão nesta lista.' : 'Adicione uma disciplina acima. Você escolhe o nome e o caminho.'}</p></div> : <ul className="subject-list">{data.items.map((subject) => <li key={subject.id}>
        {editing === subject.id ? <form className="subject-edit" onSubmit={(e) => { e.preventDefault(); void mutate('/subjects/' + subject.id, { name: editedName }, 'Nome atualizado.'); }}><label>Novo nome<input autoFocus value={editedName} onChange={(e) => setEditedName(e.target.value)} maxLength={80} required /></label><button className="app-button" disabled={busy || !editedName.trim()}>Salvar</button><button className="text-button" type="button" onClick={() => setEditing(null)}>Cancelar</button></form> : <><span className="subject-monogram" aria-hidden="true">{Array.from(subject.name)[0]?.toLocaleUpperCase()}</span><h3>{subject.name}</h3><div className="subject-actions"><button className="text-button" disabled={busy} aria-label={'Renomear ' + subject.name} onClick={() => { setEditing(subject.id); setEditedName(subject.name); }}>Renomear</button><button className="text-button" disabled={busy} aria-label={(archived ? 'Restaurar ' : 'Arquivar ') + subject.name} onClick={() => void mutate('/subjects/' + subject.id, { archived: !archived }, archived ? 'Disciplina restaurada.' : 'Disciplina arquivada. Histórico preservado.')}>{archived ? 'Restaurar' : 'Arquivar'}</button></div></>}
      </li>)}</ul>}
      {data && data.total > 20 && <div className="pagination"><button className="text-button" disabled={page === 1 || loading} onClick={() => { setPage((v) => v - 1); setLoading(true); }}>Anterior</button><span>Página {page} de {Math.ceil(data.total / 20)}</span><button className="text-button" disabled={page * 20 >= data.total || loading} onClick={() => { setPage((v) => v + 1); setLoading(true); }}>Próxima</button></div>}
    </section>
  </>;
}
