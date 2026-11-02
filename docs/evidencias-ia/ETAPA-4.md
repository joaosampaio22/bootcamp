# Etapa 4 — revisões periódicas

Data: **02/11/2026**, America/Sao_Paulo. Solicitação real: **“Pode continuar”**, após entrega da Etapa 3. Desenvolvimento assistido pelo Codex; sem outros agentes e sem LLM no produto.

## Entrega

Filas de hoje/anteriores e futuras, convite para lembrar, notas ocultas/reveláveis, quatro autoavaliações, reagendamento civil, histórico auditável e XP transacional. Dashboard informa quantidade de conteúdos para revisar; conteúdo permite abrir seu agendamento/histórico. Suspender/arquivar preserva tentativas e progresso.

| Requisitos | Arquivos e evidência |
|---|---|
| RF-040–041, RN-040–042/045–046, CA-010/014 | `reviews.service.ts`, agenda inicial existente, filas e calendário; integração cobre futuro, atraso único e data a partir da realização. |
| RF-042–043, RN-043/049 | `ReviewPage.tsx`, notas fora do DOM e avaliação opcional sem revelar; Vitest e Chromium. |
| RF-044–046, RN-044/047–048, CA-011–013 | regras, `ReviewAttempt`, quinta migração e RewardsService; tabela de decisão, corridas, retries e rollback. |
| RF-045/047, RN-050 | histórico paginado, suspensão/arquivo sem exclusão; API e navegador. |
| RN-060–061/065, TS-01/06/10/11 | eventos de XP por origem/data local, guards, FK composta, schema vazio e transações. |

Arquivos principais: `apps/api/src/reviews/`, `rewards/rewards.module.ts`, extensão de RewardsService e DashboardModule, Prisma/migração `20261102040000_review_attempts`, `test/reviews.e2e-spec.ts`, `apps/web/src/features/reviews/`, navegação, conteúdo e dashboard. Decisões: [ADR-0006](../decisoes/ADR-0006-revisoes-periodicas.md).

## Resultados reais

| Verificação | Resultado |
|---|---|
| `npm run verify` | Aprovado: lint sem avisos, tipos strict, testes, migrações de teste e builds API/web. |
| Node | **4 aprovados**. |
| Jest unitário | **140 aprovados**, 10 suítes. |
| Vitest/Testing Library | **34 aprovados**, 6 arquivos. |
| Jest/Supertest + PostgreSQL | **61 aprovados**, 5 suítes. |
| Total automatizado | **239 testes aprovados**, sem skips. |
| Migrações | Quinta migração aplicada em desenvolvimento/teste; as cinco também aplicadas desde schema vazio temporário no banco `_test`, removido após conferir tabelas e registro de migrações. |
| Processo novo da API compilada, relógio normal | Cadastro/conteúdo com agenda futura → fila/detalhe → tentativa antecipada 409, sem histórico/XP → novo login preserva agenda. |
| Chromium real com relógio de teste | Agenda inicial → novo dia/login → lembrar/revelar → GOOD → +3 dias/5 XP → histórico/refresh/login → suspensão sem perda de tentativa. |

As 18 integrações novas verificam: futuro sem recompensa, atraso único, as quatro avaliações a partir do índice 2, saturação em 60 dias, notas vazias, chaves iguais concorrentes, chave reutilizada com outro corpo/recurso, comprovante imutável após outras recompensas/arquivo, chaves diferentes/versão antiga, constraints/FK, 12 avaliações concorrentes limitadas a 50 XP, suspensão/arquivo de conteúdo e disciplina, corrida com suspensão, histórico de dois ciclos e paginação, isolamento, autenticação, CSRF/Origin, campos forjados, rollback após recompensa, DST/troca de fuso, novo dia e tetos de foco/revisão separados.

O teste de rollback injeta falha depois de criar RewardEvent: agenda, tentativa e evento retornam ao estado anterior; a mesma chave então pode ser reenviada com sucesso. A regressão de foco também passa, mantendo sua própria proteção transacional.

Os 44 novos casos unitários cobrem a tabela completa de transições, calendário em DST/meia-noite/ano novo/ano bissexto/IANA, teto de XP e DTOs. Os nove testes de interface novos cobrem notas ocultas/escape, espera de confirmação, retry da mesma chave/corpo, ausência de notas, XP zero confirmado, conflito/atualização, material indisponível, estados vazio/erro e histórico.

## Capturas e dados de teste

O navegador usou AppModule compilado e PostgreSQL `_test` com ClockService substituído somente por um harness temporário. O relógio foi avançado por arquivo local para demonstrar a revisão do dia seguinte, sem rota privilegiada ou alteração do relógio da aplicação normal. Datas de agenda visíveis nas capturas são **simuladas**; captura realizada em 02/11/2026.

- [Fila de revisões](etapa-4-fila.png).
- [Tentar lembrar, notas ocultas](etapa-4-lembrar.png).
- [Notas reveladas como texto](etapa-4-notas.png).
- [Resultado confirmado](etapa-4-resultado.png).
- [Revisão em 360px](etapa-4-mobile.png).

Foi confirmado zero XP ao abrir/revelar; cinco após a autoavaliação GOOD; uma tentativa no histórico; persistência após refresh e novo login; e preservação do registro ao suspender. Layout de 360px não apresentou rolagem horizontal. As contas fictícias do navegador e do smoke foram removidas por identificadores exatos, com zero remanescentes. As fixtures de integração também são removidas pelos testes. Senhas/segredos não foram incluídos em capturas, Git ou galeria.

## Correções e limites

Ao introduzir o segundo consumidor de RewardsService, o teste antigo de rollback de foco passou a resolver uma instância diferente da usada pelo módulo de foco. Foi criado RewardsModule compartilhado, retirando providers duplicados; a falha foi reproduzida e a suíte completa passou após a correção. A primeira geração de diff fora do workspace não escreveu SQL; a geração foi repetida com a configuração Prisma da API e seu resultado aplicado/testado em schema vazio.

Academia, estágios visuais, estatísticas por período e polimento final continuam nas **Etapas 5–6**. Autoavaliação não certifica domínio, atenção ou retenção. `PREVIA.html` é galeria offline; formulários funcionais precisam de Node/API/PostgreSQL conforme README. Não há deploy público, seed de demo final ou gravação narrada nesta entrega.
