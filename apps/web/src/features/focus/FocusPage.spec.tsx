import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Router } from '../../app/Router';
import type { FocusSnapshot } from './focus-time';

const time = '2026-11-02T12:00:00Z';
const base: FocusSnapshot = { id: 'session-fixture', status: 'RUNNING', subjectId: null, subjectName: null, activeSeconds: 0, activeStartedAt: time, plannedSeconds: 300, serverNow: time, startedAt: time, finishedAt: null, version: 1, maxConfirmableSeconds: null };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function setup(initial: FocusSnapshot | null = null, mutation?: (url: string, init: RequestInit) => Promise<Response>) {
  let current = initial;
  const fetch = vi.fn((url: string, init: RequestInit = {}) => {
    if (url.endsWith('/auth/me')) return Promise.resolve(json({ user: { id: 'person', name: 'Pessoa fictícia', timeZone: 'America/Sao_Paulo' }, csrfToken: 'csrf-fixture' }));
    if (init.method === 'POST') return (mutation ? mutation(url, init) : Promise.resolve(json(base, 201))).then(async (response) => {
      if (response.ok) {
        const body = await response.clone().json() as FocusSnapshot;
        current = ['COMPLETED', 'INTERRUPTED', 'DISCARDED'].includes(body.status) ? null : body;
      }
      return response;
    });
    if (url.endsWith('/focus-sessions/active')) return Promise.resolve(json(current));
    if (url.includes('/focus-sessions?')) return Promise.resolve(json({ items: [], total: 0, totalXp: 0, page: 1, pageSize: 10 }));
    if (url.includes('/subjects?')) return Promise.resolve(json({ items: [], total: 0, page: 1, pageSize: 100 }));
    return Promise.reject(new Error('URL inesperada'));
  });
  vi.stubGlobal('fetch', fetch);
  render(<MemoryRouter initialEntries={['/app/focus']}><AuthProvider><Router /></AuthProvider></MemoryRouter>);
  return fetch;
}

describe('fluxo de foco', () => {
  it('inicia sem disciplina, aguardando confirmação antes de mostrar timer', async () => {
    const user = userEvent.setup();
    let confirm!: (response: Response) => void;
    const fetch = setup(null, () => new Promise<Response>((resolve) => { confirm = resolve; }));
    await user.click(await screen.findByRole('button', { name: 'Iniciar foco' }));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar foco' })).toBeDisabled();
    confirm(json({ ...base, plannedSeconds: 1500 }, 201));
    await screen.findByRole('timer');
    expect(fetch).toHaveBeenCalledWith('/api/v1/focus-sessions', expect.objectContaining({ body: JSON.stringify({ plannedMinutes: 25, subjectId: null, contentId: null }) }));
    expect(screen.queryByText(/XP acumulados/)).not.toBeInTheDocument();
  });

  it('reconstitui sessão pausada e não exibe recompensa durante o foco', async () => {
    setup({ ...base, status: 'PAUSED', activeSeconds: 60, activeStartedAt: null });
    expect(await screen.findByRole('timer')).toHaveTextContent('04:00');
    expect(screen.getByRole('button', { name: 'Retomar' })).toBeEnabled();
    expect(screen.queryByText(/XP acumulados/)).not.toBeInTheDocument();
  });

  it('chegar a zero não envia finalização nem concede recompensa automática', async () => {
    const fetch = setup({ ...base, serverNow: '2026-11-02T12:05:00Z' });
    expect(await screen.findByRole('timer')).toHaveTextContent('00:00');
    expect(screen.getByText('Tempo previsto encerrado. Conclua quando estiver pronto.')).toBeVisible();
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('sessão pendente exige decisão humana antes de qualquer XP', async () => {
    const user = userEvent.setup();
    const fetch = setup({ ...base, status: 'NEEDS_RECONCILIATION', activeStartedAt: null, activeSeconds: 300, version: 2, maxConfirmableSeconds: 300 }, async () => json({ ...base, status: 'DISCARDED', activeSeconds: 0, xpGranted: 0, totalXp: 0 }));
    await screen.findByRole('heading', { name: 'Quanto tempo você estudou?' });
    expect(screen.getByText(/Nenhum XP foi concedido/)).toBeVisible();
    expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Descartar sem recompensa' }));
    await screen.findByText('A sessão foi descartada sem recompensa.');
    const call = fetch.mock.calls.find(([url]) => url.endsWith('/reconcile'))!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({ outcome: 'DISCARDED', expectedVersion: 2 });
  });

  it('reenvio de conclusão reutiliza chave e corpo sem anunciar sucesso na falha', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const fetch = setup(base, async () => ++attempts === 1
      ? json({ error: { message: 'Serviço indisponível.' } }, 503)
      : json({ ...base, status: 'COMPLETED', activeSeconds: 300, xpGranted: 5, totalXp: 5 }));
    await user.click(await screen.findByRole('button', { name: 'Concluir sessão' }));
    await screen.findByRole('heading', { name: 'Conclusão ainda não confirmada' });
    expect(screen.queryByText('Mais um passo no seu caminho.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar confirmar novamente' }));
    // A consulta posterior tem autoridade; a fixture representa agora ausência de sessão.
    await waitFor(() => expect(attempts).toBe(2));
    await screen.findByText('Mais um passo no seu caminho.');
    const calls = fetch.mock.calls.filter(([url]) => url.endsWith('/finish'));
    expect(calls[0]![1]!.headers).toEqual(calls[1]![1]!.headers);
    expect(calls[0]![1]!.body).toBe(calls[1]![1]!.body);
  });
});
