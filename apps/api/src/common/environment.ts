import { Global, Module } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

export const ENVIRONMENT = Symbol('ENVIRONMENT');

export interface Environment {
  databaseUrl: string;
  frontendOrigin: string;
  host: string;
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
}

export function readEnvironment(input: NodeJS.ProcessEnv): Environment {
  let database: URL;
  try {
    database = new URL(input.DATABASE_URL ?? '');
  } catch {
    throw new Error('DATABASE_URL precisa ser uma URL PostgreSQL válida.');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || !database.hostname || database.pathname.length <= 1) {
    throw new Error('DATABASE_URL precisa ser uma URL PostgreSQL válida.');
  }

  const portText = input.PORT ?? '3000';
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT precisa ser um inteiro entre 1 e 65535.');
  }

  const nodeEnv = input.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV inválido.');
  }

  let origin: URL;
  try {
    origin = new URL(input.FRONTEND_ORIGIN ?? 'http://localhost:5173');
  } catch {
    throw new Error('FRONTEND_ORIGIN precisa ser uma única origem HTTP(S).');
  }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('FRONTEND_ORIGIN precisa ser uma única origem HTTP(S).');
  }
  if (nodeEnv === 'production' && origin.protocol !== 'https:') {
    throw new Error('FRONTEND_ORIGIN precisa usar HTTPS em produção.');
  }

  return {
    databaseUrl: input.DATABASE_URL!,
    frontendOrigin: origin.origin,
    host: input.API_HOST ?? '127.0.0.1',
    port,
    nodeEnv
  };
}

@Global()
@Module({
  providers: [{
    provide: ENVIRONMENT,
    useFactory: () => {
      const envPath = fileURLToPath(new URL('../../../../.env', import.meta.url));
      if (existsSync(envPath)) loadEnvFile(envPath);
      return readEnvironment(process.env);
    }
  }],
  exports: [ENVIRONMENT]
})
export class EnvironmentModule {}
