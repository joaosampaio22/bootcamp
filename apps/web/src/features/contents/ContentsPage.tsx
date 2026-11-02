import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRemote } from '../study/use-remote';
import { dateLabel } from '../study/study-types';
import type { Content, Page } from '../study/study-types';

export function ContentsPage() {
  const [query, setQuery] = useSearchParams();
  const [search, setSearch] = useState(query.get('q') ?? '');
  const archived = query.get('archived') === 'true';
  const page = Math.max(1, Number(query.get('page')) || 1);
  const params = new URLSearchParams({ page: String(page), archived: String(archived), q: query.get('q') ?? '' });
  const resource = useRemote<Page<Content>>('/contents?' + params);
  return <><header className="workspace-heading"><p className="eyebrow">O QUE VOCÊ ESTUDOU</p><h1>Seus conteúdos, do seu jeito.</h1><p>Guarde um assunto, uma anotação ou um link. Não é preciso transferir todo o seu material.</p><Link className="primary-link" to="/app/contents/new">Registrar conteúdo</Link></header>
    <section className="workspace-card"><div className="list-heading"><h2>Conteúdos registrados</h2><div className="subject-filters"><button aria-pressed={!archived} onClick={() => setQuery({ q: query.get('q') ?? '', archived: 'false' })}>Ativos</button><button aria-pressed={archived} onClick={() => setQuery({ q: query.get('q') ?? '', archived: 'true' })}>Arquivados</button></div></div>
      <form className="study-search app-form" onSubmit={(e) => { e.preventDefault(); setQuery({ q: search, archived: String(archived) }); }}><label>Pesquisar por título ou notas<input value={search} maxLength={200} onChange={(e) => setSearch(e.target.value)} /></label><button className="app-button">Buscar</button></form>
      {resource.loading ? <p className="empty-state" role="status">Carregando conteúdos…</p> : resource.error ? <div className="form-error"><p role="alert">{resource.error}</p><button className="text-button" onClick={resource.reload}>Tentar novamente</button></div> : resource.data && (resource.data.items.length ? <ul className="study-list">{resource.data.items.map((content) => <li key={content.id}><div><p className="eyebrow">{content.subject.name}</p><h3><Link to={'/app/contents/' + content.id}>{content.title}</Link></h3><p>Estudado em {dateLabel(content.studiedOn)}</p><p>{content.subject.archivedAt ? 'Disciplina arquivada' : content.archivedAt ? 'Conteúdo arquivado' : content.review?.status === 'ACTIVE' ? 'Revisão agendada: ' + dateLabel(content.review.nextDueDate) : 'Sem revisão ativa'}</p></div><Link className="text-button" to={'/app/contents/' + content.id}>Ver conteúdo</Link></li>)}</ul> : <div className="empty-state"><h3>{query.get('q') ? 'Nenhum conteúdo encontrado.' : 'Um lembrete para o que você aprendeu.'}</h3><p>{query.get('q') ? 'Tente outro termo na busca.' : 'Registre seu primeiro assunto quando quiser. O foco continua disponível sem conteúdo cadastrado.'}</p></div>)}
      {resource.data && resource.data.total > 20 && <div className="pagination"><button className="text-button" disabled={page === 1} onClick={() => setQuery({ ...Object.fromEntries(query), page: String(page - 1) })}>Anterior</button><span>Página {page}</span><button className="text-button" disabled={page * 20 >= resource.data.total} onClick={() => setQuery({ ...Object.fromEntries(query), page: String(page + 1) })}>Próxima</button></div>}
    </section></>;
}
