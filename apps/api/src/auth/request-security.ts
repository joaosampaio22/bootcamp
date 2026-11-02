import { ForbiddenException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

interface OriginHeaders {
  origin?: string | string[];
  referer?: string | string[];
}

export function assertTrustedOrigin(headers: OriginHeaders, trustedOrigin: string): void {
  let origin: string | undefined;
  if (headers.origin !== undefined) {
    if (typeof headers.origin === 'string') origin = headers.origin;
  } else if (typeof headers.referer === 'string') {
    try { origin = new URL(headers.referer).origin; } catch { /* Rejeitar abaixo. */ }
  }
  if (origin !== trustedOrigin) throw new ForbiddenException('Origem da solicitação não permitida.');
}

export function assertCsrfToken(received: string | string[] | undefined, expected: string): void {
  if (typeof received !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(received) ||
      !/^[A-Za-z0-9_-]{43}$/.test(expected) || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    throw new ForbiddenException('Token de segurança inválido. Atualize a página e tente novamente.');
  }
}
