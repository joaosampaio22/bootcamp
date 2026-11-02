# ESTUDO EM DIA — DOCUMENTAÇÃO MESTRA

**Versão:** 1.0 (especificação proposta)  
**Data-base:** 02/11/2026  
**Status:** pronto para implementação incremental; parâmetros propostos ainda precisam de validação com usuários.  
**Produto:** Estudo em Dia, com gamificação visual “Academia Viva”.

## 1. Como usar este pacote

Este pacote é a referência para implementação pelo Codex. Leia antes de gerar código:

1. `01_PRODUTO_ESCOPO.md` — visão, público, jornadas, limites e decisões.
2. `02_REQUISITOS_REGRAS.md` — requisitos identificados, regras e aceitação.
3. `03_ARQUITETURA_DADOS.md` — stack, componentes, modelo relacional e segurança.
4. `04_API_ALGORITMOS.md` — endpoints, contratos e regras determinísticas.
5. `05_UX_GAMIFICACAO.md` — telas, fluxos, foco, continuidade, academia.
6. `06_TESTES_QUALIDADE.md` — estratégia, cenários e definição de pronto.
7. `07_PLANO_CODEX.md` — ordem de execução, prompts, orçamento de escopo.
8. `08_SUBMISSAO_WORKSHOP.md` — regras do trabalho, evidências e entrega.
9. `09_MATRIZ_RASTREABILIDADE.md` — ligação entre regras, fluxos e testes.
10. `AGENTS.md` — instruções resumidas para o agente de programação.

O arquivo `DOCUMENTACAO_COMPLETA.md` concatena estes materiais para leitura linear. O DOCX e o PDF são versões para apresentação e consulta; **os arquivos Markdown são a referência operacional para o Codex**.

## 2. Resumo executivo

**Problema:** as pessoas têm dificuldade de iniciar e sustentar sessões de estudo, lembrar o que estudaram e retomar uma tarefa após interrupções. Muitas ferramentas gerenciam horários ou oferecem conteúdo próprio, mas não integram foco, memória do contexto e revisão de assuntos escolhidos pelo estudante.

**Solução:** aplicativo web responsivo com cadastro de qualquer disciplina e conteúdo, sessões de foco recompensadas, registro manual do que foi estudado, algoritmo de revisões periódicas, pontos de retorno e uma academia decorativa que evolui com a atividade registrada.

**Promessa realista:** facilitar a continuidade e a organização da prática, não medir diretamente a atenção cerebral nem certificar domínio sobre temas arbitrários.

**Arquitetura:** React + TypeScript + Vite + Tailwind CSS; API REST NestJS; PostgreSQL; Prisma ORM; autenticação por sessão segura; testes automatizados; Docker Compose para o banco no desenvolvimento.

## 3. Decisões de produto — confirmadas no brainstorming

| Identificador | Decisão | Origem |
|---|---|---|
| DEC-01 | O usuário pode estudar **qualquer assunto**; não haverá catálogo obrigatório nem exercícios prontos. | Confirmada |
| DEC-02 | O usuário é recompensado por **sessões de foco registradas**. | Confirmada |
| DEC-03 | O usuário pode registrar manualmente conteúdos estudados. | Confirmada |
| DEC-04 | Os conteúdos registrados geram revisões periódicas com autoavaliação. | Confirmada |
| DEC-05 | O app preserva um ponto de retorno para continuar de onde parou. | Confirmada |
| DEC-06 | A Academia Viva é **decorativa**, não um simulador de cidade com economia. | Confirmada |
| DEC-07 | A solução terá backend próprio, API e banco relacional; não será somente armazenamento local. | Confirmada |
| DEC-08 | Não haverá dependência de LLM, tokens de API ou plataformas de exercícios. | Confirmada |

## 4. Parâmetros de projeto — propostas técnicas, ajustáveis

Valores de XP, intervalos, limites de tempo, estágios da academia, política de autenticação, nomes de telas e duração das sessões constituem **propostas de implementação**, não decisões do usuário já validadas. Servem para eliminar ambiguidades e permitir testes repetíveis. Alterações devem ser registradas em ADR/CHANGELOG, refletidas nos testes e, quando necessário, acompanhadas de migração de banco.

## 5. Não objetivos do MVP

- Não criar exercícios ou trilhas de conteúdo próprios.
- Não corrigir respostas abertas automaticamente, avaliar código alheio ou usar LLM.
- Não declarar que a pessoa **de fato** ficou atenta apenas porque um timer esteve ativo.
- Não medir “nível de TDAH”, capacidade cognitiva, inteligência ou domínio científico de um assunto.
- Não construir recursos 3D, cidade editável, economia, chat, ranking social ou marketplace.
- Não entregar sincronização offline completa nem app mobile nativo no MVP.

## 6. Definição de produto minimamente completo

Uma pessoa consegue criar conta, registrar uma disciplina, iniciar e concluir uma sessão de foco, receber XP uma única vez, registrar o conteúdo aprendido, obter uma revisão para data futura, realizar a revisão com autoavaliação, retomar uma tarefa interrompida, visualizar o crescimento decorativo da academia e encontrar todos os dados preservados após entrar novamente. A aplicação deve ser executável com instruções reproduzíveis e testes centrais aprovados.
