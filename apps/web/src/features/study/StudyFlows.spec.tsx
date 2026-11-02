import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Router } from '../../app/Router';
import type { Content, ReturnPoint } from './study-types';

const subject = { id: 'subject-fixture', name: 'História', archivedAt: null };
const content: Content = { id: 'content-fixture', subjectId: subject.id, subject, title: 'Renascimento', notes: '<script>texto livre</script>', materialUrl: 'https://example.test/material', studiedOn: '2026-11-02T00:00:00Z', reviewEnabled: true, archivedAt: null, review: { id: 'schedule-fixture', status: 'ACTIVE', nextDueDate: '2026-11-03T00:00:00Z', stepIndex: 0, version: 1 } };
const point: ReturnPoint = { id: 'point-fixture', subjectId: null, subject: null, contentId: null, content: null, nextAction: 'Abrir o livro na página 30', context: '', materialUrl: null, status: 'OPEN', updatedAt: '2026-11-02T12:00:00Z' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const page = (items: unknown[]) => ({ items, total: items.length, page: 1, pageSize: 100 });
function setup(path: string, handler?: (path: string, init: RequestInit) => Response | Promise<Response> | undefined) {
  const fetch = vi.fn((url: string, init: RequestInit = {}) => {
    const path = url.replace('/api/v1', '');
    const result = handler?.(path, init); if (result) return Promise.resolve(result);
    if (path === '/auth/me') return Promise.resolve(json({ user: { id: 'person-fixture', name: 'Pessoa fictícia', timeZone: 'America/Sao_Paulo' }, csrfToken: 'csrf-fixture' }));
    if (path.startsWith('/subjects?')) return Promise.resolve(json(page([subject])));
    if (path.startsWith('/contents?')) return Promise.resolve(json(page([content])));
    if (path === '/contents/' + content.id) return Promise.resolve(json(content));
    if (path.startsWith('/return-points?')) return Promise.resolve(json(page([point])));
    return Promise.reject(new Error('Rota inesperada: ' + path));
  });
  vi.stubGlobal('fetch', fetch);
  render(<MemoryRouter initialEntries={[path]}><AuthProvider><Router /></AuthProvider></MemoryRouter>);
  return fetch;
}

describe('conteúdos e continuidade', () => {
  it('não anuncia conteúdo salvo antes da confirmação; preserva campos e escolha sem revisão na falha', async () => {
    const user = userEvent.setup(); let confirm!: (value: Response) => void;
    const fetch = setup('/app/contents/new', (path, init) => path === '/contents' && init.method === 'POST' ? new Promise((resolve) => { confirm = resolve; }) : undefined);
    await screen.findByRole('option', { name: subject.name });
    await user.selectOptions(screen.getByLabelText('Disciplina'), subject.id);
    await user.type(screen.getByLabelText('Título do assunto'), 'Um assunto livre');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Salvar conteúdo' }));
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    confirm(json({ error: { message: 'Falha temporária ao salvar.' } }, 503));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Título do assunto')).toHaveValue('Um assunto livre');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    const call = fetch.mock.calls.find(([url, init]) => url.endsWith('/contents') && init?.method === 'POST')!;
    expect(JSON.parse(call[1]!.body as string)).toMatchObject({ subjectId: subject.id, title: 'Um assunto livre', reviewEnabled: false, materialUrl: null });
    expect(screen.queryByRole('heading', { name: 'Minhas anotações' })).not.toBeInTheDocument();
  });

  it('mostra notas como texto, data civil e link externo seguro', async () => {
    setup('/app/contents/' + content.id);
    await screen.findByRole('heading', { name: content.title });
    expect(screen.getByText(content.notes)).toBeVisible();
    expect(document.querySelector('.study-notes script')).toBeNull();
    expect(screen.getByText('Estudado em 02/11/2026')).toBeVisible();
    expect(screen.getByText('Revisão agendada para 03/11/2026')).toBeVisible();
    const link = screen.getByRole('link', { name: /Abrir material/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('não transforma esquema inseguro em link mesmo se vier de dado antigo', async () => {
    setup('/app/contents/' + content.id, (path) => path === '/contents/' + content.id ? json({ ...content, materialUrl: 'javascript:alert(1)' }) : undefined);
    await screen.findByRole('heading', { name: content.title });
    expect(screen.queryByRole('link', { name: /Abrir material/ })).not.toBeInTheDocument();
  });

  it('salva ponto independente somente após resposta do servidor', async () => {
    const user = userEvent.setup(); let confirm!: (value: Response) => void;
    const fetch = setup('/app/continue/new', (path, init) => path === '/return-points' && init.method === 'POST' ? new Promise((resolve) => { confirm = resolve; }) : undefined);
    await user.type(await screen.findByLabelText('Minha próxima ação'), point.nextAction);
    await user.click(screen.getByRole('button', { name: 'Salvar ponto' }));
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.queryByRole('heading', { name: 'Onde você parou?' })).not.toBeInTheDocument();
    confirm(json(point, 201));
    await screen.findByRole('heading', { name: point.nextAction });
    const call = fetch.mock.calls.find(([url, init]) => url.endsWith('/return-points') && init?.method === 'POST')!;
    expect(JSON.parse(call[1]!.body as string)).toMatchObject({ subjectId: null, contentId: null, nextAction: point.nextAction });
  });

  it('resolve vínculo arquivado por ID mesmo fora da primeira página de opções', async () => {
    setup('/app/continue/new?contentId=' + content.id, (path) => path.startsWith('/contents?') || path.startsWith('/subjects?') ? json(page([])) : path === '/contents/' + content.id ? json({ ...content, archivedAt: '2026-11-02T12:00:00Z' }) : undefined);
    await screen.findByLabelText('Minha próxima ação');
    await waitFor(() => expect(screen.getByLabelText('Conteúdo (opcional)')).toHaveValue(content.id));
    expect(screen.getByLabelText('Disciplina (opcional)')).toHaveValue(subject.id);
    expect(screen.getByRole('option', { name: content.title })).toBeInTheDocument();
  });

  it('painel mostra a próxima ação confirmada e permite tentar novamente após falha', async () => {
    let attempt = 0; const user = userEvent.setup();
    setup('/app', (path) => path === '/dashboard' ? ++attempt === 1 ? json({ error: { message: 'Painel indisponível.' } }, 503) : json({ activeSession: null, nextReturnPoint: point }) : undefined);
    await screen.findByRole('alert');
    expect(screen.queryByRole('heading', { name: point.nextAction })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('heading', { name: point.nextAction });
    expect(screen.getByRole('link', { name: 'Ver meu ponto de retorno' })).toHaveAttribute('href', '/app/continue/' + point.id + '/edit');
  });

  it('foco mantém conteúdo e disciplina selecionados por link fora da primeira página', async () => {
    setup('/app/focus?contentId=' + content.id, (path) => {
      if (path.startsWith('/contents?') || path.startsWith('/subjects?')) return json(page([]));
      if (path === '/focus-sessions/active') return json(null);
      if (path.startsWith('/focus-sessions?')) return json({ ...page([]), totalXp: 0 });
      return undefined;
    });
    await screen.findByRole('button', { name: 'Iniciar foco' });
    await waitFor(() => expect(screen.getByLabelText('Conteúdo (opcional)')).toHaveValue(content.id));
    expect(screen.getByLabelText('Disciplina (opcional)')).toHaveValue(subject.id);
  });
});
