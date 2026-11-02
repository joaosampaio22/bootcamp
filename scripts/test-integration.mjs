import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireTestDatabase } from './test-database.mjs';
import { randomBytes } from 'node:crypto';

let testUrl;
try {
  testUrl = requireTestDatabase(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const root = fileURLToPath(new URL('../', import.meta.url));
for (const script of ['db:migrate', 'test:integration']) {
  const result = spawnSync('npm', ['run', script, '--workspace', '@estudo-em-dia/api'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test', JWT_SECRET: randomBytes(32).toString('hex'), COOKIE_SECURE: 'false' }
  });
  if (result.error) {
    console.error('Não foi possível executar o npm. Confira sua instalação.');
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
