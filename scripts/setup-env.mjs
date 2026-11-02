import { randomBytes } from 'node:crypto';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const root = new URL('../', import.meta.url);
const example = await readFile(new URL('.env.example', root), 'utf8');
const content = example.replaceAll('CHANGE_ME_LOCAL_PASSWORD', randomBytes(32).toString('hex'))
  .replaceAll('CHANGE_ME_SESSION_SECRET', randomBytes(32).toString('hex'));
const prepared = content.replaceAll('CHANGE_ME_DEMO_SESSION_SECRET', randomBytes(32).toString('hex'));

try {
  await writeFile(new URL('.env', root), prepared, { flag: 'wx', mode: 0o600 });
  console.log('.env local criado com senha aleatória. Nenhum segredo foi exibido.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  const existing = await readFile(new URL('.env', root), 'utf8');
  if (!/^\s*JWT_SECRET\s*=/m.test(existing)) {
    await appendFile(new URL('.env', root), '\nJWT_SECRET=' + randomBytes(32).toString('hex') + '\n');
    console.log('Chave de sessão adicionada; demais variáveis preservadas.');
  }
  const values = parseEnv(existing);
  const additions = [];
  if (!values.POSTGRES_DEMO_PORT) additions.push('POSTGRES_DEMO_PORT=5434');
  if (!values.DEMO_JWT_SECRET) additions.push('DEMO_JWT_SECRET=' + randomBytes(32).toString('hex'));
  if (!values.DEMO_DATABASE_URL && values.DATABASE_URL) {
    const demoUrl = new URL(values.DATABASE_URL); demoUrl.port = values.POSTGRES_DEMO_PORT || '5434'; demoUrl.pathname = '/estudo_em_dia_demo';
    additions.push('DEMO_DATABASE_URL=' + demoUrl.toString());
  }
  if (additions.length) await appendFile(new URL('.env', root), '\n' + additions.join('\n') + '\n');
  console.log('.env já existe e foi preservado. Confira as variáveis em .env.example.');
}
