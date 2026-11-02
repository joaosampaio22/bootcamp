# 06 — ESTRATÉGIA DE TESTES, QUALIDADE E CRITÉRIOS DE CONCLUSÃO

## 6.1 Objetivo

O projeto precisa ser **demonstrável, reprodutível e verificável**, não apenas renderizar telas. A qualidade mínima se concentra em **autenticação**, **isolamento de dados**, **máquinas de estado**, **cálculo de tempo e XP**, **agenda de revisões**, **reconciliação**, **continuidade**, **integridade transacional** e **migrações**.

## 6.2 Pirâmide de testes

| Camada | Ferramentas sugeridas | O que testar | Prioridade |
|---|---|---|---|
| Unitária do domínio | Jest no backend | intervalos, XP, estágios, transições, data local | P0 |
| Integração API/banco | Jest + Supertest + PostgreSQL de teste | CRUD, constraints, propriedade, transações | P0 |
| Componentes React | Vitest + React Testing Library | formulário, timer, estados e acessibilidade básica | P0 essencial |
| Fluxos de ponta a ponta | Playwright (opcional) | cadastro → foco → conteúdo → revisão → academia | P1 se tempo |
| Manual | navegador desktop e mobile | UX, recarga, perda de rede, abas, foco, correções | P0 |

Testes de tempo e revisão devem usar **relógio injetado/congelado** (`ClockService` e fuso controlado), não `sleep()` de 25 minutos. O backend deve permitir teste sem conceder privilégios especiais em produção.

## 6.3 Matriz crítica — foco

| ID | Cenário | Resultado esperado |
|---|---|---|
| TF-01 | Foco de 25min realizado, sem pausa | contabiliza <= 1.500 segundos; XP de acordo com regra |
| TF-02 | Foco 5min + pausa 2min + 5min | conta 10min, não 12min |
| TF-03 | Interrupção após 4min | salva sessão, XP=0 |
| TF-04 | Interrupção após 12min | XP<=12, limitado por regras |
| TF-05 | Foco 90min | sessão pode existir, XP<=60 |
| TF-06 | limite diário de foco=180 | próximos eventos geram XP=0; tempo continua registrado |
| TF-07 | POST finish repetido | não duplica nem XP nem conclusão |
| TF-08 | duas sessões simultâneas do mesmo usuário | somente uma sessão aberta |
| TF-09 | duas chamadas concorrentes de finish | apenas uma transação gera evento |
| TF-10 | refresh da página | exibe estado restaurado do backend |
| TF-11 | logout durante foco | sem prêmio automático; sessão persiste com segurança |
| TF-12 | aba fechada e duração excedida | `NEEDS_RECONCILIATION`, sem XP até confirmação |
| TF-13 | `confirmedActiveSeconds` negativo/acima do teto | requisição rejeitada |
| TF-14 | clock local alterado | backend mantém duração autorizada |
| TF-15 | cliente envia XP forjado | backend rejeita/ignora campos não previstos |

## 6.4 Matriz crítica — revisões

| ID | Cenário | Resultado esperado |
|---|---|---|
| TR-01 | cadastrar conteúdo com revisão | agenda 1 dia civil depois da data de habilitação local |
| TR-02 | cadastrar sem revisão | sem agendamento ativo |
| TR-03 | índice=2, AGAIN | novo índice=0, próxima +1 dia |
| TR-04 | índice=2, HARD | mantém índice=2, próxima +7 dias |
| TR-05 | índice=2, GOOD | índice=3, próxima +14 dias |
| TR-06 | índice=2, EASY | índice=4, próxima +30 dias |
| TR-07 | índice=5, EASY | permanece 5, próxima +60 dias |
| TR-08 | revisão atrasada 10 dias | uma única pendência; cálculo contado do dia realizado |
| TR-09 | requisição de revisão repetida | mesma tentativa, sem XP adicional |
| TR-10 | revisão concorrente com versão antiga | conflito 409 e nenhuma tentativa duplicada |
| TR-11 | limite diário XP revisão=50 | tentativas persistem, XP extra=0 |
| TR-12 | desabilitar revisão | não é listada na fila, histórico permanece |
| TR-13 | arquivar conteúdo | some da fila ativa, sem cascade destrutivo |
| TR-14 | DST / meia-noite com fuso válido | aritmética de dias civis correta, sem somar 24h cegamente |
| TR-15 | conteúdo sem notas | pode completar recuperação pelo título/material externo |

## 6.5 Matriz — segurança e consistência

| ID | Cenário | Resultado esperado |
|---|---|---|
| TS-01 | usuário B acessa conteúdo ID de A | 404/403 sem dados de A |
| TS-02 | usuário B aponta `subjectId` de A em conteúdo novo | rejeição de vínculo |
| TS-03 | e-mail duplicado | erro controlado, sem criação parcial |
| TS-04 | senha inválida | erro genérico, sem revelar existência do usuário |
| TS-05 | logout e reutilização do mesmo cookie | sessão revogada; 401 |
| TS-06 | POST cross-origin malicioso com cookie | rejeição por defesa CSRF/Origin |
| TS-07 | usuário manda HTML/script nas notas | exibido como texto, nunca executado |
| TS-08 | link `javascript:` em material | 400; não é salvo |
| TS-09 | relatório de outra conta | não vaza estatísticas/XP |
| TS-10 | falha entre atualização de revisão e recompensa | transação rollback, estado consistente |
| TS-11 | migração em banco vazio | cria todas as tabelas e índices |
| TS-12 | seed executado duas vezes | não duplica demonstração nem altera usuário real |

## 6.6 Acessibilidade e dispositivos

- Navegação básica por teclado nos modais/formulários.
- Rótulos legíveis, feedback de erro e contraste suficiente.
- Formulários navegáveis em largura de **360px**, tablet e desktop.
- Cronômetro usa valores textuais estáveis; evitar anúncios de segundo a segundo a leitores de tela.
- Com `prefers-reduced-motion`, nenhuma animação é essencial para compreender a recompensa.
- Não depender de hover para editar conteúdos ou iniciar revisão.

## 6.7 Dados de demonstração e cenários controlados

Gerar via comando explícito uma conta **fictícia local**, com duas disciplinas (ex.: História e Inglês), conteúdos curtos inventados, um ponto de retorno e revisões em estados conhecidos. Nenhuma credencial real, dado corporativo, identificador pessoal, screenshot de sistema interno ou registro confidencial.

Para demonstrar mudanças de estágio e revisões vencidas, **não** manipular tempo real nem forjar XP por API pública. Usar fixtures/seed controlado em ambiente local de demo, com marcação visual de que o conteúdo é fictício e comando dedicado. Essa seed não deve ser habilitada em produção.

## 6.8 DoD — Definition of Done por funcionalidade

Uma tarefa está **concluída** somente se:

1. Requisitos e regra(s) vinculadas estão identificados.
2. Funciona na UI e/ou API em um caminho feliz e um de erro.
3. Backend valida DTO, autenticação e propriedade do recurso.
4. Operações críticas são transacionais/idempotentes e cobertas por teste.
5. Frontend trata espera, erro, vazio e sucesso confirmado, sem inventar persistência.
6. Não há alteração não documentada nas regras de XP, revisão ou estágio.
7. `lint`, `typecheck`, testes pertinentes e build passam.
8. A feature foi exercitada manualmente após refresh/relogin.
9. O Codex registrou alterações, comando de teste, evidência e limitações em `docs/evidencias-ia/`.

## 6.9 DoD — aplicação pronta para apresentação

- [ ] `docker compose up -d` sobe banco em máquina preparada.
- [ ] migrações Prisma são aplicadas com instrução documentada.
- [ ] API sobe com variáveis locais seguras e `/api/v1/health` funciona.
- [ ] SPA sobe, autentica, navega e mantém dados após refresh/relogin.
- [ ] CRUD de disciplinas/conteúdos registra material de qualquer área.
- [ ] Foco avulso inicia, pausa, retoma, conclui e recompensa sem duplicidade.
- [ ] Sessão pendente pode ser conciliada ou descartada.
- [ ] Ponto de retorno reaparece após novo login.
- [ ] Revisão aparece agendada, admite autoavaliação e reagenda.
- [ ] XP e academia permanecem coerentes com eventos armazenados.
- [ ] Testes centrais e build foram executados; relatórios incluídos.
- [ ] Dados de demo são fictícios; segredos e registros privados estão ocultos.
- [ ] Existe vídeo narrado mostrando o fluxo funcionando.
- [ ] Evidências do uso de IA durante desenvolvimento são rastreáveis.

## 6.10 Métricas do produto vs. promessas

**Pode afirmar:** quantidade de sessões registradas, tempo contabilizado, conteúdos cadastrados, revisões concluídas, dias com estudo, retomadas, XP e estágio visual.

**Não pode afirmar com base no MVP:** nível cerebral de atenção, diagnóstico de TDAH, domínio comprovado de matéria arbitrária, aumento causal de retenção, aprendizado certificado ou medida objetiva de foco.
