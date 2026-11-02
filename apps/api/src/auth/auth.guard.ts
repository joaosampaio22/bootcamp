import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { AUTH_SETTINGS } from './auth-settings.js';
import type { AuthSettings } from './auth-settings.js';
import type { SessionIdentity } from './session-token.js';
import { assertCsrfToken } from './request-security.js';

export type AuthenticatedRequest = Request & {
  auth: SessionIdentity;
  user: Awaited<ReturnType<AuthService['authenticate']>>['user'];
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const matches = (req.headers.cookie ?? '').split(';').map((v) => v.trim()).filter((v) => v.startsWith(this.settings.cookieName + '='));
    if (matches.length !== 1) throw new UnauthorizedException('Entre para continuar.');
    const token = matches[0]!.slice(this.settings.cookieName.length + 1);
    const result = await this.auth.authenticate(token);
    req.auth = result.identity;
    req.user = result.user;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertCsrfToken(req.headers['x-csrf-token'], result.identity.csrfToken);
    return true;
  }
}
