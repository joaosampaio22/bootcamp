# ADR-0008 — Demonstração isolada e entrega local verificável

Data: 02/11/2026, America/Sao_Paulo. Etapa 6. CA-018, TS-12, RNF-002/005–007/009–012, WS-02–07/10/13.

1. Demonstração usa banco/volume `_demo` em 5434, API 3005 e SPA 5175, todos acessíveis localmente. CLI rejeita produção, destino remoto e colisão com bancos normais/teste. Cookie `estudo_demo_session` e chave próprios evitam sobrescrever a sessão normal no mesmo hostname.
2. `User.isDemo` é criado somente pela seed administrativa local e exibido no perfil público autenticado para identificação visual. Cadastro e edição de perfil não aceitam esse campo. Modo demo não concede permissões adicionais, não altera XP/intervalos nem adiciona endpoints de relógio.
3. Seed transacional prepara duas disciplinas, conteúdos livres, agendas vencida/futura, retorno e histórico ilustrativo de 95 XP com sessões/transições/eventos correspondentes. Reexecução preserva dados/progresso; concorrência não duplica. Conta comum com mesmo e-mail é recusada. É um cenário fictício identificado, não atividade humana certificada.
4. Credenciais aleatórias ficam em `.demo-access.json` com permissão restrita, fora do Git/pacotes e negadas pelo Vite. `demo:access` pode rotacionar a senha dessa conta e revogar sessões sem apagar registros. Não há reset automático de dados ou volume.
5. Limite HTTP JSON sobe de 32 para 64 KiB para aceitar 10 mil caracteres Unicode UTF-8 válidos nas notas. Parser compartilhado com testes converte JSON inválido/corpo excessivo em erro estruturado, sem refletir o conteúdo da requisição. Limites de domínio continuam iguais.
6. Navegação move foco para o título após mudança de caminho/carregamento e atualiza a aba; mudanças de filtro não roubam foco. Contraste dos marcadores de estágio e papéis dos grupos de filtros/durações foram corrigidos a partir da auditoria real. Testes e axe complementam inspeção manual; não declaramos certificação de acessibilidade.
7. A entrega contém vídeo real de uso, narração sintética pt-BR, legendas/transcrição, galeria e apresentação HTML offline. Gravação é montagem de capítulos capturados, com identificação de ficção. Nenhum vídeo estático é anunciado como app interativo.
8. Gerador de submissão exige identidade fornecida pelo usuário, inclui Code/Documentation/Video e recusa sobrescrever ZIP. Não inventa identificação/URL e não envia formulário. Deploy e submissão são ações separadas da entrega local.

Evidências: [ETAPA-6.md](../evidencias-ia/ETAPA-6.md) e [auditoria final](../apresentacao/AUDITORIA_FINAL.md).
