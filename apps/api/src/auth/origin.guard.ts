import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ENVIRONMENT } from '../common/environment.js';
import type { Environment } from '../common/environment.js';
import { assertTrustedOrigin } from './request-security.js';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(@Inject(ENVIRONMENT) private readonly environment: Environment) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertTrustedOrigin(req.headers, this.environment.frontendOrigin);
    return true;
  }
}
