export function requireDemoDatabase(demoValue, developmentValue, testValue, nodeEnv) {
  let demo;
  try { demo = new URL(demoValue); } catch { throw new Error('Configure DEMO_DATABASE_URL para o banco local de demonstração.'); }
  if (nodeEnv === 'production' || !['postgres:', 'postgresql:'].includes(demo.protocol) || !['localhost','127.0.0.1','[::1]'].includes(demo.hostname) || !decodeURIComponent(demo.pathname).endsWith('_demo')) {
    throw new Error('Demonstração exige ambiente não produtivo e banco local separado terminado em _demo.');
  }
  for (const value of [developmentValue,testValue]) {
    if (!value) continue;
    const other = new URL(value);
    const host = (url) => ['localhost','127.0.0.1','[::1]'].includes(url.hostname) ? 'loopback' : url.hostname;
    if (host(demo) === host(other) && (demo.port || '5432') === (other.port || '5432') && decodeURIComponent(demo.pathname) === decodeURIComponent(other.pathname)) throw new Error('O banco de demonstração precisa ser diferente dos bancos de desenvolvimento e teste.');
  }
  return demo.toString();
}
