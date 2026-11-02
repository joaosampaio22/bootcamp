import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { RouteFocus } from './RouteFocus';

describe('navegação por teclado entre páginas',() => {
  it('move foco ao título da nova página e atualiza o título da aba',async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RouteFocus /><main><Routes><Route path="/" element={<><h1>Início</h1><Link to="/next">Continuar</Link></>} /><Route path="/next" element={<h1>Meus conteúdos</h1>} /></Routes></main></MemoryRouter>);
    expect(screen.getByRole('heading',{ name: 'Início' })).toHaveFocus();
    await user.click(screen.getByRole('link',{ name: 'Continuar' }));
    expect(screen.getByRole('heading',{ name: 'Meus conteúdos' })).toHaveFocus();
    expect(document.title).toBe('Meus conteúdos · Estudo em Dia');
  });
  it('aguarda título assíncrono e não rouba foco depois de carregado',async () => {
    function Page() { const [ready,setReady] = useState(false); return ready ? <><h1>Relatório</h1><input aria-label="Período" /></> : <button onClick={() => setReady(true)}>Carregar</button>; }
    const user = userEvent.setup(); render(<MemoryRouter><RouteFocus /><main><Page /></main></MemoryRouter>);
    await user.click(screen.getByRole('button',{ name: 'Carregar' }));
    expect(await screen.findByRole('heading')).toHaveFocus();
    await user.click(screen.getByLabelText('Período')); await user.type(screen.getByLabelText('Período'),'7 dias');
    expect(screen.getByLabelText('Período')).toHaveFocus();
  });
});
