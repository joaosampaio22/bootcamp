# 05 — EXPERIÊNCIA DO USUÁRIO, FLUXOS E ACADEMIA VIVA

## 5.1 Princípio orientador

**O aplicativo precisa facilitar a entrada e a continuidade do estudo sem competir pela atenção durante o trabalho.** A gamificação aparece antes/depois, não durante o foco. Não são permitidos pop-ups de XP, chuva de confetes, notificações intrusivas ou telas de gestão da academia sobre a atividade principal.

A aplicação acompanha materiais **externos** e **quaisquer disciplinas**, sem exigir exercícios, trilhas ou correção de conteúdo próprios. O usuário controla o que estuda e descreve o que aprendeu; o sistema controla dados, tempo registrado, agenda e recompensas.

## 5.2 Navegação principal (mobile e desktop)

| Tela / rota | Ação principal | Estados a projetar |
|---|---|---|
| Acesso `/login`, `/register` | Entrar/criar conta | carregando, erro genérico, validação, autenticação expirou |
| Inicial `/app` | **Continuar estudando** ou iniciar foco | sem disciplina, ponto de retorno, foco pendente, revisões vencidas, academia |
| Foco `/app/focus` | Iniciar, pausar, retomar, concluir | pronto, RUNNING, PAUSED, reconciliação, concluído, offline/erro |
| Disciplinas `/app/subjects` | Criar/renomear/arquivar | vazio, lista, edição, arquivamento |
| Conteúdos `/app/contents` | Registrar assunto estudado | lista, novo, detalhe, edição, revisões habilitadas/desabilitadas |
| Revisões `/app/reviews` | Tentar recordar um conteúdo | vencida, futura, texto oculto/revelado, avaliação, concluída |
| Continuidade `/app/continue` | Abrir ponto de retorno | sem ponto, ponto ativo, histórico, marcar concluído |
| Academia `/app/academy` | Ver evolução | quatro estágios, falta XP para próximo, limite máximo |
| Estatísticas `/app/statistics` | Entender a rotina | vazia, período selecionado, métricas por matéria |
| Perfil `/app/settings` | Editar nome e fuso | confirmação e aviso sobre dias civis |

As URLs são propostas; a nomenclatura exata pode ser ajustada sem alterar as regras.

## 5.3 Dashboard e hierarquia de informação

Ordem sugerida de prioridade:

1. Se houver sessão pendente de reconciliação, destacar resolução (sem XP automático).
2. Se houver sessão RUNNING/PAUSED, oferecer retorno direto ao timer.
3. Se existir ponto de retorno aberto, destacar “Continue de onde parou”, com **próxima ação**.
4. Caso contrário, destacar CTA “Começar uma sessão de foco”.
5. Exibir revisões vencidas/hoje em seção acessível, mas **não bloquear** o estudo por atraso.
6. Exibir resumo de tempo registrado e uma prévia discreta da academia.

**Estado vazio:** “Você pode começar a estudar agora; nenhuma disciplina ou conteúdo precisa ser cadastrado antes.” Dar opção de criar disciplina, nunca impor formulário inicial longo.

## 5.4 Fluxo de foco — detalhamento UX

1. Usuário escolhe 5–120 minutos (padrões 10/25/50) e, opcionalmente, vincula uma disciplina ou conteúdo.
2. Clica **Iniciar foco**; frontend aguarda confirmação do backend.
3. A tela exibe tempo restante, nome da disciplina opcional e botões “Pausar” e “Encerrar”. Link discreto “Onde parei?” só se necessário, nunca caixa de diálogo recorrente.
4. **Pausar:** contador visual congela; backend registra o tempo até a pausa.
5. **Retomar:** backend inicia novo segmento. O cronômetro renderiza a partir dos dados do servidor, sem confiar no relógio local como verdade do saldo.
6. **Concluir/interromper:** interface pergunta/indica o resultado e aguarda confirmação. Encerramento abaixo de 5 minutos é válido, mas não gera XP.
7. Resumo pós-foco: minutos efetivos registrados, XP concedido (inclusive zero por limite diário), novo estágio se aplicável e botões opcionais **Registrar conteúdo** / **Salvar ponto de retorno** / **Voltar ao início**.
8. Se o usuário omitir os dois formulários, a sessão ainda permanece registrada e a recompensa é preservada.

**Falha de conexão ou fechamento da aba:** não simular XP. Ao voltar, recuperar estado do servidor; sessões ultrapassadas exigem reconciliação. Se não houver backend acessível, mostrar erro objetivo e oferecer nova tentativa, sem registrar sucesso falso.

## 5.5 Fluxo de registro de conteúdos — sem fricção

Formulário P0:

- Disciplina: obrigatória (já escolhida quando o conteúdo foi iniciado a partir de uma disciplina); pode ser criada em diálogo leve.
- Título: obrigatório; sugestão do próprio usuário, nenhum catálogo.
- Notas: opcionais, texto puro, 10.000 caracteres.
- Link do material: opcional, somente HTTP(S).
- Data estudada: hoje no fuso do perfil por padrão, pode editar.
- “Quero revisar periodicamente este conteúdo”: opção explícita, ligada por padrão apenas se a interface explicar a consequência; o usuário pode desligar.

**Não pedir resumo longo**, anexos, categoria, questões nem nota de desempenho no primeiro registro. O objetivo é salvar **um lembrete revivível** e iniciar a agenda de revisão.

## 5.6 Fluxo de revisão — recuperação antes de revelar

1. Fila mostra título, disciplina, data de vencimento e dias de atraso (sem mensagens de culpa).
2. Ao abrir, exibir título e convite: “O que você consegue lembrar sobre esse assunto?”
3. **Notas do usuário começam ocultas**. Link externo permanece disponível, mas mostrar orientação para tentar lembrar antes de abrir.
4. Botão “Ver minhas anotações” revela texto, se houver; se não houver, a revisão ainda pode ser concluída.
5. Escolher uma autoavaliação: **Não lembrei**, **Com dificuldade**, **Lembrei bem**, **Muito fácil**.
6. Frontend envia `rating` + chave idempotente + versão esperada; servidor grava tentativa, próxima data e XP de forma atômica.
7. Exibir nova data e lembrete de que o resultado é **autoavaliação**, não correção objetiva.

**Revisões atrasadas:** uma unidade por conteúdo, sem multiplicar cartões por todos os dias perdidos. Não forçar o estudante a “pagar a dívida” antes de iniciar novas atividades.

## 5.7 Fluxo de continuidade — memória externa

Campos: disciplina e conteúdo opcionais, **onde parei** (opcional), **próxima ação** (obrigatória), URL (opcional). O usuário pode criar, editar, finalizar e manter vários pontos. O dashboard destaca um ponto aberto mais recentemente atualizado.

Exemplo de microcópia:

> **Onde você parou:** a aula terminou no exemplo de classes abstratas.  
> **Próximo passo:** abrir o projeto e executar o exemplo com duas subclasses.  
> **Material:** abrir link salvo.

A próxima ação é concreta e executável. Se o usuário não souber preenchê-la, exibir exemplos curtos, **sem gerar conteúdo por IA**.

## 5.8 Academia Viva — design do sistema decorativo

**Papel:** celebração visual do progresso. Não é jogo de administração, não possui moedas, inventário, compras, arrastar prédios, produção de recursos ou personagens simulados em P0.

| Estágio | XP cumulativo | Visual conceitual | Regra |
|---|---:|---|---|
| I — Fundação | 0–99 | terreno, edifício inicial e jardim simples | padrão de todos os usuários |
| II — Campus | 100–349 | biblioteca e caminhos | desbloqueio automático |
| III — Universidade | 350–799 | laboratórios e ampliação de jardins | desbloqueio automático |
| IV — Cidade do Conhecimento | >= 800 | conjunto acadêmico amplo | último estágio P0 |

**Apresentação técnica:** um SVG criado no próprio projeto para cada estágio, renderizado no frontend conforme `stage` vindo da API. Se o usuário atravessar vários limiares de uma vez, mostrar diretamente estágio correto; não tentar reexecutar uma sequência de efeitos. As ilustrações não podem conter marcas ou personagens protegidos por direitos autorais sem licença.

**Recompensas:** foco e revisão geram XP. A academia não distingue verdade de conhecimento adquirido; a mensagem deve ser “Sua academia evoluiu com suas sessões e revisões registradas”, e não “Sua inteligência aumentou”.

## 5.9 Gamificação responsável

- Sem streak diário obrigatório, punição por ausência, perda de XP ou degradação de edifícios.
- Sem recompensa por abrir cartão de revisão sem concluir avaliação.
- Sem chamar foco registrado de atenção neural medida.
- Recompensa de foco inclusive quando foi interrompido, proporcional ao tempo válido, sujeito a mínimo/tetos.
- Melhorias visuais aparecem **depois** do estudo; tela de foco é intencionalmente simples.
- Exibir quando o limite de XP diário foi alcançado, sem esconder o tempo estudado.
- Priorizar progresso individual, sem ranking social.

## 5.10 P1 — assistência de início e missões por tamanho

**Assistência “Não consigo começar”** (não bloquear o MVP): usuário escolhe entre “não sei o que fazer”, “parece grande demais”, “tenho receio de errar” e “estou cansado/confuso”. O app apresenta uma sugestão curta e editável, sem diagnóstico ou técnica infalível.

**Três modos de missão:** essencial (ação mínima), completo (estudo + revisão), profundo (aplicação com material externo). Devem ser apenas modelos de planejamento, não um currículo fechado. Não exigir prova criada pelo aplicativo.

## 5.11 Design visual e acessibilidade

- Interface em português brasileiro, textos legíveis e layout mobile-first.
- Paleta sugerida: azul-noite para estrutura, turquesa/verde suave para progresso e neutros claros/escuros; evitar excesso de cor durante foco.
- Tipografia simples e acessível; contraste mínimo compatível com WCAG AA nos componentes essenciais.
- Foco de teclado visível; botões com rótulos; `aria-live` discreto para estados importantes; não anunciar cada segundo do timer a leitores de tela.
- Preferência `prefers-reduced-motion`: desativar transições de recompensa e animações da academia.
- Carregamento com esqueleto/placeholder; erros com opção de tentar novamente.
- Não esconder funções essenciais atrás de hover ou efeitos visuais.

## 5.12 Mensagens e comunicação

**Correto:** “Você registrou 25 minutos de estudo”, “Sua próxima revisão está marcada para 5 de novembro”, “Você retomou uma atividade que havia deixado preparada”.

**Evitar:** “Sua atenção melhorou 30%”, “Você dominou definitivamente este tema”, “Falhou por perder a sequência”, “Seu cérebro foi recuperado”.

## 5.13 Fluxos de aceitação visual

- Sem conta: visitante vê cadastro/login e nenhuma informação privada.
- Conta vazia: usuário inicia foco avulso sem primeiro criar disciplina.
- Conteúdo sem notas: revisão oferece recordação do título e avaliação.
- Sessão já ativa: usuário é encaminhado ao estado existente, não cria outra.
- Sessão pendente: resolver/discartar antes de iniciar nova (sem XP fabricado).
- Revisões atrasadas: fila continua utilizável e não exibe cobranças repetitivas.
- Usuário no estágio IV: não mostrar barra impossível de completar para estágio V.
