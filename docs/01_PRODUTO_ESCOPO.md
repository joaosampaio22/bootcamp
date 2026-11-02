# 01 — VISÃO DO PRODUTO E ESCOPO

## 1.1 Visão

**Estudo em Dia** é uma aplicação web para estudantes autônomos de qualquer área. Ela ajuda a começar, sustentar, registrar e retomar atividades de estudo e organiza revisões de conteúdos cadastrados pelo próprio usuário. O progresso aparece também por meio da **Academia Viva**, uma cena decorativa com estágios desbloqueados.

**Proposta de valor:** “Estude o que quiser. Continue de onde parou. Revise na hora certa. Veja seu esforço virar progresso.”

## 1.2 Problema e oportunidade

Uma mesma pessoa pode estudar em livros, cursos, vídeos, aulas presenciais, ambientes virtuais, código e cadernos. O aplicativo não deve exigir que ela transfira todo o material para dentro dele. Deve guardar o contexto mínimo necessário: *o que estou estudando; o que fiz; onde parei; qual é meu próximo passo; o que preciso revisar*.

O produto integra cinco ciclos: **planejar de maneira leve → executar foco → registrar conteúdo → revisar periodicamente → retomar sem recomeçar do zero**. A academia é consequência visual do uso, não uma tarefa administrativa adicional.

## 1.3 Público e cenários

- Universitário que estuda disciplinas diferentes e precisa acompanhar o avanço.
- Autodidata que alterna cursos, vídeos, projetos, livros e resolução externa de exercícios.
- Pessoa que interrompe estudos frequentemente e precisa preservar um ponto de retorno.
- Concurseiro que registra tópicos de edital e revisões sem importar um banco de questões.
- Estudante de idiomas que registra regras, vocabulário, aulas e material externo.

O aplicativo não substitui professor, terapeuta, especialista em aprendizagem nem ferramenta de correção acadêmica.

## 1.4 Personas ilustrativas, não dados reais

**Persona A — autodidata:** faz curso de programação em plataforma externa; quer preservar a página, o repositório e a próxima ação.  
**Persona B — universitária:** estuda por livros e apostilas; quer cadastrar capítulos e revisar conceitos.  
**Persona C — rotina irregular:** tem dias curtos; quer iniciar uma atividade pequena sem acumular dívida de tarefas.

## 1.5 Objetivos de produto e indicadores

| Objetivo | Indicador | Interpretação responsável |
|---|---|---|
| Facilitar o começo | Tempo entre abrir a página e iniciar uma atividade | Mede interação, não foco mental |
| Facilitar continuidade | Taxa de retomada depois de ausência e uso de ponto de retorno | Métrica comportamental |
| Favorecer revisões | Revisões realizadas / revisões vencidas em janela móvel | Não prova retenção real sem avaliação externa |
| Gerar hábito útil | Dias com sessões concluídas em 28 dias, sem punição por falhas | Evitar pressão por streak perfeito |
| Gerar feedback visível | Estágios da academia liberados com eventos auditáveis | Não é diploma nem certificado |

## 1.6 Escopo fechado do MVP (P0)

1. Cadastro, login, logout, perfil básico e fuso horário do usuário.
2. CRUD de disciplinas independentes de qualquer catálogo.
3. CRUD de conteúdos estudados: título, disciplina, notas simples, material/URL opcional, dificuldade autodeclarada e status.
4. Sessão de foco: iniciar, pausar, retomar, concluir, interromper; recuperação de sessão pendente; registro de tempo efetivo e XP.
5. Ponto de retorno: contexto, posição e próxima ação; criação/edição e exibição no dashboard; persistência entre acessos.
6. Revisões periódicas por conteúdo, com data, estado, registro histórico, avaliação subjetiva e próximo agendamento.
7. Dashboard com ação principal, revisão vencida/próxima, resumo de foco e academia.
8. Academia decorativa 2D com quatro estágios, calculada por eventos de XP e marcos de revisão.
9. Estatísticas básicas por período e por disciplina.
10. Segurança mínima, migrações, testes centrais, documentação de execução e dados de demonstração fictícios opcionais.

## 1.7 Escopo desejável (P1, somente após P0 estável)

- Missões por tamanho: essencial, completa e profunda; sugestões sem bloquear liberdade de escolha.
- Botão “Não consigo começar” com quatro respostas simples.
- Pesquisa e filtros avançados de conteúdos.
- Preferências para intervalo de revisões e objetivos semanais.
- Exportação em JSON e CSV do próprio usuário.
- Decorações extras e marcos visuais de continuidade.
- Notificações **dentro do app** de revisões pendentes.

## 1.8 Fora do escopo inicial (P2)

- Aplicativo Android/iOS nativo, modo offline com sincronização e conflitos.
- Integrações com calendário, plataformas de cursos, Gmail, IA generativa ou serviços pagos.
- Correção automática de respostas discursivas ou aplicação de provas reais.
- FSRS calibrado com grandes históricos, predição individual de memória ou algoritmos diagnósticos clínicos.
- Comunidade, amigos, social, placar competitivo, assinaturas e pagamento.
- Cidade 3D, drag-and-drop de prédios, moeda virtual e gerenciamento de recursos.

## 1.9 Jornada ponta a ponta

1. **Primeiro acesso:** usuário se cadastra e define fuso horário; pode criar disciplina “História”.
2. **Preparação:** cadastra atividade “Ler capítulo 3” ou inicia foco ligado à disciplina sem atividade pré-cadastrada.
3. **Foco:** define 25 minutos; inicia; pode pausar ou interromper; recebe indicação de tempo real registrado.
4. **Encerramento:** recebe XP pelo tempo elegível, vê a evolução visual; decide se quer registrar conteúdo ou continuar depois.
5. **Registro:** salva “Revolução Francesa: causas sociais”, notas e material; escolhe próxima ação “Revisar páginas 48–55”.
6. **Retorno:** ao entrar novamente, dashboard mostra a próxima ação e permite abrir material externo.
7. **Revisão:** no vencimento, usuário tenta recordar sem consultar notas; revela-as quando desejar; avalia “não lembrei”, “difícil”, “bem” ou “fácil”; novo vencimento é calculado.
8. **Progresso:** histórico, XP e academia refletem apenas eventos efetivamente registrados.

## 1.10 Princípios de UX

- **Sem cadastro exaustivo:** mínimo de campos obrigatórios.
- **Sem obrigação de planejar tudo:** usuário pode começar um foco sem ter criado atividade/conteúdo.
- **Sem recompensa enganosa:** marcar minutos não equivale a comprovar concentração.
- **Sem punição por ausência:** não criar dívida cumulativa nem resetar conquistas por faltar.
- **Sem interrupção durante foco:** recompensas só aparecem em transições.
- **Controle e transparência:** usuário vê o porquê de cada revisão e pode corrigir conteúdo.

## 1.11 Critérios de sucesso da apresentação

O demonstrador executa, em sequência, uma conta de teste, criação de disciplina, sessão curta com tempo de teste controlado, registro de conteúdo, exibição da revisão agendada, realização de uma revisão forçada em dados fictícios (sem mexer no relógio real), ponto de retorno e mudança de estágio. Deve ser possível demonstrar idempotência: repetir conclusão não concede XP extra.

## 1.12 Dependências e premissas

- Internet e backend disponíveis para usar a versão hospedada.
- PostgreSQL acessível pelo backend.
- Os dados pertencem à conta autenticada.
- Fuso padrão `America/Sao_Paulo`, alterável pelo usuário; armazenar instantes em UTC.
- Avisos e cronogramas de revisão são orientações, não garantia de memorização.
