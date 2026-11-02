import { describe, expect, it } from '@jest/globals';
import { PasswordService } from './password.service.js';

describe('PasswordService / RN-002', () => {
  const service = new PasswordService();
  const password = 'senha fictícia para testes';

  it('gera Argon2id com salt independente e verifica sem aceitar senha incorreta', async () => {
    const first = await service.hash(password);
    const second = await service.hash(password);
    expect(first).toMatch(/^\$argon2id\$v=19\$/);
    expect(first.split('$')[3]!.split(',').sort()).toEqual(['m=65536', 'p=1', 't=3']);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    await expect(service.verify(first, password)).resolves.toBe(true);
    await expect(service.verify(first, 'outra senha fictícia')).resolves.toBe(false);
  });

  it.each(['', 'curta', 'x'.repeat(129)])('recusa senha de cadastro fora dos limites', async (value) => {
    await expect(service.hash(value)).rejects.toThrow('entre 12 e 128');
  });

  it('não propaga hash malformado nem processa senha excessiva', async () => {
    await expect(service.verify('hash-inválido', password)).resolves.toBe(false);
    await expect(service.verify('hash-inválido', 'x'.repeat(129))).resolves.toBe(false);
  });
});
