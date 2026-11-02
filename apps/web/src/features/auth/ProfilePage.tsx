import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './auth-context';
import type { User } from './AuthContext';

export function ProfilePage() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(''); setNotice('');
    try {
      const user = await auth.call<User>('/users/me', { method: 'PATCH', body: JSON.stringify({ name: data.get('name'), timeZone: data.get('timeZone') }) });
      auth.update(user); setNotice('Perfil atualizado.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }
  return <><header className="workspace-heading"><p className="eyebrow">DO SEU JEITO</p><h1>Meu perfil</h1><p>Os detalhes que tornam este espaço seu.</p></header><section className="workspace-card profile-card"><form className="app-form" onSubmit={save}>
    <label>Nome<input name="name" defaultValue={auth.session?.user.name} maxLength={100} required /></label>
    <label>E-mail<input type="email" value={auth.session?.user.emailNormalized ?? ''} readOnly /></label>
    <label>Fuso horário<input name="timeZone" defaultValue={auth.session?.user.timeZone} maxLength={80} required aria-describedby="timezone-help" /></label>
    <small id="timezone-help">Use um fuso IANA, como America/Sao_Paulo. O fuso será usado nas datas locais de estudo; instantes históricos permanecem em UTC.</small>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    <button className="app-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button>
  </form></section></>;
}
