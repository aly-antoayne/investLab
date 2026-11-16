import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, annualRate, defaults, incomeTaxRate, iofRate, parseBR, simulate, validate } from '../js/finance.js';

const input = overrides => ({ ...defaults(), start: '2026-01-01', ...overrides });
const close = (actual, expected, tolerance = 0.00001) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('exemplo acadêmico confere com fórmula fechada independente', () => {
  const P = 10000; const A = 500; const n = 120; const r = 1.1 ** (1 / 12) - 1;
  const expected = P * (1 + r) ** n + A * ((1 + r) ** n - 1) / r;
  const result = simulate(input({ initial: P, monthly: A, months: n, rate: 10 }));
  close(result.gross, expected, 0.001);
  close(result.invested, 70000);
  close(result.accumulated, (expected - 70000) / 70000 * 100);
});

test('recorrência mensal confere com fórmula para taxas e prazos distintos', () => {
  for (const rate of [-90, -10, 0, 0.00001, 5, 100]) {
    for (const months of [1, 12, 240, 600]) {
      const r = Math.expm1(Math.log1p(rate / 100) / 12);
      const expected = 1234 * (1 + r) ** months + (r === 0 ? 321 * months : 321 * Math.expm1(months * Math.log1p(r)) / r);
      if (expected > 1e18) {
        assert.throws(() => simulate(input({ type: 'bitcoin', initial: 1234, monthly: 321, rate, months })), /excede o limite/);
        continue;
      }
      const result = simulate(input({ type: 'bitcoin', initial: 1234, monthly: 321, rate, months }));
      close(result.gross / expected, 1, 1e-10);
    }
  }
});

test('taxa zero e patrimônio de apenas aportes', () => {
  const result = simulate(input({ initial: 0, monthly: 100, rate: 0, months: 12 }));
  close(result.gross, 1200); close(result.earnings, 0); close(result.net, 1200);
  assert.equal(result.series[0].gross, 0);
});

test('apenas capital inicial cresce pela taxa anual efetiva', () => {
  const result = simulate(input({ initial: 1000, monthly: 0, rate: 10, months: 12 }));
  close(result.gross, 1100);
  assert.equal(result.contributions, 0);
});

test('aporte no fim do mês não rende no próprio mês', () => {
  const result = simulate(input({ initial: 0, monthly: 100, rate: 100, months: 1 }));
  close(result.gross, 100); close(result.ir, 0); close(result.iof, 0);
  assert.equal(result.lots[0].days, 0);
});

test('taxa cripto negativa gera perda e não inventa líquido ou tributos zero', () => {
  for (const type of ['bitcoin', 'ethereum']) {
    const result = simulate(input({ type, initial: 1000, monthly: 0, rate: -50, months: 12 }));
    close(result.gross, 500); close(result.accumulated, -50);
    assert.equal(result.net, null); assert.equal(result.ir, null); assert.equal(result.iof, null); assert.equal(result.fees, null);
  }
});

test('limites das quatro faixas de IR', () => {
  for (const [days, expected] of [[0,.225], [180,.225], [181,.2], [360,.2], [361,.175], [720,.175], [721,.15]]) close(incomeTaxRate(days), expected);
});

test('tabela de IOF e isenção a partir de 30 dias', () => {
  close(iofRate(1), .96); close(iofRate(2), .93); close(iofRate(15), .5); close(iofRate(28), .06); close(iofRate(29), .03); close(iofRate(30), 0); close(iofRate(365), 0);
});

test('IR aplicado por lote em vez de tributar todos como o mais antigo', () => {
  const result = simulate(input({ initial: 1000, monthly: 500, rate: 12, months: 36 }));
  const old = result.lots[0]; const recent = result.lots.at(-2);
  assert.ok(old.days > 720); assert.ok(recent.days <= 180);
  close(old.ir / (old.gross - old.principal - old.iof), .15);
  close(recent.ir / (recent.gross - recent.principal - recent.iof), .225);
  assert.ok(result.ir > result.earnings * .15);
  close(result.net, result.gross - result.ir - result.iof);
});

test('IOF de fevereiro é deduzido da base de IR do lote', () => {
  const result = simulate(input({ initial: 1000, monthly: 0, months: 1, start: '2026-02-01', rate: 12 }));
  assert.equal(result.lots[0].days, 28);
  close(result.iof, result.earnings * .06);
  close(result.ir, (result.earnings - result.iof) * .225);
});

test('LCI e LCA isentas no perfil adotado', () => {
  const result = simulate(input({ type: 'lci', months: 120 }));
  close(result.ir, 0); close(result.iof, 0); close(result.net, result.gross);
});

test('custódia do Tesouro provisionada e descontada uma única vez', () => {
  const result = simulate(input({ type: 'treasury', fee: .2, initial: 1000, monthly: 0, months: 1, rate: 0 }));
  close(result.fees, 1000 * .002 * 31 / 365);
  close(result.net, result.gross - result.fees);
  assert.equal(result.partial, true);
  close(result.ir, 0);
});

test('100% CDI reproduz indicador e 110% usa composição diária', () => {
  close(annualRate(input({ mode: 'cdi', rate: 100, reference: 10 })), .10);
  const expected = ((1 + ((1.1 ** (1 / 252)) - 1) * 1.1) ** 252) - 1;
  close(annualRate(input({ mode: 'cdi', rate: 110, reference: 10 })), expected);
});

test('IPCA mais adicional é composição multiplicativa', () => {
  close(annualRate(input({ type: 'treasury', mode: 'indexed', reference: 4, rate: 6 })), 1.04 * 1.06 - 1);
});

test('datas de fim de mês preservam o aniversário original', () => {
  assert.equal(addMonths('2024-01-31', 1).toISOString().slice(0,10), '2024-02-29');
  assert.equal(addMonths('2024-01-31', 2).toISOString().slice(0,10), '2024-03-31');
  assert.equal(addMonths('2026-01-31', 1).toISOString().slice(0,10), '2026-02-28');
});

test('moeda e percentual brasileiros sem coerção silenciosa', () => {
  assert.equal(parseBR('10.000,50'), 10000.5);
  assert.equal(parseBR('-15,25'), -15.25);
  assert.equal(parseBR('10'), 10);
  for (const value of ['', 'abc', '1.23', '1,2,3', 'Infinity', '1e5', null, 'R$ 10']) assert.ok(Number.isNaN(parseBR(value)));
});

test('rejeita entradas inválidas e combinações incompatíveis', () => {
  const invalid = [ { initial: -1 }, { monthly: NaN }, { initial: 0, monthly: 0 }, { initial: Infinity }, { months: 0 }, { months: 601 }, { months: 1.5 }, { type: 'bitcoin', rate: -100 }, { rate: NaN }, { start: '2026-02-30' }, { type: 'lci', mode: 'indexed' }, { mode: 'cdi', reference: 51 }, { fee: -1 }, { type: 'unknown' } ];
  for (const overrides of invalid) assert.throws(() => simulate(input(overrides)));
  assert.deepEqual(validate(input()), {});
});

test('projeção excessiva falha com mensagem sem devolver infinito', () => {
  assert.throws(() => simulate(input({ initial: 1e9, rate: 100, months: 600 })), /excede o limite/);
});

test('soma dos lotes corresponde ao montante e série mensal completa', () => {
  const result = simulate(input());
  close(result.lots.reduce((sum, lot) => sum + lot.gross, 0), result.gross, .001);
  assert.equal(result.series.length, 241);
  assert.equal(result.series.at(-1).gross, result.gross);
});
