import type { Environment } from '../common/environment.js';

export const AUTH_SETTINGS = Symbol('AUTH_SETTINGS');
export interface AuthSettings { key: Uint8Array; secure: boolean; cookieName: string }

export function readAuthSettings(input: NodeJS.ProcessEnv, environment: Environment): AuthSettings {
  if (!/^[a-fA-F0-9]{64}$/.test(input.JWT_SECRET ?? '')) {
    throw new Error('JWT_SECRET precisa de 32 bytes aleatórios em hexadecimal. Execute npm run setup:env.');
  }
  if (input.COOKIE_SECURE !== undefined && !['true', 'false'].includes(input.COOKIE_SECURE)) {
    throw new Error('COOKIE_SECURE precisa ser true ou false.');
  }
  const secure = input.COOKIE_SECURE === undefined ? environment.nodeEnv === 'production' : input.COOKIE_SECURE === 'true';
  if (environment.nodeEnv === 'production' && !secure) throw new Error('Cookies seguros são obrigatórios em produção.');
  return { key: Buffer.from(input.JWT_SECRET!, 'hex'), secure, cookieName: secure ? '__Host-estudo_session' : 'estudo_session' };
}
