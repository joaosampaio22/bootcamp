import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

export function PrivateLayout() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (auth.loading) return <p className="app-loading" role="status">Verificando sua sessão…</p>;
  if (auth.error) return <main className="app-loading"><p role="alert">{auth.error}</p><button className="app-button" onClick={auth.retry}>Tentar novamente</button></main>;
  if (!auth.session) return <Navigate to="/login" replace />;

  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try { await auth.logout(); }
    catch { setError('Não foi possível sair. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <div className="workspace-shell">
    <a className="skip-link" href="#workspace-main">Pular para o conteúdo</a>
    <aside className="workspace-sidebar"><Link className="access-brand" to="/app">estudoemdia.</Link>
      <nav aria-label="Navegação principal"><NavLink to="/app" end>Início</NavLink><NavLink to="/app/focus">Foco</NavLink><NavLink to="/app/subjects">Disciplinas</NavLink><NavLink to="/app/contents">Conteúdos</NavLink><NavLink to="/app/reviews">Revisões</NavLink><NavLink to="/app/continue">Onde parei</NavLink><NavLink to="/app/settings">Meu perfil</NavLink></nav>
      <div className="sidebar-bottom"><p>{auth.session.user.name}</p><button onClick={logout} disabled={busy}>{busy ? 'Saindo…' : 'Sair da conta'}</button>{error && <p role="alert">{error}</p>}</div>
    </aside>
    <main id="workspace-main" className="workspace-content"><Outlet /></main>
  </div>;
}
