import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/common/configure-application.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { ClockService } from '../src/common/clock.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { RewardsService } from '../src/rewards/rewards.service.js';
import { localDate } from '../src/focus/focus.rules.js';

interface Account { id: string; email: string; cookie: string; csrf: string }
describe('revisões / TR-01–15 / PostgreSQL real', () => {
  let app: INestApplication; let db: PrismaService; let origin: string;
  let a: Account; let b: Account; let subject: string;
  let now = Date.parse('2026-11-02T12:00:00Z');
  const emails = [`reviews-a-${randomUUID()}@example.test`,`reviews-b-${randomUUID()}@example.test`];
  const password = 'Senha fictícia dos testes de revisão';
  const server = () => app.getHttpServer();
  const account = (r: request.Response, email: string): Account => ({ id: r.body.user.id, email, cookie: (r.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!, csrf: r.body.csrfToken });
  const get = (path: string, who = a) => request(server()).get('/api/v1' + path).set('Cookie',who.cookie);
  function post(path: string, body: object, key?: string, who = a) {
    const req = request(server()).post('/api/v1' + path).set('Origin',origin).set('Cookie',who.cookie).set('X-CSRF-Token',who.csrf);
    if (key) req.set('Idempotency-Key',key); return req.send(body);
  }
  const patch = (path: string, body: object) => request(server()).patch('/api/v1' + path).set('Origin',origin).set('Cookie',a.cookie).set('X-CSRF-Token',a.csrf).send(body);
  const evaluate = (id: string, extra: object = {}, key = randomUUID(), who = a) => post(`/reviews/${id}/attempts`,{ rating: 'GOOD', expectedVersion: 1, ...extra },key,who);
  async function login(who: Account) { return account(await request(server()).post('/api/v1/auth/login').set('Origin',origin).send({ email: who.email, password }).expect(200),who.email); }
  const create = (extra: object = {}) => post('/contents',{ subjectId: subject, title: 'Qualquer conteúdo do usuário', ...extra }).expect(201);
  async function due(step = 2, daysLate = 0, extra: object = {}) {
    const content = (await create(extra)).body;
    const date = localDate(new Date(now),'America/Sao_Paulo'); date.setUTCDate(date.getUTCDate() - daysLate);
    const schedule = await db.reviewSchedule.update({ where: { contentId: content.id }, data: { stepIndex: step, nextDueDate: date } });
    return { content, schedule };
  }
  async function clear(ids: string[]) {
    const where = { userId: { in: ids } };
    await db.focusAction.deleteMany({ where }); await db.focusTransition.deleteMany({ where });
    await db.rewardEvent.deleteMany({ where }); await db.focusSession.deleteMany({ where });
    await db.returnPoint.deleteMany({ where }); await db.reviewAttempt.deleteMany({ where });
    await db.reviewSchedule.deleteMany({ where }); await db.studyContent.deleteMany({ where });
  }
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test') || process.env.NODE_ENV !== 'test') throw new Error('Banco de testes isolado obrigatório.');
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ClockService).useValue({ now: () => new Date(now) }).compile();
    app = module.createNestApplication(); origin = app.get<Environment>(ENVIRONMENT).frontendOrigin;
    configureApplication(app,app.get<Environment>(ENVIRONMENT)); await app.init(); db = app.get(PrismaService);
    a = account(await request(server()).post('/api/v1/auth/register').set('Origin',origin).send({ name: 'Revisões A fictício', email: emails[0], password }).expect(201),emails[0]!);
    b = account(await request(server()).post('/api/v1/auth/register').set('Origin',origin).send({ name: 'Revisões B fictício', email: emails[1], password }).expect(201),emails[1]!);
    subject = (await post('/subjects',{ name: 'História livre' }).expect(201)).body.id;
  });
  beforeEach(async () => {
    now += 86400000; await clear([a.id,b.id]);
    await db.subject.updateMany({ where: { userId: a.id }, data: { archivedAt: null } });
    await db.user.update({ where: { id: a.id }, data: { timeZone: 'America/Sao_Paulo' } });
    a = await login(a); b = await login(b);
  });
  afterEach(() => { jest.restoreAllMocks(); });
  afterAll(async () => {
    if (db) {
      const ids = (await db.user.findMany({ where: { emailNormalized: { in: emails } }, select: { id: true } })).map((u) => u.id);
      await clear(ids); await db.subject.deleteMany({ where: { userId: { in: ids } } });
      await db.authSession.deleteMany({ where: { userId: { in: ids } } }); await db.user.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  });

  it('TR-01/02: separa agenda inicial/futura e conteúdo sem revisão; ler não pontua', async () => {
    const content = (await create()).body;
    await create({ reviewEnabled: false });
    expect((await get('/reviews/due').expect(200)).body.total).toBe(0);
    const upcoming = (await get('/reviews/upcoming').expect(200)).body;
    expect(upcoming.total).toBe(1); expect(upcoming.items[0]).toMatchObject({ id: content.review.id, canAttempt: false });
    await get('/reviews/' + content.review.id).expect(200);
    expect((await get(`/reviews/${content.review.id}/history`).expect(200)).body.items).toEqual([]);
    await evaluate(content.review.id).expect(409);
    expect(await db.reviewAttempt.count({ where: { userId: a.id } })).toBe(0);
    expect(await db.rewardEvent.count({ where: { userId: a.id } })).toBe(0);
  });
  it('TR-08: atraso aparece uma vez, sem notas na lista; próximo prazo parte do dia realizado', async () => {
    const { schedule } = await due(2,10,{ notes: 'Anotação particular' });
    const queue = (await get('/reviews/due?pageSize=1').expect(200)).body;
    expect(queue).toMatchObject({ total: 1, page: 1, pageSize: 1 });
    expect(queue.items[0]).toMatchObject({ id: schedule.id, overdueDays: 10, canAttempt: true });
    expect(queue.items[0].content).not.toHaveProperty('notes');
    expect((await get('/dashboard')).body.dueReviewCount).toBe(1);
    const today = localDate(new Date(now),'America/Sao_Paulo'); today.setUTCDate(today.getUTCDate() + 14);
    const r = await evaluate(schedule.id).expect(201);
    expect(r.body).toMatchObject({ newStepIndex: 3, nextDueDate: today.toISOString(), xpGranted: 5 });
    expect((await get('/reviews/due')).body.total).toBe(0);
  });
  it.each([['AGAIN',0,1],['HARD',2,7],['GOOD',3,14],['EASY',4,30]] as const)('TR-03–06: %s no índice 2', async (rating,step,days) => {
    const { schedule } = await due();
    const expected = localDate(new Date(now),'America/Sao_Paulo'); expected.setUTCDate(expected.getUTCDate() + days);
    const r = await evaluate(schedule.id,{ rating }).expect(201);
    expect(r.body).toMatchObject({ oldStepIndex: 2, newStepIndex: step, nextDueDate: expected.toISOString(), xpGranted: 5, version: 2 });
    const history = (await get(`/reviews/${schedule.id}/history`).expect(200)).body;
    expect(history.items[0]).toMatchObject({ rating, oldDueDate: schedule.nextDueDate.toISOString(), newDueDate: expected.toISOString(), scheduleVersionBefore: 1, reward: { sourceId: r.body.attemptId, sourceType: 'REVIEW_ATTEMPT', xp: 5 } });
  });
  it('TR-07/15: EASY satura em 60 dias e permite revisão sem notas', async () => {
    const { schedule } = await due(5);
    expect((await get('/reviews/' + schedule.id)).body.content.notes).toBe('');
    const result = await evaluate(schedule.id,{ rating: 'EASY' }).expect(201);
    const expected = localDate(new Date(now),'America/Sao_Paulo'); expected.setUTCDate(expected.getUTCDate() + 60);
    expect(result.body).toMatchObject({ newStepIndex: 5, nextDueDate: expected.toISOString() });
  });
  it('TR-09: mesma chave simultânea retorna comprovante imutável; reutilização diferente conflita', async () => {
    const { schedule } = await due(); const key = randomUUID();
    const responses = await Promise.all([1,2].map(() => evaluate(schedule.id,{},key)));
    expect(responses.map((r) => r.status)).toEqual([201,201]); expect(responses[0]!.body).toEqual(responses[1]!.body);
    expect(await db.reviewAttempt.count({ where: { scheduleId: schedule.id } })).toBe(1);
    expect(await db.rewardEvent.count({ where: { userId: a.id } })).toBe(1);
    await evaluate(schedule.id,{ rating: 'AGAIN' },key).expect(409);
    await evaluate(schedule.id,{ expectedVersion: 2 },key).expect(409);
    const second = await due(); await evaluate(second.schedule.id,{},key).expect(409);
    await evaluate(second.schedule.id).expect(201);
    await patch('/contents/' + schedule.contentId,{ archived: true }).expect(200);
    expect((await evaluate(schedule.id,{},key).expect(201)).body).toEqual(responses[0]!.body);
  });
  it('TR-10: chaves diferentes com versão antiga registram uma só tentativa; FK e unique reforçam', async () => {
    const { schedule } = await due();
    const results = await Promise.all([1,2].map(() => evaluate(schedule.id)));
    expect(results.map((r) => r.status).sort()).toEqual([201,409]);
    expect(results.find((r) => r.status === 409)!.body.error.details.schedule.version).toBe(2);
    const saved = await db.reviewAttempt.findFirstOrThrow({ where: { scheduleId: schedule.id } });
    await expect(db.reviewAttempt.create({ data: { ...saved, id: randomUUID(), idempotencyKey: randomUUID(), response: {}, userId: a.id } })).rejects.toMatchObject({ code: 'P2002' });
    const other = await due();
    await expect(db.reviewAttempt.create({ data: { ...saved, id: randomUUID(), idempotencyKey: randomUUID(), scheduleId: other.schedule.id, response: {} } })).rejects.toMatchObject({ code: 'P2003' });
  });
  it('TR-11: corridas em conteúdos distintos respeitam 50 XP e preservam tentativas extras', async () => {
    const items = [];
    for (let i = 0; i < 12; i++) items.push(await due());
    const results = await Promise.all(items.map(({ schedule }) => evaluate(schedule.id)));
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(results.map((r) => r.body.xpGranted).reduce((sum: number,xp: number) => sum + xp,0)).toBe(50);
    expect(results.filter((r) => r.body.xpGranted === 0)).toHaveLength(2);
    expect(await db.reviewAttempt.count({ where: { userId: a.id } })).toBe(12);
    expect((await db.rewardEvent.aggregate({ where: { userId: a.id, sourceType: 'REVIEW_ATTEMPT' }, _sum: { xp: true } }))._sum.xp).toBe(50);
  });
  it('TR-12/13: suspensão, conteúdo e disciplina arquivados saem da fila sem destruir histórico', async () => {
    const { schedule } = await due(); await evaluate(schedule.id).expect(201);
    await patch('/contents/' + schedule.contentId,{ reviewEnabled: false }).expect(200);
    expect((await get('/reviews/upcoming')).body.total).toBe(0);
    await evaluate(schedule.id,{ expectedVersion: 3 }).expect(409);
    expect((await get(`/reviews/${schedule.id}/history`)).body.total).toBe(1);
    await patch('/contents/' + schedule.contentId,{ reviewEnabled: true }).expect(200);
    expect((await get('/reviews/upcoming')).body.total).toBe(1);
    await patch('/contents/' + schedule.contentId,{ archived: true }).expect(200);
    expect((await get('/reviews/upcoming')).body.total).toBe(0);
    await patch('/contents/' + schedule.contentId,{ archived: false }).expect(200);
    await patch('/subjects/' + subject,{ archived: true }).expect(200);
    expect((await get('/reviews/upcoming')).body.total).toBe(0);
    expect((await get('/reviews/' + schedule.id)).body.canAttempt).toBe(false);
    expect((await get(`/reviews/${schedule.id}/history`)).body.total).toBe(1);
  });
  it('corrida entre suspensão e avaliação mantém um resultado serial válido', async () => {
    const { schedule } = await due();
    const results = await Promise.all([evaluate(schedule.id),patch('/contents/' + schedule.contentId,{ reviewEnabled: false })]);
    expect([201,409]).toContain(results[0]!.status); expect(results[1]!.status).toBe(200);
    const count = await db.reviewAttempt.count({ where: { scheduleId: schedule.id } });
    expect(count).toBe(results[0]!.status === 201 ? 1 : 0);
    expect((await get('/reviews/due')).body.total).toBe(0); expect((await get('/reviews/upcoming')).body.total).toBe(0);
    expect((await db.reviewSchedule.findUniqueOrThrow({ where: { id: schedule.id } })).status).toBe('SUSPENDED');
  });
  it('histórico mantém ciclos anteriores após nova revisão, suspensão e reativação', async () => {
    const { schedule } = await due(0); const first = await evaluate(schedule.id,{ rating: 'AGAIN' }).expect(201);
    now += 86400000; a = await login(a);
    await evaluate(schedule.id,{ expectedVersion: 2 }).expect(201);
    await patch('/contents/' + schedule.contentId,{ reviewEnabled: false }).expect(200);
    await patch('/contents/' + schedule.contentId,{ reviewEnabled: true }).expect(200);
    const history = (await get(`/reviews/${schedule.id}/history?pageSize=1`).expect(200)).body;
    expect(history).toMatchObject({ total: 2, pageSize: 1 });
    expect(history.items[0].id).not.toBe(first.body.attemptId);
    expect((await get(`/reviews/${schedule.id}/history?pageSize=1&page=2`)).body.items[0].id).toBe(first.body.attemptId);
  });
  it('TS-01/06: isola fila, detalhe, histórico e tentativas; exige autenticação/CSRF/Origin', async () => {
    const { schedule } = await due();
    expect((await get('/reviews/due',b)).body.items).toEqual([]);
    expect((await get('/reviews/upcoming',b)).body.items).toEqual([]);
    await get('/reviews/' + schedule.id,b).expect(404); await get(`/reviews/${schedule.id}/history`,b).expect(404);
    await evaluate(schedule.id,{},randomUUID(),b).expect(404);
    await request(server()).get('/api/v1/reviews/due').expect(401);
    await request(server()).post(`/api/v1/reviews/${schedule.id}/attempts`).set('Origin',origin).set('Cookie',a.cookie).set('Idempotency-Key',randomUUID()).send({ rating: 'GOOD', expectedVersion: 1 }).expect(403);
    await request(server()).post(`/api/v1/reviews/${schedule.id}/attempts`).set('Origin','https://untrusted.example.test').set('Cookie',a.cookie).set('X-CSRF-Token',a.csrf).set('Idempotency-Key',randomUUID()).send({ rating: 'GOOD', expectedVersion: 1 }).expect(403);
    expect((await get('/reviews/due?subjectId=' + randomUUID())).body.total).toBe(0);
    expect((await get('/reviews/due?subjectId=' + subject)).body.total).toBe(1);
  });
  it('rejeita chave ausente/inválida, rating/versão/XP forjados e limites de paginação', async () => {
    const { schedule } = await due(); const path = `/reviews/${schedule.id}/attempts`;
    await post(path,{ rating: 'GOOD', expectedVersion: 1 }).expect(400);
    await post(path,{ rating: 'GOOD', expectedVersion: 1 },'bad-key').expect(400);
    for (const body of [{ rating: 'GOOD' },{ rating: 'CORRECT', expectedVersion: 1 },{ rating: 'GOOD', expectedVersion: 1, xp: 500 },{ rating: 'GOOD', expectedVersion: 1, now: '2030-01-01' }]) await post(path,body,randomUUID()).expect(400);
    await get('/reviews/due?pageSize=101').expect(400); await get('/reviews/due?subjectId=bad-id').expect(400);
    expect(await db.reviewAttempt.count({ where: { userId: a.id } })).toBe(0);
  });
  it('TS-10: falha após agenda/recompensa reverte tudo, permitindo retry com mesma chave', async () => {
    const { schedule } = await due(); const key = randomUUID();
    // Falha depois da criação do RewardEvent, ainda na mesma transação.
    jest.spyOn(RewardsService.prototype,'total').mockRejectedValueOnce(new Error('Falha controlada após recompensa'));
    jest.spyOn(Logger.prototype,'error').mockImplementation(() => undefined);
    await evaluate(schedule.id,{},key).expect(500);
    expect(await db.reviewSchedule.findUniqueOrThrow({ where: { id: schedule.id } })).toEqual(schedule);
    expect(await db.reviewAttempt.count({ where: { scheduleId: schedule.id } })).toBe(0);
    expect(await db.rewardEvent.count({ where: { userId: a.id } })).toBe(0);
    jest.restoreAllMocks();
    expect((await evaluate(schedule.id,{},key).expect(201)).body.xpGranted).toBe(5);
  });
  it('TR-14/RN-065: virada local/DST e troca de fuso preservam datas antigas e usam novo fuso', async () => {
    now = Date.parse('2026-03-08T06:59:00Z'); a = await login(a);
    await db.user.update({ where: { id: a.id }, data: { timeZone: 'America/New_York' } });
    const content = (await create()).body;
    expect(content.review.nextDueDate).toBe('2026-03-09T00:00:00.000Z');
    await db.reviewSchedule.update({ where: { id: content.review.id }, data: { nextDueDate: new Date('2026-03-08'), stepIndex: 1 } });
    now = Date.parse('2026-03-08T07:01:00Z');
    const r = await evaluate(content.review.id,{ rating: 'GOOD' }).expect(201);
    expect(r.body.nextDueDate).toBe('2026-03-15T00:00:00.000Z');
    await db.user.update({ where: { id: a.id }, data: { timeZone: 'Pacific/Kiritimati' } });
    expect((await get('/reviews/' + content.review.id)).body.nextDueDate).toBe(r.body.nextDueDate);
    now = Date.parse('2026-03-14T12:00:00Z'); a = await login(a);
    expect((await evaluate(content.review.id,{ expectedVersion: 2, rating: 'AGAIN' }).expect(201)).body.nextDueDate).toBe('2026-03-16T00:00:00.000Z');
    const event = await db.rewardEvent.findFirstOrThrow({ where: { userId: a.id }, orderBy: { createdAt: 'desc' } });
    expect(event.localDate.toISOString().slice(0,10)).toBe('2026-03-15');
  });
  it('novo dia local volta a pontuar; XP de foco e revisão têm tetos independentes', async () => {
    const items = []; for (let i = 0; i < 11; i++) items.push(await due(0));
    for (const { schedule } of items) await evaluate(schedule.id,{ rating: 'AGAIN' }).expect(201);
    const focus = (await post('/focus-sessions',{ plannedMinutes: 5 }).expect(201)).body;
    now += 300000;
    const f = await post(`/focus-sessions/${focus.id}/finish`,{ outcome: 'COMPLETED' },randomUUID()).expect(200);
    expect(f.body).toMatchObject({ xpGranted: 5, totalXp: 55 });
    now += 86400000; a = await login(a);
    expect((await evaluate(items[0]!.schedule.id,{ expectedVersion: 2 }).expect(201)).body).toMatchObject({ xpGranted: 5, totalXp: 60 });
  });
});
