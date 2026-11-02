import { HttpException, Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClockService } from '../common/clock.service.js';

@Injectable()
export class AuthRateGuard implements CanActivate {
  private readonly buckets = new Map<string, { count: number; until: number }>();
  constructor(@Inject(ClockService) private readonly clock: ClockService) {}
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const now = this.clock.now().getTime();
    // Não confiar em X-Forwarded-For; Express usa o peer sem trust proxy configurado.
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.until <= now) {
      for (const [ip, entry] of this.buckets) if (entry.until <= now) this.buckets.delete(ip);
      if (this.buckets.size >= 10000) throw new HttpException('Tente novamente em instantes.', 429);
      bucket = { count: 0, until: now + 60000 };
      this.buckets.set(key, bucket);
    }
    if (++bucket.count > 10) {
      http.getResponse<Response>().setHeader('Retry-After', Math.ceil((bucket.until - now) / 1000));
      throw new HttpException('Muitas tentativas. Aguarde um minuto.', 429);
    }
    return true;
  }
}
