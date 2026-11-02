# Demonstração narrada

Abra `demonstracao-narrada.mp4` ou `../APRESENTACAO.html`. MP4 com vídeo H.264, áudio AAC e faixa de legendas em português; legendas também em SRT/VTT. Duração aproximada: 3 min 4 s. Transcrição em `../docs/apresentacao/transcricao.md`.

A captura mostra o aplicativo real usando API/PostgreSQL locais. Conta, conteúdos e histórico inicial são fictícios e estão identificados na tela. A narração é sintética, gerada localmente com eSpeak-NG, voz pt-BR, pelo pacote de ferramenta `@echogarden/espeak-ng-emscripten` 0.3.5. O produto não depende desse sintetizador nem de API de tokens.

Os capítulos foram montados com FFmpeg a partir de quadros de screencast do Chromium. O capítulo documental foi capturado separadamente por HTTP local após o navegador gerenciado bloquear navegação file. Foram excluídos a página bloqueada e três quadros de redimensionamento temporário gerados ao tirar prints. Não houve alteração de valores, reconstrução de telas ou estudo humano dos 95 XP preparados pela seed. A sessão curta filmada recebe zero XP; a revisão válida acrescenta cinco e muda a academia para Campus.

Ferramentas de produção do vídeo: [eSpeak-NG](https://github.com/espeak-ng/espeak-ng) / [porta Emscripten](https://github.com/echogarden-project/espeak-ng-emscripten), [FFmpeg](https://ffmpeg.org/) e Chromium. A biblioteca sintetizadora não é redistribuída neste repositório. Os arquivos desta pasta são os artefatos de apresentação, não uma hospedagem do app.
