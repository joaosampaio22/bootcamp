import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

function healthyResponse() {
  return new Response(JSON.stringify({ status: 'ok', service: 'estudo-em-dia-api', database: 'up' }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}

describe('base do Estudo em Dia', () => {
  it('explica o estágio atual sem oferecer recursos ainda não implementados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(healthyResponse()));
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Estudar é um caminho.');
    expect(screen.getByText('Seu espaço está em construção')).toBeVisible();
    expect(screen.getByRole('link', { name: /Veja o que vem por aí/ })).toHaveAttribute('href', '#projeto');
    expect(screen.queryByRole('button', { name: /Iniciar foco/ })).not.toBeInTheDocument();
    await screen.findByText('Conexão verificada');
  });

  it('só confirma a conexão após a resposta da API', async () => {
    let complete!: (response: Response) => void;
    const fetch = vi.fn(() => new Promise<Response>((resolve) => { complete = resolve; }));
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Verificando conexão…');
    expect(screen.queryByText('Conexão verificada')).not.toBeInTheDocument();
    complete(healthyResponse());
    await screen.findByText('Conexão verificada');
    expect(fetch).toHaveBeenCalledWith('/api/v1/health', expect.objectContaining({ credentials: 'include' }));
  });

  it('permite tentar novamente após falha de rede', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(healthyResponse());
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /Tentar novamente/ }));
    await screen.findByText('Conexão verificada');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: /Tentar novamente/ })).not.toBeInTheDocument();
  });

  it.each([
    ['falha HTTP', () => new Response('{}', { status: 503 })],
    ['contrato inválido', () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 })]
  ])('não confirma serviço saudável com %s', async (_name, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()));
    render(<App />);
    await screen.findByText('Não foi possível verificar a conexão');
    expect(screen.queryByText('Conexão verificada')).not.toBeInTheDocument();
  });
});
