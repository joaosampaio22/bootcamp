#!/usr/bin/env python3
"""Cria pacote revisável; não envia formulário nem inventa identificação."""
import argparse
from pathlib import Path
import re
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--identity', required=True, help='Identificação real no formato solicitado, como ID_NOME')
parser.add_argument('--output', required=True, type=Path, help='Arquivo ZIP novo; não sobrescreve um arquivo existente')
args = parser.parse_args()
if not re.fullmatch(r'[A-Za-z0-9_-]{3,100}', args.identity):
    parser.error('Use somente letras sem acento, números, hífen e sublinhado na identificação.')
root = Path(__file__).resolve().parents[1]
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
files = [name for name in tracked if name and (root / name).is_file()]
for required in ['README.md', 'Video/demonstracao-narrada.mp4', 'docs/evidencias-ia/ETAPA-6.md']:
    if required not in files:
        parser.error('Primeiro prepare e adicione ao Git todos os artefatos finais: ' + required)
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'x', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for name in files:
        path = Path(name)
        if any(part in {'.git', 'node_modules', 'dist', 'coverage', '__pycache__'} for part in path.parts):
            continue
        if path.name.startswith('.env') and path.name != '.env.example':
            continue
        if path.name == '.demo-access.json':
            continue
        if name.startswith('Video/'):
            destination = args.identity + '/' + name
        elif name.startswith('docs/'):
            if path.suffix not in {'.md', '.html', '.json', '.png'}:
                continue
            destination = args.identity + '/Documentation/' + name
        elif name in {'README.md', 'PREVIA.html', 'APRESENTACAO.html'}:
            # A raiz mantém a apresentação e aponta os documentos para Documentation.
            content = (root / name).read_text()
            if name == 'README.md':
                content = 'Código executável: `Code/estudo-em-dia/`. Execute os comandos npm nessa pasta.\n\n' + content
                content = content.replace('(docs/', '(Documentation/docs/').replace('](.env.example)', '](Code/estudo-em-dia/.env.example)')
            else:
                content = content.replace('href="docs/', 'href="Documentation/docs/').replace('src="docs/', 'src="Documentation/docs/').replace('poster="docs/', 'poster="Documentation/docs/')
            archive.writestr(args.identity + '/' + name, content)
            if name == 'README.md':
                documentation = (root / name).read_text().replace('](.env.example)', '](../Code/estudo-em-dia/.env.example)')
                archive.writestr(args.identity + '/Documentation/README.md', documentation)
            continue
        else:
            destination = args.identity + '/Code/estudo-em-dia/' + name
        archive.write(root / name, destination)
    archive.writestr(args.identity + '/Documentation/COMO_EXECUTAR.txt',
        'O código executável está em ../Code/estudo-em-dia.\n'
        'Abra um terminal nessa pasta e siga os comandos npm do README na raiz do pacote.\n'
        'Abra ../APRESENTACAO.html para assistir ao vídeo offline.\n'
        'Este pacote não equivale a envio de formulário ou hospedagem pública.\n')
    archive.writestr(args.identity + '/links.txt',
        'Código: https://github.com/joaosampaio22/bootcamp\n'
        'Aplicação: execução local, conforme README. Não há URL de deploy público nesta entrega.\n'
        'Vídeo: Video/demonstracao-narrada.mp4\n')
with ZipFile(args.output) as archive:
    if archive.testzip() is not None:
        raise RuntimeError('ZIP não passou na validação de integridade.')
print('Pacote técnico criado e conferido. Revise identificação, acesso e exigências do formulário antes de submeter.')
