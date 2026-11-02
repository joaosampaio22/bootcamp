import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import helmet from 'helmet';
import type { Environment } from './environment.js';
import { HttpErrorFilter } from './http-error.filter.js';
import type { IdentifiedRequest } from './http-error.filter.js';

export function configureApplication(app: INestApplication, environment: Environment): void {
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use((request: IdentifiedRequest, response: Response, next: NextFunction) => {
    request.requestId = randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    next();
  });
  app.enableCors({ origin: environment.frontendOrigin, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpErrorFilter());
}
