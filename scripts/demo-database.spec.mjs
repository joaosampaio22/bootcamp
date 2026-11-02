import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireDemoDatabase } from './demo-database.mjs';

const demo = 'postgresql://example:example@127.0.0.1:5434/estudo_demo';
test('demo permite somente banco local separado, sem depender de credenciais reais',() => {
  assert.equal(requireDemoDatabase(demo,'postgresql://localhost:5432/estudo','postgresql://localhost:5433/estudo_test','development'),demo);
});
test('demo recusa produção mesmo com URL local válida',() => { assert.throws(() => requireDemoDatabase(demo,undefined,undefined,'production')); });
test('demo recusa banco remoto ou sem sufixo reservado',() => {
  for (const url of ['postgresql://remote.example/estudo_demo','postgresql://127.0.0.1/estudo','file:/estudo_demo',undefined]) assert.throws(() => requireDemoDatabase(url));
});
test('demo recusa colisão com desenvolvimento ou teste, inclusive alias localhost',() => {
  assert.throws(() => requireDemoDatabase(demo,'postgresql://localhost:5434/estudo_demo'));
  assert.throws(() => requireDemoDatabase(demo,undefined,'postgresql://localhost:5434/estudo_demo'));
});
