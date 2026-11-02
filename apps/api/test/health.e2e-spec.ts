import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/common/configure-application.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API e PostgreSQL reais', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let environment: Environment;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (!decodeURIComponent(url.pathname).endsWith('_test') || process.env.NODE_ENV !== 'test') {
      throw new Error('Execute pela raiz: npm run test:integration (banco isolado obrigatório).');
    }
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    environment = app.get<Environment>(ENVIRONMENT);
    configureApplication(app, environment);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => { if (app) await app.close(); });

  it('GET /api/v1/health verifica banco, contrato, cache e headers', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'estudo-em-dia-api', database: 'up' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('mantém prefixo versionado e erro estruturado sem stack', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(404);
    expect(response.body).toEqual({ error: {
      code: 'NOT_FOUND', message: 'Recurso não encontrado.', details: {}, requestId: response.headers['x-request-id']
    } });
    expect(response.body.error.requestId).toBeTruthy();
  });

  it('permite somente a origem configurada no CORS', async () => {
    const allowed = await request(app.getHttpServer()).get('/api/v1/health').set('Origin', environment.frontendOrigin).expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe(environment.frontendOrigin);
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const other = await request(app.getHttpServer()).get('/api/v1/health').set('Origin', 'https://untrusted.example').expect(200);
    expect(other.headers['access-control-allow-origin']).not.toBe('https://untrusted.example');
  });

  it('sinaliza 503 e não devolve credenciais quando a consulta falha', async () => {
    const query = jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('private-driver-error'));
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      const response = await request(app.getHttpServer()).get('/api/v1/health').expect(503);
      expect(response.body).toEqual({ error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Serviço temporariamente indisponível. Tente novamente.',
        details: {}, requestId: response.headers['x-request-id']
      } });
      expect(JSON.stringify(response.body)).not.toContain('private-driver-error');
      expect(log).toHaveBeenCalledWith(expect.objectContaining({ requestId: response.headers['x-request-id'], status: 503 }));
    } finally { query.mockRestore(); log.mockRestore(); }
  });

  it('migração permite round-trip via Prisma 7 e impõe unicidade de e-mail', async () => {
    const id = randomUUID();
    const email = `migration-${id}@example.test`;
    try {
      const user = await prisma.user.create({ data: { id, name: 'Pessoa fictícia', emailNormalized: email, passwordHash: 'fixture-only-not-a-login' } });
      expect(user.timeZone).toBe('America/Sao_Paulo');
      expect(user.createdAt).toBeInstanceOf(Date);
      const stored = await prisma.user.findUniqueOrThrow({ where: { id } });
      expect(stored.name).toBe('Pessoa fictícia');
      await expect(prisma.user.create({ data: { name: 'Duplicada', emailNormalized: email, passwordHash: 'fixture-only-not-a-login' } })).rejects.toMatchObject({ code: 'P2002' });
      expect(await prisma.user.count({ where: { emailNormalized: email } })).toBe(1);
    } finally { await prisma.user.deleteMany({ where: { emailNormalized: email } }); }
  });
});
