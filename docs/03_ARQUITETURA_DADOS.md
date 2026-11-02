# 03 — ARQUITETURA TÉCNICA, DADOS E SEGURANÇA

## 3.1 Decisão de arquitetura (ADR-001)

**Padrão:** monólito modular com frontend separado, API REST e banco PostgreSQL. Evitar microsserviços e filas distribuídas no MVP.

| Camada | Escolha | Decisão prática |
|---|---|---|
| UI | React + TypeScript + Vite | SPA responsiva, telas modulares, hooks pequenos |
| CSS | Tailwind CSS + CSS/SVG próprios | Academia em SVG estático/camadas, sem engine de jogo |
| Navegação | React Router | Rotas públicas e privadas |
| API | Node.js + NestJS | Controllers, serviços, DTOs, Guards, OpenAPI |
| Persistência | PostgreSQL | Relacional, transações, constraints e índices |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Fixar versões compatíveis; Prisma 7 exige adapter e ESM |
| Autenticação | JWT curto em cookie HttpOnly + sessão revogável | Não salvar token em localStorage; consultar sessão ativa |
| Testes | Vitest frontend e Jest/Supertest backend | Cobrir regras, endpoints e autorização |
| Desenvolvimento | npm workspaces + Docker Compose (Postgres) | Monorepo sem turborepo/Nx inicialmente |
| Documentação de API | OpenAPI/Swagger via NestJS | Contratos gerados e exemplos verificáveis |

**Justificativa:** uma única linguagem em todas as camadas reduz o custo de contexto do Codex, sem remover a separação de responsabilidades. Prisma deve ser configurado conforme documentação da versão fixada (Prisma 7 usa driver adapter e configuração moderna); não misturar snippets de versões 5/6/7/8.

## 3.2 Desenho dos componentes

```text
                   ┌────────────────────────────────┐
                   │  SPA React / TypeScript        │
                   │  Dashboard, Foco, Revisões,    │
                   │  Conteúdos, Continuidade, RPG  │
                   └────────────────┬───────────────┘
                                    │ HTTPS/JSON + cookies
                                    ▼
                   ┌────────────────────────────────┐
                   │ NestJS API /api/v1             │
                   │ AuthGuard + DTO validation     │
                   │ Modules/Controllers            │
                   ├────────────────────────────────┤
                   │ Application services           │
                   │ Focus / Review / Continuity    │
                   │ Rewards / Subjects / Stats     │
                   ├────────────────────────────────┤
                   │ Prisma service + transactions  │
                   └────────────────┬───────────────┘
                                    │ SQL
                                    ▼
                            PostgreSQL
```

## 3.3 Estrutura proposta do repositório

```text
estudo-em-dia/
  AGENTS.md
  README.md
  .env.example
  package.json                 # npm workspaces
  docker-compose.yml           # PostgreSQL local
  docs/                        # este pacote de especificação
  apps/
    web/
      src/
        app/                   # rotas, providers
        components/            # base UI
        features/
          auth/ subjects/ contents/ focus/ reviews/
          continuity/ academy/ statistics/
        lib/api.ts
        styles/
      public/academy/          # 4 assets SVG/PNG próprios
    api/
      prisma/
        schema.prisma
        migrations/
        seed.ts
      src/
        auth/ users/ subjects/ contents/
        focus/ reviews/ continuity/ rewards/ statistics/
        common/                # config, guards, errors, time
        prisma/
      test/
  packages/
    contracts/                 # tipos DTO compartilhados (opcional P1)
```

Em P0, **não** criar `packages/contracts` se isso atrasar o trabalho. É aceitável consumir OpenAPI ou manter DTOs pequenos e testes de contrato sem duplicação desnecessária.

## 3.4 Responsabilidades e dependências

- `auth`: cadastro, login, logout, cookie, proteção por sessão.
- `users`: perfil, fuso IANA.
- `subjects`: disciplina e arquivamento.
- `contents`: conteúdo livre e regras de edição/arquivamento.
- `focus`: estados de sessão, intervalos ativos, reconciliação.
- `reviews`: agendamento, tentativas, cálculo da próxima revisão.
- `continuity`: pontos de retorno.
- `rewards`: fonte única de XP, limites e consulta de eventos.
- `statistics`: agregações filtradas por usuário e fuso.
- `academy`: **somente leitura derivada** do total de XP; não precisa de tabela de posições de edifícios.

As regras de negócio ficam nos serviços do backend, não no frontend. A interface é consumidora de dados e fonte de ações do usuário, não autoridade para saldo de XP ou cálculo final de tempo.

## 3.5 Modelo relacional lógico

**Tipos:** IDs UUID gerados no servidor; datas de eventos como `timestamptz`/DateTime UTC; vencimento de revisão como data civil (`DATE`) sem horário; durações inteiras em segundos; `updatedAt` e `createdAt` nas entidades mutáveis.

### User

| Campo | Tipo | Restrição |
|---|---|---|
| id | UUID | PK |
| name | varchar(100) | obrigatório |
| emailNormalized | varchar(254) | único, lowercase |
| passwordHash | text | obrigatório, nunca resposta API |
| timeZone | varchar(80) | IANA, padrão America/Sao_Paulo |
| createdAt / updatedAt | datetime UTC | obrigatório |

### AuthSession

| Campo | Tipo | Restrição |
|---|---|---|
| id | UUID | PK, também `jti` de JWT |
| userId | UUID | FK User |
| expiresAt | datetime UTC | obrigatório |
| revokedAt | datetime UTC | nulo quando ativa |
| createdAt | datetime UTC | obrigatório |

### Subject

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId | UUID | PK / FK User |
| name | varchar(80) | obrigatório |
| normalizedName | varchar(80) | índice único por usuário entre ativas, se viável no SQL |
| archivedAt | datetime UTC | nullable |
| createdAt / updatedAt | datetime UTC | obrigatório |

### StudyContent

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId / subjectId | UUID | PK / FK; subject pertence ao mesmo usuário |
| title | varchar(160) | obrigatório |
| notes | text | limite lógico de 10.000 |
| materialUrl | text | nullable, protocolo http(s) |
| studiedOn | DATE | data civil informada ou padrão hoje local |
| reviewEnabled | boolean | padrão true; usuário escolhe |
| archivedAt | datetime UTC | nullable |
| createdAt / updatedAt | datetime UTC | obrigatório |

### ReturnPoint

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId | UUID | PK / FK |
| subjectId / contentId | UUID | opcionais; validar propriedade |
| context | text | até 2.000 |
| nextAction | varchar(500) | obrigatório |
| materialUrl | text | opcional |
| status | enum | OPEN / DONE |
| createdAt / updatedAt | datetime UTC | obrigatório |

### FocusSession

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId | UUID | PK / FK |
| subjectId / contentId | UUID | opcionais, propriedade validada |
| plannedSeconds | int | 300 a 7.200 |
| activeSeconds | int | acumulado confirmado pelo servidor |
| status | enum | RUNNING, PAUSED, NEEDS_RECONCILIATION, COMPLETED, INTERRUPTED, DISCARDED |
| activeStartedAt | datetime UTC | nulo quando pausada/encerrada |
| startedAt / finishedAt | datetime UTC | datas de ciclo |
| version | int | controle concorrência / atualizações |
| createdAt / updatedAt | datetime UTC | obrigatório |

Opcional `FocusSegment` (P1): segmentos `{sessionId,startAt,endAt}` para auditoria granular. Em P0, `activeSeconds` + `activeStartedAt` + histórico de transições estruturado já permitem cálculo, mas recomenda-se **FocusSegment** se o tempo permitir, pois melhora auditoria e testes.

### ReviewSchedule

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId / contentId | UUID | PK / FKs |
| stepIndex | int | 0 a 5 |
| nextDueDate | DATE | data civil no fuso do usuário ao agendar |
| status | enum | ACTIVE / SUSPENDED |
| version | int | concorrência otimista |
| createdAt / updatedAt | datetime UTC | obrigatório |

`contentId` é único em ReviewSchedule (um agendamento por conteúdo). Definir política de fuso: o vencimento é uma **data civil persistida**, não recalcular retroativamente ao trocar o fuso; apenas as próximas tentativas usam o novo fuso.

### ReviewAttempt

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId / contentId / scheduleId | UUID | FKs |
| scheduleVersionBefore | int | versão de agendamento processada |
| rating | enum | AGAIN/HARD/GOOD/EASY |
| oldStepIndex / newStepIndex | int | auditoria |
| oldDueDate / newDueDate | DATE | auditoria |
| createdAt | datetime UTC | obrigatório |
| idempotencyKey | varchar(80) | única por usuário/ação |

Índice único `(scheduleId, scheduleVersionBefore)` evita duas avaliações do mesmo ciclo. `idempotencyKey` adicional resolve retries por rede.

### RewardEvent

| Campo | Tipo | Restrição |
|---|---|---|
| id / userId | UUID | PK / FK |
| sourceType | enum | FOCUS_SESSION / REVIEW_ATTEMPT |
| sourceId | UUID | origem |
| xp | int | >= 0 |
| localDate | DATE | data local do evento para limites |
| createdAt | datetime UTC | obrigatório |

Índice único `(sourceType,sourceId)`; XP total é soma de eventos. Restrições de teto diário devem ser avaliadas atomicamente com bloqueio por usuário/dia ou outra estratégia transacional equivalente, para impedir corrida de requisições. Não confiar somente em consulta seguida de `create` sem sincronização.

## 3.6 Relações e consistência

```text
User 1--N AuthSession
User 1--N Subject 1--N StudyContent
User 1--N FocusSession
User 1--N ReturnPoint
StudyContent 1--0..1 ReviewSchedule 1--N ReviewAttempt
User 1--N RewardEvent
```

Todas as entidades privadas carregam `userId` para filtragem de propriedade. FKs isoladas não garantem propriedade cruzada automaticamente; validar `subjectId` / `contentId` com o usuário autenticado antes de associar. Em operações críticas, usar transações e índices compostos quando apropriado.

## 3.7 Índices sugeridos

- `User.emailNormalized UNIQUE`; `AuthSession(userId,expiresAt)`.
- `Subject(userId,archivedAt)` e unicidade lógica de nome ativo por usuário.
- `StudyContent(userId,subjectId,archivedAt)`, `StudyContent(userId,studiedOn)`.
- `ReturnPoint(userId,status,updatedAt DESC)`.
- `FocusSession(userId,startedAt DESC)`, `FocusSession(userId,status)`; unicidade parcial de sessão aberta por usuário via índice SQL parcial, se aplicável.
- `ReviewSchedule(userId,status,nextDueDate)` e `ReviewSchedule(contentId) UNIQUE`.
- `ReviewAttempt(scheduleId,scheduleVersionBefore) UNIQUE`.
- `RewardEvent(sourceType,sourceId) UNIQUE`, `RewardEvent(userId,localDate,sourceType)`.

## 3.8 Segurança mínima obrigatória

1. **HTTPS em hospedagem**, cookies `HttpOnly`, `Secure` (produção), `SameSite=Lax` ou `Strict`, `Path=/`. Não guardar JWT em localStorage.
2. JWT de curta duração associado a `AuthSession` revogável; logout seta `revokedAt` e remove cookie. Se expirar, exigir novo login no MVP.
3. Proteger rotas de alteração por validação de `Origin`/`Referer` e estratégia CSRF adequada; `SameSite` sozinho não substitui CSRF. Manter implantação de produção preferencialmente em mesmo site.
4. Validar todos os DTOs (`ValidationPipe` com `whitelist`, `forbidNonWhitelisted`, transformação conforme necessidade); limites de comprimento e tamanho do payload.
5. `helmet`, rate limit para autenticação, CORS restrito a origem permitida e `credentials: true` quando necessário.
6. Hash de senha Argon2id; mensagens genéricas de credencial inválida; segredos fortes por env e nunca logs.
7. Verificar usuário em **cada** entidade, inclusive relacionamentos aninhados. Não confiar em `userId` recebido no body.
8. Erros de API sem stack trace ou hash de senha; logs com ID de requisição e sem notas de estudo em texto integral.
9. Renderizar notas como texto; se Markdown for adicionado futuramente, sanitizar. Links externos com `rel="noopener noreferrer"`.
10. Separar dados de demonstração e dados reais; contas demo com credenciais de teste somente em ambiente local e nunca segredo embutido em produção.

## 3.9 Observabilidade e erros

Resposta de erro padrão:

```json
{
  "error": {
    "code": "FOCUS_INVALID_TRANSITION",
    "message": "Esta sessão não pode ser retomada.",
    "details": {},
    "requestId": "req-demo-123"
  }
}
```

Códigos típicos: 400 entrada inválida; 401 sessão não autenticada; 403 não autorizado; 404 não encontrado (preferencial para ocultar recursos de outros usuários); 409 estado/versão incompatível; 422 regra de negócio; 429 rate-limit; 500 erro inesperado. Incluir `/api/v1/health` sem informações sensíveis.

## 3.10 Configuração e execução

Variáveis de exemplo: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `COOKIE_SECURE`, `PORT`, `NODE_ENV`. Usar `apps/api/.env.example` com placeholders, jamais senhas funcionais. `docker-compose.yml` fornece somente banco Postgres com volume persistente para desenvolvimento. Seed é idempotente, usa dados falsos e deve exigir comando explícito.

**Prisma 7:** utilizar `prisma.config.ts`, `@prisma/client@7`, `prisma@7`, `@prisma/adapter-pg` e geração de client atual. Checar requisitos de Node/TypeScript no momento da instalação. Não copiar APIs antigas como `new PrismaClient()` sem adapter.

## 3.11 Estratégia de deploy

- Desenvolvimento: Vite e NestJS locais; PostgreSQL no Docker.
- Demonstração: executar localmente em máquina preparada ou hospedar SPA/API/Postgres em serviços apropriados, sem promessa de gratuidade permanente.
- Produção pública futura: HTTPS, backup de banco, política de retenção, recuperação de senha, monitoramento e direitos do titular de dados antes de abertura geral.

## 3.12 Fontes técnicas de referência

- NestJS: https://docs.nestjs.com/
- NestJS + Prisma: https://docs.nestjs.com/data/prisma
- Prisma v7 NestJS: https://www.prisma.io/docs/guides/v7/frameworks/nestjs
- Prisma ORM v7: https://www.prisma.io/docs/orm/v7
- Vite: https://vite.dev/guide/
- OWASP Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet
