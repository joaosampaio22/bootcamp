import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/common/configure-application.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { ClockService } from '../src/common/clock.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

interface Account { id: string; email: string; cookie: string; csrf: string }
describe('conteúdos e continuidade / PostgreSQL real', () => {
  let app: INestApplication; let db: PrismaService; let origin: string;
  let a: Account; let b: Account; let subject: string; let otherSubject: string;
  let now = Date.parse('2026-11-03T01:00:00Z');
  const emails = [`contents-a-${randomUUID()}@example.test`,`contents-b-${randomUUID()}@example.test`];
  const password = 'Senha fictícia para integração';
  const server = () => app.getHttpServer();
  const account = (r: request.Response, email: string): Account => ({ id: r.body.user.id, email, cookie: (r.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!, csrf: r.body.csrfToken });
  function write(method: 'post' | 'patch', path: string, body: object, who = a, key?: string) {
    const req = request(server())[method]('/api/v1' + path).set('Origin', origin).set('Cookie', who.cookie).set('X-CSRF-Token', who.csrf);
    if (key) req.set('Idempotency-Key', key); return req.send(body);
  }
  const get = (path: string, who = a) => request(server()).get('/api/v1' + path).set('Cookie', who.cookie);
  const create = (extra: object = {}) => write('post', '/contents', { subjectId: subject, title: 'História da Arte', ...extra }).expect(201);
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test') || process.env.NODE_ENV !== 'test') throw new Error('Banco isolado obrigatório.');
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ClockService).useValue({ now: () => new Date(now) }).compile();
    app = module.createNestApplication(); origin = app.get<Environment>(ENVIRONMENT).frontendOrigin; configureApplication(app, app.get<Environment>(ENVIRONMENT)); await app.init(); db = app.get(PrismaService);
    a = account(await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Conteúdos A', email: emails[0], password }).expect(201), emails[0]!);
    b = account(await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Conteúdos B', email: emails[1], password }).expect(201), emails[1]!);
    subject = (await write('post','/subjects',{ name: 'História' })).body.id;
    otherSubject = (await write('post','/subjects',{ name: 'Outra conta' },b)).body.id;
  });
  beforeEach(() => { now += 1000; });
  afterAll(async () => {
    if (db) {
      const ids = (await db.user.findMany({ where: { emailNormalized: { in: emails } }, select: { id: true } })).map((u) => u.id);
      const where = { userId: { in: ids } };
      await db.focusAction.deleteMany({ where });
      await db.focusTransition.deleteMany({ where });
      await db.rewardEvent.deleteMany({ where });
      await db.focusSession.deleteMany({ where });
      await db.returnPoint.deleteMany({ where });
      await db.reviewSchedule.deleteMany({ where });
      await db.studyContent.deleteMany({ where });
      await db.subject.deleteMany({ where });
      await db.authSession.deleteMany({ where });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  });

  it('conteúdo livre com campos mínimos agenda amanhã no fuso, independentemente da data estudada', async () => {
    const r = await create({ studiedOn: '2020-01-01' });
    expect(r.body).toMatchObject({ title: 'História da Arte', notes: '', materialUrl: null, studiedOn: '2020-01-01T00:00:00.000Z', review: { stepIndex: 0, status: 'ACTIVE', nextDueDate: '2026-11-03T00:00:00.000Z' } });
    const today = await create({ title: 'Qualquer assunto, sem catálogo' });
    expect(today.body.studiedOn).toBe('2026-11-02T00:00:00.000Z');
  });

  it('sem revisão não cria agenda; habilitações concorrentes criam uma só e patch de notas não adia', async () => {
    const content = (await create({ reviewEnabled: false })).body;
    expect(content.review).toBeNull();
    const responses = await Promise.all([1,2].map(() => write('patch','/contents/' + content.id,{ reviewEnabled: true })));
    expect(responses.map((r) => r.status)).toEqual([200,200]);
    expect(await db.reviewSchedule.count({ where: { contentId: content.id } })).toBe(1);
    const original = (await get('/contents/' + content.id)).body.review;
    await write('patch','/contents/' + content.id,{ notes: 'Uma anotação livre' }).expect(200);
    expect((await get('/contents/' + content.id)).body.review).toEqual(original);
    await write('patch','/contents/' + content.id,{ reviewEnabled: false }).expect(200);
    expect((await get('/contents/' + content.id)).body.review).toMatchObject({ id: original.id, status: 'SUSPENDED' });
    await write('patch','/contents/' + content.id,{ notes: 'Continuar sem agenda' }).expect(200);
    expect((await get('/contents/' + content.id)).body.review.status).toBe('SUSPENDED');
    await write('patch','/contents/' + content.id,{ reviewEnabled: true }).expect(200);
    expect((await get('/contents/' + content.id)).body.review).toMatchObject({ id: original.id, status: 'ACTIVE', stepIndex: 0, version: 3 });
  });

  it('pesquisa título/notas com texto literal, preserva notas como texto e valida links', async () => {
    const content = (await create({ title: '100% livre', notes: '<script>alert("teste fictício")</script>', materialUrl: 'https://example.test/material' })).body;
    await create({ title: '100 outros assuntos', reviewEnabled: false });
    const found = await get('/contents?q=' + encodeURIComponent('100%')).expect(200);
    expect(found.body.items.map((c: { id: string }) => c.id)).toEqual([content.id]);
    expect((await get('/contents?q=' + encodeURIComponent('script')).expect(200)).body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: content.id, notes: '<script>alert("teste fictício")</script>' })]));
    for (const materialUrl of ['javascript:alert(1)','data:text/html,test','https://user:secret@example.test']) await write('patch','/contents/' + content.id,{ materialUrl }).expect(400);
    await write('patch','/contents/' + content.id,{ materialUrl: null }).expect(200);
    expect((await get('/contents/' + content.id)).body.materialUrl).toBeNull();
  });

  it('arquivamento suspende agenda e preserva conteúdo e vínculos; disciplina arquivada oculta a lista padrão', async () => {
    const s = (await write('post','/subjects',{ name: 'Disciplina arquivável' }).expect(201)).body.id;
    const content = (await create({ subjectId: s })).body;
    await write('patch','/contents/' + content.id,{ archived: true }).expect(200);
    expect((await get('/contents/' + content.id)).body.review.status).toBe('SUSPENDED');
    expect((await get('/contents?archived=true')).body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: content.id })]));
    await write('patch','/contents/' + content.id,{ archived: false }).expect(200);
    await write('patch','/subjects/' + s,{ archived: true }).expect(200);
    expect((await get('/contents?subjectId=' + s)).body.items).toEqual([]);
    expect((await get('/contents/' + content.id)).body.title).toBe('História da Arte');
    await write('post','/contents',{ subjectId: s, title: 'Novo' }).expect(404);
    await write('patch','/subjects/' + s,{ archived: false }).expect(200);
    expect((await get('/contents?subjectId=' + s)).body.items).toHaveLength(1);
  });

  it('isola recursos e associações de contas no servidor e por FK composta', async () => {
    const content = (await create()).body;
    await get('/contents/' + content.id,b).expect(404);
    await write('patch','/contents/' + content.id,{ notes: 'Indevido' },b).expect(404);
    await write('post','/contents',{ subjectId: otherSubject, title: 'Vínculo alheio' }).expect(404);
    await write('patch','/contents/' + content.id,{ subjectId: otherSubject }).expect(404);
    await write('post','/return-points',{ contentId: content.id, nextAction: 'Acessar dado alheio' },b).expect(404);
    await write('post','/return-points',{ subjectId: otherSubject, nextAction: 'Acessar dado alheio' }).expect(404);
    await expect(db.studyContent.create({ data: { userId: a.id, subjectId: otherSubject, title: 'FK cruzada', studiedOn: new Date('2026-11-02') } })).rejects.toMatchObject({ code: 'P2003' });
    expect((await get('/contents',b)).body.items).toEqual([]);
  });

  it('ponto independente persiste, destaca o aberto mais recente e não some após novo login', async () => {
    const first = (await write('post','/return-points',{ nextAction: 'Abrir o livro', context: 'Parei na página 30' }).expect(201)).body;
    now += 1000;
    const second = (await write('post','/return-points',{ nextAction: 'Executar meu exemplo', materialUrl: 'https://example.test/code' }).expect(201)).body;
    expect((await get('/dashboard')).body.nextReturnPoint.id).toBe(second.id);
    now += 1000; await write('patch','/return-points/' + first.id,{ nextAction: 'Abrir a página 31' }).expect(200);
    expect((await get('/dashboard')).body.nextReturnPoint.id).toBe(first.id);
    await write('post','/auth/logout',{}).expect(204); await get('/return-points').expect(401);
    a = account(await request(server()).post('/api/v1/auth/login').set('Origin',origin).send({ email: a.email, password }).expect(200),a.email);
    expect((await get('/dashboard')).body.nextReturnPoint).toMatchObject({ id: first.id, nextAction: 'Abrir a página 31', context: 'Parei na página 30', subjectId: null, contentId: null });
    await write('patch','/return-points/' + first.id,{ status: 'DONE' }).expect(200);
    expect((await get('/dashboard')).body.nextReturnPoint.id).toBe(second.id);
    expect((await get('/return-points?status=DONE')).body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: first.id })]));
    await get('/return-points/' + first.id,b).expect(404);
    await write('patch','/return-points/' + first.id,{ nextAction: 'Indevido' },b).expect(404);
  });

  it('conteúdo vinculado deriva disciplina; mover conteúdo mantém pontos abertos consistentes', async () => {
    const content = (await create()).body;
    const point = (await write('post','/return-points',{ contentId: content.id, nextAction: 'Reabrir minhas anotações' }).expect(201)).body;
    expect(point.subjectId).toBe(subject);
    const target = (await write('post','/subjects',{ name: 'Outra área própria' }).expect(201)).body.id;
    await write('post','/return-points',{ subjectId: target, contentId: content.id, nextAction: 'Inconsistente' }).expect(422);
    await write('patch','/contents/' + content.id,{ subjectId: target }).expect(200);
    expect((await get('/return-points/' + point.id)).body.subjectId).toBe(target);
    await write('patch','/contents/' + content.id,{ archived: true }).expect(200);
    expect((await get('/return-points/' + point.id)).body.nextAction).toBe('Reabrir minhas anotações');
  });

  it('foco vinculado valida conteúdo, disciplina e arquivamento; encerramento continua opcional', async () => {
    const content = (await create()).body;
    await write('post','/focus-sessions',{ plannedMinutes: 5, contentId: content.id },b).expect(404);
    await write('patch','/contents/' + content.id,{ archived: true }).expect(200);
    await write('post','/focus-sessions',{ plannedMinutes: 5, contentId: content.id }).expect(404);
    await write('patch','/contents/' + content.id,{ archived: false }).expect(200);
    const s = (await write('post','/focus-sessions',{ plannedMinutes: 5, contentId: content.id }).expect(201)).body;
    expect(s).toMatchObject({ subjectId: subject, contentId: content.id, contentTitle: 'História da Arte' });
    now += 300000;
    const finished = await write('post',`/focus-sessions/${s.id}/finish`,{ outcome: 'COMPLETED' },a,randomUUID()).expect(200);
    expect(finished.body.xpGranted).toBe(5);
    const xp = (await get('/focus-sessions')).body.totalXp;
    await create({ title: 'Registro opcional após foco' });
    expect((await get('/focus-sessions')).body.totalXp).toBe(xp);
    const free = (await write('post','/focus-sessions',{ plannedMinutes: 5 }).expect(201)).body;
    now += 300000; await write('post',`/focus-sessions/${free.id}/finish`,{ outcome: 'INTERRUPTED' },a,randomUUID()).expect(200);
  });

  it('rejeita campos forjados, limites, datas inválidas, CSRF ausente e exclusão física', async () => {
    await write('post','/contents',{ subjectId: subject, title: 'x', userId: b.id }).expect(400);
    await write('post','/contents',{ subjectId: subject, title: 'x', studiedOn: '2026-02-30' }).expect(400);
    await write('post','/return-points',{ nextAction: ' ' }).expect(400);
    await write('post','/return-points',{ nextAction: 'x', context: 'x'.repeat(2001) }).expect(400);
    await request(server()).post('/api/v1/contents').set('Origin',origin).set('Cookie',a.cookie).send({ subjectId: subject, title: 'Sem CSRF' }).expect(403);
    await request(server()).delete('/api/v1/contents/' + randomUUID()).set('Origin',origin).set('Cookie',a.cookie).set('X-CSRF-Token',a.csrf).expect(404);
    await get('/contents?pageSize=101').expect(400);
  });
});
