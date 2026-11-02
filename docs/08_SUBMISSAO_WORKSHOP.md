# 08 — REQUISITOS DO WORKSHOP E PLANO DE ENTREGA

## 8.1 Fonte e distinção

Este capítulo resume as exigências do **Final Project Submission Guide — Gen AI Workshop / E2 Proficiency / Learning Path 6618**, disponibilizado pelo usuário. São **requisitos da avaliação**, distintos dos requisitos de produto P0/P1/P2. As demais escolhas de arquitetura e experiência em `docs/` são propostas deste projeto, não exigências do guia.

O material de origem identifica-se como **Confidential TCS**; evitar publicar ou redistribuir o guia em repositório público ou vídeo. Este resumo é usado apenas para conferir a entrega.

## 8.2 Requisitos extraídos do guia

| Código | O que a avaliação exige | Como este projeto deve demonstrar |
|---|---|---|
| WS-01 | Resolver situação real do cotidiano | dificuldade de iniciar/retomar estudos e manter revisões |
| WS-02 | Ser validável por qualquer pessoa | dados de exemplo e instruções reproduzíveis |
| WS-03 | Mostrar claramente onde GenAI foi usada | log verdadeiro de prompts, decisões, commits, capturas e testes |
| WS-04 | Funcionar durante a apresentação | executar cenário completo localmente ou em hospedagem preparada |
| WS-05 | Entregar o código-fonte | código React/Nest/Prisma e instruções de execução |
| WS-06 | Entregar documentação da solução, objetivo e tecnologias | este pacote + README do projeto implementado |
| WS-07 | Entregar vídeo narrado mostrando a aplicação em funcionamento | gravação real MP4/MKV/MOV ou link de vídeo privado permitido |
| WS-08 | Enviar **ZIP** pelo formulário da Talent Development dentro do prazo comunicado | preparar pacote conforme nome/estrutura determinados |
| WS-09 | Pasta de submissão deve ter nome `ID_NAME` | substituir por identificação solicitada pelo formulário, **sem inventar ID** |
| WS-10 | Pasta deve conter **Code, Documentation, Video/URL** | verificar estrutura final abaixo |
| WS-11 | Formulário pede endereço onde o projeto está hospedado | incluir URL pública acessível, se exigida no momento da submissão |
| WS-12 | Compartilhamento deve permitir acesso/baixar conteúdo | testar link em janela anônima antes de submeter |
| WS-13 | Não expor dados de TCS/cliente, dados sensíveis ou chaves | capturas e seeds completamente fictícios; `.env.example` sem segredos |
| WS-14 | Respeitar políticas internas e evitar temas impróprios | conteúdo educativo neutro e dados de teste sem material restrito |

**Observações:** o guia enfatiza evidência visível de uso de IA durante o **desenvolvimento**; não exige LLM integrada ao funcionamento do aplicativo. Não há necessidade técnica de pagar por API de geração de texto para satisfazer WS-03. O prazo concreto de entrega depende do comunicado da equipe responsável; não foi fornecido nesta especificação.

## 8.3 Estrutura de entrega final sugerida

```text
ID_NAME/
  Code/
    estudo-em-dia/          # código-fonte, configs e migrações
  Documentation/
    README.md               # objetivo, stack, como executar
    docs/                   # esta documentação técnica
    evidencias-ia/          # registros reais, capturas e prompts
    roteiro-demonstracao.md
  Video/
    demonstracao-narrada.mp4    # ou arquivo com URL e orientações
  links.txt                 # URL funcional e URLs públicas, se solicitado
```

A pasta acima representa **estrutura recomendada para submissão**; este pacote contém apenas a documentação de desenvolvimento. O código executável e o vídeo deverão ser produzidos **quando a implementação existir**, não devem ser simulados ou apresentados como prontos.

## 8.4 Roteiro da demonstração narrada

1. Mostrar brevemente o problema cotidiano que o produto resolve e a tecnologia empregada.
2. Entrar com conta fictícia e exibir dashboard.
3. Criar disciplina livre, por exemplo “História da Arte”, para mostrar universalidade.
4. Iniciar uma sessão de foco curta com **relógio de demonstração controlado por testes/seed**, sem falsificar atividade real em produção.
5. Pausar, retomar, concluir e explicar tempo registrado e XP (com evidência em API/log se necessário).
6. Registrar conteúdo estudado com notas curtas e ligar revisão periódica.
7. Abrir a fila com uma revisão de exemplo **pré-populada pela seed**, autoavaliar e exibir o próximo vencimento.
8. Salvar ponto de retorno; sair e entrar novamente para mostrar persistência.
9. Exibir a Academia Viva e explicar os estágios desbloqueados; usar usuário demo em estágio adequado para a gravação.
10. Mostrar brevemente evidências reais de prompts do Codex, alterações e testes executados.
11. Encerrar com limitações honestas: o app não verifica foco cognitivo nem corrige conteúdo de qualquer disciplina.

## 8.5 Checklist de entrega

- [ ] Código executável dentro de `Code/`, sem arquivos de segredos.
- [ ] Documentação consistente com a versão realmente implementada.
- [ ] Migrações e seed fictícia reproduzíveis, com instruções claras.
- [ ] Vídeo narrado do aplicativo **operando**, não apenas slides/mockups.
- [ ] Uso de GenAI documentado por evidências verificáveis (não inventadas).
- [ ] Link de hospedagem informado e testado no formulário, se aplicável.
- [ ] Pasta ZIP com nomenclatura `ID_NAME` real e subpastas exigidas.
- [ ] Nenhum dado corporativo, pessoal ou chave de acesso nos vídeos/arquivos.
- [ ] Arquivo ZIP testado para extração e integridade.
- [ ] Submissão realizada dentro do prazo comunicado pela Talent Development.

## 8.6 Não conformidades a evitar

- Submeter apenas uma descrição sem aplicativo funcional.
- Incluir somente print ou layout estático e afirmar que funciona.
- Declarar uso de IA sem registros verificáveis.
- Inventar URL ou credenciais de ambiente público.
- Apresentar dados reais de cliente, empresa ou usuários no vídeo.
- Pressupor que este **ZIP de documentação** já equivale ao **ZIP de entrega final** com código e vídeo.
