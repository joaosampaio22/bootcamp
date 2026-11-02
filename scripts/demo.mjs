import 'reflect-metadata';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { requireDemoDatabase } from './demo-database.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
const accessPath = new URL('../.demo-access.json',import.meta.url);
function run(command,args,env = process.env) {
  const result = spawnSync(command,args,{ cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error || result.status !== 0) throw new Error('Não foi possível concluir a preparação. Confira a saída do comando.');
}
try {
  const databaseUrl = requireDemoDatabase(process.env.DEMO_DATABASE_URL,process.env.DATABASE_URL,process.env.TEST_DATABASE_URL,process.env.NODE_ENV);
  const env = { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: 'development', DEMO_MODE: 'true', PORT: '3005', API_HOST: '127.0.0.1', FRONTEND_ORIGIN: 'http://localhost:5175', JWT_SECRET: process.env.DEMO_JWT_SECRET, COOKIE_SECURE: 'false', VITE_DEMO_MODE: 'true' };
  const command = process.argv[2] ?? 'start';
  if (!['setup','seed','access','start'].includes(command)) throw new Error('Use demo:setup, demo:seed, demo:access ou demo.');
  if (!/^[a-f0-9]{64}$/i.test(env.JWT_SECRET ?? '')) throw new Error('Execute npm run setup:env para preparar a chave local de demonstração.');
  if (command === 'setup') {
    run('docker',['compose','--profile','demo','up','-d','--wait','db-demo']);
    run('npm',['run','db:migrate'],env);
  }
  if (command !== 'start') {
    run('npm',['run','build','--workspace','@estudo-em-dia/api']);
    const [{ PrismaClient },{ PrismaPg },{ PasswordService },{ seedDemo,DEMO_EMAIL }] = await Promise.all([
      import('../apps/api/dist/generated/prisma/client.js'),import('@prisma/adapter-pg'),import('../apps/api/dist/auth/password.service.js'),import('../apps/api/dist/demo/demo-seed.js')
    ]);
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    try {
      let access;
      try { access = JSON.parse(await readFile(accessPath,'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw new Error('Arquivo de acesso local inválido. Preserve-o e confira a documentação.', { cause: error }); }
      if (access && (access.email !== DEMO_EMAIL || typeof access.password !== 'string')) throw new Error('Arquivo de acesso local incompatível.');
      const previous = await db.user.findUnique({ where: { emailNormalized: DEMO_EMAIL } });
      if (previous && !previous.isDemo) throw new Error('A conta existente não é de demonstração. Nenhum dado foi alterado.');
      if (previous && !access && command !== 'access') throw new Error('Acesso local ausente. Use npm run demo:access para gerar outra senha sem apagar progresso.');
      if (!access || command === 'access') access = { email: DEMO_EMAIL, password: randomBytes(24).toString('base64url') };
      const passwordHash = await new PasswordService().hash(access.password);
      if (command === 'access' && previous) {
        await db.$transaction(async (tx) => {
          await tx.user.update({ where: { id: previous.id, isDemo: true }, data: { passwordHash } });
          await tx.authSession.updateMany({ where: { userId: previous.id }, data: { revokedAt: new Date() } });
        });
      } else await seedDemo(db,DEMO_EMAIL,passwordHash,new Date());
      await writeFile(accessPath,JSON.stringify(access,null,2) + '\n',{ mode: 0o600 }); await chmod(accessPath,0o600);
      console.log('Demonstração pronta. Acesso fictício salvo em .demo-access.json, fora do Git. Dados existentes preservados.');
    } finally { await db.$disconnect(); }
  } else {
    console.log('Demonstração local: http://localhost:5175/login. Consulte .demo-access.json para entrar. Ctrl+C encerra os servidores.');
    const child = spawn(process.execPath,['node_modules/concurrently/dist/bin/concurrently.js','--kill-others','--names','demo-api,demo-web','npm run start --workspace @estudo-em-dia/api','npm run dev --workspace @estudo-em-dia/web -- --port 5175 --host 127.0.0.1'],{ cwd: root, env, stdio: 'inherit' });
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal,() => child.kill(signal));
    child.on('exit',(code) => { process.exitCode = code ?? 1; });
  }
} catch (error) {
  const operational = typeof error === 'object' && error !== null && ('code' in error || (error instanceof Error && error.name.startsWith('Prisma')));
  console.error(error instanceof Error && !operational ? error.message : 'Falha ao preparar demonstração. Confira o banco e os comandos de configuração.'); process.exitCode = 1;
}
