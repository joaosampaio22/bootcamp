import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { request } from '../../lib/http';
import { useAuth } from './auth-context';
import type { Session } from './AuthContext';

export function AccessPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (auth.loading) return <p className="app-loading" role="status">Verificando sua sessão…</p>;
  if (auth.session) return <Navigate to="/app" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const data = await request<Session>(register ? '/auth/register' : '/auth/login', {
        method: 'POST', body: JSON.stringify({
          email: values.get('email'), password: values.get('password'),
          ...(register ? { name: values.get('name'), timeZone: values.get('timeZone') } : {})
        })
      });
      auth.accept(data);
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }

  return <div className="access-page">
    <aside className="access-aside"><Link className="access-brand" to="/">estudoemdia.</Link>
      <div><span className="eyebrow">UM PASSO DE CADA VEZ</span><h1>Seu caminho começa<br />com um pequeno passo.</h1><p>Um espaço para organizar o que você escolheu estudar. Sem catálogos obrigatórios, no seu ritmo.</p></div>
      <small>Feito para continuar.</small>
    </aside>
    <main className="access-main"><div className="access-card">
      <Link className="mobile-brand" to="/">estudoemdia.</Link>
      <p className="eyebrow">BEM-VINDO AO SEU ESPAÇO</p>
      <h1>{register ? 'Vamos começar?' : 'Bom ter você de volta.'}</h1>
      <p>{register ? 'Crie sua conta e organize suas disciplinas.' : 'Entre para continuar de onde parou.'}</p>
      <form onSubmit={submit} className="app-form">
        {register && <label>Seu nome<input name="name" autoComplete="name" maxLength={100} required /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Senha<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : 1} maxLength={128} required aria-describedby={register ? 'password-help' : undefined} /></label>
        {register && <><small id="password-help">Use pelo menos 12 caracteres. Prefira uma frase única.</small>
          <label>Fuso horário<input name="timeZone" defaultValue="America/Sao_Paulo" list="time-zones" required maxLength={80} /><datalist id="time-zones"><option value="America/Sao_Paulo" /><option value="America/Manaus" /><option value="Europe/Lisbon" /><option value="UTC" /></datalist></label></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="app-button" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar minha conta' : 'Entrar'}</button>
      </form>
      <p className="access-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem conta?'} <Link to={register ? '/login' : '/register'}>{register ? 'Entrar' : 'Criar conta'}</Link></p>
    </div></main>
  </div>;
}
