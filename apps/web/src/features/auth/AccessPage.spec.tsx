import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Router } from '../../app/Router';

const session = { user: { id: 'user-demo', name: 'Pessoa fictícia', emailNormalized: 'demo@example.test', timeZone: 'America/Sao_Paulo' }, csrfToken: 'csrf-only-fixture' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
function mount(path: string) { return render(<MemoryRouter initialEntries={[path]}><AuthProvider><Router /></AuthProvider></MemoryRouter>); }

describe('acesso e rotas privadas', () => {
  it('redireciona visitante da rota privada para login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: { message: 'Entre.' } }, 401)));
    mount('/app/subjects');
    await screen.findByRole('heading', { name: 'Bom ter você de volta.' });
    expect(screen.queryByRole('heading', { name: 'Suas disciplinas' })).not.toBeInTheDocument();
  });

  it('mostra erro de credenciais e não anuncia login bem-sucedido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(json({ error: { message: url.endsWith('/auth/login') ? 'E-mail ou senha inválidos.' : 'Entre.' } }, 401))));
    const user = userEvent.setup();
    mount('/login');
    await user.type(await screen.findByLabelText('E-mail'), 'demo@example.test');
    await user.type(screen.getByLabelText('Senha'), 'senha-fictícia');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('cadastro confirmado abre disciplinas e envia CSRF na criação', async () => {
    let created = false;
    const fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(json({}, 401));
      if (url.endsWith('/auth/register')) return Promise.resolve(json(session, 201));
      if (url.endsWith('/dashboard')) return Promise.resolve(json({ activeSession: null, nextReturnPoint: null }));
      if (url.endsWith('/focus-sessions/active')) return Promise.resolve(json(null));
      if (url.includes('/focus-sessions?')) return Promise.resolve(json({ items: [], total: 0, totalXp: 0, page: 1, pageSize: 10 }));
      if (url.endsWith('/subjects') && init?.method === 'POST') { created = true; return Promise.resolve(json({ id: 'subject-demo', name: 'História livre' }, 201)); }
      if (url.includes('/subjects?')) return Promise.resolve(json({ items: created ? [{ id: 'subject-demo', name: 'História livre', archivedAt: null }] : [], total: created ? 1 : 0, page: 1, pageSize: 20 }));
      return Promise.reject(new Error('Requisição inesperada: ' + url));
    });
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    mount('/register');
    await user.type(await screen.findByLabelText('Seu nome'), 'Pessoa fictícia');
    await user.type(screen.getByLabelText('E-mail'), 'demo@example.test');
    await user.type(screen.getByLabelText('Senha'), 'senha-fictícia-longa');
    await user.click(screen.getByRole('button', { name: 'Criar minha conta' }));
    await user.click(await screen.findByRole('link', { name: 'Disciplinas' }));
    await screen.findByRole('heading', { name: 'Suas disciplinas' });
    expect(await screen.findByText('Seu próximo aprendizado começa aqui.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nome da disciplina'), 'História livre');
    await user.click(screen.getByRole('button', { name: 'Adicionar disciplina' }));
    await screen.findByRole('heading', { name: 'História livre' });
    expect(fetch).toHaveBeenCalledWith('/api/v1/subjects', expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-CSRF-Token': session.csrfToken }) }));
  });

  it('sessão expirada durante ação retorna ao login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(json(session));
      if (init?.method === 'POST') return Promise.resolve(json({ error: { message: 'Sessão expirada.' } }, 401));
      return Promise.resolve(json({ items: [], total: 0, page: 1, pageSize: 20 }));
    }));
    const user = userEvent.setup();
    mount('/app/subjects');
    await screen.findByRole('heading', { name: 'Suas disciplinas' });
    await user.type(screen.getByLabelText('Nome da disciplina'), 'Teste');
    await user.click(screen.getByRole('button', { name: 'Adicionar disciplina' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bom ter você de volta.' })).toBeVisible());
  });

  it('falha ao carregar disciplinas não é apresentada como lista vazia confirmada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(
      url.endsWith('/auth/me') ? json(session) : json({ error: { message: 'Serviço indisponível.' } }, 503)
    )));
    mount('/app/subjects');
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Serviço indisponível.');
    expect(screen.queryByText('Seu próximo aprendizado começa aqui.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });
});
