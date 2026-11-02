import { describe, expect, it } from '@jest/globals';
import { readEnvironment } from '../common/environment.js';
import { readAuthSettings } from './auth-settings.js';

describe('configuração dos cookies e da chave de sessão', () => {
  const local = readEnvironment({ DATABASE_URL: 'postgresql://localhost/fixture' });
  const production = { ...local, nodeEnv: 'production' as const, frontendOrigin: 'https://estudo.example' };
  const key = 'a'.repeat(64);

  it('produção usa prefixo __Host e exige Secure', () => {
    expect(readAuthSettings({ JWT_SECRET: key }, production)).toMatchObject({ secure: true, cookieName: '__Host-estudo_session' });
    expect(() => readAuthSettings({ JWT_SECRET: key, COOKIE_SECURE: 'false' }, production)).toThrow('obrigatórios');
  });
  it('desenvolvimento local permite cookie HTTP sem usar prefixo reservado', () => {
    expect(readAuthSettings({ JWT_SECRET: key }, local)).toMatchObject({ secure: false, cookieName: 'estudo_session' });
  });
  it.each([{}, { JWT_SECRET: 'curta' }, { JWT_SECRET: 'z'.repeat(64) }])('recusa chave ausente ou fora do formato', (input) => {
    expect(() => readAuthSettings(input, local)).toThrow('JWT_SECRET');
  });
  it('não aceita valor ambíguo para COOKIE_SECURE', () => {
    expect(() => readAuthSettings({ JWT_SECRET: key, COOKIE_SECURE: 'yes' }, local)).toThrow('COOKIE_SECURE');
  });
});
