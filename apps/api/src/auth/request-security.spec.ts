import { describe, expect, it } from '@jest/globals';
import { randomBytes } from 'node:crypto';
import { assertCsrfToken, assertTrustedOrigin } from './request-security.js';

describe('política de Origin e CSRF / TS-06', () => {
  const trusted = 'https://estudo.example';
  it('aceita a origem exata e Referer da mesma origem quando Origin está ausente', () => {
    expect(() => assertTrustedOrigin({ origin: trusted }, trusted)).not.toThrow();
    expect(() => assertTrustedOrigin({ referer: trusted + '/app/subjects' }, trusted)).not.toThrow();
  });

  it.each([
    {}, { origin: 'null' }, { origin: 'https://evil.example' },
    { origin: 'https://estudo.example.evil.example' },
    { origin: ['https://estudo.example', 'https://evil.example'] },
    { origin: 'https://evil.example', referer: trusted + '/app' },
    { referer: 'inválido' }, { referer: 'https://evil.example' }
  ])('recusa origem ausente, múltipla ou não confiável', (headers) => {
    expect(() => assertTrustedOrigin(headers, trusted)).toThrow('Origem');
  });

  it('aceita somente o token CSRF correto e de tamanho limitado', () => {
    const token = randomBytes(32).toString('base64url');
    expect(() => assertCsrfToken(token, token)).not.toThrow();
    for (const invalid of [undefined, '', [token], randomBytes(32).toString('base64url'), 'x'.repeat(10000)]) {
      expect(() => assertCsrfToken(invalid, token)).toThrow('Token de segurança inválido');
    }
  });
});
