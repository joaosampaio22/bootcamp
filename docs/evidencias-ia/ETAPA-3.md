# Etapa 3 — conteúdos e continuidade

Data: **02/11/2026**. Solicitação real: **“Proxima etapa”**. Continuação do plano documentado após a Etapa 2; implementação assistida pelo Codex, sem delegação a outros agentes.

## Entrega e requisitos

Conteúdos de qualquer área, título/nota/link/data, pesquisa, edição, arquivamento/restauração, opção de agenda inicial e foco vinculado. Pontos de retorno independentes ou vinculados, edição, conclusão/reabertura e início com próximo passo persistido. Não há exercício pronto nem cadastro obrigatório para focar ou receber XP.

| Requisito | Implementação e evidência |
|---|---|
| RF-011–012/015, RN-011/013, CA-003 | ContentsModule, quatro telas de conteúdos, quarta migração; integração verifica texto livre, busca literal, links e arquivo lógico. |
| RF-013, RN-012/041, CA-010 | Agenda única transacional e data civil de amanhã; DTO/regras cobrem DST, meia-noite e ano novo; integração cobre habilitação simultânea. Realização da revisão fica na Etapa 4. |
| RF-014/021, CA-004/009 | FocusService valida vínculo e deriva disciplina; ações opcionais após foco. Regressão preserva foco avulso e XP sem conteúdo. |
| RF-030–034, RN-014–015, CA-015 | ContinuityModule, ReturnPoint OPEN/DONE e dashboard; integração e navegador recuperam contexto após novo login. |
| CA-001 | Cadastro/login levam ao início autenticado `/app`. |
| Segurança transversal | Guards existentes, CSRF, propriedade, FKs compostas, URL segura e renderização como texto. Integração rejeita associações de outra conta. |

Arquivos: Prisma/migração `20261102030000_contents_continuity`, módulos `contents`, `continuity`, `dashboard`, `prisma/user-transaction.service.ts`, integração de foco/disciplinas, rotas React e `features/{contents,continuity,dashboard,study}`. Decisões: [ADR-0005](../decisoes/ADR-0005-conteudos-continuidade.md).

## Verificações executadas

| Verificação | Resultado real |
|---|---|
| `npm run verify` | Aprovado: lint sem avisos, tipos strict, testes, migrações de teste e builds API/web. |
| Node | **4** testes aprovados. |
| Jest unitário | **96** testes em 9 suítes aprovados. |
| Vitest/Testing Library | **25** testes em 5 arquivos aprovados. |
| Jest/Supertest + PostgreSQL real | **43** testes em 4 suítes aprovados. |
| Total automatizado | **168 aprovados**, sem skips. |
| Migração local | Quarta migração aplicada nos bancos de desenvolvimento e de teste. |
| API compilada em processo novo | Cadastro → disciplina → conteúdo/agenda → retorno → dashboard → novo login com dados preservados, relógio normal. |
| Chromium real | Cadastro, conteúdo, edição/refresh, foco vinculado, retorno, novo login, conclusão/reabertura, arquivamento e layout de 360px aprovados. |

As nove integrações novas cobrem agenda amanhã no fuso sem depender de studiedOn; duas habilitações concorrentes com uma só linha; desabilitar sem excluir/reabilitar no mesmo ID; notas sem adiar agenda; busca literal por `%`; notas com marcação preservadas como texto; rejeição de javascript/data/credenciais na URL; arquivamento de conteúdo/disciplina; isolamento e FK cruzada; múltiplos retornos e mais recente no início; logout/login; mover conteúdo e atualizar retorno aberto; foco vinculado e avulso; registro opcional sem XP adicional; DTOs, limites e CSRF. As regressões da Etapa 2 preservam idempotência, recuperação, tetos e rollback de recompensa.

Os testes de interface aguardam confirmação antes de navegar, preservam campos na falha, apresentam erro/retry no início, escapam notas, suprimem URL insegura mesmo se vier de dado antigo e resolvem conteúdo/disciplinas vinculados fora da primeira página de opções.

## Navegador e capturas

Chromium headless acessou os servidores normais da aplicação com PostgreSQL de desenvolvimento e **relógio normal**. A conta era fictícia, com senha aleatória não registrada. O foco vinculado foi encerrado logo após iniciar; não representa cinco minutos estudados nem gera XP pelo tempo curto. Testes temporais de agenda usam relógio substituído somente nos testes automatizados.

- [Conteúdo e agenda inicial](etapa-3-conteudo.png).
- [Ponto de retorno vinculado](etapa-3-retorno.png).
- [Início com próxima ação](etapa-3-inicio.png).
- [Início em 360px](etapa-3-mobile.png).

As cinco contas fictícias criadas pelas tentativas de navegador e smoke, com seus registros dependentes, foram removidas por e-mails/IDs exatos; confirmação de zero remanescentes. Testes de integração também removem suas próprias fixtures. Capturas usam apenas textos fictícios e não mostram credenciais.

Durante a verificação, foram corrigidos tipos da limpeza das fixtures, espera pelo carregamento das opções nos testes e preenchimento de links cujo conteúdo está arquivado/fora da primeira página. O harness temporário precisou aguardar uma nova página após refresh e a renderização antes da captura; a primeira captura imediatamente após reload teve timeout. O fluxo completo foi reexecutado com sucesso. Não foram criadas rotas privilegiadas de teste na aplicação.

## Limites e próxima etapa

`ReviewSchedule` está persistida para agenda inicial. Fila de revisões, revelar notas, autoavaliação, intervalos seguintes, ReviewAttempt e recompensa por revisão ainda não estão implementados: são a **Etapa 4**. Academia, estatísticas e polimento permanecem nas etapas posteriores. O dashboard expõe apenas os campos implementados.

`PREVIA.html` é uma galeria offline de capturas reais; usar formulários e persistir dados exige Node/API/PostgreSQL conforme README. Não há deploy público ou gravação narrada. As instruções de inicialização da nuvem foram atualizadas e salvas em rascunho; aplicar/publicar a configuração e restaurá-la em outra tarefa são ações separadas.
