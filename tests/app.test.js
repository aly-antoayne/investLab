import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// Integração de DOM, não teste visual: apenas a camada de gráficos é substituída.
const bundled = await build({ entryPoints: ['js/app.js'], bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{ name: 'charts-test-double', setup(builder) { builder.onLoad({ filter: /[\\/]charts\.js$/ }, () => ({ contents: 'export function clearCharts(){}; export function comparisonChart(){}; export function composition(){}; export function evolution(){};', loader: 'js' })); } }] });
const html = (await readFile(new URL('../index.html', import.meta.url), 'utf8')).replace(/<script type="module"[^>]+><\/script>/, '');

function app(hash = '', storageRaw = null) {
  const dom = new JSDOM(html, { url: 'http://localhost/' + hash, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  Object.defineProperty(window.crypto, 'randomUUID', { value: randomUUID });
  if (storageRaw !== null) window.localStorage.setItem('investlab.simulations.v1', storageRaw);
  window.eval(bundled.outputFiles[0].text);
  const document = window.document;
  return { dom, window, document,
    set(name, value, form = document.querySelector('form')) { const field = form.elements[name]; field.value = value; field.dispatchEvent(new window.Event(field.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); },
    submit(form = document.querySelector('form')) { form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); },
    async navigate(hash) { const event = new Promise(resolve => window.addEventListener('hashchange', resolve, { once: true })); window.location.hash = hash; await event; },
  };
}

test('formulário calcula exemplo, indica alterações e bloqueia salvar resultado desatualizado', () => {
  const a = app();
  try {
    a.set('initial', '10.000,00'); a.set('monthly', '500'); a.set('duration', '10'); a.set('rate', '10');
    assert.equal(a.document.querySelector('#save-current').disabled, true);
    assert.equal(a.document.querySelector('#stale-sim').hidden, false);
    a.submit();
    assert.match(a.document.querySelector('[data-testid=gross-result]').textContent, /125\.869,35/);
    assert.equal(a.document.querySelector('#save-current').disabled, false);
    assert.equal(a.document.querySelector('#stale-sim').hidden, true);
  } finally { a.dom.window.close(); }
});

test('validação acessível mostra erro por campo e preserva último resultado', () => {
  const a = app();
  try {
    const previous = a.document.querySelector('[data-testid=gross-result]').textContent;
    a.set('monthly', '-1'); a.submit();
    assert.equal(a.document.querySelector('#monthly').getAttribute('aria-invalid'), 'true');
    assert.match(a.document.querySelector('#error-monthly').textContent, /Informe/);
    assert.equal(a.document.querySelector('[data-testid=gross-result]').textContent, previous);
  } finally { a.dom.window.close(); }
});

test('troca de unidade mantém duração, inclusive 13 meses em anos', () => {
  const a = app();
  try {
    a.set('unit', 'months');
    assert.equal(a.document.querySelector('#duration').value, '240');
    a.set('duration', '13'); a.set('unit', 'years'); a.submit();
    assert.equal(a.document.querySelector('#error-duration').textContent, '');
    assert.match(a.document.querySelector('#sim-results').textContent, /13 meses/);
  } finally { a.dom.window.close(); }
});

test('modalidade e modelo atualizam campos e aceitam cenário negativo de Ethereum', () => {
  const a = app();
  try {
    a.set('mode', 'cdi');
    assert.equal(a.document.querySelector('[data-reference=""]').hidden, false);
    assert.equal(a.document.querySelector('#rate').value, '110');
    a.set('type', 'treasury'); a.set('mode', 'indexed');
    assert.equal(a.document.querySelector('[data-fee=""]').hidden, false);
    a.set('type', 'ethereum'); a.set('rate', '-10'); a.submit();
    assert.equal(a.document.querySelector('#mode').options.length, 1);
    assert.match(a.document.querySelector('#sim-results').textContent, /Perda projetada/);
    assert.match(a.document.querySelector('#sim-results').textContent, /Não modelado/);
  } finally { a.dom.window.close(); }
});

test('comparador renderiza quatro alternativas, valida campos e recalcula com parâmetros comuns', () => {
  const a = app('#comparador');
  try {
    assert.equal(a.document.querySelectorAll('#compare-results tbody tr').length, 4);
    a.set('slot0_rate', 'inválido'); a.submit();
    assert.equal(a.document.querySelector('#slot0_rate').getAttribute('aria-invalid'), 'true');
    a.set('slot0_rate', '10'); a.set('initial', '10.000'); a.set('duration', '10'); a.submit();
    assert.equal(a.document.querySelectorAll('#compare-results tbody tr').length, 4);
    assert.match(a.document.querySelector('#compare-results tbody').textContent, /125\.869,35/);
    assert.equal(a.document.querySelector('#compare-dirty').hidden, true);
  } finally { a.dom.window.close(); }
});

test('dashboard mostra composição individual e cenários configuráveis', () => {
  const a = app('#dashboard');
  try {
    assert.equal(a.document.querySelectorAll('#scenario-results tbody tr').length, 3);
    assert.match(a.document.querySelector('main').textContent, /Aportes mensais acumulados/);
    const form = a.document.querySelector('#scenario-form');
    a.set('pessimistic', '15', form); a.set('moderate', '10', form); a.submit(form);
    assert.match(a.document.querySelector('#error-moderate').textContent, /ordem/);
  } finally { a.dom.window.close(); }
});

test('salva três registros, compara, reabre e exclui somente o selecionado', async () => {
  const a = app();
  try {
    for (const name of ['Plano A', 'Plano B', '<img src=x onerror=alert(1)>']) {
      a.document.querySelector('#save-current').click();
      assert.equal(a.document.querySelector('#save-dialog').open, true);
      a.document.querySelector('#simulation-name').value = name;
      a.submit(a.document.querySelector('#save-form'));
      assert.equal(a.document.querySelector('#save-dialog').open, false);
    }
    const persisted = a.window.localStorage.getItem('investlab.simulations.v1');
    assert.equal(JSON.parse(persisted).simulations.length, 3);
    const reloaded = app('#historico', persisted);
    assert.equal(reloaded.document.querySelectorAll('[data-open]').length, 3);
    reloaded.dom.window.close();
    await a.navigate('historico');
    assert.equal(a.document.querySelectorAll('#history-content img').length, 0);
    for (const checkbox of a.document.querySelectorAll('input[name=saved]')) { checkbox.checked = true; checkbox.dispatchEvent(new a.window.Event('change')); }
    a.document.querySelector('#compare-saved').click();
    assert.equal(a.document.querySelectorAll('#saved-results tbody tr').length, 3);
    a.document.querySelector('[data-delete]').click();
    assert.equal(a.document.querySelectorAll('[data-open]').length, 2);
    const navigated = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
    a.document.querySelector('[data-open]').click(); await navigated;
    assert.ok(a.document.querySelector('#sim-form'));
    assert.equal(JSON.parse(a.window.localStorage.getItem('investlab.simulations.v1')).simulations.length, 2);
  } finally { a.dom.window.close(); }
});

test('histórico corrompido explica falha e preserva funcionamento do simulador', async () => {
  const a = app('#historico', '{invalid');
  try {
    assert.match(a.document.querySelector('#history-content').textContent, /corrompido/);
    await a.navigate('simulador');
    a.submit();
    assert.ok(a.document.querySelector('[data-testid=gross-result]'));
    assert.equal(a.window.localStorage.getItem('investlab.simulations.v1'), '{invalid');
  } finally { a.dom.window.close(); }
});

test('sugestões do dashboard respeitam limites para perdas extremas e CDI elevado', async () => {
  for (const type of ['bitcoin', 'cdb']) {
    const a = app();
    try {
      a.set('type', type);
      if (type === 'bitcoin') a.set('rate', '-99,99');
      else { a.set('mode', 'cdi'); a.set('rate', '300'); a.set('reference', '50'); a.set('duration', '1'); }
      a.submit();
      assert.equal(a.document.querySelector('#error-rate').textContent, '');
      await a.navigate('dashboard');
      assert.equal(a.document.querySelectorAll('#scenario-results tbody tr').length, 3);
      assert.equal(a.document.querySelectorAll('#scenario-form [aria-invalid=true]').length, 0);
    } finally { a.dom.window.close(); }
  }
});


test('comparador preserva os parâmetros calculados ao alternar telas', async () => {
  const a = app('#comparador');
  try {
    a.set('initial', '12.000'); a.set('monthly', '750');
    a.set('duration', '10'); a.set('start', '2026-01-31');
    a.set('slot0_rate', '11'); a.submit();
    const expected = a.document.querySelector('#compare-results tbody').textContent;
    await a.navigate('dashboard');
    await a.navigate('comparador');
    assert.equal(a.document.querySelector('#initial').value, '12.000');
    assert.equal(a.document.querySelector('#monthly').value, '750');
    assert.equal(a.document.querySelector('#duration').value, '10');
    assert.equal(a.document.querySelector('#start').value, '2026-01-31');
    assert.equal(a.document.querySelector('#slot0_rate').value, '11');
    assert.equal(a.document.querySelector('#compare-results tbody').textContent, expected);
  } finally { a.dom.window.close(); }
});

test('nova simulação atualiza a base do comparador sem reutilizar a base antiga', async () => {
  const a = app('#comparador');
  try {
    a.set('monthly', '750'); a.submit();
    await a.navigate('simulador');
    a.set('initial', '10.000'); a.set('monthly', '600'); a.set('duration', '10'); a.submit();
    await a.navigate('comparador');
    assert.equal(a.document.querySelector('#initial').value, '10.000');
    assert.equal(a.document.querySelector('#monthly').value, '600');
    assert.equal(a.document.querySelector('#duration').value, '10');
    assert.match(a.document.querySelector('#compare-results tbody').textContent, /82\.000,00/);
  } finally { a.dom.window.close(); }
});

test('pular para o conteúdo mantém a rota e os resultados e foca o conteúdo', async () => {
  const a = app('#comparador');
  try {
    for (const route of ['comparador', 'dashboard', 'historico', 'premissas']) {
      if (a.window.location.hash !== '#' + route) await a.navigate(route);
      const content = a.document.querySelector('main').innerHTML;
      const event = new a.window.MouseEvent('click', {bubbles: true, cancelable: true});
      a.document.querySelector('.skip-link').dispatchEvent(event);
      await new Promise(resolve => a.window.setTimeout(resolve, 10));
      assert.equal(event.defaultPrevented, true);
      assert.equal(a.window.location.hash, '#' + route);
      assert.equal(a.document.activeElement.id, 'main');
      assert.equal(a.document.querySelector('main').innerHTML, content);
    }
  } finally { a.dom.window.close(); }
});
