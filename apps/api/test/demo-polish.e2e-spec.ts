import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/common/configure-application.js';
import { configureRequestBody } from '../src/common/request-body.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/auth/password.service.js';
import { seedDemo } from '../src/demo/demo-seed.js';

describe('seed fictícia e polimento / PostgreSQL real',() => {
  let app: NestExpressApplication; let db: PrismaService; let origin: string; let passwordHash: string;
  const password = 'Senha fictícia para testar a seed';
  const emails = [`demo-seed-${randomUUID()}@example.test`,`demo-other-${randomUUID()}@example.test`,`demo-race-${randomUUID()}@example.test`];
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test') || process.env.NODE_ENV !== 'test') throw new Error('Banco isolado obrigatório.');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
    origin = app.get<Environment>(ENVIRONMENT).frontendOrigin; configureApplication(app,app.get<Environment>(ENVIRONMENT)); configureRequestBody(app);
    await app.init(); db = app.get(PrismaService); passwordHash = await app.get(PasswordService).hash(password);
  });
  afterAll(async () => {
    if (db) {
      const ids = (await db.user.findMany({ where: { emailNormalized: { in: emails } }, select: { id: true } })).map((u) => u.id);
      const where = { userId: { in: ids } };
      await db.focusAction.deleteMany({ where }); await db.focusTransition.deleteMany({ where }); await db.rewardEvent.deleteMany({ where }); await db.focusSession.deleteMany({ where });
      await db.returnPoint.deleteMany({ where }); await db.reviewAttempt.deleteMany({ where }); await db.reviewSchedule.deleteMany({ where }); await db.studyContent.deleteMany({ where }); await db.subject.deleteMany({ where }); await db.authSession.deleteMany({ where }); await db.user.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  });
  it('seed idempotente cria dados coerentes e não repõe XP ou duplica progresso ao repetir',async () => {
    const first = await seedDemo(db,emails[0]!,passwordHash,new Date());
    expect(first.created).toBe(true);
    const where = { userId: first.id };
    expect(await db.subject.count({ where })).toBe(2); expect(await db.studyContent.count({ where })).toBe(2); expect(await db.returnPoint.count({ where })).toBe(1);
    expect(await db.reviewSchedule.count({ where })).toBe(2); expect(await db.focusSession.count({ where })).toBe(2);
    expect((await db.rewardEvent.aggregate({ where, _sum: { xp: true } }))._sum.xp).toBe(95);
    await db.returnPoint.updateMany({ where, data: { nextAction: 'Minha edição preservada' } });
    const again = await seedDemo(db,emails[0]!,passwordHash,new Date(Date.now() + 86400000));
    expect(again).toEqual({ id: first.id, created: false });
    expect((await db.returnPoint.findFirstOrThrow({ where })).nextAction).toBe('Minha edição preservada');
    expect(await db.rewardEvent.count({ where })).toBe(2);
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').set('Origin',origin).send({ email: emails[0], password }).expect(200);
    expect(login.body.user.isDemo).toBe(true);
  });
  it('seed recusa conta comum e não modifica seus dados',async () => {
    const ordinary = await db.user.create({ data: { name: 'Pessoa fictícia comum', emailNormalized: emails[1]!, passwordHash } });
    await expect(seedDemo(db,emails[1]!,passwordHash,new Date())).rejects.toThrow('não é de demonstração');
    expect(await db.user.findUniqueOrThrow({ where: { id: ordinary.id } })).toEqual(ordinary);
    expect(await db.subject.count({ where: { userId: ordinary.id } })).toBe(0);
  });
  it('duas seeds concorrentes criam uma só demonstração',async () => {
    const results = await Promise.all([1,2].map(() => seedDemo(db,emails[2]!,passwordHash,new Date())));
    expect(results[0]!.id).toBe(results[1]!.id); expect(results.map((r) => r.created).sort()).toEqual([false,true]);
    expect(await db.rewardEvent.count({ where: { userId: results[0]!.id } })).toBe(2);
  });
  it('requisições normais não podem marcar conta como demo e aceitam 10 mil caracteres Unicode nas notas',async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').set('Origin',origin).send({ name: 'Forjada', email: 'forged@example.test', password, isDemo: true }).expect(400);
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').set('Origin',origin).send({ email: emails[0], password }).expect(200);
    const cookie = (login.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;
    const subject = await db.subject.findFirstOrThrow({ where: { userId: login.body.user.id } });
    const notes = '😀'.repeat(10000);
    const response = await request(app.getHttpServer()).post('/api/v1/contents').set('Origin',origin).set('Cookie',cookie).set('X-CSRF-Token',login.body.csrfToken).send({ subjectId: subject.id, title: 'Notas Unicode válidas', notes, reviewEnabled: false }).expect(201);
    expect(response.body.notes).toBe(notes);
    await request(app.getHttpServer()).patch('/api/v1/users/me').set('Origin',origin).set('Cookie',cookie).set('X-CSRF-Token',login.body.csrfToken).send({ isDemo: false }).expect(400);
  });
  it('JSON inválido e corpo excessivo recebem erro estruturado sem refletir o conteúdo enviado',async () => {
    const malformed = await request(app.getHttpServer()).post('/api/v1/auth/login').set('Origin',origin).set('Content-Type','application/json').send('{"password": "texto fictício"').expect(400);
    expect(malformed.body.error).toMatchObject({ message: 'Envie um JSON válido.', requestId: expect.any(String) });
    const tooLarge = await request(app.getHttpServer()).post('/api/v1/auth/login').set('Origin',origin).send({ email: 'x'.repeat(70000) }).expect(413);
    expect(tooLarge.body.error).toMatchObject({ message: 'Os dados enviados excedem o limite de tamanho.', requestId: expect.any(String) });
    expect(tooLarge.headers['cache-control']).toBe('no-store');
  });
});
