# Etapa 2 — foco e recompensas

Data: **02/11/2026**, America/Sao_Paulo. Solicitação real: **“pode avançar”**.

## Entrega

Foco avulso ou com disciplina, pausa/retomada, encerramento completo/interrompido, recuperação de sessão pendente, descarte, histórico e eventos de XP. Nenhum conteúdo obrigatório, exercício pronto ou dependência de LLM. Requisitos: RF-020–027, RN-020–030/060–061/065, CA-004–008/017 e TF-01–15. RF-021 está atendido para disciplina; vínculo com conteúdo depende da Etapa 3 e é rejeitado explicitamente quando não nulo.

## Arquivos e decisões

- Prisma: FocusSession, FocusTransition, FocusAction, RewardEvent e terceira migração, gerada via `prisma migrate diff`, com índices/constraints adicionais de domínio.
- Backend: `src/focus/`, `src/rewards/`, registro do módulo e envelope de erro com estado atual no conflito. Todas as respostas da API usam no-store.
- Frontend: página privada de foco, timer monotônico, recuperação, comprovante pós-foco, histórico, controle de retry e rota padrão. Navegação preserva disciplinas/perfil.
- Decisões em `ADR-0004-foco-recompensas.md`. Nenhum parâmetro de XP, duração ou carência foi alterado.

## Resultados executados

| Verificação | Resultado |
|---|---|
| `npm run verify` | Aprovado: lint, tipos, testes, migração de teste e builds API/web. |
| Node | **4 testes aprovados** de proteção do banco de teste. |
| Jest unitário | **73 aprovados**, 8 suítes, incluindo limites de XP, pausas, carência e datas civis em meia-noite/DST. |
| Vitest/Testing Library | **18 aprovados**, incluindo restauração de pausa, ausência de auto-conclusão, confirmação humana e retry com mesma chave/corpo. |
| Jest/Supertest + PostgreSQL | **34 aprovados**, 3 suítes. |
| Total automatizado | **129 testes aprovados**, sem skips e sem esperar minutos de estudo reais. |
| Migração de desenvolvimento | Terceira migração aplicada com sucesso pelo Prisma. |
| Smoke de processo novo da API compilada | Cadastro → início → pausa → interrupção → retry idêntico. Relógio real, duração curta e XP zero, conforme mínimo. |
| Chromium real | Início avulso, pausa, refresh sem contar descanso, retomada, conclusão, recuperação, descarte e 360px sem overflow. |

Integração cobriu 25min=25XP, interrupção de 4min=0 e 12min=12, 90min com XP<=60 e reautenticação, teto de 180 sem perda do tempo, virada de dia, origem auditável, somente uma sessão aberta e constraint de banco, corridas com chaves iguais/diferentes, replay imutável depois de nova recompensa, 409 em versão/transição inválida, confirmação limitada ao plausível, logout/novo login sem prêmio automático, isolamento, CSRF e rejeição de XP/tempo/identidade forjados.

O teste de rollback causa erro **depois** de criar RewardEvent e confirma que sessão, transição, XP e comprovante são revertidos. O mesmo pedido pode então ser reenviado com segurança.

## Navegador e evidência visual

O backend do navegador foi instanciado de AppModule compilado em um harness temporário com ClockService substituído, origem própria e banco `_test`. O relógio era controlado por arquivo do harness, sem endpoint HTTP adicional e sem alterar o código de produção. Capturas usam pessoa e dados fictícios; os cinco minutos exibidos foram avançados pelo relógio de teste, não representam estudo real de uma pessoa.

- [Foco desktop](etapa-2-foco-desktop.png).
- [Resultado confirmado](etapa-2-resultado.png).
- [Recuperação pendente](etapa-2-recuperacao.png).
- [Foco em 360px](etapa-2-foco-mobile.png).

O fluxo verificou zero XP antes da decisão humana; cinco após concluir; nenhuma recompensa adicional pela detecção de abandono; dez após a segunda confirmação; nenhum aumento ao descartar a terceira sessão. Uma quarta sessão demonstrou o layout ativo em celular. As fixtures e os processos temporários foram removidos ao final. O smoke com relógio real usou outra conta fictícia, também removida por identificador exato.

## Correções durante a execução

- Atualização de estado foi movida para callbacks assíncronos explícitos, e respostas antigas são invalidadas ao mudar a ação/página, após as verificações de hooks apontarem inconsistências.
- O endpoint sem sessão passou a responder JSON `null` explicitamente, evitando corpo vazio incompatível com o contrato e o cliente.
- A entrada privada passou a ser foco; o teste de cadastro foi atualizado para navegar para disciplinas quando esse é o objeto da asserção, preservando a verificação de criação/CSRF.
- O harness temporário resolveu Nest Testing pelo resolvedor do workspace após a primeira tentativa usar um caminho de pacote inexistente. Não foi uma falha da aplicação.

## Limites e próximo passo

Esta etapa não implementa conteúdos, continuidade, revisões, academia ou painel de estatísticas. O histórico e o total de XP são dados reais de foco, não telas simuladas dessas funcionalidades futuras. `PREVIA.html` é somente uma galeria offline de capturas; uso funcional exige API/banco conforme README.

Próxima etapa: **Etapa 3 — conteúdos e pontos de retorno**. Configuração de inicialização do ambiente é salva em rascunho; publicação e restauração em nova tarefa são verificações separadas. Não foi feito deploy público nem gravação narrada.
