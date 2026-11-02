import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ClockService } from '../src/common/clock.service.js';
import { configureApplication } from '../src/common/configure-application.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { localDate } from '../src/focus/focus.rules.js';

interface Account { id: string; email: string; cookie: string; csrf: string }
describe('academia/estatísticas / PostgreSQL real', () => {
  let app: INestApplication; let db: PrismaService; let origin: string; let a: Account; let b: Account;
  let now = Date.parse('2026-11-02T12:00:00Z');
  const emails = [`progress-a-${randomUUID()}@example.test`,`progress-b-${randomUUID()}@example.test`];
  const password = 'Senha fictícia dos testes de progresso';
  const server = () => app.getHttpServer();
  const account = (r: request.Response, email: string): Account => ({ id: r.body.user.id, email, cookie: (r.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!, csrf: r.body.csrfToken });
  const get = (path: string, who = a) => request(server()).get('/api/v1' + path).set('Cookie',who.cookie);
  function write(method: 'post' | 'patch', path: string, body: object, who = a, key?: string) {
    const req = request(server())[method]('/api/v1' + path).set('Origin',origin).set('Cookie',who.cookie).set('X-CSRF-Token',who.csrf);
    if (key) req.set('Idempotency-Key',key); return req.send(body);
  }
  const date = () => localDate(new Date(now),'America/Sao_Paulo').toISOString().slice(0,10);
  const summary = (from = date(), to = from, who = a) => get(`/statistics/summary?from=${from}&to=${to}`,who).expect(200);
  async function login(who: Account) { return account(await request(server()).post('/api/v1/auth/login').set('Origin',origin).send({ email: who.email, password }).expect(200),who.email); }
  async function focus(minutes: number, outcome: 'COMPLETED' | 'INTERRUPTED' = 'COMPLETED', planned = Math.max(minutes,5), who = a) {
    const session = (await write('post','/focus-sessions',{ plannedMinutes: planned },who).expect(201)).body;
    now += minutes * 60000; const current = await login(who); if (who.id === a.id) a = current; else b = current;
    const key = randomUUID(); const body = { outcome, expectedVersion: 1 };
    const result = await write('post',`/focus-sessions/${session.id}/finish`,body,current,key).expect(200);
    return { session, result, key, body };
  }
  async function clear(ids: string[]) {
    const where = { userId: { in: ids } };
    await db.focusAction.deleteMany({ where }); await db.focusTransition.deleteMany({ where }); await db.rewardEvent.deleteMany({ where });
    await db.focusSession.deleteMany({ where }); await db.returnPoint.deleteMany({ where }); await db.reviewAttempt.deleteMany({ where });
    await db.reviewSchedule.deleteMany({ where }); await db.studyContent.deleteMany({ where }); await db.subject.deleteMany({ where });
  }
  async function boot() {
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ClockService).useValue({ now: () => new Date(now) }).compile();
    app = module.createNestApplication(); origin = app.get<Environment>(ENVIRONMENT).frontendOrigin;
    configureApplication(app,app.get<Environment>(ENVIRONMENT)); await app.init(); db = app.get(PrismaService);
  }
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test') || process.env.NODE_ENV !== 'test') throw new Error('Banco isolado obrigatório.');
    await boot();
    a = account(await request(server()).post('/api/v1/auth/register').set('Origin',origin).send({ name: 'Progresso A fictício', email: emails[0], password }).expect(201),emails[0]!);
    b = account(await request(server()).post('/api/v1/auth/register').set('Origin',origin).send({ name: 'Progresso B fictício', email: emails[1], password }).expect(201),emails[1]!);
  });
  beforeEach(async () => {
    now += 86400000; await clear([a.id,b.id]);
    await db.user.update({ where: { id: a.id }, data: { timeZone: 'America/Sao_Paulo' } });
    // Casos de DST voltam no calendário; isolar o app também isola o rate limit.
    await app.close(); await boot();
    a = await login(a); b = await login(b);
  });
  afterAll(async () => {
    if (db) {
      const ids = (await db.user.findMany({ where: { emailNormalized: { in: emails } }, select: { id: true } })).map((u) => u.id);
      await clear(ids); await db.authSession.deleteMany({ where: { userId: { in: ids } } }); await db.user.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  });
  it('conta nova retorna fundação, zero XP e sete dias vazios, sem criar registros', async () => {
    expect((await get('/academy').expect(200)).body).toMatchObject({ stage: 1, stageName: 'Fundação', totalXp: 0, focusXp: 0, reviewXp: 0, nextStageXp: 100 });
    const stats = (await get('/statistics/summary').expect(200)).body;
    expect(stats.daily).toHaveLength(7); expect(stats.metrics).toEqual({ focusSeconds: 0, finishedSessions: 0, completedSessions: 0, interruptedSessions: 0, reviewCount: 0, daysWithStudy: 0 });
    expect((await get('/academy/events')).body.items).toEqual([]);
    expect(await db.rewardEvent.count({ where: { userId: a.id } })).toBe(0);
  });
  it('XP real cruza 100/350 e continua no estágio III depois de trinta dias sem uso', async () => {
    await focus(60); await focus(35); await focus(5);
    expect((await get('/academy')).body).toMatchObject({ totalXp: 100, stage: 2, nextStageXp: 350 });
    now += 86400000; a = await login(a); for (let i = 0; i < 3; i++) await focus(60);
    now += 86400000; a = await login(a); await focus(60); await focus(10);
    const original = (await get('/academy')).body;
    expect(original).toMatchObject({ totalXp: 350, focusXp: 350, reviewXp: 0, stage: 3, assetUrl: '/academy/stage-3.svg' });
    now += 30 * 86400000; a = await login(a);
    expect((await get('/academy')).body).toEqual(original);
    expect((await summary()).body.metrics.finishedSessions).toBe(0);
  });
  it('estatísticas contam concluídas/interrompidas e tempo curto, excluindo pausa/pendência/descarte', async () => {
    await focus(25); await focus(12,'INTERRUPTED',25); await focus(4,'INTERRUPTED',25);
    const open = (await write('post','/focus-sessions',{ plannedMinutes: 5 }).expect(201)).body;
    now += 300000; await write('post',`/focus-sessions/${open.id}/pause`,{}).expect(200);
    const expected = { focusSeconds: 2460, finishedSessions: 3, completedSessions: 1, interruptedSessions: 2, reviewCount: 0, daysWithStudy: 1 };
    expect((await summary()).body.metrics).toEqual(expected);
    expect((await get('/dashboard')).body.academy).toBeNull();
    await write('post',`/focus-sessions/${open.id}/resume`,{}).expect(200); now += 1201000;
    await get('/focus-sessions/active').expect(200); expect((await summary()).body.metrics).toEqual(expected);
    await write('post',`/focus-sessions/${open.id}/reconcile`,{ outcome: 'DISCARDED' },a,randomUUID()).expect(200);
    expect((await summary()).body.metrics).toEqual(expected);
    expect((await get('/academy')).body.totalXp).toBe(37);
  });
  it('teto de XP não reduz tempo e retry não duplica estatísticas/eventos; extrato pagina origens', async () => {
    for (let i = 0; i < 3; i++) await focus(60);
    const final = await focus(25);
    expect(final.result.body.xpGranted).toBe(0);
    await write('post',`/focus-sessions/${final.session.id}/finish`,final.body,a,final.key).expect(200);
    expect((await summary()).body.metrics).toMatchObject({ focusSeconds: 12300, finishedSessions: 4, daysWithStudy: 1 });
    expect((await get('/academy')).body).toMatchObject({ totalXp: 180, focusXp: 180, reviewXp: 0 });
    const events = (await get('/academy/events?sourceType=FOCUS_SESSION&pageSize=1').expect(200)).body;
    expect(events.total).toBe(4); expect(events.items[0]).toMatchObject({ sourceId: final.session.id, xp: 0, title: 'Foco livre', historyPath: '/app/focus' });
    expect((await get('/academy/events?pageSize=1&page=2')).body.items[0].sourceId).not.toBe(final.session.id);
    expect((await get('/academy/events?sourceType=REVIEW_ATTEMPT')).body.total).toBe(0);
  });
  it('conta revisões reais inclusive além do teto; arquivo preserva XP e histórico', async () => {
    const subject = (await write('post','/subjects',{ name: 'Área livre' }).expect(201)).body.id;
    const contents = [];
    for (let i = 0; i < 11; i++) contents.push((await write('post','/contents',{ subjectId: subject, title: 'Assunto ' + i }).expect(201)).body);
    expect((await summary()).body.metrics.reviewCount).toBe(0);
    now += 86400000; a = await login(a);
    for (const c of contents) await write('post',`/reviews/${c.review.id}/attempts`,{ rating: 'GOOD', expectedVersion: 1 },a,randomUUID()).expect(201);
    expect((await summary()).body.metrics).toMatchObject({ reviewCount: 11, daysWithStudy: 0, focusSeconds: 0 });
    expect((await get('/academy')).body).toMatchObject({ totalXp: 50, reviewXp: 50, focusXp: 0 });
    const events = (await get('/academy/events?sourceType=REVIEW_ATTEMPT')).body;
    expect(events.total).toBe(11); expect(events.items[0].historyPath).toMatch(/^\/app\/reviews\/.*\/history$/);
    await write('patch','/subjects/' + subject,{ archived: true }).expect(200);
    expect((await summary()).body.metrics.reviewCount).toBe(11); expect((await get('/academy')).body.totalXp).toBe(50);
  });
  it('limites inclusivos usam a meia-noite local e agrupamento acompanha o fuso atual', async () => {
    now = Date.parse('2026-11-03T02:54:59Z'); a = await login(a); await focus(5);
    const s = (await write('post','/focus-sessions',{ plannedMinutes: 5 }).expect(201)).body; now += 1000;
    await write('post',`/focus-sessions/${s.id}/finish`,{ outcome: 'INTERRUPTED' },a,randomUUID()).expect(200);
    expect((await summary('2026-11-02')).body.metrics).toMatchObject({ focusSeconds: 300, finishedSessions: 1, daysWithStudy: 1 });
    expect((await summary('2026-11-03')).body.metrics).toMatchObject({ focusSeconds: 1, finishedSessions: 1, daysWithStudy: 0 });
    await write('patch','/users/me',{ timeZone: 'UTC' }).expect(200);
    const stats = (await summary('2026-11-03')).body;
    expect(stats.timeZone).toBe('UTC'); expect(stats.metrics.focusSeconds).toBe(301);
    expect((await get('/academy/events')).body.items.some((event: { localDate: string }) => event.localDate.startsWith('2026-11-02'))).toBe(true);
  });
  it.each([
    ['2026-03-08','2026-03-09T03:30:00Z'],
    ['2026-11-01','2026-11-02T04:30:00Z']
  ])('dia com mudança DST %s inclui sua última hora local', async (day, instant) => {
    now = Date.parse(instant!) - 300000; a = await login(a);
    await write('patch','/users/me',{ timeZone: 'America/New_York' }).expect(200); await focus(5);
    const result = (await summary(day!)).body;
    expect(result.daily).toHaveLength(1); expect(result.daily[0]).toMatchObject({ date: day, focusSeconds: 300, finishedSessions: 1 });
  });
  it('dados de B não entram na academia, extrato ou métricas de A; rotas exigem sessão', async () => {
    await focus(60,'COMPLETED',60,b);
    a = await login(a);
    expect((await get('/academy')).body.totalXp).toBe(0);
    expect((await get('/academy/events')).body.total).toBe(0);
    expect((await summary()).body.metrics.finishedSessions).toBe(0);
    expect((await get('/academy',b)).body.totalXp).toBe(60);
    for (const path of ['/academy','/academy/events','/statistics/summary']) await request(server()).get('/api/v1' + path).expect(401);
    await get('/statistics/summary?userId=' + b.id).expect(400);
    await get('/academy/events?userId=' + b.id).expect(400);
  });
  it('valida período, datas e filtros e não oferece escrita de XP ou estágio', async () => {
    for (const query of ['from=2026-11-02','from=2026-02-30&to=2026-03-01','from=2026-11-03&to=2026-11-02','from=2025-01-01&to=2026-01-02','from=2026-11-01&to=2026-11-02&timeZone=UTC']) await get('/statistics/summary?' + query).expect(400);
    await get('/academy/events?pageSize=101').expect(400); await get('/academy/events?sourceType=ADMIN').expect(400);
    await write('post','/academy',{ xp: 9999, stage: 4 }).expect(404);
    await write('patch','/academy',{ xp: 9999 }).expect(404);
    expect((await get('/academy')).headers['cache-control']).toBe('no-store');
    expect((await get('/academy')).body.totalXp).toBe(0);
  });
});
