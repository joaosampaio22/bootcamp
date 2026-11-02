# ADR-0002 — Fundamentos testáveis da autenticação

Data: 02/11/2026. Etapa 1 iniciada após solicitação do usuário para continuar o desenvolvimento.

## Contexto e limite

O download oficial do schema engine Prisma continua retornando HTTP 403. O domínio está salvo no rascunho, mas ausente da política da instância. Aplicamos a exceção de bloqueio externo de `07_PLANO_CODEX.md`, seção 7.9: desenvolver somente componentes independentes verificáveis, sem declarar a Etapa 0 ou a Etapa 1 concluídas. Não substituir PostgreSQL por armazenamento em memória nem desativar checksums.

## Decisões

- `argon2@0.45.1` para Argon2id (64 MiB, três iterações, paralelismo 1, salt aleatório da biblioteca). Senhas de cadastro entre 12 e 128 caracteres; não trimar nem normalizar a senha. Hashes malformados falham sem propagar detalhes do driver.
- `jose@6.2.15` para JWT HS256, chave de pelo menos 32 bytes, issuer/audience explícitos, UUIDs de usuário/sessão e validade de uma hora. O chamador fornece o instante para testar fronteiras sem esperar tempo real. Os testes geram suas próprias chaves efêmeras.
- O codec não autentica uma conta sozinho. O futuro guard deve obrigatoriamente verificar a sessão `AuthSession` no banco, expiração e revogação. Nunca confiar apenas no JWT.
- Token CSRF aleatório de 32 bytes representado em base64url no JWT; comparação em tempo constante. A futura rota deve validar a origem e o CSRF. A política não aceita ausência de Origin/Referer, múltiplas origens ou fallback para Referer quando existe Origin inválido.
- DTOs com normalização de e-mail, limites e fuso IANA; disciplinas com nome livre, sem catálogo, e arquivamento com booleano real. Rejeitar campos de autoridade como `userId` e `xp` pelo ValidationPipe.
- Health recebe uma interface de consulta (`DatabaseProbe`); o módulo de produção continua executando `SELECT 1` pelo Prisma. Isso permite testar comportamento unitário sem carregar client gerado; não substitui o teste de integração com PostgreSQL.

## Pendências obrigatórias

Geração do client, migrações, `AuthSession`, persistência/transações, cookies HttpOnly/Secure/SameSite, guards aplicados nas rotas, rate limit, cadastro/login/logout, perfil, CRUD e isolamento de disciplinas, frontend autenticado e testes de integração. Os componentes deste commit ainda não são recursos acessíveis pela API.

Requisitos relacionados: RF-001–005, RF-010, RN-001–003, RN-010, RNF-003/005/006/010. TS-04–06 recebem testes de componentes, não prova de fluxo HTTP completo.
