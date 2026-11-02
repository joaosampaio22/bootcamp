# ADR-0004 — Foco durável, recuperação e XP idempotente

Data: 02/11/2026. Etapa 2. RF-020–027; RN-020–030/060–061/065; CA-004–008/017; matriz TF-01–15.

## Decisões

1. Sessões persistem timestamps UTC e tempo elegível inteiro, limitado ao planejado. A tela calcula a estimativa a partir de `serverNow` e do início do segmento, somando somente tempo monotônico desde a resposta. Intervalos repintam a tela; não determinam XP nem persistência. Retorno de visibilidade/foco e polling reconciliam o estado, sem pausa automática nem prêmio automático ao chegar a zero.
2. `elapsedActiveSeconds` é um acumulador técnico para a carência: não inclui pausas e preserva o excesso ativo entre segmentos, mesmo quando `activeSeconds` já atingiu o planejado. Satura em planejado + 901, suficiente para sinalizar ultrapassagem; não é uma métrica adicional de estudo. `FocusTransition` registra timestamps/estados/tempo para auditoria dos segmentos. Não criamos a tabela opcional P1 FocusSegment.
3. A interpretação de “com consideração de pausas” é planejado + 900 segundos **ativos**. Uma pausa longa não vira abandono. Ultrapassagem estrita é avaliada na próxima leitura/ação de foco e persiste NEEDS_RECONCILIATION, sem XP. Resposta 409 após essa detecção ocorre depois do commit da marcação, evitando que o próprio conflito reverta a recuperação.
4. Reconciliar exige decisão explícita, com tempo autodeclarado não superior ao planejado/plausível. Descartar salva estado terminal com tempo elegível zero, sem RewardEvent; as transições preservam o contexto anterior. Concluir/interromper cria um evento inclusive quando XP=0, para auditoria.
5. Toda operação de foco adquire `SELECT ... FOR UPDATE` da linha User dentro de transação. O teto usa o fuso atual lido sob o mesmo lock e a data civil persistida em RewardEvent, representada como DATE. Foco conserva os parâmetros da especificação: mínimo 5 min, 1 XP/min inteiro, 60/sessão, 180/dia. Futuras recompensas de revisão devem usar o mesmo mecanismo de serialização.
6. `FocusAction` mantém chave UUID única por usuário, fingerprint de ação/recurso/corpo/versão e comprovante JSON imutável. Replays idênticos retornam o comprovante original, mesmo após novas recompensas. Chave com outro corpo ou chave nova após estado terminal gera 409. Estado, transição, RewardEvent e comprovante são atômicos. Falha após criar RewardEvent deve reverter tudo.
7. Índice SQL parcial garante uma sessão aberta por usuário. Índice de origem única evita XP duplicado. CHECKs de duração/estado/timestamps/XP e FKs compostas de auditoria/comprovante reforçam a consistência no banco.
8. Start aceita disciplina própria ativa ou nenhum vínculo. Conteúdos ainda não existem nesta etapa; `contentId` aceita null/omissão e rejeita referência não nula com 422. A relação será adicionada na Etapa 3, sem simular conteúdo ou pular a validação de propriedade.
9. O cliente envia versão esperada e mantém a mesma chave/corpo durante retry de conclusão com falha de rede. Outras ações ficam bloqueadas enquanto esse resultado está incerto. Refresh consulta estado/histórico persistidos; não inventa um novo prêmio. Respostas anteriores ao início de uma ação não sobrescrevem o novo estado da tela.
10. Foco é a entrada privada padrão. Histórico e XP aparecem fora da sessão ativa. O formulário de recuperação explica a natureza autodeclarada do tempo. Todos os endpoints mantêm autenticação, CSRF e propriedade; cache privado desabilitado.

## Validação e limitações

Testes usam ClockService substituído e PostgreSQL real. O harness de navegador usa banco `_test`, backend compilado e relógio injetado por arquivo local; não foi adicionada rota de relógio nem privilégio de teste à aplicação de produção. Smoke separado usa API compilada com relógio real e confirma zero XP em sessão muito curta.

O histórico de foco não substitui o painel de estatísticas da Etapa 5. Conteúdos, pontos de retorno, revisões e academia permanecem nas etapas seguintes. O app registra prática; não certifica atenção nem domínio de matéria.
