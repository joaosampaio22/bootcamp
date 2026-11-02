import { describe, expect, it } from '@jest/globals';
import { randomBytes, randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import { SessionTokenCodec, SESSION_TTL_SECONDS } from './session-token.js';

describe('assinatura da sessão com relógio explícito', () => {
  const key = randomBytes(32);
  const codec = new SessionTokenCodec(key);
  const now = new Date('2026-11-02T12:00:00Z');
  const identity = { userId: randomUUID(), sessionId: randomUUID(), csrfToken: randomBytes(32).toString('base64url') };

  it('preserva identidade e token CSRF, sem incluir senha ou notas', async () => {
    const token = await codec.issue(identity, now);
    await expect(codec.verify(token, now)).resolves.toEqual(identity);
    const body = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    expect(Object.keys(body).sort()).toEqual(['aud', 'csrf', 'exp', 'iat', 'iss', 'jti', 'nbf', 'sub']);
  });

  it('expira exatamente no limite, sem esperar tempo real', async () => {
    const token = await codec.issue(identity, now);
    await expect(codec.verify(token, new Date(now.getTime() + SESSION_TTL_SECONDS * 1000 - 1))).resolves.toEqual(identity);
    await expect(codec.verify(token, new Date(now.getTime() + SESSION_TTL_SECONDS * 1000))).rejects.toThrow('Sessão inválida ou expirada.');
  });

  it('recusa token emitido no futuro', async () => {
    const token = await codec.issue(identity, now);
    await expect(codec.verify(token, new Date(now.getTime() - 1000))).rejects.toThrow('Sessão inválida ou expirada.');
  });

  it('recusa outra chave e payload adulterado', async () => {
    const token = await codec.issue(identity, now);
    await expect(new SessionTokenCodec(randomBytes(32)).verify(token, now)).rejects.toThrow('Sessão inválida ou expirada.');
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: randomUUID() })).toString('base64url');
    await expect(codec.verify(parts.join('.'), now)).rejects.toThrow('Sessão inválida ou expirada.');
  });

  it('recusa token assinado que não contém os claims exigidos', async () => {
    const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).sign(key);
    await expect(codec.verify(token, now)).rejects.toThrow('Sessão inválida ou expirada.');
  });

  it('recusa identidade inválida e chave curta', async () => {
    expect(() => new SessionTokenCodec(new Uint8Array(31))).toThrow('32 bytes');
    await expect(codec.issue({ ...identity, userId: 'inexistente' }, now)).rejects.toThrow('Identidade');
  });
});
