import { useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-context';
import type { Page } from './study-types';

export function useRemote<T>(path: string | null) {
  const { call } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ path: string | null; data: T | null; loading: boolean; error: string }>({ path, data: null, loading: !!path, error: '' });
  useEffect(() => {
    if (!path) return;
    let alive = true; const controller = new AbortController();
    call<T>(path, { signal: controller.signal })
      .then((data) => { if (alive) setState({ path, data, loading: false, error: '' }); })
      .catch((error: unknown) => { if (alive) setState({ path, data: null, loading: false, error: error instanceof Error ? error.message : 'Não foi possível carregar.' }); });
    return () => { alive = false; controller.abort(); };
  }, [path, revision, call]);
  const current = state.path === path ? state : { path, data: null, loading: !!path, error: '' };
  function reload() { if (!path) return; setState((value) => ({ ...value, loading: true, error: '' })); setRevision((value) => value + 1); }
  return { ...current, reload };
}

export function useOptions<T>(path: string) {
  const { call } = useAuth();
  const first = useRemote<Page<T>>(path + '?pageSize=100');
  const [extra, setExtra] = useState<Page<T> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const data = extra ?? first.data;
  async function more() {
    if (!data || busy) return;
    setBusy(true); setError('');
    try { const next = await call<Page<T>>(path + `?pageSize=100&page=${data.page + 1}`); setExtra({ ...next, items: [...data.items, ...next.items] }); }
    catch { setError('Não foi possível carregar outras opções.'); }
    finally { setBusy(false); }
  }
  return { items: data?.items ?? [], loading: first.loading, error: error || first.error, more, busy, hasMore: !!data && data.items.length < data.total };
}
