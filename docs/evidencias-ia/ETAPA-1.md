# Etapa 1 — continuação parcial: fundamentos de segurança

> Registro histórico da primeira continuação. A implementação persistida e sua validação posterior estão no [relatório de conclusão](ETAPA-1-CONCLUSAO.md).

Data: 02/11/2026. Solicitação real: **“Pode continuar o desenvolvimento”**.

**Em andamento, não concluída.** O usuário autorizou anteriormente o envio dos arquivos ao repositório `joaosampaio22/bootcamp`. Não há aprovação de funcionalidades prontas nem teste de login entre contas.

## Trabalho realizado

- Consultados AGENTS.md, plano, testes e decisões da base. O acesso ao checksum oficial do Prisma foi tentado novamente pelo proxy, com TLS verificado: HTTP 403. O rascunho continua contendo `binaries.prisma.sh`; a instância não recebeu a liberação.
- Instalados Argon2 e jose pelo npm, com lockfile. Usado `--ignore-scripts` porque o postinstall do projeto continua bloqueado no Prisma; não desativadas verificações TLS ou de integridade. Os testes executaram o Argon2 nativo instalado e verificaram hashes reais de senhas fictícias.
- Implementados `auth/password.service.ts`, `auth/session-token.ts`, `auth/request-security.ts`, DTOs de cadastro/login/disciplinas e validação de fuso IANA, com testes.
- Desacoplado o teste unitário de saúde do client Prisma: interface de ping injetada, mantendo a consulta SQL no módulo de produção. As mesmas verificações de sucesso e indisponibilidade continuam presentes. A integração real permanece pendente.
- Documentadas decisões e responsabilidades ainda não ligadas a endpoints em `ADR-0002-primitivas-autenticacao.md`.

## Verificações

- `npm test`: **61 testes aprovados** — 4 no runner Node, 52 no backend (6 suítes Jest), 5 no frontend (Vitest). Nenhum skip. São testes unitários/de componentes; não validam autenticação persistida ou revogação de sessão no banco.
- A primeira execução apontou que a biblioteca serializa os parâmetros PHC de Argon2 em ordem diferente. O teste foi corrigido para validar os três valores sem depender da ordem; algoritmo, custo e asserções de salt/verificação foram preservados.
- `npm run lint`: **aprovado**, zero warnings. O primeiro lint apontou escape desnecessário em regex, corrigido.
- `npm run typecheck:security --workspace @estudo-em-dia/api`: **aprovado**, comando dedicado ao subconjunto independente do banco. Não substitui o typecheck/build completo, que exige o client gerado.
- Não executados novos testes de integração, migração Prisma nem início funcional da API nesta continuação: client/engine ainda indisponíveis.

O registro da Etapa 0 preserva os resultados históricos daquela execução; o resultado agregado mais recente de testes é o informado acima.

## Próximo requisito externo

Nas configurações do ambiente, revisar e salvar a liberação já proposta de **`binaries.prisma.sh`**. Depois de aplicada, verificar novamente o destino e executar instalação com scripts, geração, migração e verificações integrais antes de declarar qualquer etapa pronta. O simples salvamento do rascunho não aplica nem publica a configuração.

As telas atuais e `PREVIA.html` continuam mostrando a Etapa 0. Não representam cadastro, login ou disciplinas funcionais.
