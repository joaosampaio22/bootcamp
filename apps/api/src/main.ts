import 'reflect-metadata';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApplication } from './common/configure-application.js';
import { ENVIRONMENT } from './common/environment.js';
import type { Environment } from './common/environment.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ json: true }),
    bodyParser: false,
    abortOnError: false
  });
  const environment = app.get<Environment>(ENVIRONMENT);
  configureApplication(app, environment);
  app.useBodyParser('json', { limit: '32kb' });
  app.enableShutdownHooks();
  await app.listen(environment.port, environment.host);
}

bootstrap().catch(() => {
  new Logger('Bootstrap').error('Não foi possível iniciar a API. Confira as variáveis e a disponibilidade do PostgreSQL.');
  process.exitCode = 1;
});
