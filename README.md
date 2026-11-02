# Estudo em Dia

Um espaço para estudar qualquer conteúdo, preservar pontos de retorno e organizar revisões. A **Academia Viva** será uma representação decorativa do progresso, sem economia, exercícios prontos ou LLM em produção.

## Baixar e visualizar sem instalar

No GitHub, use **Code → Download ZIP**, extraia o arquivo e abra **`PREVIA.html`** no navegador. Esse HTML inclui os estilos e o JavaScript da página inicial e não exige instalar Node ou dependências. É uma prévia da **Etapa 0**; não executa a API nem as funcionalidades futuras. O indicador de conexão ficará indisponível enquanto não houver backend.

Para desenvolver ou executar com API e banco, siga as instruções abaixo.

**Estado atual: Etapa 0 — base em implementação.** Há uma SPA de apresentação, API com saúde do PostgreSQL, esquema mínimo e verificações automatizadas. Cadastro, login, disciplinas, foco, XP, conteúdos, continuidade, revisões e academia **ainda não estão implementados**. O plano completo está em [docs/07_PLANO_CODEX.md](docs/07_PLANO_CODEX.md). Consulte as [evidências de execução](docs/evidencias-ia/ETAPA-0.md) para os resultados e pendências da base.

**Continuação: Etapa 1 iniciada pela segurança**, com Argon2id, codec JWT, verificações de Origin/CSRF e DTOs testados. Esses componentes ainda não estão ligados a endpoints nem a sessões persistidas; não há cadastro/login funcional. A validação integral continua bloqueada pelo download oficial do Prisma. Veja o [registro da continuação](docs/evidencias-ia/ETAPA-1.md).

## Pré-requisitos

- Node.js **24.19.0** (ver `.nvmrc`) e npm **11.x**; ambiente usa npm 11.9.0.
- Docker Engine e Docker Compose v2, com daemon ativo e permissão de acesso.
- Portas locais 3000 (API), 5173 (SPA), 5432 (PostgreSQL de desenvolvimento) e 5433 (PostgreSQL de testes) livres.
- Acesso ao registro npm, à imagem oficial do PostgreSQL e a `binaries.prisma.sh` (binário e checksum oficiais do Prisma).

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

`npm ci` gera o client Prisma pelo `postinstall`; essa geração não exige banco ativo nem `.env`. `setup:env` gera uma senha **aleatória, somente local**, em `.env` com permissão restrita, sem exibir o valor. Reexecutar o comando preserva arquivos existentes. Não use nem versione as credenciais locais em hospedagem pública.

O frontend usa a porta **5173**; a API, **3000**. O Vite encaminha `/api` para a API, sem expor `DATABASE_URL` ao navegador. A interface informa que o produto está em construção e só confirma conexão após resposta real da API e do banco.

Verifique em outro terminal:

```sh
curl --fail http://127.0.0.1:3000/api/v1/health
curl --fail http://127.0.0.1:5173/api/v1/health
```

Resposta esperada em ambos:

```json
{"status":"ok","service":"estudo-em-dia-api","database":"up"}
```

O health check não revela versão, credenciais, dados de usuários ou erros do driver. Falha de consulta retorna HTTP 503 com erro estruturado e ID da requisição. Não existe endpoint de escrita nesta etapa.

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

- `npm test`: quatro verificações Node do bloqueio de bancos inseguros, Jest para configuração/saúde da API e Vitest + Testing Library para a SPA (espera, sucesso confirmado, erro e retry). Não depende de banco, mas os testes de saúde precisam do client Prisma gerado.
- `npm run test:integration`: aplica migrações **no banco de testes** e executa Jest/Supertest com Nest e PostgreSQL reais. Verifica contrato HTTP, headers, CORS, erros, leitura/escrita via Prisma e unicidade do e-mail. O cenário de consulta indisponível injeta uma falha controlada; não é um teste de queda física do servidor.
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

O preview usa a porta 4173 e encaminha `/api` para a API local. É apenas inspeção do build, não servidor de produção. Uma hospedagem futura precisará de HTTPS, proxy no mesmo site, configuração de autenticação da Etapa 1 e configuração própria de PostgreSQL.

`npm run dev` inicia ambos os apps. A API usa o compilador TypeScript para preservar metadados do Nest e o watch nativo do Node para reiniciar; o frontend usa o HMR do Vite. `Ctrl+C` encerra os processos. O banco persiste separadamente:

```sh
npm run db:down
npm run db:up
npm run db:migrate
```

`db:down` preserva o volume de desenvolvimento. O banco de testes é isolado, temporário e recriado vazio; o runner reaplica suas migrações. Não use `docker compose down -v` para um ambiente com dados que deseja preservar.

## Configuração

As variáveis ficam no `.env` da raiz, com referência em [.env.example](.env.example). API e Prisma carregam esse arquivo sem sobrescrever variáveis já injetadas no processo. O frontend só publica variáveis com prefixo `VITE_`; **nunca coloque segredos nesse prefixo**.

Se houver conflito de portas, altere `POSTGRES_PORT` / `POSTGRES_TEST_PORT` **e as URLs correspondentes**. Ao mudar `PORT`, o proxy Vite acompanha o valor. `FRONTEND_ORIGIN` é uma única origem HTTP(S), sem caminho; não aceita `*`. Em produção, exige HTTPS. Não há cookies ou login nesta etapa; CORS e Helmet estão preparados, mas não substituem a proteção de sessão/CSRF que será implementada na Etapa 1.

Se alterar a senha depois de o volume do PostgreSQL existir, a variável do Compose não muda a senha já armazenada no banco. Preserve a configuração original ou faça a rotação explicitamente com ferramentas do PostgreSQL, sem apagar dados.

Em ambientes com sandbox de rede, Docker, PostgreSQL e servidores HTTP locais podem precisar ser executados pelo mecanismo autorizado da plataforma. Preserve proxies, checksums e verificação TLS. Um bloqueio de `binaries.prisma.sh` exige liberar esse domínio nas configurações de rede; não desative a verificação do Prisma.

## Organização

```text
apps/web/       React, Vite, Tailwind e testes de interface
apps/api/       NestJS, Prisma 7, migrações e testes de API
scripts/        configuração local e runner seguro de integração
docs/           especificação original, decisões e evidências reais
```

O esquema mínimo inclui apenas `User` conforme a especificação, sem contas ou seed automática. Não há implementação de autenticação só porque o modelo existe. A próxima entrega do plano é **Etapa 1 — autenticação e disciplinas**, com sessões revogáveis, Argon2id, proteção Origin/CSRF e isolamento entre contas.

Referências: [documentação principal](docs/00_LEIA_PRIMEIRO.md), [decisão da base](docs/decisoes/ADR-0001-base-reprodutivel.md), [evidências de execução](docs/evidencias-ia/ETAPA-0.md).
