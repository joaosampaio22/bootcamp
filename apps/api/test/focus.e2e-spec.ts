import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { configureApplication } from '../src/common/configure-application.js';
import { ClockService } from '../src/common/clock.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { RewardsService } from '../src/rewards/rewards.service.js';

interface Account { id: string; email: string; cookie: string; csrf: string }
describe('foco transacional / TF-01–15 / PostgreSQL real', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let origin: string;
  let alice: Account;
  let bob: Account;
  let ownSubject: string;
  let foreignSubject: string;
  let now = Date.parse('2026-11-02T12:00:00Z');
  const emails = [`focus-a-${randomUUID()}@example.test`, `focus-b-${randomUUID()}@example.test`];
  const password = 'Senha fictícia dos testes de foco';
  const server = () => app.getHttpServer();
  const tick = (seconds: number) => { now += seconds * 1000; };
  const account = (r: request.Response, email: string): Account => ({ id: r.body.user.id, email, cookie: (r.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!, csrf: r.body.csrfToken });
  const post = (path: string, body: object, who = alice, key?: string) => {
    const req = request(server()).post('/api/v1' + path).set('Origin', origin).set('Cookie', who.cookie).set('X-CSRF-Token', who.csrf);
    if (key) req.set('Idempotency-Key', key);
    return req.send(body);
  };
  const active = (who = alice) => request(server()).get('/api/v1/focus-sessions/active').set('Cookie', who.cookie);
  async function login(who: Account) { return account(await request(server()).post('/api/v1/auth/login').set('Origin', origin).send({ email: who.email, password }).expect(200), who.email); }
  async function clear(ids: string[]) {
    await prisma.focusAction.deleteMany({ where: { userId: { in: ids } } });
    await prisma.focusTransition.deleteMany({ where: { userId: { in: ids } } });
    await prisma.rewardEvent.deleteMany({ where: { userId: { in: ids } } });
    await prisma.focusSession.deleteMany({ where: { userId: { in: ids } } });
  }
  async function start(minutes = 25) { return (await post('/focus-sessions', { plannedMinutes: minutes }).expect(201)).body; }
  async function complete(minutes: number) {
    const session = await start(minutes); tick(minutes * 60); alice = await login(alice);
    return post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, randomUUID()).expect(200);
  }

  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test') || process.env.NODE_ENV !== 'test') throw new Error('Banco de testes isolado obrigatório.');
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ClockService).useValue({ now: () => new Date(now) }).compile();
    app = module.createNestApplication(); origin = app.get<Environment>(ENVIRONMENT).frontendOrigin;
    configureApplication(app, app.get<Environment>(ENVIRONMENT)); await app.init(); prisma = app.get(PrismaService);
    alice = account(await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Foco A fictício', email: emails[0], password }).expect(201), emails[0]!);
    bob = account(await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Foco B fictício', email: emails[1], password }).expect(201), emails[1]!);
    ownSubject = (await post('/subjects', { name: 'Conteúdo livre' }).expect(201)).body.id;
    foreignSubject = (await post('/subjects', { name: 'Outra conta' }, bob).expect(201)).body.id;
  });
  beforeEach(async () => {
    tick(86400); await clear([alice.id, bob.id]); alice = await login(alice); bob = await login(bob);
  });
  afterEach(() => { jest.restoreAllMocks(); });
  afterAll(async () => {
    if (prisma) {
      const ids = (await prisma.user.findMany({ where: { emailNormalized: { in: emails } }, select: { id: true } })).map((u) => u.id);
      await clear(ids); await prisma.subject.deleteMany({ where: { userId: { in: ids } } });
      await prisma.authSession.deleteMany({ where: { userId: { in: ids } } }); await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  });

  it('TF-01/10: foco avulso de 25 minutos é recuperado, concluído e auditável', async () => {
    const session = await start(); tick(600);
    expect((await active().expect(200)).body).toMatchObject({ id: session.id, status: 'RUNNING', activeSeconds: 0 });
    tick(900);
    const result = await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED', expectedVersion: 1 }, alice, randomUUID()).expect(200);
    expect(result.body).toMatchObject({ activeSeconds: 1500, status: 'COMPLETED', xpGranted: 25, totalXp: 25, subjectId: null });
    expect((await active().expect(200)).body).toBeNull();
    const history = await request(server()).get('/api/v1/focus-sessions').set('Cookie', alice.cookie).expect(200);
    expect(history.body.items[0].reward).toMatchObject({ sourceId: session.id, sourceType: 'FOCUS_SESSION', xp: 25 });
    expect(await prisma.focusTransition.count({ where: { sessionId: session.id } })).toBe(2);
  });

  it('TF-02: pausa não conta e versões antigas não alteram a sessão', async () => {
    const session = await start(); tick(300);
    await post(`/focus-sessions/${session.id}/pause`, { expectedVersion: 1 }).expect(200); tick(120);
    expect((await active().expect(200)).body).toMatchObject({ status: 'PAUSED', activeSeconds: 300, activeStartedAt: null });
    await post(`/focus-sessions/${session.id}/resume`, { expectedVersion: 1 }).expect(409);
    await post(`/focus-sessions/${session.id}/resume`, { expectedVersion: 2 }).expect(200); tick(300);
    const result = await post(`/focus-sessions/${session.id}/finish`, { outcome: 'INTERRUPTED' }, alice, randomUUID()).expect(200);
    expect(result.body).toMatchObject({ activeSeconds: 600, xpGranted: 10 });
    expect(await prisma.focusTransition.count({ where: { sessionId: session.id } })).toBe(4);
  });

  it.each([[240,0],[720,12]])('TF-03/04: interromper com %i segundos concede %i XP', async (seconds, xp) => {
    const session = await start(); tick(seconds);
    expect((await post(`/focus-sessions/${session.id}/finish`, { outcome: 'INTERRUPTED' }, alice, randomUUID()).expect(200)).body).toMatchObject({ activeSeconds: seconds, xpGranted: xp });
  });

  it('TF-05/11: foco de 90 minutos sobrevive ao login expirado e limita recompensa a 60', async () => {
    const session = await start(90); tick(5400);
    await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, randomUUID()).expect(401);
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(0);
    alice = await login(alice);
    expect((await active().expect(200)).body.id).toBe(session.id);
    const result = await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, randomUUID()).expect(200);
    expect(result.body).toMatchObject({ activeSeconds: 5400, xpGranted: 60 });
  });

  it('TF-06: teto diário não apaga tempo de estudo; um novo dia volta a pontuar', async () => {
    for (let i = 0; i < 3; i++) expect((await complete(60)).body.xpGranted).toBe(60);
    const result = await complete(25);
    expect(result.body).toMatchObject({ activeSeconds: 1500, xpGranted: 0, totalXp: 180 });
    tick(86400); alice = await login(alice);
    expect((await complete(10)).body).toMatchObject({ xpGranted: 10, totalXp: 190 });
  });

  it('TF-11: logout não encerra nem recompensa o foco; novo login recupera a sessão', async () => {
    const session = await start(); tick(120);
    await post('/auth/logout', {}).expect(204);
    await active().expect(401);
    expect((await prisma.focusSession.findUniqueOrThrow({ where: { id: session.id } })).status).toBe('RUNNING');
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(0);
    alice = await login(alice);
    expect((await active().expect(200)).body).toMatchObject({ id: session.id, status: 'RUNNING' });
  });

  it('TF-07/09: finalizações concorrentes com a mesma chave devolvem a mesma resposta', async () => {
    const session = await start(); tick(1500); const key = randomUUID();
    const responses = await Promise.all([1,2].map(() => post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED', expectedVersion: 1 }, alice, key)));
    expect(responses.map((r) => r.status)).toEqual([200,200]); expect(responses[0]!.body).toEqual(responses[1]!.body);
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(1);
    await post(`/focus-sessions/${session.id}/finish`, { outcome: 'INTERRUPTED' }, alice, key).expect(409);
    await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, randomUUID()).expect(409);
    await post(`/focus-sessions/${session.id}/pause`, {}).expect(409);
    expect(await prisma.focusTransition.count({ where: { sessionId: session.id, toStatus: 'COMPLETED' } })).toBe(1);
    await complete(5);
    const oldReceipt = await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED', expectedVersion: 1 }, alice, key).expect(200);
    expect(oldReceipt.body).toEqual(responses[0]!.body);
  });

  it('chaves diferentes em corrida também concedem XP uma única vez', async () => {
    const session = await start(); tick(300);
    const results = await Promise.all([1,2].map(() => post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, randomUUID())));
    expect(results.map((r) => r.status).sort()).toEqual([200,409]);
    expect((await prisma.rewardEvent.aggregate({ where: { userId: alice.id }, _sum: { xp: true } }))._sum.xp).toBe(5);
  });

  it('TF-08: duas abas iniciando criam somente uma sessão aberta', async () => {
    const results = await Promise.all([1,2].map(() => post('/focus-sessions', { plannedMinutes: 25 })));
    expect(results.map((r) => r.status).sort()).toEqual([201,409]);
    expect(await prisma.focusSession.count({ where: { userId: alice.id } })).toBe(1);
    expect(results.find((r) => r.status === 409)!.body.error.details.session.status).toBe('RUNNING');
    await expect(prisma.focusSession.create({ data: { userId: alice.id, plannedSeconds: 300, startedAt: new Date(now), activeStartedAt: new Date(now) } })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('TF-12/13: excesso exige confirmação, não pontua e limita tempo autodeclarado', async () => {
    const session = await start(5); tick(1201);
    const finish = await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, randomUUID()).expect(409);
    expect(finish.body.error.details.session.status).toBe('NEEDS_RECONCILIATION');
    expect((await prisma.focusSession.findUniqueOrThrow({ where: { id: session.id } })).status).toBe('NEEDS_RECONCILIATION');
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(0);
    await post('/focus-sessions', { plannedMinutes: 10 }).expect(409);
    await post(`/focus-sessions/${session.id}/reconcile`, { outcome: 'INTERRUPTED', confirmedActiveSeconds: -1 }, alice, randomUUID()).expect(400);
    await post(`/focus-sessions/${session.id}/reconcile`, { outcome: 'INTERRUPTED', confirmedActiveSeconds: 301 }, alice, randomUUID()).expect(422);
    const key = randomUUID(); const body = { outcome: 'INTERRUPTED', confirmedActiveSeconds: 300 };
    const first = await post(`/focus-sessions/${session.id}/reconcile`, body, alice, key).expect(200);
    const retry = await post(`/focus-sessions/${session.id}/reconcile`, body, alice, key).expect(200);
    expect(first.body).toEqual(retry.body); expect(first.body).toMatchObject({ activeSeconds: 300, xpGranted: 5 });
  });

  it('descartar sessão pendente registra decisão sem evento de recompensa', async () => {
    const session = await start(5); tick(1201); await active().expect(200);
    const result = await post(`/focus-sessions/${session.id}/reconcile`, { outcome: 'DISCARDED' }, alice, randomUUID()).expect(200);
    expect(result.body).toMatchObject({ status: 'DISCARDED', activeSeconds: 0, xpGranted: 0, totalXp: 0 });
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(0);
  });

  it('pausas longas não geram abandono; a carência considera todos os segmentos ativos', async () => {
    const session = await start(5); tick(600); await post(`/focus-sessions/${session.id}/pause`, {}).expect(200);
    tick(86400); alice = await login(alice);
    expect((await active().expect(200)).body.status).toBe('PAUSED');
    await post(`/focus-sessions/${session.id}/resume`, {}).expect(200); tick(601);
    expect((await active().expect(200)).body.status).toBe('NEEDS_RECONCILIATION');
  });

  it('TF-14/15: rejeita tempo, XP, relógio e identidade forjados no cliente', async () => {
    await post('/focus-sessions', { plannedMinutes: 4 }).expect(400);
    await post('/focus-sessions', { plannedMinutes: 121 }).expect(400);
    await post('/focus-sessions', { plannedMinutes: 10, userId: bob.id }).expect(400);
    const session = await start();
    for (const extra of [{ xp: 999 }, { activeSeconds: 1500 }, { serverNow: '2030-01-01' }]) {
      await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED', ...extra }, alice, randomUUID()).expect(400);
    }
    await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }).expect(400);
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(0);
  });

  it('isola sessão, histórico e associações entre contas; vínculo arquivado é rejeitado', async () => {
    await post('/focus-sessions', { plannedMinutes: 25, subjectId: foreignSubject }).expect(404);
    await request(server()).patch('/api/v1/subjects/' + ownSubject).set('Origin', origin).set('Cookie', alice.cookie).set('X-CSRF-Token', alice.csrf).send({ archived: true }).expect(200);
    await post('/focus-sessions', { plannedMinutes: 25, subjectId: ownSubject }).expect(404);
    await request(server()).patch('/api/v1/subjects/' + ownSubject).set('Origin', origin).set('Cookie', alice.cookie).set('X-CSRF-Token', alice.csrf).send({ archived: false }).expect(200);
    const session = (await post('/focus-sessions', { plannedMinutes: 25, subjectId: ownSubject, contentId: null }).expect(201)).body;
    await post(`/focus-sessions/${session.id}/pause`, {}, bob).expect(404);
    await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, bob, randomUUID()).expect(404);
    expect((await request(server()).get('/api/v1/focus-sessions').set('Cookie', bob.cookie).expect(200)).body).toMatchObject({ items: [], totalXp: 0 });
    await request(server()).post('/api/v1/focus-sessions').set('Origin', origin).set('Cookie', alice.cookie).send({ plannedMinutes: 25 }).expect(403);
  });

  it('falha após criar recompensa faz rollback de XP, sessão, transição e receipt', async () => {
    const session = await start(); tick(300); const key = randomUUID();
    const reward = app.get(RewardsService);
    const spy = jest.spyOn(reward, 'total').mockRejectedValueOnce(new Error('falha controlada'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, key).expect(500);
    spy.mockRestore();
    expect((await prisma.focusSession.findUniqueOrThrow({ where: { id: session.id } })).status).toBe('RUNNING');
    expect(await prisma.focusAction.count({ where: { sessionId: session.id } })).toBe(0);
    expect(await prisma.rewardEvent.count({ where: { userId: alice.id } })).toBe(0);
    expect(await prisma.focusTransition.count({ where: { sessionId: session.id } })).toBe(1);
    expect((await post(`/focus-sessions/${session.id}/finish`, { outcome: 'COMPLETED' }, alice, key).expect(200)).body.xpGranted).toBe(5);
  });

  it('limite diário usa a data local do evento, não o dia UTC', async () => {
    now = Date.parse('2026-11-20T02:40:00Z'); alice = await login(alice);
    await complete(10);
    const event = await prisma.rewardEvent.findFirstOrThrow({ where: { userId: alice.id } });
    expect(event.localDate.toISOString().slice(0,10)).toBe('2026-11-19');
  });
});
