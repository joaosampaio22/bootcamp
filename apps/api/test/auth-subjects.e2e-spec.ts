import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ENVIRONMENT } from '../src/common/environment.js';
import type { Environment } from '../src/common/environment.js';
import { configureApplication } from '../src/common/configure-application.js';
import { ClockService } from '../src/common/clock.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

interface Account { cookie: string; csrf: string; id: string; email: string }
describe('autenticação e disciplinas / PostgreSQL real', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let origin: string;
  let alice: Account;
  let bob: Account;
  let subjectId: string;
  let now = Date.parse('2026-11-02T12:00:00Z');
  const password = 'Uma senha fictícia para integração';
  const emails = [`a-${randomUUID()}@example.test`, `b-${randomUUID()}@example.test`];
  const server = () => app.getHttpServer();
  function write(method: 'post' | 'patch', path: string, account: Account) {
    return request(server())[method]('/api/v1' + path).set('Origin', origin).set('Cookie', account.cookie).set('X-CSRF-Token', account.csrf);
  }
  function account(response: request.Response, email: string): Account {
    return { cookie: (response.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!, csrf: response.body.csrfToken, id: response.body.user.id, email };
  }
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test') || process.env.NODE_ENV !== 'test') throw new Error('Use npm run test:integration com banco isolado.');
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(ClockService).useValue({ now: () => new Date(now) }).compile();
    app = module.createNestApplication();
    origin = app.get<Environment>(ENVIRONMENT).frontendOrigin;
    configureApplication(app, app.get<Environment>(ENVIRONMENT));
    await app.init();
    prisma = app.get(PrismaService);
    const first = await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Alice fictícia', email: emails[0], password }).expect(201);
    alice = account(first, emails[0]!);
    const second = await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Bob fictício', email: emails[1], password }).expect(201);
    bob = account(second, emails[1]!);
    const subject = await write('post', '/subjects', alice).send({ name: 'História livre' }).expect(201);
    subjectId = subject.body.id;
  });
  beforeEach(() => { now += 61000; });
  afterAll(async () => {
    if (prisma) {
      const ids = (await prisma.user.findMany({ where: { emailNormalized: { in: emails } }, select: { id: true } })).map((u) => u.id);
      await prisma.subject.deleteMany({ where: { userId: { in: ids } } });
      await prisma.authSession.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    if (app) await app.close();
  });

  it('cadastro persiste hash Argon2id e sessão, com cookie HttpOnly e sem JWT no JSON', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: alice.id } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.passwordHash).not.toContain(password);
    expect(await prisma.authSession.count({ where: { userId: alice.id } })).toBe(1);
    const response = await request(server()).post('/api/v1/auth/login').set('Origin', origin).send({ email: alice.email, password }).expect(200);
    const cookie = response.headers['set-cookie'] as unknown as string[];
    expect(cookie[0]).toContain('HttpOnly'); expect(cookie[0]).toContain('SameSite=Lax'); expect(cookie[0]).toContain('Path=/');
    expect(response.body).toEqual({ user: expect.objectContaining({ id: alice.id }), csrfToken: expect.any(String) });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(response.body.token).toBeUndefined();
  });

  it('mantém perfil e sessão após nova requisição; permite alterar nome e fuso', async () => {
    await write('patch', '/users/me', alice).send({ name: 'Alice atualizada', timeZone: 'Europe/Lisbon' }).expect(200);
    const profile = await request(server()).get('/api/v1/auth/me').set('Cookie', alice.cookie).expect(200);
    expect(profile.body.user).toMatchObject({ name: 'Alice atualizada', timeZone: 'Europe/Lisbon' });
    expect(profile.headers['cache-control']).toBe('no-store');
  });

  it('e-mail duplicado normalizado não cria usuário nem sessão parcial', async () => {
    const count = await prisma.authSession.count({ where: { userId: alice.id } });
    await request(server()).post('/api/v1/auth/register').set('Origin', origin).send({ name: 'Duplicada', email: ' ' + alice.email.toUpperCase() + ' ', password }).expect(409);
    expect(await prisma.user.count({ where: { emailNormalized: alice.email } })).toBe(1);
    expect(await prisma.authSession.count({ where: { userId: alice.id } })).toBe(count);
  });

  it('senha incorreta e conta inexistente retornam a mesma mensagem genérica', async () => {
    const a = await request(server()).post('/api/v1/auth/login').set('Origin', origin).send({ email: alice.email, password: 'errada' }).expect(401);
    const b = await request(server()).post('/api/v1/auth/login').set('Origin', origin).send({ email: 'missing-' + randomUUID() + '@example.test', password: 'errada' }).expect(401);
    expect(a.body.error.message).toBe(b.body.error.message);
    expect(a.headers['set-cookie']).toBeUndefined();
  });

  it('rejeita alterações sem origem, de origem maliciosa ou sem CSRF válido', async () => {
    await request(server()).post('/api/v1/auth/register').send({ name: 'Sem origem' }).expect(403);
    await request(server()).post('/api/v1/subjects').set('Origin', 'https://evil.example').set('Cookie', alice.cookie).set('X-CSRF-Token', alice.csrf).send({ name: 'Invasão' }).expect(403);
    await request(server()).post('/api/v1/subjects').set('Origin', origin).set('Cookie', alice.cookie).send({ name: 'Sem CSRF' }).expect(403);
    await request(server()).post('/api/v1/subjects').set('Origin', origin).set('Cookie', alice.cookie).set('X-CSRF-Token', bob.csrf).send({ name: 'CSRF alheio' }).expect(403);
  });

  it('usuário B não lê nem modifica disciplina de A por ID conhecido', async () => {
    await request(server()).get('/api/v1/subjects/' + subjectId).set('Cookie', bob.cookie).expect(404);
    await write('patch', '/subjects/' + subjectId, bob).send({ name: 'Alteração indevida' }).expect(404);
    const own = await request(server()).get('/api/v1/subjects/' + subjectId).set('Cookie', alice.cookie).expect(200);
    expect(own.body.name).toBe('História livre');
    const list = await request(server()).get('/api/v1/subjects').set('Cookie', bob.cookie).expect(200);
    expect(list.body.items).toEqual([]);
  });

  it('nomes ativos são únicos por usuário inclusive em chamadas concorrentes', async () => {
    const results = await Promise.all([
      write('post', '/subjects', alice).send({ name: 'Concorrência' }),
      write('post', '/subjects', alice).send({ name: ' CONCORRÊNCIA ' })
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    await write('post', '/subjects', bob).send({ name: 'Concorrência' }).expect(201);
    expect(await prisma.subject.count({ where: { userId: alice.id, normalizedName: 'concorrência', archivedAt: null } })).toBe(1);
  });

  it('arquiva, preserva histórico, permite reutilizar nome e impede restauração conflitante', async () => {
    const created = await write('post', '/subjects', alice).send({ name: 'Inglês' }).expect(201);
    const id = created.body.id;
    await write('patch', '/subjects/' + id, alice).send({ archived: true }).expect(200);
    const archived = await request(server()).get('/api/v1/subjects?archived=true').set('Cookie', alice.cookie).expect(200);
    expect(archived.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    await write('post', '/subjects', alice).send({ name: 'INGLÊS' }).expect(201);
    await write('patch', '/subjects/' + id, alice).send({ archived: false }).expect(409);
    expect((await prisma.subject.findUniqueOrThrow({ where: { id } })).archivedAt).not.toBeNull();
    await write('patch', '/subjects/' + id, alice).send({ name: 'Inglês antigo', archived: false }).expect(200);
  });

  it('rejeita identidade forjada, tipos incorretos, nome vazio e paginação inválida', async () => {
    await write('post', '/subjects', alice).send({ name: 'Forjada', userId: bob.id }).expect(400);
    await write('post', '/subjects', alice).send({ name: '   ' }).expect(400);
    await write('patch', '/subjects/' + subjectId, alice).send({ archived: 'false' }).expect(400);
    await write('patch', '/subjects/' + subjectId, alice).send({}).expect(400);
    await write('patch', '/users/me', alice).send({ timeZone: '+03:00' }).expect(400);
    await request(server()).get('/api/v1/subjects?pageSize=101').set('Cookie', alice.cookie).expect(400);
    await request(server()).get('/api/v1/subjects?userId=' + bob.id).set('Cookie', alice.cookie).expect(400);
  });

  it('logout revoga a sessão no banco; reutilizar o cookie retorna 401', async () => {
    const login = await request(server()).post('/api/v1/auth/login').set('Origin', origin).send({ email: alice.email, password }).expect(200);
    const fresh = account(login, alice.email);
    const logout = await write('post', '/auth/logout', fresh).send({}).expect(204);
    expect((logout.headers['set-cookie'] as unknown as string[])[0]).toContain('Expires=Thu, 01 Jan 1970');
    await request(server()).get('/api/v1/auth/me').set('Cookie', fresh.cookie).expect(401);
    await request(server()).get('/api/v1/auth/me').set('Cookie', alice.cookie).expect(200);
  });

  it('expiração usa relógio do servidor e rejeita sessão expirada mesmo com cookie', async () => {
    const saved = now;
    try { now += 3600000; await request(server()).get('/api/v1/auth/me').set('Cookie', alice.cookie).expect(401); }
    finally { now = saved; }
    await request(server()).get('/api/v1/auth/me').set('Cookie', 'estudo_session=invalid').expect(401);
    await request(server()).get('/api/v1/subjects').expect(401);
  });

  it('limita login por peer e não aceita X-Forwarded-For para escapar do limite', async () => {
    for (let i = 0; i < 10; i++) await request(server()).post('/api/v1/auth/login').set('Origin', origin).set('X-Forwarded-For', `192.0.2.${i}`).send({ email: alice.email, password: 'errada' }).expect(401);
    const response = await request(server()).post('/api/v1/auth/login').set('Origin', origin).set('X-Forwarded-For', '198.51.100.1').send({ email: alice.email, password }).expect(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });
});
