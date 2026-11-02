# Instruções obrigatórias para Codex — Estudo em Dia

## Objetivo

Implementar o MVP do **Estudo em Dia** como web app robusto e universal de foco, registro livre de conteúdo, revisões periódicas, continuidade e academia decorativa. **Nenhum exercício pronto, catálogo compulsório, LLM em produção ou city-builder de gestão.**

## Fonte de verdade

Leia `docs/00_LEIA_PRIMEIRO.md`, `docs/02_REQUISITOS_REGRAS.md`, `docs/03_ARQUITETURA_DADOS.md`, `docs/04_API_ALGORITMOS.md`, `docs/06_TESTES_QUALIDADE.md` e o plano `docs/07_PLANO_CODEX.md`. A hierarquia em caso de conflito está em `docs/07_PLANO_CODEX.md`.

## Stack e organização

- TypeScript strict do frontend ao backend.
- Frontend React + Vite + Tailwind CSS.
- Backend NestJS monólito modular com REST `/api/v1`.
- PostgreSQL + Prisma ORM 7 (driver adapter `pg`), migrações e Compose para banco local.
- Autenticação por sessão revogável com cookie HttpOnly; segurança de Origin/CSRF.
- Vitest frontend; Jest/Supertest backend.
- npm workspaces; não criar microserviços, infraestrutura distribuída nem pacotes extras sem justificativa.

## Regras inegociáveis

1. Disciplina e assunto são livres, criados pelo usuário; **não implementar exercícios predefinidos**.
2. Sessão de foco pode começar sem conteúdo cadastrado.
3. XP vem apenas do backend, é auditável e **não duplica em retries/corridas**.
4. Revisões se baseiam em autoavaliação de conteúdo do usuário; não declarar correção objetiva.
5. Pontos de retorno persistem entre dispositivos e logins.
6. Academia é uma visualização 2D de quatro estágios, **sem economia e sem edição manual de cidade**.
7. Todos os recursos são isolados por usuário; autenticação e propriedade validadas em todos os endpoints.
8. Operações críticas usam transação, validações DTO e erros estruturados.
9. Testes com relógio controlado e banco preparado; não esperar minutos reais durante os testes.
10. Não inventar implementação concluída, resultados de testes, evidências de IA, fontes ou URL de hospedagem.

## Rotina a cada etapa

1. Identifique IDs RF/RN/CA correspondentes.
2. Implemente **somente** a etapa solicitada.
3. Rode testes, typecheck, lint e build aplicáveis, registrando o resultado real.
4. Explique arquivos modificados e riscos remanescentes.
5. Registre decisões importantes em `docs/decisoes/` e evidências reais de assistência GenAI em `docs/evidencias-ia/`.

## Alterações permitidas

Pode tomar pequenas decisões de UI ou nomes de funções respeitando requisitos. **Não alterar** XP, intervalos, limites, modelo de estados, segurança, arquitetura nem escopo P0 sem justificar alteração, atualizar documentação/testes e obter decisão de produto quando o impacto for relevante.
