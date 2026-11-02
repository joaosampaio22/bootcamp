import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// O .env compartilhado pode manter a API em desenvolvimento; a SPA compilada
// sempre deve usar os runtimes de produção do React e do roteador.
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build'], {
  cwd: fileURLToPath(new URL('../apps/web/', import.meta.url)),
  env: { ...process.env, NODE_ENV: 'production' }, stdio: 'inherit'
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
