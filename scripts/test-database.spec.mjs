import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireTestDatabase } from './test-database.mjs';

test('recusa URL ausente ou um banco de desenvolvimento antes de migrar', () => {
  for (const url of [undefined, '', 'not-a-url', 'https://db.test/app_test', 'postgresql://localhost/app']) {
    assert.throws(() => requireTestDatabase(url), /banco separado/);
  }
});

test('recusa o mesmo banco mesmo com credenciais, schema e aliases de loopback diferentes', () => {
  assert.throws(() => requireTestDatabase(
    'postgresql://test:fixture@localhost:5432/app_test?schema=test',
    'postgresql://dev:other@127.0.0.1/app_test?schema=public'
  ), /banco separado/);
});

test('aceita servidor de teste isolado por porta', () => {
  const url = 'postgresql://localhost:5433/app_test';
  assert.equal(requireTestDatabase(url, 'postgresql://localhost:5432/app_test'), url);
});

test('aceita um banco de teste com nome separado no mesmo servidor', () => {
  const url = 'postgresql://localhost/app_test';
  assert.equal(requireTestDatabase(url, 'postgresql://localhost/app'), url);
});
