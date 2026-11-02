import { describe, expect, it } from '@jest/globals';
import { readEnvironment } from './environment.js';

const base = { DATABASE_URL: 'postgresql://local:fixture@127.0.0.1:5432/estudo_em_dia' };

describe('configuração do ambiente', () => {
  it('lê configurações locais e normaliza a origem', () => {
    expect(readEnvironment({ ...base, FRONTEND_ORIGIN: 'http://localhost:5173/' })).toEqual({
      databaseUrl: base.DATABASE_URL,
      frontendOrigin: 'http://localhost:5173',
      host: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development'
    });
  });

  it.each(['', 'https://example.test/database', 'postgresql://localhost'])('rejeita DATABASE_URL inválida: %s', (value) => {
    expect(() => readEnvironment({ ...base, DATABASE_URL: value })).toThrow('DATABASE_URL');
  });

  it.each(['0', '65536', '3000abc', '3.5', ''])('rejeita PORT inválida: %s', (value) => {
    expect(() => readEnvironment({ ...base, PORT: value })).toThrow('PORT');
  });

  it.each(['*', 'https://example.test/app', 'https://user:password@example.test', 'ftp://example.test'])('rejeita origem inválida: %s', (value) => {
    expect(() => readEnvironment({ ...base, FRONTEND_ORIGIN: value })).toThrow('FRONTEND_ORIGIN');
  });

  it('exige HTTPS para origem de produção', () => {
    expect(() => readEnvironment({ ...base, NODE_ENV: 'production' })).toThrow('HTTPS');
    expect(readEnvironment({ ...base, NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://example.test' }).nodeEnv).toBe('production');
  });

  it('rejeita modo de execução desconhecido', () => {
    expect(() => readEnvironment({ ...base, NODE_ENV: 'typo' })).toThrow('NODE_ENV');
  });

  it('não inclui a URL ou a senha na mensagem de validação', () => {
    expect(() => readEnvironment({ DATABASE_URL: 'segredo-que-nao-deve-ser-exibido' })).toThrow(/^DATABASE_URL precisa ser uma URL PostgreSQL válida\.$/);
  });
});
