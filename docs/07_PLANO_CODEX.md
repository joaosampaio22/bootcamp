# 07 — PLANO DE EXECUÇÃO COM CODEX E CONTROLE DE ESCOPO

## 7.1 Estratégia

**Uma linguagem de ponta a ponta, mas com backend real:** TypeScript no React e no NestJS, banco PostgreSQL e Prisma. Implementar um **monólito modular** e um ciclo vertical completo antes de detalhes cosméticos. A academia é decorativa e não possui engine de jogos.

O plano foi desenhado para reduzir retrabalho e custo de contexto do agente. **Não é garantia de desenvolvimento integral em um dia.** A arquitetura deve estar correta, enquanto o escopo visual e as melhorias P1 podem esperar.

## 7.2 Ordem de leitura obrigatória do Codex

1. `docs/00_LEIA_PRIMEIRO.md`.
2. `docs/01_PRODUTO_ESCOPO.md` e `docs/02_REQUISITOS_REGRAS.md`.
3. `docs/03_ARQUITETURA_DADOS.md` e `docs/04_API_ALGORITMOS.md`.
4. `docs/05_UX_GAMIFICACAO.md` e `docs/06_TESTES_QUALIDADE.md`.
5. `docs/07_PLANO_CODEX.md` e `AGENTS.md`.

Ordem de precedência em conflito: `02_REQUISITOS_REGRAS` > `04_API_ALGORITMOS` > `03_ARQUITETURA_DADOS` > `05_UX_GAMIFICACAO` > `01_PRODUTO_ESCOPO`; se conflito material permanecer, registrar e não inventar comportamento silenciosamente.

## 7.3 Sequência de implementação com entregas verificáveis

### Etapa 0 — Base reprodutível

**Construir:** monorepo npm workspaces, apps web/api, configuração TypeScript strict, Tailwind, Nest, Prisma 7 + adapter, PostgreSQL Compose, `.env.example`, health check, scripts `dev/test/build/lint/typecheck`.

**Aceitar se:** instruções de README funcionam em máquina nova; banco migra; API responde; SPA abre; nenhuma credencial no Git.

### Etapa 1 — Autenticação + disciplinas

**Construir:** usuário, AuthSession, hash Argon2id, cookie, login/logout, guards, validação, rotas privadas, CRUD de disciplinas com arquivamento, teste de isolamento entre contas.

**Aceitar se:** cadastro e login persistem; logout revoga sessão; B não acessa disciplinas de A.

### Etapa 2 — Foco robusto + recompensas

**Construir:** máquina de estados, timer reconstituído pelo servidor, pausa e retomada, encerramento, reconciliação, RewardEvent e tetos diários. Tela de foco sem distrações.

**Aceitar se:** refresh não zera timer; POST repetido não concede XP novo; pausa não conta; sessão pendente não gera XP automático.

### Etapa 3 — Conteúdos + continuidade

**Construir:** CRUD de assuntos registrados manualmente, link/nota, revisão habilitada, ReturnPoint independente, dashboard com próximo passo, telas de vazio.

**Aceitar se:** o usuário registra História, Java ou qualquer outra área sem catálogo, não precisa cadastrar um exercício, salva onde parou e recupera após login.

### Etapa 4 — Revisões periódicas

**Construir:** ReviewSchedule, ReviewAttempt, algoritmo de intervalos de dias civis, autoavaliação, fila vencida/futura, transação com XP, controles de versão/idempotência.

**Aceitar se:** primeira revisão é amanhã (fuso local), atraso não se acumula em N tarefas, rating altera data, reenvio não pontua duas vezes.

### Etapa 5 — Academia e estatísticas

**Construir:** stage derivado de XP, quatro SVGS próprios (podem ser estilizados sem alta complexidade), preview e tela academia, métricas por período.

**Aceitar se:** atingir XP limiar muda estágio; falta de uso não reduz progresso; painel só exibe fatos registrados.

### Etapa 6 — Polimento + apresentação

**Construir:** tratamento uniforme de erro, responsividade, acessibilidade básica, seed de demo isolada, documentação de execução, evidências GenAI, roteiro e gravação narrada.

**Aceitar se:** DoD em 06 e roteiro em 08 passam; projeto executa sem depender de API de tokens.

## 7.4 Estratégia caso exista apenas um dia

**Regra:** concluir e testar o conjunto de P0 antes de P1. Se o prazo encurtar:

1. Não remover backend, banco, autenticação nem testes dos invariantes críticos.
2. Reduzir primeiro os efeitos visuais (quatro SVGs simples, sem animação).
3. Simplificar estatísticas para duas métricas confiáveis e expansão futura.
4. Priorizar foco, conteúdo, ponto de retorno e uma revisão ponta a ponta.
5. Adiar filtros avançados, animações, personalização, exportações e diagnósticos de início.
6. Reportar honestamente toda funcionalidade P0 incompleta; não marcar telas estáticas como concluídas.

## 7.5 Templates de prompt para Codex

### Prompt de abertura

> Leia `AGENTS.md` e a documentação em `docs/`, em especial `02_REQUISITOS_REGRAS.md`. Não programe antes de resumir em até 20 linhas o escopo P0, a stack, os invariantes críticos e a primeira etapa. Implemente SOMENTE a Etapa 0 do `07_PLANO_CODEX.md` e rode os comandos de verificação. Não modifique regras de negócio sem registrar o motivo. Ao concluir, relate arquivos alterados, testes, pendências e próximo passo.

### Prompt por etapa

> Implemente SOMENTE a Etapa N de `docs/07_PLANO_CODEX.md`, atendendo RF/RN/CA correspondentes. Preserve a arquitetura e não acrescente features fora de P0. Rode testes específicos, lint/typecheck e build quando aplicável. Mantenha logs de evidência de IA e descreva o que foi realmente verificado. Não invente dados nem declare sucesso sem execução.

### Prompt de correção

> Corrija a falha [DESCREVER] sem reescrever módulos não relacionados. Primeiro reproduza com teste automatizado, identifique a causa, altere o menor conjunto de arquivos, execute testes regressivos e registre o antes/depois em `docs/evidencias-ia/`.

### Prompt de auditoria

> Compare a implementação com os itens P0 de `docs/02_REQUISITOS_REGRAS.md` e os critérios de `docs/06_TESTES_QUALIDADE.md`. Gere tabela `requisito → arquivo → evidência/teste → status` apenas com evidência verificável, sinalize lacunas e priorize as críticas. Não implemente mudanças até identificar a causa e o escopo.

## 7.6 Controle de tokens e contexto

- **Uma etapa por conversa/tarefa** para reduzir difusão de mudanças; criar commits verificáveis.
- Colocar decisões permanentes em docs e `AGENTS.md`; não repetir toda a história do brainstorming a cada prompt.
- Exigir que o Codex leia **somente** documentos relevantes a cada etapa após o onboarding inicial.
- Não solicitar reescrita total para corrigir uma função.
- Usar testes de relógio falso, seed controlado, logs de transações e respostas de API para depuração rápida.
- Evitar novos pacotes e serviços sem necessidade clara; manter npm, monorepo enxuto e Nest modular.
- Documentar suposições como ADR curto em `docs/decisoes/` antes de divergir de regras P0.

## 7.7 Fluxo Git sugerido

- `main`: estável; branches pequenas por etapa se desejado.
- Commits descritivos: `chore: scaffold monorepo`, `feat(auth): session login`, `feat(focus): durable sessions`, `feat(review): scheduled recall`, etc.
- Antes de cada merge: testes pertinentes, typecheck, migração aplicável e relatório curto de regressões.
- Não versionar `.env`, credenciais, dados pessoais, vídeos de clientes ou snapshots com informações reais.

## 7.8 Evidência do desenvolvimento com GenAI

Criar `docs/evidencias-ia/README.md`, além de registros selecionados com:

| Campo | Conteúdo |
|---|---|
| Etapa | qual módulo foi assistido pela IA |
| Objetivo | requisito ou defeito real |
| Prompt | solicitação efetivamente realizada |
| Intervenção | sugestões e alterações do Codex, com decisão humana |
| Arquivos | módulos concretamente alterados |
| Verificação | comandos e saídas dos testes |
| Limitações | o que ainda não foi implementado ou verificado |
| Evidência visual | captura legível sem dados sensíveis |

Não inventar conversas de IA, screenshots, commits ou testes. Comentários em código podem mencionar assistência de IA quando pertinente, mas **não** inserir comentários falsos do tipo “gerado por IA” em todo arquivo.

## 7.9 Critério para solicitar a etapa seguinte

Só avançar quando a etapa anterior tem build executável, migrações aplicáveis, testes essenciais e resumo claro do que foi implementado. Exceção: bloqueio externo documentado; nesse caso, registrar a pendência e não anunciar conclusão da etapa.
