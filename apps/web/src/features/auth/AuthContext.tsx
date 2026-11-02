import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, request } from '../../lib/http';

import { AuthContext } from './auth-context';
import type { Session, User } from './auth-context';
export type { Session, User } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    request<Session>('/auth/me', { signal: controller.signal })
      .then((value) => { if (active) { setSession(value); setError(''); } })
      .catch((reason: unknown) => { if (active) {
        setSession(null);
        setError(reason instanceof ApiError && reason.status === 401 ? '' : 'Não foi possível verificar sua sessão.');
      } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  const call = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    try { return await request<T>(path, init, session?.csrfToken); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) { setSession(null); setError(''); }
      throw error;
    }
  }, [session]);

  async function logout() { await call<void>('/auth/logout', { method: 'POST' }); setSession(null); }
  function accept(value: Session) { setSession(value); setError(''); setLoading(false); }
  function retry() { setError(''); setLoading(true); setAttempt((value) => value + 1); }
  function update(user: User) { setSession((current) => current ? { ...current, user } : null); }
  return <AuthContext.Provider value={{ session, loading, error, accept, retry, logout, call, update }}>{children}</AuthContext.Provider>;
}

