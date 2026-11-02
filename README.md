# Estudo em Dia

Um espaço para estudar qualquer conteúdo, preservar pontos de retorno e organizar revisões. A **Academia Viva** será uma representação decorativa do progresso, sem economia, exercícios prontos ou LLM em produção.

## Baixar e visualizar sem instalar

No GitHub, use **Code → Download ZIP**, extraia o arquivo e abra **`PREVIA.html`** no navegador. O arquivo mostra capturas reais das revisões da **Etapa 4**, com dados fictícios e datas simuladas por um relógio de teste, sem instalar nada. É uma galeria visual; para usar os formulários e salvar seus próprios dados, execute a aplicação conforme abaixo.

Para desenvolver ou executar com API e banco, siga as instruções abaixo.

**Estado atual: Etapas 0–4 implementadas e verificadas nesta instância.** Cadastro, perfil, disciplinas, foco, conteúdos, pontos de retorno e revisões funcionam com API e PostgreSQL. Revisões permitem tentar lembrar, revelar notas e autoavaliar; o servidor registra histórico, próxima data e XP atomicamente. O início destaca próxima ação e quantidade de conteúdos para revisar. Consulte o [relatório atual](docs/evidencias-ia/ETAPA-4.md).

**O MVP completo ainda está em desenvolvimento:** academia, estatísticas e polimento pertencem às próximas etapas de [docs/07_PLANO_CODEX.md](docs/07_PLANO_CODEX.md). Os relatos anteriores são registros históricos.

## Pré-requisitos

- Node.js **24.19.0** (ver `.nvmrc`) e npm **11.x**; ambiente usa npm 11.9.0.
- Docker Engine e Docker Compose v2, com daemon ativo e permissão de acesso.
- Portas locais 3000 (API), 5173 (SPA), 5432 (PostgreSQL de desenvolvimento) e 5433 (PostgreSQL de testes) livres.
- Acesso ao registro npm, à imagem oficial do PostgreSQL e a `binaries.prisma.sh` (binário e checksum oficiais do Prisma), ou compilação oficial alternativa descrita abaixo.

React 19 + Vite 8 + Tailwind 4, NestJS 12, TypeScript strict, PostgreSQL 17 e Prisma **7.10.1**, com client ESM e driver adapter `pg`. Versões de dependências e imagem do banco estão fixadas; o lockfile faz parte do projeto.

## Primeira execução

Na raiz do checkout:

```sh
# Se usa nvm:
nvm install
nvm use

npm ci
npm run setup:env
npm run db:up
npm run db:migrate
npm run dev
```

`npm ci` gera o client Prisma pelo `postinstall`; essa geração não exige banco ativo nem `.env`. `setup:env` gera uma senha do banco e uma chave JWT **aleatórias, somente locais**, em `.env` com permissão restrita, sem exibir os valores. Reexecutar preserva as variáveis existentes e adiciona a chave JWT se ainda estiver ausente. Não use nem versione as credenciais locais em hospedagem pública.

Abra **http://localhost:5173/register** para criar sua conta; o app abre **/app** após entrar. Início, foco, disciplinas, conteúdos, revisões, “Onde parei” e perfil ficam na navegação. A API usa a porta **3000**. O Vite encaminha `/api` para a API sem expor segredos ao navegador. Use `localhost` na interface: o padrão `FRONTEND_ORIGIN=http://localhost:5173` rejeita escritas originadas de `http://127.0.0.1:5173`. Se escolher outra origem, configure-a explicitamente no `.env`.

Verifique em outro terminal:

```sh
curl --fail http://127.0.0.1:3000/api/v1/health
curl --fail http://127.0.0.1:5173/api/v1/health
```

Resposta esperada em ambos:

```json
{"status":"ok","service":"estudo-em-dia-api","database":"up"}
```

O health check não revela versão, credenciais, dados de usuários ou erros do driver. Falha de consulta retorna HTTP 503 com erro estruturado e ID da requisição.

As rotas de escrita exigem `Origin` confiável (ou `Referer` válido quando Origin não existe). Escritas autenticadas também exigem `X-CSRF-Token`, retornado no JSON do cadastro/login e de `/api/v1/auth/me`. O JWT fica exclusivamente no cookie HttpOnly; não armazená-lo em localStorage. A sessão expira em uma hora e o logout a revoga no banco. O limite de autenticação é dez tentativas por minuto por peer, compartilhado entre cadastro e login, sem confiar em X-Forwarded-For.

## Foco e recompensas

- Duração entre **5 e 120 minutos**, com sugestões de 10, 25 e 50. Disciplina é opcional; não há catálogo nem conteúdo obrigatório.
- Uma única sessão aberta por conta. Aba invisível não pausa automaticamente; pausas explícitas não contam. Refresh e novo login recuperam os timestamps do servidor.
- XP por foco: minutos inteiros, mínimo de cinco minutos, até **60 XP por sessão** e **180 XP por dia local** do perfil. O tempo elegível continua no histórico quando o teto de XP é atingido. Isso representa estudo registrado, não prova de concentração ou aprendizado.
- O timer chegar a zero não encerra nem premia sozinho. Depois de planejado + 15 minutos **ativos**, a próxima leitura/ação de foco coloca a sessão em recuperação. Pausas não consomem a carência. Confirmar tempo fica limitado ao planejado e ao registro plausível; descartar não concede XP.
- Concluir/interromper/reconciliar usa `Idempotency-Key` UUID. Reenvio da mesma operação retorna o comprovante original; chave reutilizada com outro corpo ou chave nova em sessão já encerrada retorna 409. A tela mantém a chave em memória durante retry de rede. Após recarregar, o estado e o histórico vêm novamente do servidor.
- Histórico inclui a origem e o identificador do evento de XP. Não existe rota pública para enviar XP ou avançar o relógio.

API: `POST /api/v1/focus-sessions`, `GET /focus-sessions/active`, `GET /focus-sessions`, `POST /focus-sessions/:id/pause`, `/resume`, `/finish` e `/reconcile`, sempre sob `/api/v1`. Start recebe `{plannedMinutes, subjectId?, contentId?}`; finish recebe `{outcome:"COMPLETED"|"INTERRUPTED", expectedVersion?}`. Reconcile também permite `DISCARDED`; nos outros resultados exige `confirmedActiveSeconds` inteiro. Um conteúdo vinculado precisa ser próprio, ativo e de disciplina ativa; sua disciplina é derivada pelo servidor. Disciplina explícita incompatível retorna 422.

As transições aceitam `expectedVersion` para detectar abas desatualizadas. Os erros de conflito devolvem estado atual em `error.details.session`. Os dados privados são enviados com `Cache-Control: no-store`.

## Conteúdos e continuidade

- Conteúdo exige disciplina e título; aceita notas em texto simples, link HTTP(S), data civil de estudo e opção de revisão. Pesquisa por título/notas e listas paginadas distinguem ativos e arquivados. Não há catálogo ou exercício obrigatório.
- A primeira agenda vence **amanhã no fuso do perfil**, independentemente de uma data de estudo retroativa. Datas são persistidas como DATE; a resposta JSON usa ISO à meia-noite UTC e a interface exibe a parte civil sem converter fuso. Editar notas não adia a agenda.
- Desabilitar revisão ou arquivar o conteúdo suspende a mesma agenda, preservando seu ID e histórico. Reabilitar/restaurar com revisão habilitada agenda novamente amanhã. Disciplina arquivada oculta seus conteúdos e impede foco vinculado; filas de revisão excluem conteúdos e disciplinas arquivados.
- “Onde parei” exige somente uma próxima ação; contexto, disciplina, conteúdo e material são opcionais. Pontos abertos/concluídos persistem após refresh e novo login. O início destaca o ponto OPEN atualizado mais recentemente e permite voltar a uma sessão ativa ou pendente.
- Arquivar preserva os vínculos e o histórico. Não existe exclusão física por API. Registrar conteúdo ou retorno não concede XP. Após o foco, os dois registros continuam opcionais.

Rotas sob `/api/v1`: `GET/POST /contents`, `GET/PATCH /contents/:id`, `GET/POST /return-points`, `GET/PATCH /return-points/:id` e `GET /dashboard`. Listagens aceitam `page` e `pageSize` (máximo 100). Conteúdos aceitam `q`, `subjectId` e `archived=true|false`; retornos aceitam `status=OPEN|DONE`. Patch usa `archived` em conteúdos e `status` em retornos. Dashboard expõe `activeSession`, `nextReturnPoint` e `dueReviewCount`.

## Revisões periódicas

Em **Revisões**, consulte hoje/anteriores ou próximas datas. Cada conteúdo aparece uma vez, mesmo com vários dias de atraso. Abrir um agendamento ou revelar notas não concede XP. Notas começam fora do DOM; você pode tentar lembrar pelo título/material e avaliar mesmo sem notas ou sem revelá-las.

Os intervalos são **[1, 3, 7, 14, 30, 60] dias civis**, com índice de 0 a 5. São uma heurística de organização, sem promessa de retenção ou correção objetiva.

| Autoavaliação | Novo índice |
|---|---|
| Não lembrei (`AGAIN`) | 0 |
| Com dificuldade (`HARD`) | mantém o atual |
| Lembrei bem (`GOOD`) | avança 1, até 5 |
| Muito fácil (`EASY`) | avança 2, até 5 |

A nova data parte do **dia local da realização**, sem multiplicar tarefas atrasadas. Datas já agendadas permanecem civis ao trocar o fuso; o próximo cálculo usa o perfil atual. Não é permitido avaliar antes do vencimento ou com revisão suspensa/material arquivado.

Cada conclusão válida registra tentativa, datas/índices anteriores e novos, evento auditável de até **5 XP** e comprovante na mesma transação. Teto de **50 XP por dia local** para revisões, independente dos 180 XP de foco. Revisões além do teto continuam salvas com XP zero. História e progresso não são apagados ao suspender ou arquivar.

Rotas sob `/api/v1`: `GET /reviews/due`, `GET /reviews/upcoming`, `GET /reviews/:id`, `GET /reviews/:id/history` e `POST /reviews/:id/attempts`. Filas e histórico aceitam paginação; filas também aceitam `subjectId`. Avaliar exige `{rating, expectedVersion}` e `Idempotency-Key` UUID. Mesma chave/corpo retorna o comprovante original, inclusive depois de outras recompensas; reutilizar chave para outra operação ou enviar versão antiga retorna 409. Erros de estado incluem `error.details.schedule`. A tela mantém chave e corpo no retry de falha de rede; após refresh/novo login, consulte a agenda e o histórico persistidos.

## Verificação

Com os bancos ativos e a migração aplicada:

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
# Ou todos os comandos acima, em sequência:
npm run verify
```

- `npm test`: verificações Node do bloqueio de bancos inseguros, Jest para segurança/configuração/saúde, regras de foco e datas civis, e Vitest/Testing Library para as telas implementadas. Não depende de banco ativo; requer dependências e client Prisma gerado para resolver os tipos da aplicação.
- `npm run test:integration`: aplica migrações **no banco de testes** e executa Jest/Supertest com Nest e PostgreSQL reais. Verifica autenticação, isolamento, foco, XP, concorrência, recuperação, conteúdos, agenda, revisões, histórico, arquivamento e continuidade após login com relógio controlado. Falhas injetadas depois da recompensa verificam rollback de foco/revisão. O cenário de indisponibilidade do health injeta uma falha de consulta; não é um teste de queda física do servidor.
- O runner de integração exige `TEST_DATABASE_URL` separado, com nome terminado em `_test`, antes de executar qualquer migração. Os registros fictícios criados pelos testes são removidos ao final.
- `npm run db:status`: estado das migrações de desenvolvimento.
- `npm run db:migrate:dev -- --name nome`: para criar novas migrações durante desenvolvimento; `db:migrate` somente aplica migrações versionadas.

## Build e processos

```sh
npm run build
npm run start --workspace @estudo-em-dia/api
# Em outro terminal, para inspecionar a SPA compilada:
npm run preview --workspace @estudo-em-dia/web
```

O preview usa a porta 4173 e encaminha `/api` para a API local. Para autenticar pelo preview, inicie a API com `FRONTEND_ORIGIN=http://localhost:4173`. A SPA compilada sempre usa os runtimes de produção, mesmo se o `.env` mantiver a API em desenvolvimento. Preview é inspeção do build; hospedagem pública precisará de HTTPS, proxy no mesmo site, credenciais próprias, backups e configuração de PostgreSQL.

`npm run dev` inicia ambos os apps. A API usa o compilador TypeScript para preservar metadados do Nest e o watch nativo do Node para reiniciar; o frontend usa o HMR do Vite. `Ctrl+C` encerra os processos. O banco persiste separadamente:

```sh
npm run db:down
npm run db:up
npm run db:migrate
```

`db:down` preserva o volume de desenvolvimento. O banco de testes é isolado, temporário e recriado vazio; o runner reaplica suas migrações. Não use `docker compose down -v` para um ambiente com dados que deseja preservar.

## Configuração

As variáveis ficam no `.env` da raiz, com referência em [.env.example](.env.example). API e Prisma carregam esse arquivo sem sobrescrever variáveis já injetadas no processo. O frontend só publica variáveis com prefixo `VITE_`; **nunca coloque segredos nesse prefixo**.

Se houver conflito de portas, altere `POSTGRES_PORT` / `POSTGRES_TEST_PORT` **e as URLs correspondentes**. Ao mudar `PORT`, o proxy Vite acompanha o valor. `FRONTEND_ORIGIN` é uma única origem HTTP(S), sem caminho; não aceita `*`. Em produção exige HTTPS, cookie Secure com prefixo `__Host-` e chave JWT de 32 bytes em hexadecimal. `COOKIE_SECURE=false` é permitido somente fora de produção. Rotacionar a chave invalida os JWTs existentes.

Se alterar a senha depois de o volume do PostgreSQL existir, a variável do Compose não muda a senha já armazenada no banco. Preserve a configuração original ou faça a rotação explicitamente com ferramentas do PostgreSQL, sem apagar dados.

Em ambientes com sandbox de rede, Docker, PostgreSQL e servidores HTTP locais podem precisar ser executados pelo mecanismo autorizado da plataforma. Preserve proxies, checksums e verificação TLS.

### Alternativa oficial quando o host dos binários estiver bloqueado

Nesta instância, o HTTP 403 de `binaries.prisma.sh` foi resolvido compilando **o código oficial do engine no commit exato do Prisma 7.10.1**, usando Rust fixado e Cargo.lock. Não foram desativados checksums. O diretório de ferramentas é um cache de dependência fora do checkout da aplicação; o binário não é enviado ao GitHub.

Em Linux com compilador C, make, headers OpenSSL, pkg-config, Python/pip, Git e curl instalados, e acesso permitido a GitHub, Rust e crates.io:

```sh
bash scripts/build-prisma-engine.sh /workspace/tooling
export PRISMA_SCHEMA_ENGINE_BINARY=/workspace/tooling/prisma-engines/target/release/schema-engine
npm ci
npm run setup:env
```

O script preserva caches válidos e recusa código-fonte local alterado. Essa alternativa foi exercitada nesta instância; não é necessário usá-la em máquinas que conseguem obter normalmente o binário oficial. Guarde o export nas instruções do ambiente, não copie o binário ou valores secretos para o Git. O bloqueio de rede original não foi removido; o caminho de instalação mudou para uma compilação a partir da fonte oficial.

## Organização

```text
apps/web/       React, Vite, Tailwind e testes de interface
apps/api/       NestJS, Prisma 7, migrações e testes de API
scripts/        configuração local e runner seguro de integração
docs/           especificação original, decisões e evidências reais
```

O banco possui cinco migrações, incluindo `StudyContent`, `ReviewSchedule`, `ReturnPoint` e `ReviewAttempt`. Índices parciais garantem disciplina ativa única por nome/conta e uma sessão aberta por conta; cada conteúdo possui no máximo uma agenda e cada versão processada tem no máximo uma tentativa. Eventos têm origem única; o lock de usuário serializa escritas de disciplinas, conteúdos, continuidade, foco e revisões. FKs compostas reforçam propriedade de vínculos. Não há seed automática nem credenciais de demonstração no código. As contas fictícias das verificações são removidas ao final.

A próxima entrega do plano é **Etapa 5 — academia e estatísticas**: quatro estágios decorativos derivados de XP e métricas baseadas em registros reais.

Referências: [documentação principal](docs/00_LEIA_PRIMEIRO.md), [autenticação e engine](docs/decisoes/ADR-0003-autenticacao-persistida-engine.md), [foco e XP](docs/decisoes/ADR-0004-foco-recompensas.md), [conteúdos e continuidade](docs/decisoes/ADR-0005-conteudos-continuidade.md), [revisões](docs/decisoes/ADR-0006-revisoes-periodicas.md), [resultados atuais](docs/evidencias-ia/ETAPA-4.md).
