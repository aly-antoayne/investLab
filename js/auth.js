// Acesso demonstrativo local. A credencial é pública e não protege dados sensíveis.
export const ACCOUNT_KEY = 'investlab.account.v1';
export const SESSION_KEY = 'investlab.session.v1';
export const DEMO_PASSWORD = 'InvestLab123!';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = value => value.trim().toLowerCase();

export function validateProfile({ name, email, bio }) {
  const errors = {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) errors.name = 'Informe um nome de 2 a 80 caracteres.';
  if (typeof email !== 'string' || email.trim().length > 254 || !emailPattern.test(email.trim())) errors.email = 'Informe um e-mail válido com até 254 caracteres.';
  if (typeof bio !== 'string' || bio.length > 280) errors.bio = 'A biografia deve ter até 280 caracteres.';
  return errors;
}

export function initials(name) {
  const parts = name.trim().split(/\s+/u);
  return (Array.from(parts[0])[0] + (parts.length > 1 ? Array.from(parts.at(-1))[0] : '')).toLocaleUpperCase('pt-BR');
}

export function readAccount(storage = globalThis.localStorage) {
  const raw = storage.getItem(ACCOUNT_KEY);
  if (raw === null) return null;
  let account;
  try { account = JSON.parse(raw); } catch { throw new Error('O perfil local está corrompido. Os dados originais foram preservados.'); }
  if (!account || account.version !== 1 || typeof account.id !== 'string' || !account.id || typeof account.revision !== 'string' || !account.revision || account.password !== DEMO_PASSWORD || Object.keys(validateProfile(account)).length || !Number.isFinite(Date.parse(account.createdAt)) || !Number.isFinite(Date.parse(account.updatedAt))) {
    throw new Error('O perfil local está inválido ou incompatível. Os dados originais foram preservados.');
  }
  return account;
}

export function ensureAccount(storage = globalThis.localStorage) {
  const existing = readAccount(storage);
  if (existing) return existing;
  // Uma sessão antiga não deve autenticar uma conta recriada.
  storage.removeItem(SESSION_KEY);
  const now = new Date().toISOString();
  const account = { version: 1, id: 'investlab-local-user', revision: globalThis.crypto.randomUUID(), name: 'Usuário InvestLab', email: 'usuario@investlab.local', bio: 'Estou começando a planejar meu futuro financeiro com o InvestLab.', password: DEMO_PASSWORD, createdAt: now, updatedAt: now };
  storage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  return account;
}

export function currentAccount(storage = globalThis.localStorage) {
  const account = readAccount(storage);
  const raw = storage.getItem(SESSION_KEY);
  if (!account || raw === null) return null;
  let session;
  try { session = JSON.parse(raw); } catch { return null; }
  return session?.version === 1 && session.accountId === account.id && Number.isFinite(Date.parse(session.loggedInAt)) ? account : null;
}

export function login(email, password, storage = globalThis.localStorage) {
  const account = ensureAccount(storage);
  if (normalizeEmail(email) !== normalizeEmail(account.email) || password !== account.password) throw new Error('E-mail ou senha inválidos.');
  storage.setItem(SESSION_KEY, JSON.stringify({ version: 1, accountId: account.id, loggedInAt: new Date().toISOString() }));
  return account;
}

export function updateProfile(values, expectedRevision, storage = globalThis.localStorage) {
  const account = currentAccount(storage);
  if (!account) throw new Error('Sua sessão foi encerrada. Entre novamente para editar o perfil.');
  if (account.revision !== expectedRevision) throw new Error('O perfil foi alterado em outra aba. Recarregue o perfil antes de salvar.');
  if (Object.keys(validateProfile(values)).length) throw new Error('Revise os campos do perfil.');
  const updated = { ...account, name: values.name.trim(), email: normalizeEmail(values.email), bio: values.bio, revision: globalThis.crypto.randomUUID(), updatedAt: new Date().toISOString() };
  storage.setItem(ACCOUNT_KEY, JSON.stringify(updated));
  return updated;
}

export function logout(storage = globalThis.localStorage) {
  storage.removeItem(SESSION_KEY);
}
