# Estudo em Dia

Um espaço para estudar qualquer conteúdo, preservar pontos de retorno e organizar revisões. A **Academia Viva** será uma representação decorativa do progresso, sem economia, exercícios prontos ou LLM em produção.

## Baixar e visualizar sem instalar

No GitHub, use **Code → Download ZIP**, extraia o arquivo e abra **`PREVIA.html`** no navegador. O arquivo mostra capturas reais de cadastro e disciplinas da **Etapa 1**, com dados fictícios, sem instalar nada. É uma galeria visual; para usar os formulários e salvar seus próprios dados, execute a aplicação conforme abaixo.

Para desenvolver ou executar com API e banco, siga as instruções abaixo.

**Estado atual: Etapas 0 e 1 implementadas e verificadas nesta instância.** Cadastro, login/logout, sessões revogáveis, perfil/fuso, rotas privadas e disciplinas livres (criar, listar, renomear, arquivar e restaurar) funcionam com API e PostgreSQL. As verificações incluem isolamento entre contas, CSRF, rate limit e persistência após refresh e novo login. Consulte o [relatório atual](docs/evidencias-ia/ETAPA-1-CONCLUSAO.md).

**O MVP completo ainda está em desenvolvimento:** foco, XP, conteúdos, continuidade, revisões, academia e estatísticas pertencem às próximas etapas de [docs/07_PLANO_CODEX.md](docs/07_PLANO_CODEX.md). Os relatos anteriores da Etapa 0 e do início da Etapa 1 são registros históricos, não o estado atual.

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

Abra **http://localhost:5173/register** para criar sua conta; depois entre em **http://localhost:5173/app/subjects**. A API usa a porta **3000**. O Vite encaminha `/api` para a API sem expor segredos ao navegador. Use `localhost` na interface: o padrão `FRONTEND_ORIGIN=http://localhost:5173` rejeita escritas originadas de `http://127.0.0.1:5173`. Se escolher outra origem, configure-a explicitamente no `.env`.

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

- `npm test`: verificações Node do bloqueio de bancos inseguros, Jest para segurança/configuração/saúde e Vitest/Testing Library para acesso, rotas privadas e disciplinas. Não depende de banco ativo; requer dependências e client Prisma gerado para resolver os tipos da aplicação.
- `npm run test:integration`: aplica migrações **no banco de testes** e executa Jest/Supertest com Nest e PostgreSQL reais. Verifica cadastro, cookies, login/logout, perfil, disciplinas, isolamento entre contas, CSRF, expiração com relógio controlado, rate limit e unicidade em chamadas concorrentes. O cenário de consulta indisponível do health injeta uma falha controlada; não é um teste de queda física do servidor.
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

O banco possui `User`, `AuthSession` e `Subject`, com duas migrações. Um índice SQL parcial garante nomes ativos únicos por usuário, inclusive em concorrência, permitindo reutilização após arquivamento. Não há seed automática nem credenciais de demonstração no código. As contas fictícias das verificações são removidas ao final.

A próxima entrega do plano é **Etapa 2 — foco robusto e recompensas**, ainda não implementada.

Referências: [documentação principal](docs/00_LEIA_PRIMEIRO.md), [decisões da autenticação e do engine](docs/decisoes/ADR-0003-autenticacao-persistida-engine.md), [resultados atuais](docs/evidencias-ia/ETAPA-1-CONCLUSAO.md).
