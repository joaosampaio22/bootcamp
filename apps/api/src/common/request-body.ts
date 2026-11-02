import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

export function configureRequestBody(app: NestExpressApplication) {
  app.useBodyParser('json', { limit: '64kb' });
  app.use((error: unknown, _request: Request, _response: Response, next: NextFunction) => {
    if (typeof error === 'object' && error !== null && 'type' in error) {
      if (error.type === 'entity.too.large') return next(new PayloadTooLargeException('Os dados enviados excedem o limite de tamanho.'));
      if (error.type === 'entity.parse.failed') return next(new BadRequestException('Envie um JSON válido.'));
    }
    next(error);
  });
}
