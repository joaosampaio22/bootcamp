function parseDatabase(value) {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length <= 1) return null;
    return url;
  } catch {
    return null;
  }
}

function identity(url) {
  const host = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ? 'loopback' : url.hostname;
  return `${host}:${url.port || '5432'}/${decodeURIComponent(url.pathname.slice(1))}`;
}

export function requireTestDatabase(testValue, developmentValue) {
  const test = parseDatabase(testValue);
  const development = parseDatabase(developmentValue);
  if (!test || !decodeURIComponent(test.pathname).endsWith('_test') ||
      (development && identity(test) === identity(development))) {
    throw new Error('Defina TEST_DATABASE_URL com banco separado cujo nome termine em _test.');
  }
  return testValue;
}
