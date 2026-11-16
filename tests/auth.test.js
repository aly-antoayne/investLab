import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNT_KEY, SESSION_KEY, DEMO_PASSWORD, ensureAccount, readAccount, currentAccount, login, logout, updateProfile, validateProfile, initials } from '../js/auth.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('criação única, sessão persistente, edição e logout preservam conta e histórico', () => {
  const storage = memoryStorage();
  storage.setItem('investlab.simulations.v1', 'histórico original');
  const account = ensureAccount(storage);
  assert.equal(account.name, 'Usuário InvestLab');
  assert.deepEqual(ensureAccount(storage), account);
  assert.equal(currentAccount(storage), null);
  login(' USUARIO@INVESTLAB.LOCAL ', DEMO_PASSWORD, storage);
  assert.equal(currentAccount(storage).id, account.id);
  assert.equal(JSON.parse(storage.getItem(SESSION_KEY)).password, undefined);
  const updated = updateProfile({ name: '  Ana Érica  ', email: ' ANA@EXAMPLE.COM ', bio: '' }, account.revision, storage);
  assert.equal(updated.id, account.id);
  assert.equal(updated.createdAt, account.createdAt);
  assert.equal(updated.name, 'Ana Érica');
  assert.equal(updated.email, 'ana@example.com');
  assert.deepEqual(ensureAccount(storage), updated);
  logout(storage);
  assert.equal(currentAccount(storage), null);
  assert.equal(readAccount(storage).name, 'Ana Érica');
  assert.throws(() => login(account.email, DEMO_PASSWORD, storage), /inválidos/);
  login(updated.email, DEMO_PASSWORD, storage);
  assert.equal(currentAccount(storage).email, updated.email);
  assert.equal(storage.getItem('investlab.simulations.v1'), 'histórico original');
});

test('credenciais incorretas não criam sessão; senha é exata', () => {
  const storage = memoryStorage();
  for (const [email, password] of [['outro@example.com', DEMO_PASSWORD], ['usuario@investlab.local', 'investlab123!'], ['usuario@investlab.local', DEMO_PASSWORD + ' ']]) {
    assert.throws(() => login(email, password, storage), /E-mail ou senha inválidos/);
    assert.equal(storage.getItem(SESSION_KEY), null);
  }
});

test('valida limites do perfil e iniciais com acentos e nome único', () => {
  assert.deepEqual(validateProfile({ name: 'Érica', email: 'e@example.com', bio: '' }), {});
  assert.deepEqual(validateProfile({ name: 'A'.repeat(80), email: 'e@example.com', bio: 'B'.repeat(280) }), {});
  assert.deepEqual(Object.keys(validateProfile({ name: ' ', email: 'inválido', bio: 'A'.repeat(281) })), ['name', 'email', 'bio']);
  assert.ok(validateProfile({ name: 'A'.repeat(81), email: 'a'.repeat(250) + '@a.com', bio: '' }).email);
  assert.equal(initials('Usuário InvestLab'), 'UI');
  assert.equal(initials('Érica'), 'É');
  assert.equal(initials(' Ana Maria Érica '), 'AÉ');
});

test('registros corrompidos, parciais ou incompatíveis são preservados', () => {
  const storage = memoryStorage();
  for (const raw of ['{invalid', 'null', '{}', '{"version":2}']) {
    storage.setItem(ACCOUNT_KEY, raw);
    assert.throws(() => ensureAccount(storage), /corrompido|inválido|incompatível/);
    assert.equal(storage.getItem(ACCOUNT_KEY), raw);
  }
});

test('sessões inválidas e conta removida não autorizam perfil; recriação remove sessão antiga', () => {
  const storage = memoryStorage();
  const account = ensureAccount(storage);
  for (const raw of ['{broken', 'null', '{}', JSON.stringify({ version: 1, accountId: 'outro', loggedInAt: account.createdAt })]) {
    storage.setItem(SESSION_KEY, raw);
    assert.equal(currentAccount(storage), null);
    assert.throws(() => updateProfile(account, account.revision, storage), /sessão/);
  }
  login(account.email, DEMO_PASSWORD, storage);
  storage.removeItem(ACCOUNT_KEY);
  assert.equal(currentAccount(storage), null);
  ensureAccount(storage);
  assert.equal(currentAccount(storage), null);
  assert.equal(storage.getItem(SESSION_KEY), null);
});

test('rejeita edição desatualizada e edição após logout em outra aba', () => {
  const storage = memoryStorage();
  const original = ensureAccount(storage);
  login(original.email, DEMO_PASSWORD, storage);
  const updated = updateProfile({ ...original, name: 'Outra aba' }, original.revision, storage);
  assert.throws(() => updateProfile(original, original.revision, storage), /outra aba/);
  assert.deepEqual(readAccount(storage), updated);
  logout(storage);
  assert.throws(() => updateProfile(updated, updated.revision, storage), /sessão/);
});

test('falhas em criação, login, edição e logout não modificam os dados anteriores', () => {
  const storage = memoryStorage();
  const setItem = storage.setItem;
  const fail = () => { throw new DOMException('Quota', 'QuotaExceededError'); };
  storage.setItem = fail;
  assert.throws(() => ensureAccount(storage), { name: 'QuotaExceededError' });
  assert.equal(storage.getItem(ACCOUNT_KEY), null);
  storage.setItem = setItem;
  const account = ensureAccount(storage);
  storage.setItem = fail;
  assert.throws(() => login(account.email, DEMO_PASSWORD, storage));
  assert.equal(currentAccount(storage), null);
  storage.setItem = setItem;
  login(account.email, DEMO_PASSWORD, storage);
  storage.setItem = fail;
  assert.throws(() => updateProfile({ ...account, name: 'Nome novo' }, account.revision, storage));
  assert.deepEqual(readAccount(storage), account);
  storage.removeItem = fail;
  assert.throws(() => logout(storage));
  assert.equal(currentAccount(storage).id, account.id);
  assert.throws(() => ensureAccount({ getItem() { throw new DOMException('Bloqueado', 'SecurityError'); } }), { name: 'SecurityError' });
});
