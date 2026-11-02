import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { Router } from '../../app/Router';
import type { Academy, Statistics } from './progress-types';

const academy: Academy = { totalXp: 350, focusXp: 345, reviewXp: 5, stage: 3, stageName: 'Universidade', assetUrl: '/academy/stage-3.svg', stageStartXp: 350, nextStageXp: 800, nextStageName: 'Cidade do Conhecimento', remainingXp: 450, stages: [ { stage: 1, name: 'Fundação', startXp: 0, assetUrl: '/academy/stage-1.svg' },{ stage: 2, name: 'Campus', startXp: 100, assetUrl: '/academy/stage-2.svg' },{ stage: 3, name: 'Universidade', startXp: 350, assetUrl: '/academy/stage-3.svg' },{ stage: 4, name: 'Cidade do Conhecimento', startXp: 800, assetUrl: '/academy/stage-4.svg' } ] };
const stats: Statistics = { timeZone: 'America/Sao_Paulo', range: { from: '2026-11-01', to: '2026-11-02' }, metrics: { focusSeconds: 330, finishedSessions: 2, completedSessions: 1, interruptedSessions: 1, reviewCount: 1, daysWithStudy: 1 }, daily: [{ date: '2026-11-01', focusSeconds: 300, finishedSessions: 1, completedSessions: 1, interruptedSessions: 0, reviewCount: 0, studied: true },{ date: '2026-11-02', focusSeconds: 30, finishedSessions: 1, completedSessions: 0, interruptedSessions: 1, reviewCount: 1, studied: false }] };
const json = (body: unknown,status = 200) => new Response(JSON.stringify(body),{ status, headers: { 'Content-Type': 'application/json' } });
const emptyEvents = { items: [], total: 0, page: 1, pageSize: 20 };
function setup(path: string, handler?: (path: string,init: RequestInit) => Response | Promise<Response> | undefined) {
  const fetch = vi.fn((url: string,init: RequestInit = {}) => {
    const path = url.replace('/api/v1',''); const result = handler?.(path,init); if (result) return Promise.resolve(result);
    if (path === '/auth/me') return Promise.resolve(json({ user: { id: 'person-fixture', name: 'Pessoa fictícia', timeZone: 'America/Sao_Paulo' }, csrfToken: 'csrf-fixture' }));
    if (path === '/academy') return Promise.resolve(json(academy));
    if (path.startsWith('/academy/events?')) return Promise.resolve(json(emptyEvents));
    if (path.startsWith('/statistics/summary')) return Promise.resolve(json(stats));
    return Promise.reject(new Error('Rota inesperada: ' + path));
  });
  vi.stubGlobal('fetch',fetch);
  render(<MemoryRouter initialEntries={[path]}><AuthProvider><Router /></AuthProvider></MemoryRouter>);
  return fetch;
}
describe('academia e estatísticas', () => {
  it('apresenta estágio/asset da API, origens do XP e progresso até o próximo limiar', async () => {
    setup('/app/academy');
    const image = await screen.findByRole('img', { name: 'Academia Viva, estágio 3: Universidade' });
    expect(image).toHaveAttribute('src','/academy/stage-3.svg');
    expect(screen.getByText('345')).toBeVisible(); expect(screen.getByText('5')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('max','450');
    expect(screen.getByText('Faltam 450 XP para Cidade do Conhecimento.')).toBeVisible();
    expect(document.querySelectorAll('.academy-stages [aria-current=step]')).toHaveLength(1);
  });
  it('quarto estágio não inventa próximo nível ou barra adicional', async () => {
    setup('/app/academy',(path) => path === '/academy' ? json({ ...academy, stage: 4, stageName: 'Cidade do Conhecimento', totalXp: 900, stageStartXp: 800, assetUrl: '/academy/stage-4.svg', nextStageXp: null, nextStageName: null, remainingXp: 0 }) : undefined);
    await screen.findByRole('img', { name: /estágio 4/ });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(/Você chegou ao quarto estágio/)).toBeVisible();
  });
  it('carregamento/erro não vira XP zero fictício e permite tentar novamente', async () => {
    let reads = 0; const user = userEvent.setup();
    setup('/app/academy',(path) => path === '/academy' && ++reads === 1 ? json({ error: { message: 'Progresso indisponível.' } },503) : undefined);
    await screen.findByRole('alert');
    expect(screen.queryByText('XP acumulados')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('img', { name: /estágio 3/ });
  });
  it('extrato mostra origem real, evento zero e filtro sem enviar mutações', async () => {
    const user = userEvent.setup();
    const fetch = setup('/app/academy',(path) => path.startsWith('/academy/events?') ? json({ ...emptyEvents, total: 1, items: [{ id: 'reward-fixture', sourceType: 'FOCUS_SESSION', sourceId: 'session-fixture', title: 'Foco livre', xp: 0, localDate: '2026-11-02T00:00:00Z', createdAt: '2026-11-02T12:00:00Z', historyPath: '/app/focus' }] }) : undefined);
    await screen.findByRole('heading', { name: 'Foco livre' });
    expect(screen.getByText('0 XP')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Consultar histórico' })).toHaveAttribute('href','/app/focus');
    await user.selectOptions(screen.getByLabelText('Filtrar origem do XP'),'REVIEW_ATTEMPT');
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('sourceType=REVIEW_ATTEMPT'))).toBe(true));
    expect(fetch.mock.calls.some(([,init]) => init?.method === 'POST')).toBe(false);
  });
  it('estatísticas mostram tempo e sessões confirmados e gráfico consultável por teclado', async () => {
    const user = userEvent.setup(); setup('/app/statistics');
    await screen.findByText('5 min 30 s');
    expect(screen.getByText('1 concluída · 1 interrompida')).toBeVisible();
    const day = screen.getByRole('button', { name: '02/11/2026: 0 min 30 s' });
    day.focus(); await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('02/11/2026 · 0 min 30 s · 1 sessão finalizada · 1 revisão');
    await user.click(screen.getByText('Ver dados por dia em tabela'));
    expect(screen.getByRole('table', { name: 'Registros diários no fuso do perfil' })).toBeVisible();
  });
  it('período personalizado só apresenta o novo resultado depois da resposta', async () => {
    const user = userEvent.setup(); let confirm!: (response: Response) => void;
    const fetch = setup('/app/statistics',(path) => path.includes('from=2026-10-01') ? new Promise((resolve) => { confirm = resolve; }) : undefined);
    await screen.findByText('5 min 30 s');
    await user.clear(screen.getByLabelText('De')); await user.type(screen.getByLabelText('De'),'2026-10-01');
    await user.clear(screen.getByLabelText('Até')); await user.type(screen.getByLabelText('Até'),'2026-10-02');
    await user.click(screen.getByRole('button', { name: 'Aplicar período' }));
    expect(screen.getByRole('status')).toHaveTextContent('Consultando seus registros');
    expect(screen.queryByText('5 min 30 s')).not.toBeInTheDocument();
    confirm(json({ ...stats, range: { from: '2026-10-01', to: '2026-10-02' } }));
    await screen.findByText(/De 01\/10\/2026 a 02\/10\/2026/);
    expect(fetch.mock.calls.some(([url]) => url.includes('from=2026-10-01&to=2026-10-02'))).toBe(true);
  });
  it('estado vazio exibe os dados zerados confirmados pela API', async () => {
    setup('/app/statistics',(path) => path.startsWith('/statistics/') ? json({ ...stats, metrics: { focusSeconds: 0, finishedSessions: 0, completedSessions: 0, interruptedSessions: 0, reviewCount: 0, daysWithStudy: 0 }, daily: stats.daily.map((day) => ({ ...day, focusSeconds: 0, finishedSessions: 0, completedSessions: 0, interruptedSessions: 0, reviewCount: 0, studied: false })) }) : undefined);
    await screen.findByRole('heading', { name: 'Seu próximo registro pode começar hoje.' });
    expect(screen.getByText('0 min', { selector: 'strong' })).toBeVisible();
  });
  it('erro de período retorna feedback e permite consultar novamente', async () => {
    const user = userEvent.setup(); let reads = 0;
    setup('/app/statistics',(path) => path.startsWith('/statistics/') && ++reads === 1 ? json({ error: { message: 'Escolha um período de 1 a 366 dias.' } },400) : undefined);
    await screen.findByRole('alert'); expect(screen.queryByText('5 min 30 s')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('5 min 30 s');
  });
  it('preview da academia é ocultado quando há sessão aberta', async () => {
    setup('/app',(path) => path === '/dashboard' ? json({ activeSession: { status: 'RUNNING' }, nextReturnPoint: null, dueReviewCount: 0, academy }) : undefined);
    await screen.findByRole('link', { name: 'Voltar ao foco' });
    expect(screen.queryByRole('img', { name: /Academia Viva/ })).not.toBeInTheDocument();
  });
});
