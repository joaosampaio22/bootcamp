import { UnauthorizedException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_TTL_SECONDS = 3600;
const ISSUER = 'estudo-em-dia';
const AUDIENCE = 'estudo-em-dia-web';

export interface SessionIdentity {
  userId: string;
  sessionId: string;
  csrfToken: string;
}

function validIdentity(value: SessionIdentity): boolean {
  return isUUID(value.userId, '4') && isUUID(value.sessionId, '4') && /^[A-Za-z0-9_-]{43}$/.test(value.csrfToken);
}

// Valida apenas a assinatura/claims. O guard futuro também deve consultar AuthSession.
export class SessionTokenCodec {
  private readonly key: Uint8Array;

  constructor(key: Uint8Array) {
    if (key.byteLength < 32) throw new Error('A chave de sessão precisa de pelo menos 32 bytes aleatórios.');
    this.key = Uint8Array.from(key);
  }

  async issue(identity: SessionIdentity, now: Date): Promise<string> {
    if (!validIdentity(identity) || !Number.isFinite(now.getTime())) throw new Error('Identidade ou instante de sessão inválido.');
    const seconds = Math.floor(now.getTime() / 1000);
    return new SignJWT({ csrf: identity.csrfToken })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(identity.userId).setJti(identity.sessionId)
      .setIssuer(ISSUER).setAudience(AUDIENCE)
      .setIssuedAt(seconds).setNotBefore(seconds).setExpirationTime(seconds + SESSION_TTL_SECONDS)
      .sign(this.key);
  }

  async verify(token: string, now: Date): Promise<SessionIdentity> {
    try {
      if (token.length > 4096 || !Number.isFinite(now.getTime())) throw new Error('Token inválido.');
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ['HS256'], typ: 'JWT', issuer: ISSUER, audience: AUDIENCE,
        currentDate: now, requiredClaims: ['sub', 'jti', 'iat', 'nbf', 'exp', 'csrf']
      });
      if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string' || typeof payload.csrf !== 'string') {
        throw new Error('Claims inválidas.');
      }
      const identity = { userId: payload.sub, sessionId: payload.jti, csrfToken: payload.csrf };
      if (!validIdentity(identity) || typeof payload.iat !== 'number' || typeof payload.exp !== 'number' ||
          payload.exp - payload.iat !== SESSION_TTL_SECONDS) throw new Error('Claims inválidas.');
      return identity;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
  }
}
