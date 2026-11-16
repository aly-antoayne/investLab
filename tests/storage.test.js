import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../js/finance.js';
import { deleteSimulation, readHistory, saveSimulation, STORAGE_KEY } from '../js/storage.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('salvar, recarregar, consultar e excluir preserva outros registros', () => {
  const storage = memoryStorage();
  assert.deepEqual(readHistory(storage), []);
  const first = saveSimulation('Plano A', defaults(), storage);
  const second = saveSimulation('Plano B', defaults('lci'), storage);
  const reloaded = readHistory(storage);
  assert.equal(reloaded.length, 2);
  assert.equal(reloaded[0].id, second.id);
  assert.equal(reloaded[1].input.initial, 5000);
  deleteSimulation(first.id, storage);
  assert.deepEqual(readHistory(storage).map(item => item.id), [second.id]);
});

test('salvar cópia não sobrescreve original e entradas são copiadas', () => {
  const storage = memoryStorage();
  const params = defaults();
  saveSimulation('Original', params, storage);
  params.initial = 2000;
  saveSimulation('Cópia', params, storage);
  assert.equal(readHistory(storage)[1].input.initial, 5000);
  assert.equal(readHistory(storage)[0].input.initial, 2000);
});

test('JSON corrompido não é sobrescrito ao salvar', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, '{invalid');
  assert.throws(() => readHistory(storage), /corrompido/);
  assert.throws(() => saveSimulation('Teste', defaults(), storage));
  assert.equal(storage.getItem(STORAGE_KEY), '{invalid');
});

test('recusa registro com versão financeira desconhecida', () => {
  const storage = memoryStorage();
  saveSimulation('Teste', defaults(), storage);
  const data = JSON.parse(storage.getItem(STORAGE_KEY));
  data.simulations[0].rulesVersion = 'future';
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
  assert.throws(() => readHistory(storage), /incompatíveis/);
});

test('registros inválidos, ids repetidos e formato desconhecido são recusados', () => {
  const storage = memoryStorage();
  saveSimulation('Teste', defaults(), storage);
  const data = JSON.parse(storage.getItem(STORAGE_KEY));
  data.simulations.push(data.simulations[0]);
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
  assert.throws(() => readHistory(storage));
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, simulations: [] }));
  assert.throws(() => readHistory(storage), /incompatível/);
});

test('quota ou bloqueio de armazenamento é propagado sem alterar dados', () => {
  const storage = memoryStorage();
  storage.setItem = () => { throw new DOMException('Quota', 'QuotaExceededError'); };
  assert.throws(() => saveSimulation('Teste', defaults(), storage), { name: 'QuotaExceededError' });
  const blocked = { getItem() { throw new DOMException('Blocked', 'SecurityError'); } };
  assert.throws(() => readHistory(blocked), { name: 'SecurityError' });
});

test('valida nome e parâmetros antes de salvar', () => {
  const storage = memoryStorage();
  assert.throws(() => saveSimulation(' ', defaults(), storage));
  assert.throws(() => saveSimulation('A'.repeat(81), defaults(), storage));
  assert.throws(() => saveSimulation('Teste', { ...defaults(), months: -1 }, storage));
  assert.deepEqual(readHistory(storage), []);
});
