import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, root, ''), ...process.env };
  return {
    plugins: [react(), tailwindcss()],
    envDir: root,
    server: {
      port: 5173,
      strictPort: true,
      fs: { deny: ['.env','.env.*','*.{crt,pem}','**/.git/**','**/.demo-access.json'] },
      proxy: { '/api': { target: `http://127.0.0.1:${env.PORT ?? '3000'}` } }
    },
    preview: {
      port: 4173,
      strictPort: true,
      proxy: { '/api': { target: `http://127.0.0.1:${env.PORT ?? '3000'}` } }
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      clearMocks: true
    }
  };
});
