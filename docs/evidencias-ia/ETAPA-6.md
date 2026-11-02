# Etapa 6 — polimento e apresentação

Data: **02/11/2026**, America/Sao_Paulo. Solicitação real: **“pode continuar”** após a Etapa 5. Codex auxiliou código, testes, correções, documentação e montagem dos artefatos; sem outros agentes e sem LLM no produto.

## Entrega e decisões

MVP local com demonstração separada, seed idempotente, identificação de dados fictícios, foco por rota/teclado, contraste e grupos ARIA corrigidos, notas Unicode válidas, erros de parser estruturados, vídeo narrado, legendas, transcrição, apresentação offline e gerador de pacote. [ADR-0008](../decisoes/ADR-0008-demo-polimento.md) e [matriz final](../apresentacao/AUDITORIA_FINAL.md) registram escopo e limites.

Arquivos principais: CLI `scripts/demo*.mjs`, setup/Compose, `src/demo/demo-seed.ts`, marcador User.isDemo e sétima migração, auth/cookie demo, `request-body.ts`, RouteFocus, ajustes de estilos/ARIA, testes e material em `Video/` e `docs/apresentacao/`.

## Verificação real

| Verificação | Resultado |
|---|---|
| `npm run verify` | Lint, tipos strict, testes, migrações de teste e builds API/web aprovados |
| Node | **8 testes aprovados** de proteção de bancos normais/teste/demo |
| Jest unitário | **166 aprovados**, 12 suítes |
| Vitest/Testing Library | **45 aprovados**, 8 arquivos |
| Jest/Supertest + PostgreSQL | **76 aprovados**, 7 suítes |
| Total | **295 aprovados**, sem skips |
| Migrações | Sete aplicadas em desenvolvimento/teste/demo; schema vazio temporário conferiu tabelas, índices e isDemo, sendo removido ao final |
| CLI demo real | Setup em banco próprio, seed repetida preservando dados, cookie separado e rotação de senha revogando sessão anterior |
| Processo novo da API compilada, relógio normal | Conta comum, notas de 10 mil caracteres Unicode, foco/pausa/retomada/retry, retorno entre logins, revisão futura 409 e métricas aprovados |
| Axe-core 4.14.0 | **23 estados**, zero violações e zero itens incompletos na execução final; desktop/móvel/movimento reduzido |
| Vídeo | 184 segundos, H.264/AAC e legenda mov_text; decodificado integralmente sem erro |

Os testes novos cobrem produção/remoto/colisão de banco demo, cookies isolados/modo proibido em produção, seed repetida/concorrente, proteção de conta comum, marcador não editável pela API, Unicode válido, JSON malformado, 413 estruturado e foco após rotas/carregamento. Todas as regressões transacionais de foco/revisão, calendário, isolamento e estatísticas continuam aprovadas. Ajustes finais de cópia/ARIA foram conferidos por lint, tipos, testes e build web.

## Problemas reproduzidos e corrigidos

1. Na API compilada, notas válidas com 10 mil caracteres de quatro bytes recebiam 413 pelo limite de 32 KiB. Limite passou a 64 KiB, com parser compartilhado entre execução e integração. DTOs e limites de negócio foram mantidos.
2. Axe detectou contraste de 4,12:1 nos números dos estágios da academia; cor foi corrigida. A revisão dos itens incompletos encontrou divs rotulados sem papel de grupo em disciplinas/durações; receberam role=group. Nova auditoria não deixou violações ou incompletos. JSON bruto final em [etapa-6-acessibilidade.json](etapa-6-acessibilidade.json).
3. Credenciais fictícias geradas ficam em arquivo privado ignorado e negado pelo Vite: tentativa HTTP retorna 403. A demo usa chave/cookie/banco separados, sem substituir a sessão normal. Não há relógio ou concessão de XP de teste na API pública.

## Gravação e apresentação

O vídeo é captura real do app com conta seed identificada e **relógio normal**. O exemplo inicial contém 95 XP fictícios. A sessão curta filmada salva zero XP; a revisão legítima concede cinco e leva ao Campus. Conteúdo livre e retorno são criados pela interface; o vídeo sai/entra novamente, consulta academia/extrato e gráfico/tabela. Narração sintética local pt-BR por eSpeak-NG; roteiro/transcrição não são conversas de IA inventadas.

O capítulo documental foi capturado separadamente em HTTP local porque o navegador gerenciado bloqueou file. A página bloqueada foi descartada. Três quadros de viewport temporário usados ao tirar prints também foram descartados; os 180 quadros de screencast restantes preservam o tempo das ações. Montagem com FFmpeg, áudio/legendas e identificação permanente de demonstração. Metadados em [etapa-6-video.json](etapa-6-video.json).

- [Início da demonstração](etapa-6-inicio.png).
- [Revisão confirmada](etapa-6-revisao.png).
- [Academia após a revisão](etapa-6-academia.png).
- [Estatísticas](etapa-6-estatisticas.png).
- Vídeo/transcrição/roteiro: `Video/`, `docs/apresentacao/` e `APRESENTACAO.html` na raiz.

Contas temporárias de smoke foram removidas por IDs exatos. A conta de demonstração permanece somente no banco separado para validação do usuário; a seed não a reseta. Senhas/tokens não aparecem no Git, galeria ou vídeo.

## Limites

O MVP técnico local e o material de apresentação estão entregues. Auditoria automática não equivale a certificação de acessibilidade, e não foi feito benchmark/SLA. Não houve deploy público, identificação real de submissão inventada ou envio de formulário. O gerador de ZIP prepara estrutura revisável quando receber a identidade real; o teste usa identificação explicitamente fictícia. Nenhum guia corporativo de avaliação é incluído pelo gerador. `PREVIA.html` é galeria; formulários funcionais exigem Node/API/PostgreSQL conforme README.
