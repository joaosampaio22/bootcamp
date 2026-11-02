# Etapas 0 e 1 — implementação e validação nesta instância

Data: **02/11/2026**, America/Sao_Paulo. Solicitação real: **“pode avançar”**.

## Resultado concreto

Base executável com Prisma 7/PostgreSQL e autenticação + disciplinas implementadas. Cadastro cria usuário e sessão em transação. Login, recuperação da sessão na recarga, perfil, logout com revogação e disciplinas livres funcionaram na API e no navegador. Foco, XP, conteúdos, revisões, continuidade, academia e estatísticas ainda não pertencem a esta entrega.

Requisitos relacionados: RF-001–005, RF-010; RN-001–005 (parte aplicável), RN-010; RNF-001–006/009–011; CA-001–003; TS-01–06/11 nas rotas desta etapa. Não declarar atendidos os RF/CA do restante do MVP.

## Bloqueio do Prisma superado sem desativar verificação

O destino de binários continuou retornando HTTP 403. A instância não recebeu a mudança de rede proposta no rascunho. Compilamos a fonte oficial de `prisma/prisma-engines` no **commit exato d1b3f377ca835d73fd50954a5e22128b9ebdd6b8**, Rust **1.97.1**, Cargo com `--locked`, checksums ativos e três jobs. CMake 4.4.4 obtido pelo PyPI. A compilação terminou em aproximadamente quatro minutos e o binário informou a revisão correta.

Configurada a opção suportada `PRISMA_SCHEMA_ENGINE_BINARY`. A geração do Prisma Client 7.10.1 e as duas migrações foram então executadas com sucesso pelo Prisma em bancos reais. O binário/cache não foi adicionado ao Git; o script de reprodução está em `scripts/build-prisma-engine.sh`. Proveniência, parâmetros e digest desta compilação em `ADR-0003-autenticacao-persistida-engine.md`.

## Alterações principais

- Modelos AuthSession/Subject, FKs, índices e migração SQL parcial para nome ativo único por usuário.
- AuthService/Controller/Guard, cookies, chave de sessão local aleatória, hash dummy, limite de tentativas e proteção Origin/CSRF aplicada às rotas.
- Users e Subjects com DTOs, autenticação e filtros de propriedade no servidor. Arquivamento preserva histórico; restauração conflitante faz rollback.
- Rotas React de cadastro/login, recuperação de sessão, organização de disciplinas e perfil. Estados de espera/erro/vazio/sucesso, retry e tratamento de 401. Sem JWT em armazenamento do navegador.
- Build web força runtime de produção independentemente do NODE_ENV da API. A mudança reduziu o JS compilado de cerca de 502 kB para 280 kB sem elevar o limite de warnings.
- PREVIA.html substituída por galeria offline de capturas reais, com indicação explícita de que não executa a API.
- README atualizado com execução, origem correta, CSRF, cookies, duração da sessão, perfil e alternativa oficial de instalação.

## Resultados executados

| Verificação | Resultado |
|---|---|
| Compilação oficial e reexecução do script com cache | Aprovadas; revisão exata e mesmo digest local no cache. |
| `npm ci --no-fund`, com override do engine exportado | Aprovado, scripts habilitados, 793 pacotes instalados e client gerado. |
| `npm run setup:env` | Chave JWT adicionada ao arquivo local existente; demais valores preservados. Nenhum valor secreto exibido. |
| `npm run db:up` / `npm run db:migrate` | Bancos saudáveis; duas migrações aplicadas pelo Prisma em desenvolvimento. |
| `npm run verify`, após instalação limpa | **Aprovado**: lint, strict types, testes, migrações de teste e builds API/web. |
| Runner Node | **4 aprovados**, banco de teste isolado obrigatório. |
| Jest unitário | **58 aprovados**, 7 suítes, incluindo formato/produção de cookies e segurança. |
| Vitest / Testing Library | **10 aprovados**, 2 arquivos: apresentação, acesso, erros, redirecionamento, criação confirmada, envio de CSRF e falha de carregamento sem falso estado vazio. |
| Jest/Supertest + PostgreSQL | **17 aprovados**, 2 suítes, sem skips. |
| Total automatizado | **89 testes aprovados**, sem esperas de minutos reais. |
| Health em processo de desenvolvimento, direto e pelo Vite | Resposta real `{status:ok,service:estudo-em-dia-api,database:up}` em ambos. |
| API compilada em processo novo, porta temporária 3001 | Health real aprovado; processo encerrado ao fim. |
| `npm audit --omit=dev --json` | Zero alertas nas dependências de execução no momento da consulta. Não equivale a auditoria profissional nem garante ausência de falhas. |
| Fluxo real Chromium, desktop e 360px | Cadastro, disciplina, edição, refresh, arquivamento/restauração, perfil, logout e novo login aprovados; sem overflow horizontal em 360px. |

Os testes HTTP exercitaram: isolamento entre contas, mensagens genéricas de credenciais, duplicidade de e-mail sem sessão parcial, sessão revogada/expirada, cookie inválido, CSRF ausente/alheio, origem maliciosa, rate limit sem aceitar spoofing de X-Forwarded-For, whitelist, paginação e conflito real de duas criações simultâneas.

O cenário de indisponibilidade do banco no health injeta falha de consulta; não representa teste de queda física do PostgreSQL. Os demais cenários de persistência usam Prisma e PostgreSQL reais.

## Falhas encontradas e correções reais

- O primeiro teste de integração revelou 404 HTML do Nest 12 fora do prefixo, em vez do envelope esperado. A fronteira do serviço passou a devolver JSON estruturado para caminhos externos; o teste original foi preservado e passou.
- Ajustados imports de DTO para preservar metadados de decorators; o lint considera `emitDecoratorMetadata`, sem transformar imports necessários em `import type`.
- Corrigidos contexto React/fast refresh e dependência do callback de sessão, após falhas de lint.
- A primeira captura privada no Chromium excedeu o timeout. Repetimos com perfil limpo e configuração adequada do processo; todas as etapas funcionais e capturas finais terminaram. Não registrar o timeout como aprovação.
- A revisão do estado de erro removeu a lista vazia quando não há resposta confirmada. O teste de cadastro passou a aguardar a resposta da lista antes de afirmar estado vazio, preservando a asserção e eliminando uma dependência de timing.

## Capturas reais e limpeza

- [Cadastro](etapa-1-cadastro.png).
- [Disciplinas desktop](etapa-1-disciplinas-desktop.png).
- [Disciplinas em 360px](etapa-1-disciplinas-mobile.png).

São dados fictícios, não um catálogo oferecido pelo app. As duas contas criadas nas tentativas do navegador e seus registros foram removidos ao final por identificadores exatos. Os testes também removem suas próprias fixtures. Não foi criada seed automática, conta pública ou credencial de demonstração reutilizável.

## Ambiente e limites da entrega

Foram salvos os campos `install_script` e `start_skill` no rascunho do ambiente com caminhos, export do engine, instruções de banco, startup e readiness. Salvar o rascunho não aplica/publica o snapshot. A publicação é feita nas configurações pelo usuário. A restauração em uma nova tarefa ainda não foi verificada.

Esta entrega não é o MVP completo e não inclui hospedagem pública, recuperação de senha, MFA, vídeo narrado ou alegação de segurança auditada profissionalmente. A próxima etapa do plano é **foco robusto e recompensas**, com tempo no servidor e idempotência transacional.
