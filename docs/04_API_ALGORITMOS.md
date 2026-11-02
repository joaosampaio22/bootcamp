# 04 — CONTRATOS DE API, ESTADOS E ALGORITMOS

## 4.1 Convenções REST

Base: `/api/v1`. Endpoints privados exigem autenticação. Todas as datas de instantes são ISO 8601 UTC; vencimentos de revisão são strings `YYYY-MM-DD` no calendário civil do usuário. IDs UUID. Paginação `{items, page, pageSize, total}` para listas grandes; padrão `pageSize=20`, teto 100. Endpoints de escrita aceitam JSON e validam DTOs. Campos geridos pelo servidor (`userId`, `xp`, `createdAt`, `activeSeconds`) nunca são confiados ao body do cliente.

**Idempotência:** ações de conclusão aceitam header `Idempotency-Key` UUID; o servidor persiste a chave no evento/registro correspondente e retorna a mesma operação em repetição. Para transições incompatíveis com nova chave, retornar 409. Excluir metadados de autenticação de logs.

## 4.2 Catálogo de endpoints P0

| Método | Caminho | Propósito | Sucesso |
|---|---|---|---|
| POST | `/auth/register` | Criar usuário e iniciar sessão | 201 |
| POST | `/auth/login` | Login | 200 |
| POST | `/auth/logout` | Revogar sessão | 204 |
| GET | `/auth/me` | Perfil autenticado | 200 |
| PATCH | `/users/me` | Nome e fuso | 200 |
| GET | `/subjects` | Listar disciplinas | 200 |
| POST | `/subjects` | Criar disciplina | 201 |
| PATCH | `/subjects/:id` | Renomear/arquivar | 200 |
| GET | `/contents` | Listar/pesquisar conteúdos | 200 |
| POST | `/contents` | Criar conteúdo livre | 201 |
| GET | `/contents/:id` | Detalhar conteúdo | 200 |
| PATCH | `/contents/:id` | Editar/arquivar/habilitar revisão | 200 |
| POST | `/focus-sessions` | Iniciar sessão | 201 |
| GET | `/focus-sessions/active` | Recuperar sessão aberta ou null | 200 |
| GET | `/focus-sessions` | Histórico paginado | 200 |
| POST | `/focus-sessions/:id/pause` | Pausar | 200 |
| POST | `/focus-sessions/:id/resume` | Retomar | 200 |
| POST | `/focus-sessions/:id/finish` | Concluir/interromper | 200 |
| POST | `/focus-sessions/:id/reconcile` | Resolver sessão pendente | 200 |
| GET | `/return-points` | Listar pontos de retorno | 200 |
| POST | `/return-points` | Criar ponto | 201 |
| PATCH | `/return-points/:id` | Editar/concluir | 200 |
| GET | `/reviews/due` | Revisões vencidas/hoje | 200 |
| GET | `/reviews/upcoming` | Próximas revisões | 200 |
| POST | `/reviews/:scheduleId/attempts` | Avaliar revisão e reagendar | 201 |
| GET | `/reviews/:scheduleId/history` | Histórico de avaliações | 200 |
| GET | `/academy` | XP, estágio, assets | 200 |
| GET | `/statistics/summary` | Métricas filtradas | 200 |
| GET | `/dashboard` | Visão agregada em uma chamada | 200 |
| GET | `/health` | Estado mínimo da API | 200 |

Endpoints adicionais de delete físico, reset de XP, ranking e anexos não pertencem a P0.

## 4.3 Exemplos de contratos JSON

**POST `/contents`**

```json
{
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "title": "Herança em Java",
  "notes": "Conceito de herança e sobrescrita de métodos.",
  "materialUrl": "https://example.org/aula/18",
  "studiedOn": "2026-11-02",
  "reviewEnabled": true
}
```

**Resposta 201 (exemplo):**

```json
{
  "id": "00000000-0000-4000-8000-000000000002",
  "title": "Herança em Java",
  "review": {"status":"ACTIVE", "stepIndex":0, "nextDueDate":"2026-11-03"}
}
```

**POST `/focus-sessions`**

```json
{"plannedMinutes":25,"subjectId":null,"contentId":null}
```

**Resposta 201:**

```json
{
  "id":"00000000-0000-4000-8000-000000000003",
  "status":"RUNNING","plannedSeconds":1500,
  "activeSeconds":0,"activeStartedAt":"2026-11-02T13:00:00Z",
  "serverNow":"2026-11-02T13:00:00Z","version":1
}
```

**POST `/focus-sessions/:id/finish`**

```json
{"outcome":"COMPLETED"}
```

Retornar `activeSeconds`, `xpGranted`, `totalXp` e `status`; não aceitar `xp` calculado no cliente. Para `INTERRUPTED`, permitir tempo parcial válido. Endpoint deve ser idempotente.

**POST `/focus-sessions/:id/reconcile`**

```json
{"outcome":"INTERRUPTED","confirmedActiveSeconds":600}
```

`confirmedActiveSeconds` é autodeclarado em recuperação e deve ser validado contra um teto plausível inferido de timestamps de servidor e duração planejada. Não confundir com verificação real de foco. `DISCARDED` não concede XP.

**POST `/return-points`**

```json
{
  "subjectId": null,
  "contentId": null,
  "context":"A aula parou no exemplo de sobrescrita.",
  "nextAction":"Abrir o projeto e executar o exemplo com duas subclasses.",
  "materialUrl":"https://example.org/aula/18"
}
```

**POST `/reviews/:scheduleId/attempts`**

```json
{"rating":"GOOD","expectedVersion":2}
```

**Resposta 201:**

```json
{
  "attemptId":"00000000-0000-4000-8000-000000000004",
  "oldStepIndex":1,"newStepIndex":2,
  "nextDueDate":"2026-11-09","xpGranted":5
}
```

Se a versão não corresponder, devolver 409 com status atual para o cliente atualizar; nunca registrar duas revisões concorrentes do mesmo agendamento.

**GET `/dashboard` (exemplo parcial)**

```json
{
  "focusTodaySeconds":1500,
  "dueReviewCount":2,
  "activeSession":null,
  "nextReturnPoint":{"id":"...","nextAction":"..."},
  "academy":{"totalXp":355,"stage":3}
}
```

## 4.4 Máquina de estados de foco

```text
      POST start
          │
          ▼
        RUNNING ───── pause ─────► PAUSED
          ▲                         │
          └──────── resume ─────────┘
          │                         │
          ├──── finish ──► COMPLETED / INTERRUPTED
          │                         │
          └── sem conclusão e tempo excedido ─► NEEDS_RECONCILIATION
                                                   │
                                             reconcile
                                                   │
                                      COMPLETED / INTERRUPTED /
                                              DISCARDED
```

Transições terminais são imutáveis; não há pause/resume após finalizar. O usuário não pode ter duas sessões abertas simultaneamente. A API deve ser resiliente a requisições concorrentes e retornos tardios.

### Cálculo de duração

```text
on start:    status=RUNNING; activeStartedAt=serverNow; activeSeconds=0
on pause:    activeSeconds += clamp(now - activeStartedAt, 0, remainingPlanned)
             activeStartedAt=null; status=PAUSED
on resume:   activeStartedAt=serverNow; status=RUNNING
on finish:   if RUNNING, consolidar segmento até now
             eligibleSeconds=min(activeSeconds, plannedSeconds)
             se conclusão válida, calcular XP e gravar evento na mesma transação
```

**Teto por sessão:** segmentos nunca somam mais que a duração planejada. O timer no frontend pode mostrar `max(0, plannedSeconds - eligibleSeconds - currentElapsed)` e não depende de `setInterval` para *calcular* a verdade. `setInterval` serve apenas para repintar a UI.

**Caso sem rede/aba fechada:** o backend não consegue certificar se o usuário continuou estudando. Se não houver finalização e passar `plannedSeconds + 900s` desde o início ativo (com consideração de pausas), marcar como pendente na próxima leitura e solicitar confirmação humana. Não conceder XP sem decisão explícita.

### Recompensa por foco

```text
eligibleMinutes = floor(eligibleSeconds / 60)
rawXp = eligibleMinutes < 5 ? 0 : min(eligibleMinutes, 60)
alreadyAwardedToday = soma eventos FOCUS_SESSION localDate=hojeLocal
xpGranted = min(rawXp, max(0, 180 - alreadyAwardedToday))
```

Para interrupção com 12 minutos de foco efetivo, o evento concede até 12 XP; 4 minutos concedem 0. A UI nunca deve dizer que XP prova qualidade da concentração. Usar transação serializável/lock por usuário + data de recompensa e restrições únicas para evitar corrida entre duas finalizações.

## 4.5 Algoritmo de revisão inicial

Não se trata de algoritmo científico ideal. É uma **heurística transparente de repetição espaçada**, adequada ao MVP universal sem conteúdos predefinidos.

**Configuração P0:** `intervals = [1, 3, 7, 14, 30, 60]` (dias civis). Cada conteúdo tem `stepIndex`. Ao ativar revisão, índice 0 e primeiro vencimento amanhã na data local. No vencimento, o usuário realiza recuperação ativa e autoavalia.

```typescript
const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;

type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

function nextStep(current: number, rating: ReviewRating): number {
  switch (rating) {
    case 'AGAIN': return 0;
    case 'HARD':  return current;
    case 'GOOD':  return Math.min(current + 1, 5);
    case 'EASY':  return Math.min(current + 2, 5);
  }
}

// nextDueDate = adicionarDiasCivis(dataLocalDaResposta,
//                                 INTERVALS_DAYS[nextStep(...)])
// Não usar soma ingênua de 86.400.000 ms para datas civis com DST.
```

Exemplos de tabela de decisão:

| Índice anterior | Avaliação | Novo índice | Próximo vencimento |
|---|---|---|---|
| 0 (1 dia) | AGAIN | 0 | +1 dia |
| 0 (1 dia) | HARD | 0 | +1 dia |
| 0 (1 dia) | GOOD | 1 | +3 dias |
| 1 (3 dias) | GOOD | 2 | +7 dias |
| 2 (7 dias) | EASY | 4 | +30 dias |
| 4 (30 dias) | HARD | 4 | +30 dias |
| 5 (60 dias) | GOOD | 5 | +60 dias |

**Ponto importante:** o atraso não multiplica revisões vencidas. Se a revisão estava marcada para 01/11 e foi concluída em 10/11, contar o próximo intervalo desde **10/11**. Guardar histórico de data anterior e nova data.

**Recompensas de revisão:** uma conclusão válida registra `ReviewAttempt` e `RewardEvent` de até 5 XP, sujeito ao limite de 50 XP/dia. Registrar avaliação + novo vencimento + recompensa numa transação. A tela de revisão sempre mostra conteúdo/título e permite tentar lembrar **antes** de revelar as notas.

**Fuso e datas:** usar biblioteca compatível com IANA para `localDate` e aritmética de calendário. Persistir `nextDueDate` como DATE; consultar com `nextDueDate <= hojeLocal`. Horário do dia é irrelevante em P0 (sem lembrete agendado externo).

## 4.6 Academia e progressão

```typescript
function academyStage(totalXp: number): 1 | 2 | 3 | 4 {
  if (totalXp >= 800) return 4;
  if (totalXp >= 350) return 3;
  if (totalXp >= 100) return 2;
  return 1;
}
```

A API envia `{totalXp, focusXp, reviewXp, stage, stageStartXp, nextStageXp}`. Estágio IV não possui próximo limiar (`nextStageXp=null`). Frontend usa quatro ilustrações SVG pré-definidas e uma animação curta opcional apenas **após** sessão/revisão, nunca durante o foco.

## 4.7 Métricas e painéis

- `focusSecondsByPeriod`: somatório `eligibleSeconds` de sessões concluídas/interrompidas, filtrado por UTC e agrupado por data local de conclusão.
- `reviewCount`: número de ReviewAttempt válidas, não de cartões abertos.
- `dueReviewCount`: número de agendamentos ativos com `nextDueDate <= todayLocal`.
- `daysWithStudy`: dias locais distintos com foco >= 5 minutos registrado; não usar streak punitivo.
- `totalXp`: soma de RewardEvent; nunca computed client-side para persistência.
- Não criar métrica “porcentagem de domínio”, “nível de atenção” nem “retenção comprovada” no P0.

## 4.8 Casos limite obrigatórios

1. Duas abas tentam iniciar foco: uma ganha; a outra recebe 409 com sessão ativa.
2. Reenvio da conclusão após timeout: mesma resposta, XP invariável.
3. Duas revisões simultâneas de um conteúdo: uma registra, outra recebe 409.
4. Conteúdo com notas vazias: pode ser revisado por lembrança do tema/título.
5. Usuário troca fuso: datas antigas de revisão permanecem como datas civis registradas; novos vencimentos usam fuso atual.
6. Relógio do cliente adiantado: eventos são datados pelo servidor.
7. Usuário arquiva disciplina com conteúdos: manter histórico; conteúdos ficam ocultos por padrão; não excluir em cascata por engano.
8. Link de material é `javascript:`: rejeitar 400.
9. Sessão com pausa antes de completar 5 minutos: registro válido, sem XP.
10. Fila com 50 revisões atrasadas: cada conteúdo aparece uma vez; UI pode paginar ou agrupar.
