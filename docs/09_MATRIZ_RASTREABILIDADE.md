# 09 — RASTREABILIDADE, DECISÕES E PONTOS EM ABERTO

## 9.1 Fluxos de alto valor e seus requisitos

| Fluxo | Requisitos funcionais | Regras principais | Testes |
|---|---|---|---|
| Cadastro/entrada | RF-001–005 | RN-001–005 | TS-01–06 |
| Disciplina livre | RF-010 | RN-010 e RN-003 | TS-02, CA-003 |
| Conteúdo livre + revisão | RF-011–015 | RN-011–013, RN-040–043 | TR-01–02, TR-12–15 |
| Foco + XP | RF-020–028 | RN-020–030, RN-060–065 | TF-01–15 |
| Ponto de retorno | RF-030–034 | RN-014–016 | CA-015 |
| Revisão + XP | RF-040–047, RF-051 | RN-040–050 | TR-03–11 |
| Academia decorativa | RF-050–054 | RN-060–063 | CA-016 |
| Estatísticas | RF-055 | RN-064–065 | CA-017; testes de agregação |
| Submissão workshop | WS-01–14 | seção 08 | checklist da seção 08 |

## 9.2 Decisões definitivas nesta especificação

1. Universalidade: nenhum conteúdo ou catálogo obrigatório; o próprio usuário define as disciplinas.
2. A atividade principal é uma sessão de foco registrada com recompensa após conclusão.
3. O registro de conteúdos é **manual e opcional**, inclusive depois da sessão.
4. Revisões partem desses conteúdos; não há banco de questões interno.
5. A revisão utiliza tentativa de recordar seguida de autoavaliação, não correção automática.
6. Pontos de retorno preservam **onde parei** e **próximo passo**, com armazenamento no backend.
7. A Academia Viva é somente decorativa e cresce por XP; não há gestão de cidade em P0.
8. Backend NestJS e PostgreSQL com Prisma formam uma aplicação real, não SPA apenas local.
9. Sem dependência de LLM/tokens para uso do produto; IA generativa apenas auxilia desenvolvimento e documentação da avaliação.

## 9.3 Parâmetros propostos, ainda não validados por usuários

| Parâmetro | Padrão de implementação | Como alterar com segurança |
|---|---|---|
| Mínimo foco para XP | 5 minutos | constante versionada + testes |
| Duração de foco | 5–120 min | validações DTO/UI e testes de limite |
| XP foco | 1 XP/min inteiro, até 60/sessão, 180/dia | motor de RewardEvent; migrar lógica sem alterar histórico |
| XP revisão | 5/tentativa, teto 50/dia | motor de RewardEvent |
| Intervalos de revisão | 1,3,7,14,30,60 dias | algoritmo versão 1 com histórico |
| Estágios de academia | 0,100,350,800 XP | função de estágio + ativos visuais |
| Fuso inicial | America/Sao_Paulo | preferência editável pelo usuário |
| Duração do JWT | curta, a definir na configuração | segurança e testes de expiração/revogação |

Não apresentar esses números como dados experimentais sobre retenção ou atenção. Representam **decisões de produto para permitir implementação e validação inicial**.

## 9.4 Questões técnicas a resolver na implementação sem alterar o produto

- Confirmar versão Node LTS e compatibilidade exata NestJS/Prisma 7 antes de instalar.
- Escolher estratégia explícita de cookie e CSRF em ambiente de desenvolvimento de duas portas versus produção no mesmo site.
- Definir mecanismo confiável de exclusividade de sessão aberta (índice parcial SQL ou transação com lock adequado).
- Implementar idempotência para finalização e tentativas de revisão, com testes de corrida.
- Definir auditoria mínima de segmentos de foco. A versão P0 exige tempo correto, mesmo que a tabela opcional `FocusSegment` seja adiada.
- Definir formato definitivo de respostas de paginação e do tratamento de erros de validação, consistente em todos os endpoints.
- Selecionar biblioteca de timezone e operação com `DATE` que não dependa de soma de milissegundos.

Quando a decisão afetar mais de um módulo, registrar um **ADR** no repositório com contexto, escolha, alternativas e consequências.

## 9.5 Limitações explícitas

- Não há verificação objetiva de concentração apenas por cronômetro.
- Não há comprovação de que o usuário aprendeu corretamente tudo que registra.
- O agendamento de revisão é uma heurística inicial de produto, não um protocolo individual cientificamente otimizado.
- A academia é incentivo visual, não medida de inteligência ou saúde cognitiva.
- A hospedagem depende de ambiente configurado; não há garantia de custo zero de infraestrutura pública.

## 9.6 Glossário breve

- **Disciplina / Subject:** área definida pelo usuário, como “História”, “Java”, “Inglês”.
- **Conteúdo / StudyContent:** assunto ou conceito registrado manualmente; não é um exercício do sistema.
- **Sessão de foco / FocusSession:** intervalo ativo declarado e rastreado, com pausas, conclusão ou reconciliação.
- **Ponto de retorno / ReturnPoint:** contexto salvo e próxima ação para retomada.
- **Agendamento de revisão / ReviewSchedule:** estado que determina quando revisar um conteúdo.
- **Tentativa / ReviewAttempt:** ato de recuperação ativa e autoavaliação registrado com horário e resultado.
- **Evento de recompensa / RewardEvent:** registro auditável de XP originado de sessão ou revisão.
- **Academia Viva:** cena decorativa cujo estágio deriva de XP persistido.
- **P0/P1/P2:** obrigatório no MVP / desejável após MVP / evolução futura.
