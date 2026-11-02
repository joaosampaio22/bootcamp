# Evidência real — Etapa 0: base reprodutível

Data: **02/11/2026**, horário do usuário `America/Sao_Paulo`.

**Status: implementação criada; validação integral bloqueada pela rede. Não declarar a Etapa 0 concluída.**

## Solicitação e escopo

O usuário esclareceu que criou o repositório vazio para receber a implementação e enviou `Estudo_em_Dia_Pacote_Completo_Codex.zip` com a mensagem: “Estou te enviando a documentação do que você tem que fazer.”

O pacote contém `PROMPT_INICIAL_CODEX.txt` e o plano `07_PLANO_CODEX.md`, que orientam implementar somente a Etapa 0 primeiro. O Codex leu todos os documentos numerados e incorporou a especificação ao repositório. Não houve revisão humana adicional dos arquivos nesta execução; não registrar aprovação, commit, deploy ou produto completo.

Requisitos desta entrega: RNF-001, RNF-002 (base), RNF-003, RNF-004 (esquema mínimo), RNF-006, RNF-009, RNF-010 e TS-11 limitado ao esquema inicial. RF/CA de autenticação, foco, XP, conteúdos, revisões e academia continuam pendentes.

## Intervenção concreta

- Monorepo npm workspaces, configurações strict, lint e versões fixadas no lockfile.
- React/Vite/Tailwind com apresentação em português, SVG próprio, navegação por âncoras, estado explícito de construção e status obtido da API. Não há funcionalidades de estudo simuladas.
- NestJS modular, prefixo `/api/v1`, health com consulta ao PostgreSQL, request IDs, erros estruturados, Helmet, CORS restrito e ValidationPipe.
- Prisma 7 com adapter `pg`, configuração moderna e schema `User` mínimo. Migração SQL versionada; nenhum usuário/seed automático.
- PostgreSQL oficial com digest fixado; bancos separados para desenvolvimento e testes.
- Geração local e não destrutiva de `.env`; runner que exige banco `_test` diferente do desenvolvimento, inclusive quando a URL muda somente senha, schema ou alias de loopback.
- README com execução, limites, comandos de verificação e próxima etapa. Decisões em `docs/decisoes/ADR-0001-base-reprodutivel.md`.

Principais arquivos: `package.json`, `package-lock.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.env.example`, `docker-compose.yml`, `scripts/`, `apps/api/`, `apps/web/`, `README.md` e documentação desta etapa.

## Comandos e resultados observados

| Comando / verificação | Resultado real |
|---|---|
| `npm install --no-fund --fetch-retries=1` | **Falhou** no `postinstall` ao gerar Prisma: checksum oficial em `binaries.prisma.sh` retornou HTTP 403. |
| `npm install --ignore-scripts --no-fund --fetch-retries=1` | Instalou/atualizou dependências para permitir trabalho independente. **Não completa a instalação do Prisma.** |
| `npm run setup:env`, duas execuções | Criou arquivo local com senha aleatória; segunda execução preservou o arquivo. Nenhum valor secreto foi exibido. |
| `npm run db:up` | Dois containers saudáveis: desenvolvimento em 5432, testes em 5433. |
| Consultas `SELECT 1` via `pg` nos dois bancos | **Aprovadas**, conexão SQL real sem imprimir URLs ou senhas. |
| SQL da migração em transação no banco de testes | **Aprovado**: criação, INSERT, default `America/Sao_Paulo`, unicidade do e-mail (23505) e rollback que removeu tabela/fixture. **Não equivale a `prisma migrate deploy`.** |
| `npm run lint` | **Aprovado**, zero warnings. |
| `node --test --test-isolation=none scripts/test-database.spec.mjs` | **4 testes aprovados**. O modo sem isolamento permite observar cada caso neste runtime; nenhuma asserção foi removida. |
| Jest `src/common/environment.spec.ts` | **16 testes aprovados**: configuração, portas, origens, modo, HTTPS e mensagens sem credenciais. |
| `npm run test --workspace @estudo-em-dia/web` | **5 testes aprovados**, sem skips: estado atual, espera, sucesso, retry e falhas HTTP/contrato. |
| `npm test` (execução agregada) | **Falhou**: suíte `health.service.spec.ts` não carregou por ausência de `src/generated/prisma/client.js`. Os 16 testes de configuração e 5 de frontend passaram; os 2 casos da suíte de saúde **não executaram**. |
| `npm run typecheck --workspace @estudo-em-dia/api` | **Falhou** por client Prisma ausente e propriedades herdadas indisponíveis. Não declarar o backend tipado/build validado. |
| `npm run build --workspace @estudo-em-dia/web` | **Aprovado**, inclui `tsc --noEmit` e Vite; compilação de produção da SPA gerada. |
| Chromium real, 1440px e 360px | SPA renderizou; sem overflow horizontal. Exibiu corretamente indisponibilidade de conexão, pois a API não iniciou. Capturas abaixo. |
| `npm audit --omit=dev --json` após atualizações | **0 vulnerabilidades de execução reportadas** naquele momento. |
| `npm audit --json` completo | **31 alertas em dependências de desenvolvimento**: 4 baixos e 27 moderados, sem altos/críticos. Não aplicar overrides incompatíveis para esconder alertas. |
| `git diff --check` | **Aprovado** na inspeção realizada. |

As verificações SQL e do navegador foram feitas por scripts temporários nesta execução. Não há alegação de CI, teste em máquina nova, autenticação funcional, gravação de vídeo ou implantação pública.

## Diagnóstico e correções

1. A rede do sandbox impediu conexão até com o proxy/local; operações autorizadas de npm, Docker e SQL funcionaram pelo mecanismo de execução com permissão de rede. A autenticação GitHub fornecida pela plataforma funcionou em operação de leitura, sem token adicional.
2. O download do checksum do schema engine Prisma falhou com HTTP 403. Uma requisição HTTPS ao mesmo destino confirmou `CONNECT tunnel failed, response 403`. O host não constava nos destinos permitidos da instância. Não desativamos TLS, assinatura ou checksums e não usamos o artefato não verificado.
3. Foi salva no **rascunho** do ambiente a adição de `binaries.prisma.sh`, mantendo o preset existente de gerenciadores de pacotes. A política observada da instância continuou sem o domínio. Salvar rascunho não aplica nem publica a mudança.
4. A primeira seleção de Nest 11 trouxe alerta transitivo de Multer. Atualizamos todo o Nest para 12.3.2, mantivemos Prisma 7.10.1 e atualizamos Concurrently e lint para versões corrigidas/compatíveis. A auditoria de execução passou após isso.
5. A inspeção visual encontrou glifos de setas ausentes na fonte do navegador; foram substituídos por SVG e a página foi novamente verificada em desktop e mobile.

## Evidência visual

Estas capturas são do **frontend real da Etapa 0**, com status indisponível enquanto a API está bloqueada. Não são telas do MVP completo.

- [Desktop, 1440px](etapa-0-desktop.png).
- [Mobile, 360px](etapa-0-mobile.png).

## Pendências que impedem a conclusão

1. Aplicar a liberação de `binaries.prisma.sh` nas configurações do ambiente e verificar a propagação.
2. Reexecutar `npm ci` com scripts habilitados e checksums ativos; confirmar geração do client ESM.
3. Executar `npm run db:migrate` e `npm run test:integration` via **Prisma**, inclusive o round-trip pelo client e a migração em banco vazio.
4. Executar `npm run verify` integralmente; resolver qualquer falha que apareça após a geração.
5. Iniciar a API de desenvolvimento e a compilada; confirmar health direto e pelo proxy Vite, então testar também o estado conectado no navegador real.
6. Validar os comandos de instalação/início restantes e salvar `install_script` / `start_skill` reutilizáveis do ambiente. Esses campos não foram salvos como instruções testadas enquanto o fluxo completo continua bloqueado.

Após a Etapa 0 validada, aguardar solicitação da **Etapa 1 — autenticação + disciplinas**, conforme o plano fornecido. Publicação do ambiente e deploy não foram realizados.
