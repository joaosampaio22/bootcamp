# ADR-0001 — Base ESM, ambiente local e migração mínima

Data: 02/11/2026. Escopo: Etapa 0 de `07_PLANO_CODEX.md`.

## Contexto

O repositório continha apenas `README.md`. O pacote enviado especifica implementação incremental, começando pela base, sem autenticação ou regras de estudo nesta etapa. Prisma 7 usa driver adapter e o client moderno; Nest depende de metadados de decorators.

## Decisão

- npm workspaces `apps/web` e `apps/api`; Node 24.19.0 / npm 11; TypeScript 5.9 strict. Sem pacote compartilhado, monorepo manager ou serviço adicional de aplicação.
- NestJS 12.3.2 e Prisma 7.10.1 em ESM com `NodeNext`, `prisma.config.ts`, generator `prisma-client`, imports `.js` e `PrismaPg`. Client gerado fica ignorado pelo Git e é reconstruído no `postinstall`. A seleção inicial de Nest 11 foi atualizada após auditoria apontar uma versão vulnerável de Multer; a documentação de produto não fixa o major do Nest. ESLint 10 usa plugins compatíveis para evitar a versão 9 sem suporte.
- API compilada pelo `tsc`, sem Nest CLI. Watch nativo do Node reinicia o build; isso preserva `emitDecoratorMetadata` sem adicionar outra ferramenta de compilação. Backend usa Jest/ts-jest em ESM; frontend, Vitest/Testing Library.
- `.env` central, ignorado, com senha local aleatória. Geração exclusiva não sobrescreve arquivo existente. Compose expõe PostgreSQL somente em loopback e fixa o digest da imagem oficial.
- Banco de desenvolvimento com volume persistente; banco de testes separado no perfil `test`, porta própria e armazenamento temporário. O runner exige nome `_test` e URL diferente antes de migrar.
- Migração mínima com `User` completo conforme 03. Não criar tabelas descartáveis de infraestrutura nem antecipar modelos das próximas etapas. Não inserir dados ou credenciais de demonstração automaticamente.
- `/api/v1/health` executa `SELECT 1`. Respostas de erro estruturadas, request ID gerado no servidor, Helmet, CORS com origem explícita e ValidationPipe. Segurança de autenticação/CSRF será feita na Etapa 1, antes de endpoints de negócio.
- SPA apresenta o propósito e o estado de construção, sem simular timer, saldo de XP, contas ou persistência de estudo. A conexão exibida vem do health real, via proxy do Vite.

## Alternativas descartadas

SQLite ou persistência em memória não validariam PostgreSQL/Prisma. `tsx` como compilador principal do Nest exigiria outro tratamento de metadados. Banco único misturaria fixtures e desenvolvimento. Implementar todo o MVP contrariaria a divisão explícita por etapas do pacote.

## Consequências

Docker e conectividade local são necessários para integração. O banco de testes é descartável; o volume de desenvolvimento deve ser preservado. Não há autenticação, seed, regra de XP, agenda ou deploy nesta etapa. A tabela `User` será consumida pela Etapa 1.

## Rastreabilidade e validação

RNF-001 (REST), RNF-002 (base responsiva), RNF-003 (strict/validação), RNF-004 (migração), RNF-006 (segredos), RNF-009 (health/erros), RNF-010 (runners), TS-11 (migração em banco vazio, limitada ao esquema da Etapa 0). Não declarar RF/CA de autenticação ou estudo atendidos.

Resultados reais são registrados em `../evidencias-ia/ETAPA-0.md`; requisitos das próximas etapas continuam pendentes.
