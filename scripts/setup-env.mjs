import { randomBytes } from 'node:crypto';
import { appendFile, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const example = await readFile(new URL('.env.example', root), 'utf8');
const content = example.replaceAll('CHANGE_ME_LOCAL_PASSWORD', randomBytes(32).toString('hex'))
  .replaceAll('CHANGE_ME_SESSION_SECRET', randomBytes(32).toString('hex'));

try {
  await writeFile(new URL('.env', root), content, { flag: 'wx', mode: 0o600 });
  console.log('.env local criado com senha aleatória. Nenhum segredo foi exibido.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  const existing = await readFile(new URL('.env', root), 'utf8');
  if (!/^\s*JWT_SECRET\s*=/m.test(existing)) {
    await appendFile(new URL('.env', root), '\nJWT_SECRET=' + randomBytes(32).toString('hex') + '\n');
    console.log('Chave de sessão adicionada; demais variáveis preservadas.');
  }
  console.log('.env já existe e foi preservado. Confira as variáveis em .env.example.');
}
