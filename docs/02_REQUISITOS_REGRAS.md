# 02 — REQUISITOS FUNCIONAIS, REGRAS DE NEGÓCIO E ACEITAÇÃO

## 2.1 Convenções

- `RF-xxx`: requisito funcional; `RN-xxx`: regra de negócio; `RNF-xxx`: requisito não funcional; `CA-xxx`: critério de aceitação.
- `P0`: obrigatório no MVP; `P1`: melhoria desejável; `P2`: futuro.
- Regras P0 são normativas para esta versão **proposta**, ainda sujeitas à revisão do responsável pelo produto.
- Todos os registros pertencem a `userId`; toda operação protegida exige autenticação e validação de propriedade **no servidor**.
- “Conteúdo” significa um tema registrado pelo usuário, não um exercício fornecido pela plataforma.

## 2.2 Requisitos — conta e perfil

| ID | Prioridade | Descrição verificável |
|---|---|---|
| RF-001 | P0 | Cadastrar conta com nome, e-mail normalizado e senha segura. |
| RF-002 | P0 | Autenticar credenciais e iniciar sessão com cookie protegido. |
| RF-003 | P0 | Encerrar sessão e invalidá-la no servidor. |
| RF-004 | P0 | Consultar o próprio perfil e alterar nome e fuso horário válido. |
| RF-005 | P0 | Impedir acesso aos dados de outra conta mesmo com ID conhecido. |
| RF-006 | P1 | Permitir exportar os próprios dados em formato portátil. |
| RF-007 | P2 | Recuperação de senha por e-mail, verificação de e-mail e MFA. |

## 2.3 Requisitos — disciplinas e conteúdos

| ID | Prioridade | Descrição verificável |
|---|---|---|
| RF-010 | P0 | Criar, listar, renomear, arquivar e consultar disciplinas próprias. |
| RF-011 | P0 | Criar conteúdo com título, disciplina, notas opcionais, link e data de estudo. |
| RF-012 | P0 | Editar, consultar, pesquisar por texto simples e arquivar conteúdo. |
| RF-013 | P0 | Iniciar revisão periódica de conteúdo quando explicitamente solicitado no cadastro ou depois. |
| RF-014 | P0 | Permitir registrar conteúdo após foco, mas **não tornar o cadastro obrigatório** para obter XP. |
| RF-015 | P0 | Distinguir conteúdos ativos, arquivados e sem revisão habilitada. |
| RF-016 | P1 | Classificar conteúdos com etiquetas e filtros por data. |
| RF-017 | P2 | Anexos, importação de fontes externas e edição em lote. |

## 2.4 Requisitos — foco

| ID | Prioridade | Descrição verificável |
|---|---|---|
| RF-020 | P0 | Escolher duração prevista entre 5 e 120 minutos; padrões de 10, 25 e 50. |
| RF-021 | P0 | Iniciar sessão vinculada opcionalmente a disciplina e a conteúdo/atividade. |
| RF-022 | P0 | Pausar e retomar com persistência da máquina de estados. |
| RF-023 | P0 | Concluir uma sessão ou encerrá-la como interrompida, registrando tempo efetivo. |
| RF-024 | P0 | Conceder XP de foco apenas por evento válido e sem duplicidade. |
| RF-025 | P0 | Exibir cronômetro correto após refresh e calcular tempo a partir de timestamps do servidor. |
| RF-026 | P0 | Detectar sessão inconclusa na volta e solicitar confirmação de conclusão parcial/abandono. |
| RF-027 | P0 | Não exibir gamificação intrusiva na tela de foco. |
| RF-028 | P1 | Registrar interrupções e motivo opcional ao concluir. |

## 2.5 Requisitos — continuidade

| ID | Prioridade | Descrição verificável |
|---|---|---|
| RF-030 | P0 | Registrar ponto de retorno: onde parei e próxima ação objetiva. |
| RF-031 | P0 | Associar ponto de retorno opcionalmente a disciplina, conteúdo e URL do material. |
| RF-032 | P0 | Exibir ponto de retorno aberto e ação de retomada na página inicial. |
| RF-033 | P0 | Editar, concluir ou substituir ponto de retorno; preservar data de atualização. |
| RF-034 | P0 | Recuperar contexto mesmo após logout, refresh ou novo login no mesmo/novo dispositivo. |
| RF-035 | P1 | Oferecer um único toque “Não consigo começar” e resposta de baixa fricção. |
| RF-036 | P1 | Sugerir um ponto de retorno ao fechar uma sessão, sem exigir preenchimento. |

## 2.6 Requisitos — revisões periódicas

| ID | Prioridade | Descrição verificável |
|---|---|---|
| RF-040 | P0 | Listar conteúdos com revisão vencida, de hoje e futura. |
| RF-041 | P0 | Agendar a primeira revisão automaticamente para conteúdo com revisão habilitada. |
| RF-042 | P0 | Oferecer passo “Tente lembrar” antes de mostrar a anotação. |
| RF-043 | P0 | Permitir revelar as próprias notas e classificar recordação em quatro graus. |
| RF-044 | P0 | Calcular próxima data de revisão segundo regra determinística e auditável. |
| RF-045 | P0 | Armazenar histórico de cada revisão realizada, sem sobrescrever registros anteriores. |
| RF-046 | P0 | Impedir duas revisões processadas para o mesmo vencimento pela mesma requisição repetida. |
| RF-047 | P0 | Permitir suspender e reativar revisão de conteúdo; suspensão não remove histórico. |
| RF-048 | P1 | Personalizar intervalos e horário preferido de revisão. |
| RF-049 | P2 | Algoritmos mais sofisticados calibrados por desempenho, sem promessas de diagnóstico. |

## 2.7 Requisitos — gamificação e estatísticas

| ID | Prioridade | Descrição verificável |
|---|---|---|
| RF-050 | P0 | Consultar XP total, XP de foco e XP de revisões com origem auditável. |
| RF-051 | P0 | Conceder XP de revisão somente pela primeira resposta válida do ciclo. |
| RF-052 | P0 | Calcular estágio da academia automaticamente por XP acumulado. |
| RF-053 | P0 | Mostrar 4 estágios decorativos estáticos/SVG sem edição de mapa. |
| RF-054 | P0 | Manter conquistas e XP mesmo após faltar dias de estudo. |
| RF-055 | P0 | Exibir minutos registrados, sessões finalizadas e revisões por período. |
| RF-056 | P1 | Liberar estilos visuais e pequenas decorações por marcos definidos. |
| RF-057 | P2 | Social, competição, cidade editável, moedas, construções manuais. |

## 2.8 Regras de negócio detalhadas

### Contas e propriedade

**RN-001** E-mail é único após normalização por trim e lowercase. A resposta de erro de login não revela se o usuário existe.  
**RN-002** Senhas são armazenadas apenas por hash de algoritmo apropriado (Argon2id preferencial), nunca texto puro.  
**RN-003** Recursos de usuário A não podem ser consultados/alterados por usuário B: preferir consulta com `where: {id, userId}`.  
**RN-004** Alterar o fuso não altera instantes históricos UTC; pode alterar o dia local de agregação de relatórios futuros, com critério documentado.  
**RN-005** Em P0, arquivamento lógico preserva histórico; exclusão física fica fora do MVP.

### Disciplinas, conteúdos e pontos de retorno

**RN-010** Disciplina exige nome de 1–80 caracteres após trim; sem duplicata de mesmo nome ativo por usuário (comparação normalizada).  
**RN-011** Conteúdo exige título de 1–160 caracteres; notas limitadas a 10.000 caracteres; URL opcional `http(s)`, validada, nunca executada nem inserida como HTML.  
**RN-012** Um conteúdo pode não ter revisão habilitada. Habilitar revisão cria exatamente um agendamento ativo, e desabilitar cancela esse agendamento sem apagar histórico.  
**RN-013** Conteúdo arquivado não aparece na fila ativa; seu histórico fica consultável.  
**RN-014** Um usuário pode manter mais de um ponto de retorno, mas o dashboard destaca apenas o mais recentemente atualizado que esteja `OPEN`.  
**RN-015** Ponto de retorno exige “próxima ação” com 1–500 caracteres; “onde parei” pode ter até 2.000; link opcional. Pode existir sem conteúdo vinculado.  
**RN-016** Não usar IA para deduzir notas, aprender o conteúdo ou corrigir afirmações inseridas pelo usuário.

### Sessões de foco e cálculo de tempo

**RN-020** Duração planejada: inteiro 5–120 minutos; no máximo uma sessão `RUNNING/PAUSED/NEEDS_RECONCILIATION` por usuário.  
**RN-021** Estados: `RUNNING`, `PAUSED`, `COMPLETED`, `INTERRUPTED`, `DISCARDED`, `NEEDS_RECONCILIATION`; transições autorizadas no capítulo 4.  
**RN-022** O servidor registra timestamps das mudanças de estado; o cliente não envia tempo “ganho” nem XP para persistência.  
**RN-023** Tempo acumulado de foco = soma dos segmentos ativos entre START/PAUSE/RESUME/END, limitado ao planejado; valores negativos são rejeitados e horários de cliente não têm autoridade.  
**RN-024** O cronômetro pode continuar enquanto o usuário estuda em plataforma externa; aba invisível **não** implica pausa automática. Não afirmar detecção física de atenção.  
**RN-025** Uma sessão aberta além da duração planejada + 15 minutos não é automaticamente premiada. É colocada em `NEEDS_RECONCILIATION` no próximo acesso/ação, com escolha de confirmar período estudado (até o limite plausível registrado) ou descartar.  
**RN-026** Para sessão interrompida, é permitido registrar tempo parcial já acumulado; não há promessa de minutos exatos de concentração.  
**RN-027** XP de foco = `floor(segundosElegíveis/60)`, com mínimo de 5 minutos efetivos para gerar XP, limite de **60 XP por sessão** e **180 XP por dia local do usuário**. O restante do tempo é preservado nas estatísticas sem conceder XP adicional.  
**RN-028** Um evento `FOCUS_SESSION_REWARD` é único por sessão, protegido por transação e índice único. Repetições de POST, timeout e múltiplas abas não geram XP duplo.  
**RN-029** Finalização salva sessão, segmentos, XP e evento de progresso atomicamente. Falha parcial deve fazer rollback.  
**RN-030** Expiração da sessão de login não apaga dados; o usuário autentica novamente antes de confirmar alterações.

### Revisões

**RN-040** Uma revisão ativa por conteúdo; conteúdo sem revisão habilitada não entra na fila.  
**RN-041** Primeira revisão vence no **dia local seguinte** ao cadastro/habilitação; mostrar a data ao usuário.  
**RN-042** Escala de intervalos proposta em dias: `[1, 3, 7, 14, 30, 60]`; armazenar `stepIndex` (0 a 5). O valor é heurístico e configurável em versão futura, não é garantia de retenção.  
**RN-043** Autoavaliação: `AGAIN` (não lembrei), `HARD` (com dificuldade), `GOOD` (bem), `EASY` (fácil). É avaliação subjetiva; a interface não declara correção objetiva.  
**RN-044** Transição de intervalos: `AGAIN` → índice 0; `HARD` → índice atual; `GOOD` → `min(indice+1,5)`; `EASY` → `min(indice+2,5)`. Agendar `dataLocalDaRevisão + intervalos[novoIndice]` dias civis; ver detalhes em 04.  
**RN-045** Revisões atrasadas não criam múltiplas cobranças: exibir apenas **um** cartão vencido por conteúdo. Não penalizar XP, estágio nem histórico por atraso.  
**RN-046** A data futura é calculada a partir do dia da realização, não da data original vencida; não gerar revisão no passado por atraso.  
**RN-047** Revisão e atualização de `nextDueDate` ocorrem em transação; usar `reviewAttemptId`/chave idempotente para não recompensar duas vezes.  
**RN-048** XP de revisão: 5 XP por conclusão de revisão válida, limitado a **50 XP por dia local**, sem recompensa por apenas abrir o cartão. Repetir requisição não rende novo XP.  
**RN-049** “Revelar notas” pode ser opcional; permitir classificar mesmo sem notas preenchidas, pois o assunto pode existir em fonte externa.  
**RN-050** Arquivar conteúdo ou desabilitar revisão não destrói o histórico.

### Academia, recompensa e métricas

**RN-060** XP é calculado exclusivamente no backend a partir de eventos persistidos e auditáveis; cliente apenas apresenta.  
**RN-061** `XP_total = soma(XP de eventos válidos)`. Não usar moedas nem gasto de XP.  
**RN-062** Estágios decorativos propostos: **I** 0–99 XP; **II** 100–349 XP; **III** 350–799 XP; **IV** a partir de 800 XP. O palco muda automaticamente, sem seleção de edifícios.  
**RN-063** Mudança de estágio nunca remove XP; nenhuma ausência gera perda de construção.  
**RN-064** Relatórios distinguem *tempo registrado* de *aprendizado verificado*. Em P0, o último não é calculado.  
**RN-065** Um dia local é identificado pelo fuso IANA salvo na conta. O limite diário de XP usa a data local do evento, mesmo quando o instante UTC cai em outro dia.

## 2.9 Requisitos não funcionais (RNF)

| ID | P0/P1 | Exigência / critério de verificação |
|---|---|---|
| RNF-001 | P0 | API REST com prefixo `/api/v1`, JSON, códigos HTTP coerentes. |
| RNF-002 | P0 | Frontend responsivo (largura de 360px a desktop), navegação por teclado e labels acessíveis. |
| RNF-003 | P0 | TypeScript strict, DTOs validados, sem `any` indiscriminado. |
| RNF-004 | P0 | PostgreSQL com migrações versionadas, chaves estrangeiras e índices para consultas comuns. |
| RNF-005 | P0 | Auth segura, rate limit para login, headers de segurança, cookies HttpOnly e proteção CSRF/Origin. |
| RNF-006 | P0 | Nenhum segredo ou credencial real no repositório. `.env.example` apenas com placeholders. |
| RNF-007 | P0 | Idempotência de encerramento e revisão; transações para operações com XP. |
| RNF-008 | P0 | Tempo persistido sobreviver a recarregamento do navegador; estado reconstruído do servidor. |
| RNF-009 | P0 | Endpoint de saúde, logging estruturado sem passwords e mensagens de erro consistentes. |
| RNF-010 | P0 | Testes automatizados sobre regras centrais; comando para rodá-los localmente. |
| RNF-011 | P0 | Dados separados por usuário; teste de autorização cruzada obrigatório. |
| RNF-012 | P0 | Endpoint e UI não apresentam desempenho/retorno como diagnóstico clínico ou prova de conhecimento. |
| RNF-013 | P1 | Metas iniciais de experiência: interações usuais responsivas em ambiente local; medir antes de afirmar SLA. |
| RNF-014 | P1 | Exportação de dados do usuário; política de privacidade e exclusão definitiva antes de lançamento público real. |
| RNF-015 | P1 | CI rodando lint, typecheck, testes e build. |

## 2.10 Critérios de aceitação (formato dado / quando / então)

**CA-001 — Primeiro acesso:** dado visitante sem conta, quando cadastra dados válidos, então cria conta e é levado ao dashboard autenticado; e-mail duplicado retorna conflito controlado.  
**CA-002 — Isolamento:** dado usuário B, quando solicita disciplina de A por ID, então recebe 404 ou 403 sem divulgar conteúdo privado.  
**CA-003 — Disciplina universal:** dado usuário, quando cria “Direito Constitucional”, então pode registrar conteúdos sem escolher catálogo ou curso predefinido.  
**CA-004 — Foco avulso:** dado usuário sem disciplina, quando inicia e encerra foco válido, então sessão é preservada e XP é concedido sem exigir conteúdo cadastrado.  
**CA-005 — Pausa:** dado foco em andamento, quando pausa por 60s e retoma, então os 60s não contam como tempo ativo.  
**CA-006 — Atualização:** dado foco ativo, quando recarrega a página, então timer e estado refletem registros do servidor, sem zerar ou duplicar a sessão.  
**CA-007 — Encerramento duplicado:** dado sessão concluída, quando requisição é reenviada, então total de XP e contador de conclusões não aumentam.  
**CA-008 — Sessão pendente:** dado navegador fechado antes de concluir, quando retorna, então vê fluxo de reconciliação, não XP inventado.  
**CA-009 — Conteúdo:** dado foco concluído, quando omite registro de conteúdo, então ainda pode voltar ao dashboard.  
**CA-010 — Agenda inicial:** dado conteúdo cadastrado com revisão ativa hoje, quando salva, então aparece uma revisão para amanhã na data local.  
**CA-011 — Revisão com dificuldade:** dada revisão cujo índice é 3, quando responde AGAIN, então novo índice é 0 e vencimento é dia seguinte.  
**CA-012 — Revisão bem-sucedida:** dado índice 1, quando responde GOOD, então índice vai a 2 e agenda +7 dias civis.  
**CA-013 — Revisão repetida:** dada avaliação processada, quando repete mesma chave idempotente, então recebe mesmo resultado e nenhum novo XP.  
**CA-014 — Atraso:** dado conteúdo vencido há 10 dias, quando abre fila, então há um único item e nenhum bloqueio por backlog.  
**CA-015 — Continuidade:** dado ponto de retorno aberto, quando reloga, então vê “onde parei” e “próxima ação” salvos.  
**CA-016 — Academia:** dado total XP de 350, quando abre academia, então visualiza estágio III; depois de uma ausência continua no mesmo estágio.  
**CA-017 — Limite diário:** dado XP diário já no limite de foco, quando completa nova sessão, então tempo ainda conta na estatística, mas XP diário não ultrapassa 180.  
**CA-018 — Dados de teste:** dados exemplos fictícios, quando são carregados por seed de demonstração, então a aplicação opera sem credenciais reais nem dependência externa.

## 2.11 Tratamento de exceções e invariantes

- Backend deve rejeitar transições inválidas (retomar sessão concluída; concluir sessão de outra pessoa; editar item inexistente) com erros estruturados.
- Em falha de rede, frontend não declara sucesso até resposta confirmada; pode mostrar estado de envio e permitir retry idempotente.
- Se o relógio do dispositivo for alterado, ele não muda XP calculado pelo servidor; o timer usa o timestamp retornado pelo backend para reconciliar exibição.
- Não aceitar duração negativa, superior a máximo, texto vazio obrigatório, datas inválidas ou `userId` enviado pelo cliente como autoridade.
- Conteúdo de notas é tratado como texto; escape de HTML para evitar XSS; links externos com comportamento seguro.
- Alterações de fuso usam a regra do dia civil local e são testadas perto da meia-noite e transições DST.
- Em conflitos de duas abas, backend é a fonte de verdade; retornar 409 e estado atual quando necessário.
