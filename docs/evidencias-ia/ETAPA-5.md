# Etapa 5 — academia e estatísticas

Data: **02/11/2026**, America/Sao_Paulo. Solicitação real: **“Pode continuar”**, depois da entrega de revisões. Trabalho assistido pelo Codex, sem outros agentes e sem LLM no produto.

## Entrega e requisitos

| Requisito | Implementação e evidência |
|---|---|
| RF-050, RN-060–061 | AcademyService agrega RewardEvent por conta/origem; extrato paginado com evento/origem/data/XP/histórico. Integração compara saldo, eventos e relatórios. |
| RF-052–054, RN-062–063, CA-016 | Limiares 0/100/350/800, quatro SVGs originais, academia e preview; testes de fronteira e 350 XP preservados após 30 dias. |
| RF-055, RN-064–065 | StatisticsService, filtros de datas, métricas/dias, gráfico consultável e tabela; integração cobre meia-noite, DST e troca de fuso. |
| RF-051 preservado | Regressões de revisão mantêm tentativa/XP idempotentes e rollback. Leituras de academia/estatísticas não concedem XP. |
| Segurança e isolamento | AuthGuard, usuário do servidor em todas as consultas, SQL parametrizado, no-store; testes excluem dados da outra conta e rejeitam filtros forjados. |

Arquivos: `src/academy/`, `src/statistics/`, `test/progress.e2e-spec.ts`, DashboardModule/AppModule, índices Prisma e sexta migração, `features/progress/`, rotas/navegação e `public/academy/stage-{1,2,3,4}.svg`. Decisões: [ADR-0007](../decisoes/ADR-0007-academia-estatisticas.md).

## Verificação executada

| Verificação | Resultado |
|---|---|
| `npm run verify` | Aprovado: lint, tipos strict, testes, migrações de teste e builds API/web. |
| Node | **4 aprovados**. |
| Jest unitário | **163 aprovados**, 12 suítes. |
| Vitest/Testing Library | **43 aprovados**, 7 arquivos. |
| Jest/Supertest + PostgreSQL | **71 aprovados**, 6 suítes. |
| Total | **281 testes aprovados**, sem skips. |
| Ajuste final de texto/fixture | Lint, tipos, 43 testes de interface e build web reexecutados após ajuste de singular/plural. |
| Migrações | Sexta aplicada em desenvolvimento/teste; as seis aplicadas em schema vazio temporário `_test`, com conferência dos três índices novos e remoção do schema ao final. |
| Smoke em processo novo, relógio normal | Conta nova/fundação → foco curto legítimo sem XP → sessão e tempo no relatório, evento zero no extrato → novo login preserva registros. |
| Chromium real | Academia inicial, estágio III/IV, gráfico/tabela, filtro do extrato, refresh/login, ausência e layouts móveis conferidos. |

As dez integrações novas verificam conta vazia, 100/350 XP por conclusões reais, ausência de 30 dias sem regressão, totais COMPLETED/INTERRUPTED, exclusão de pausa/pendência/descarte, tempo além do teto de XP, retry sem duplicar contadores, extrato/filtros/paginação, 11 revisões apesar do teto de 50 XP, arquivo preservando histórico, fronteiras UTC/local, troca de fuso, dias de 23/25h, isolamento, autenticação e validação de consulta. As suítes anteriores preservam as corridas e transações de foco/revisão.

Os 23 testes unitários novos cobrem limiares, último estágio, soma das origens, período inclusivo/padrão, ano bissexto e rejeição de filtros inválidos. Os nove de interface cobrem asset/estágio vindos da API, ausência de próximo nível no IV, erro sem inventar XP, extrato zero, gráfico por teclado/tabela, período aguardando resposta, vazio confirmado, retry e preview oculto com foco aberto.

## Navegador, arte e dados fictícios

As capturas usam Chromium, API compilada de AppModule, PostgreSQL `_test` e ClockService substituído só no harness temporário. **Não houve estudo humano de centenas de minutos:** o relógio do teste foi avançado entre chamadas legítimas de foco/revisão. Não foi criado endpoint privilegiado nem escrito XP manualmente no banco para essas capturas.

No primeiro cenário, seis sessões somam 345 minutos/XP e uma revisão concede 5 XP: total 350, estágio III, dois dias com estudo e uma revisão. Depois, outras oito sessões somam 450 XP em três dias, respeitando o teto diário; total 800, estágio IV sem próximo limiar. Uma ausência simulada de 30 dias deixa XP/estágio intactos e o período recente vazio. Refresh e novo login preservam os eventos. Duas execuções do cenário verificaram também os ajustes finais de texto e ambas as telas em 360px, sem rolagem horizontal da página.

- [Fundação, conta nova](etapa-5-fundacao.png).
- [Universidade, 350 XP](etapa-5-academia.png).
- [Quarto estágio, 800 XP](etapa-5-estagio-4.png).
- [Estatísticas e seleção de um dia](etapa-5-estatisticas.png).
- [Academia em 360px](etapa-5-academia-mobile.png).
- [Estatísticas em 360px](etapa-5-mobile.png).

Os quatro SVGs foram escritos no projeto com formas vetoriais originais, sem imagens/serviços externos. As duas contas fictícias de navegador e a conta de smoke foram removidas por identificadores exatos, confirmando zero remanescentes; fixtures de integração também são removidas pelos testes. Capturas não incluem senha, token ou dado pessoal real.

## Correções e limites

Os primeiros cenários de DST voltavam o relógio para antes da janela já existente do rate limit de autenticação, causando 429 em cenários seguintes. A integração passou a criar um app Nest independente para cada caso temporal, isolando a janela; as defesas de produção foram mantidas. A fixture de estatísticas vazias foi ajustada para preservar a série de dias, e a asserção de zero passou a distinguir o cartão da tabela.

O núcleo das Etapas 0–5 está implementado. Polimento geral, auditoria final, seed dedicada de demonstração, roteiro/gravação e preparação de apresentação pertencem à **Etapa 6**. Não há deploy público, benchmark/SLA ou medida de retenção/domínio/atenção. `PREVIA.html` é galeria offline; uso funcional exige Node/API/PostgreSQL conforme README.
