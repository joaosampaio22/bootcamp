# ADR-0003 — Autenticação persistida, disciplinas e engine oficial compilado

Data: 02/11/2026. Solicitação real: “pode avançar”. Etapas 0 (validação final) e 1.

## Resolução do bloqueio de ferramentas

O host `binaries.prisma.sh` continuou retornando HTTP 403. Sem alterar a política do proxy, obtivemos a fonte oficial de `https://github.com/prisma/prisma-engines`, commit **d1b3f377ca835d73fd50954a5e22128b9ebdd6b8**, exatamente o identificador do engine do Prisma 7.10.1 instalado. Rust **1.97.1** conforme `rust-toolchain.toml`; CMake **4.4.4**; Cargo com `--locked`, checksums ativos e três jobs. Alteramos somente opções de otimização da compilação pelo ambiente, sem editar fontes ou lockfile oficial.

O binário identifica-se como `schema-engine-cli d1b3f377ca835d73fd50954a5e22128b9ebdd6b8`. Digest SHA-256 observado desta compilação: `bf66e884fe0752bab861e4770436a12286c7554881527f90cf472376e0eade27`. É um artefato compilado localmente de fonte oficial, não uma alegação de igualdade byte a byte com o binário distribuído pelo Prisma. A proveniência é a revisão Git oficial mais Cargo.lock e a toolchain fixada. Usamos a opção suportada `PRISMA_SCHEMA_ENGINE_BINARY` e preservamos a validação de pacotes/TLS. O script reexecutável está em `scripts/build-prisma-engine.sh`; o cache de dependência fica fora da aplicação em `/workspace/tooling`.

## Autenticação

- Cadastro normaliza e-mail, calcula Argon2id fora da transação e cria usuário + sessão atomicamente. Conflito não deixa sessão parcial.
- Login valida hash real ou hash dummy quando a conta não existe. A resposta não distingue conta ausente de senha errada, nem contém hash/JWT.
- JWT HS256 com validade de uma hora e `jti` ligado a AuthSession. Cada endpoint privado verifica assinatura, expiração, existência e revogação da sessão no banco.
- Cookie HttpOnly, Path=/, SameSite=Lax e Secure obrigatório em produção; prefixo `__Host-` quando Secure. Sem JWT em localStorage. Logout revoga no banco e remove o cookie com os mesmos atributos.
- Todas as escritas verificam Origin, ou Referer quando Origin estiver ausente. Escritas privadas exigem nonce CSRF do JWT no header, comparado em tempo constante. GET /auth/me fornece o nonce sem expor o JWT.
- Limite de dez tentativas de cadastro/login por minuto por peer, em memória no monólito, com tamanho limitado. Sem trust proxy nem confiança em X-Forwarded-For. Uma futura implantação com proxy precisa configurar peers confiáveis e revisar a estratégia antes de escalar múltiplas réplicas.
- ClockService é substituível em testes; nenhuma rota permite alterar o tempo ou pular autenticação.

## Disciplinas e perfil

- User, AuthSession e Subject com FKs/índices. Índice SQL parcial por usuário + nome normalizado garante unicidade entre ativas, inclusive sob corrida. Normalização NFC + lowercase pt-BR preserva conteúdo livre sem expansão arbitrária de compatibilidade Unicode.
- Consultas e alterações sempre incluem userId derivado da sessão. Recursos alheios retornam 404. Arquivamento preserva a linha; restaurar um nome já ativo gera 409 e rollback.
- Paginação até cem itens; nome 1–80 caracteres. O perfil permite nome e fuso IANA, mantendo e-mail somente leitura nesta etapa.
- Rotas React privadas recuperam sessão na recarga. Ações só anunciam sucesso após resposta confirmada; 401 retorna ao login. CSRF mantido em memória, recuperado por /auth/me.

## Verificação e limites

RF-001–005, RF-010, RN-001–005 (parte aplicável a esta etapa), RN-010, RNF-001–006/009–011 e CA-001–003. Casos de sessão revogada, expiração, CSRF, senha inválida, duplicidade e isolamento cobertos por HTTP com PostgreSQL real; componentes e navegador cobrem fluxo visual.

O runtime de produção da SPA é forçado no build, independentemente do NODE_ENV de desenvolvimento da API no .env compartilhado. A prévia HTML distribuída é uma galeria de capturas reais, sem simular persistência ou autenticação offline.

Foco, XP, conteúdos, revisão, continuidade e academia continuam fora desta etapa. Sem recuperação de senha, deploy público ou vídeo narrado. Publicação do snapshot do ambiente continua sendo uma operação separada das verificações e do envio do código ao GitHub.
