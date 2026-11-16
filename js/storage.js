import { RULES_VERSION, simulate, validate } from './finance.js';
export const STORAGE_KEY = 'investlab.simulations.v1';
export const MAX_RECORDS = 100;

export function readHistory(storage = globalThis.localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('O histórico está corrompido. Os dados originais foram preservados.'); }
  if (data?.version !== 1 || !Array.isArray(data.simulations) || data.simulations.length > MAX_RECORDS) throw new Error('Formato do histórico incompatível. Os dados originais foram preservados.');
  const ids = new Set();
  for (const record of data.simulations) {
    if (!record || record.version !== 1 || record.rulesVersion !== RULES_VERSION || typeof record.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(record.id) || ids.has(record.id) || typeof record.name !== 'string' || record.name.length > 80 || !record.name.trim() || !Number.isFinite(Date.parse(record.createdAt)) || !record.input || Object.keys(validate(record.input)).length) {
      throw new Error('O histórico contém registro inválido ou premissas incompatíveis. Os dados originais foram preservados.');
    }
    try { simulate(record.input); } catch { throw new Error('O histórico contém uma projeção fora dos limites. Os dados originais foram preservados.'); }
    ids.add(record.id);
  }
  return data.simulations;
}

export function saveSimulation(name, input, storage = globalThis.localStorage) {
  const normalized = name.trim();
  if (!normalized || normalized.length > 80) throw new Error('Dê um nome à simulação, com até 80 caracteres.');
  if (Object.keys(validate(input)).length) throw new Error('A simulação contém parâmetros inválidos.');
  simulate(input);
  const records = readHistory(storage);
  if (records.length >= MAX_RECORDS) throw new Error('Limite de 100 simulações atingido. Exclua uma antes de salvar.');
  const record = { version: 1, rulesVersion: RULES_VERSION, id: globalThis.crypto.randomUUID(), name: normalized, createdAt: new Date().toISOString(), input: { ...input } };
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, simulations: [record, ...records] }));
  return record;
}

export function deleteSimulation(id, storage = globalThis.localStorage) {
  const records = readHistory(storage);
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, simulations: records.filter(record => record.id !== id) }));
}
