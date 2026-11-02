import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { Router } from '../../app/Router';
import type { Review, ReviewReceipt } from './review-types';

const review: Review = { id: 'review-fixture', contentId: 'content-fixture', status: 'ACTIVE', stepIndex: 2, nextDueDate: '2026-11-02T00:00:00Z', version: 1, today: '2026-11-02', overdueDays: 0, canAttempt: true, content: { id: 'content-fixture', title: 'Herança em Java', notes: '<script>Minhas próprias anotações</script>', materialUrl: 'https://example.test/material', reviewEnabled: true, archivedAt: null, subject: { id: 'subject-fixture', name: 'Programação', archivedAt: null } } };
const receipt: ReviewReceipt = { attemptId: 'attempt-fixture', scheduleId: review.id, contentId: review.contentId, rating: 'GOOD', oldStepIndex: 2, newStepIndex: 3, oldDueDate: review.nextDueDate, nextDueDate: '2026-11-16T00:00:00Z', version: 2, xpGranted: 5, totalXp: 15, createdAt: '2026-11-02T12:00:00Z' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const page = (items: unknown[]) => ({ items, total: items.length, page: 1, pageSize: 20, today: '2026-11-02' });
function setup(path = '/app/reviews/' + review.id, handler?: (path: string, init: RequestInit) => Response | Promise<Response> | undefined) {
  const fetch = vi.fn((url: string, init: RequestInit = {}) => {
    const path = url.replace('/api/v1',''); const response = handler?.(path,init);
    if (response) return Promise.resolve(response);
    if (path === '/auth/me') return Promise.resolve(json({ user: { id: 'person-fixture', name: 'Pessoa fictícia', timeZone: 'America/Sao_Paulo' }, csrfToken: 'csrf-fixture' }));
    if (path === '/reviews/' + review.id) return Promise.resolve(json(review));
    if (path.endsWith('/attempts') && init.method === 'POST') return Promise.resolve(json(receipt,201));
    if (path.startsWith('/reviews/due?')) return Promise.resolve(json(page([review])));
    if (path.startsWith('/reviews/upcoming?')) return Promise.resolve(json(page([])));
    if (path.includes('/history?')) return Promise.resolve(json(page([])));
    return Promise.reject(new Error('Rota inesperada: ' + path));
  });
  vi.stubGlobal('fetch',fetch);
  render(<MemoryRouter initialEntries={[path]}><AuthProvider><Router /></AuthProvider></MemoryRouter>);
  return fetch;
}

describe('revisão por autoavaliação', () => {
  it('começa com notas fora do DOM e revelar exibe texto seguro sem enviar avaliação', async () => {
    const user = userEvent.setup(); const fetch = setup();
    await screen.findByRole('heading', { name: review.content.title });
    expect(screen.queryByText(review.content.notes!)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver minhas anotações' }));
    expect(screen.getByText(review.content.notes!)).toBeVisible();
    expect(document.querySelector('.review-notes script')).toBeNull();
    expect(fetch.mock.calls.some(([,init]) => init?.method === 'POST')).toBe(false);
    expect(screen.getByRole('link', { name: /Abrir material/ })).toHaveAttribute('rel','noopener noreferrer');
    await user.click(screen.getByRole('button', { name: 'Ocultar minhas anotações' }));
    expect(screen.queryByText(review.content.notes!)).not.toBeInTheDocument();
  });
  it('aguarda confirmação do servidor antes de mostrar nova data e XP', async () => {
    let confirm!: (response: Response) => void; const user = userEvent.setup();
    const fetch = setup(undefined,(path,init) => path.endsWith('/attempts') && init.method === 'POST' ? new Promise((resolve) => { confirm = resolve; }) : undefined);
    await user.click(await screen.findByRole('button', { name: /^Lembrei bem/ }));
    expect(screen.getByRole('button', { name: /^Muito fácil/ })).toBeDisabled();
    expect(screen.queryByText('5 XP concedidos')).not.toBeInTheDocument();
    confirm(json(receipt,201));
    await screen.findByText('5 XP concedidos');
    expect(screen.getByText('16/11/2026')).toBeVisible();
    expect(screen.getByText(/Esta é uma autoavaliação/)).toBeVisible();
    const call = fetch.mock.calls.find(([url,init]) => url.endsWith('/attempts') && init?.method === 'POST')!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({ rating: 'GOOD', expectedVersion: 1 });
  });
  it('falha de rede não anuncia sucesso; retry usa mesma chave, versão e avaliação', async () => {
    const user = userEvent.setup(); let attempts = 0;
    const fetch = setup(undefined,(path) => path.endsWith('/attempts') ? ++attempts === 1 ? json({ error: { message: 'Serviço indisponível.' } },503) : json(receipt,201) : undefined);
    await user.click(await screen.findByRole('button', { name: /^Lembrei bem/ }));
    await screen.findByRole('heading', { name: 'Revisão ainda não confirmada' });
    expect(screen.queryByText('5 XP concedidos')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Não lembrei/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Tentar confirmar novamente' }));
    await screen.findByText('5 XP concedidos');
    const calls = fetch.mock.calls.filter(([url]) => url.endsWith('/attempts'));
    expect(calls).toHaveLength(2); expect(calls[0]![1]!.headers).toEqual(calls[1]![1]!.headers);
    expect(calls[0]![1]!.body).toBe(calls[1]![1]!.body);
  });
  it('permite classificar sem notas e informa limite diário sem apagar sucesso', async () => {
    const user = userEvent.setup();
    setup(undefined,(path) => path === '/reviews/' + review.id ? json({ ...review, content: { ...review.content, notes: '' } }) : path.endsWith('/attempts') ? json({ ...receipt, xpGranted: 0, totalXp: 50 },201) : undefined);
    await user.click(await screen.findByRole('button', { name: /^Não lembrei/ }));
    await screen.findByText('0 XP concedidos');
    expect(screen.getByText(/Sua revisão foi salva/)).toBeVisible();
  });
  it('versão obsoleta exige atualizar; a nova página oculta notas e desabilita avaliação futura', async () => {
    const user = userEvent.setup(); let changed = false;
    setup(undefined,(path) => {
      if (path.endsWith('/attempts')) { changed = true; return json({ error: { message: 'A revisão mudou em outra aba.' } },409); }
      if (path === '/reviews/' + review.id && changed) return json({ ...review, version: 2, canAttempt: false, nextDueDate: receipt.nextDueDate });
      return undefined;
    });
    await user.click(await screen.findByRole('button', { name: 'Ver minhas anotações' }));
    await user.click(screen.getByRole('button', { name: /^Lembrei bem/ }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: /^Lembrei bem/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Atualizar revisão' }));
    await screen.findByText(/Esta revisão está agendada para uma data futura/);
    expect(screen.queryByText(review.content.notes!)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Muito fácil/ })).toBeDisabled();
  });
  it('não permite avaliar futuro ou material arquivado, mesmo após revelar notas', async () => {
    const user = userEvent.setup();
    const fetch = setup(undefined,(path) => path === '/reviews/' + review.id ? json({ ...review, canAttempt: false, content: { ...review.content, archivedAt: '2026-11-02T12:00:00Z' } }) : undefined);
    await user.click(await screen.findByRole('button', { name: 'Ver minhas anotações' }));
    expect(screen.getByText(/O conteúdo ou a disciplina está arquivado/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: /^Lembrei bem/ }));
    expect(fetch.mock.calls.some(([,init]) => init?.method === 'POST')).toBe(false);
  });
  it('lista vencidas uma vez e permite consultar o estado vazio das futuras', async () => {
    const user = userEvent.setup(); setup('/app/reviews');
    await screen.findByRole('heading', { name: review.content.title });
    expect(screen.getAllByRole('link', { name: 'Tentar lembrar' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Próximas' }));
    await screen.findByRole('heading', { name: 'Sem revisões futuras por aqui.' });
    expect(screen.queryByRole('link', { name: 'Tentar lembrar' })).not.toBeInTheDocument();
  });
  it('erro da fila pode ser reconsultado sem exibir números fictícios', async () => {
    const user = userEvent.setup(); let reads = 0;
    setup('/app/reviews',(path) => path.startsWith('/reviews/due?') && ++reads === 1 ? json({ error: { message: 'Fila indisponível.' } },503) : undefined);
    await screen.findByRole('alert');
    expect(screen.queryByText(/conteúdo nesta lista/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('heading', { name: review.content.title });
  });
  it('histórico apresenta autoavaliação, datas civis e XP persistido', async () => {
    setup('/app/reviews/' + review.id + '/history',(path) => path.includes('/history?') ? json(page([{ id: receipt.attemptId, rating: 'GOOD', oldStepIndex: 2, newStepIndex: 3, oldDueDate: review.nextDueDate, newDueDate: receipt.nextDueDate, createdAt: receipt.createdAt, reward: { id: 'reward-fixture', sourceId: receipt.attemptId, sourceType: 'REVIEW_ATTEMPT', xp: 5, localDate: '2026-11-02' } }])) : undefined);
    await screen.findByRole('heading', { name: 'Lembrei bem' });
    expect(screen.getByText('Antes: 02/11/2026 · Próxima: 16/11/2026')).toBeVisible();
    await waitFor(() => expect(screen.getByText('5 XP concedidos · Autoavaliação')).toBeVisible());
  });
});
