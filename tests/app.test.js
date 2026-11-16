import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// Integração de DOM, não teste visual: apenas a camada de gráficos é substituída.
const bundled = await build({ entryPoints: ['js/app.js'], bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{ name: 'charts-test-double', setup(builder) { builder.onLoad({ filter: /[\\/]charts\.js$/ }, () => ({ contents: 'export function clearCharts(){}; export function comparisonChart(){}; export function composition(){}; export function evolution(){};', loader: 'js' })); } }] });
const html = (await readFile(new URL('../index.html', import.meta.url), 'utf8')).replace(/<script type="module"[^>]+><\/script>/, '');

function app(hash = '#simulador', storageRaw = null, accountData = {}, configure = () => {}) {
  const dom = new JSDOM(html, { url: 'http://localhost/' + hash, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  Object.defineProperty(window.crypto, 'randomUUID', { value: randomUUID });
  if (storageRaw !== null) window.localStorage.setItem('investlab.simulations.v1', storageRaw);
  for (const [key, value] of Object.entries(accountData)) window.localStorage.setItem(key, value);
  configure(window);
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

test('entrada sem sessão mostra login antes do início e permite continuar como convidado', async () => {
  const a = app('');
  try {
    assert.equal(a.window.location.hash, '#login');
    assert.ok(a.document.querySelector('#login-form'));
    assert.equal(a.document.body.classList.contains('access-screen'), true);
    const changed = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
    a.document.querySelector('#continue-guest').click(); await changed;
    assert.equal(a.window.location.hash, '#inicio');
    assert.ok(a.document.querySelector('#home-chart'));
    assert.equal(a.document.body.classList.contains('access-screen'), false);
    assert.equal(a.window.localStorage.getItem('investlab.session.v1'), null);
    await a.navigate('simulador');
    a.submit();
    assert.ok(a.document.querySelector('#save-current'));
  } finally { a.dom.window.close(); }
});

test('login de entrada abre início e sessão existente evita repetir a tela de acesso', async () => {
  const a = app('');
  try {
    a.document.querySelector('#fill-demo').click();
    assert.equal(a.document.querySelector('#email').value, 'usuario@investlab.local');
    assert.equal(a.document.querySelector('#password').type, 'password');
    a.document.querySelector('#toggle-password').click();
    assert.equal(a.document.querySelector('#password').type, 'text');
    assert.equal(a.document.querySelector('#toggle-password').getAttribute('aria-pressed'), 'true');
    a.document.querySelector('#toggle-password').click();
    assert.equal(a.document.querySelector('#password').type, 'password');
    const changed = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
    a.submit(); await changed;
    assert.equal(a.window.location.hash, '#inicio');
    assert.ok(a.document.querySelector('#home-chart'));
    const reloaded = app('', null, accountData(a));
    try {
      assert.equal(reloaded.window.location.hash, '#inicio');
      assert.equal(reloaded.document.querySelector('#login-form'), null);
      assert.ok(reloaded.document.querySelector('#logout'));
    } finally { reloaded.dom.window.close(); }
  } finally { a.dom.window.close(); }
});

test('exemplo do início transfere parâmetros reais para o simulador', async () => {
  const a = app('#inicio');
  try {
    const changed = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
    a.document.querySelector('#explore-sample').click(); await changed;
    assert.equal(a.document.querySelector('#initial').value, '1.000');
    assert.equal(a.document.querySelector('#monthly').value, '300');
    assert.equal(a.document.querySelector('#duration').value, '10');
    assert.equal(a.document.querySelector('#rate').value, '10');
    assert.equal(a.document.querySelector('#stale-sim').hidden, true);
  } finally { a.dom.window.close(); }
});

test('redefinir simulador restaura o exemplo sem apagar histórico salvo', () => {
  const a = app();
  try {
    a.document.querySelector('#save-current').click();
    a.document.querySelector('#simulation-name').value = 'Preservar no reset';
    a.submit(a.document.querySelector('#save-form'));
    const history = a.window.localStorage.getItem('investlab.simulations.v1');
    a.set('monthly', '900'); a.submit();
    a.document.querySelector('#reset-sim').click();
    assert.equal(a.document.querySelector('#monthly').value, '500');
    assert.match(a.document.querySelector('[data-testid=gross-result]').textContent, /392\.767,11/);
    assert.equal(a.window.localStorage.getItem('investlab.simulations.v1'), history);
  } finally { a.dom.window.close(); }
});

test('sincronização explícita do comparador recupera a base da última simulação', () => {
  const a = app('#comparador');
  try {
    a.set('monthly', '900'); a.submit();
    a.document.querySelector('#sync-comparison').click();
    assert.equal(a.document.querySelector('#monthly').value, '500');
    assert.match(a.document.querySelector('#compare-results').textContent, /392\.767,11/);
  } finally { a.dom.window.close(); }
});

test('busca e filtros do histórico exibem registros corretos sem alterar armazenamento', async () => {
  const a = app();
  try {
    for (const [name, type] of [['Plano Alpha', 'cdb'], ['Plano Beta', 'bitcoin']]) {
      a.set('type', type); a.submit();
      a.document.querySelector('#save-current').click();
      a.document.querySelector('#simulation-name').value = name;
      a.submit(a.document.querySelector('#save-form'));
    }
    const history = a.window.localStorage.getItem('investlab.simulations.v1');
    await a.navigate('historico');
    const visibleRows = () => [...a.document.querySelectorAll('#history-content tbody tr')].filter(row => !row.hidden);
    const query = a.document.querySelector('#history-search');
    query.value = 'alpha'; query.dispatchEvent(new a.window.Event('input'));
    assert.equal(visibleRows().length, 1);
    assert.match(visibleRows()[0].textContent, /Plano Alpha/);
    query.value = ''; query.dispatchEvent(new a.window.Event('input'));
    a.document.querySelector('[data-history-filter=crypto]').click();
    assert.equal(visibleRows().length, 1);
    assert.match(visibleRows()[0].textContent, /Plano Beta/);
    query.value = 'inexistente'; query.dispatchEvent(new a.window.Event('input'));
    assert.equal(visibleRows().length, 0);
    assert.equal(a.document.querySelector('#history-content [role=status]').hidden, false);
    assert.equal(a.window.localStorage.getItem('investlab.simulations.v1'), history);
  } finally { a.dom.window.close(); }
});

const accountKey = 'investlab.account.v1';
const sessionKey = 'investlab.session.v1';
const accountData = a => Object.fromEntries([accountKey, sessionKey].flatMap(key => {
  const value = a.window.localStorage.getItem(key);
  return value === null ? [] : [[key, value]];
}));
async function enterAccount(a) {
  if (a.window.location.hash !== '#login') await a.navigate('login');
  a.set('email', ' USUARIO@INVESTLAB.LOCAL ');
  a.set('password', 'InvestLab123!');
  const changed = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
  a.submit();
  await changed;
  if (a.window.location.hash !== '#perfil') await a.navigate('perfil');
}

test('login, perfil, cancelamento, recarga e logout preservam dados e histórico', async () => {
  const a = app('#login');
  try {
    assert.match(a.document.querySelector('.demo-credentials').textContent, /usuario@investlab.local/);
    a.submit();
    assert.equal(a.document.querySelector('#email').getAttribute('aria-invalid'), 'true');
    a.set('email', 'usuario@investlab.local'); a.set('password', 'errada'); a.submit();
    assert.match(a.document.querySelector('#auth-error').textContent, /E-mail ou senha inválidos/);
    assert.equal(a.window.localStorage.getItem(sessionKey), null);
    await enterAccount(a);
    assert.ok(a.document.querySelector('#profile-form'));
    assert.equal(a.document.querySelector('#password'), null);
    assert.equal(a.document.querySelector('.profile-avatar').textContent, 'UI');
    a.set('name', 'Descartar'); a.document.querySelector('#cancel-profile').click();
    assert.equal(a.document.querySelector('#name').value, 'Usuário InvestLab');
    a.set('name', 'Ana Érica'); a.set('email', 'ana@example.com'); a.set('bio', '<img src=x onerror=alert(1)>'); a.submit();
    assert.match(a.document.querySelector('#account-controls').textContent, /Ana Érica/);
    assert.equal(a.document.querySelector('.profile-avatar').textContent, 'AÉ');
    assert.equal(a.document.querySelector('#bio').value, '<img src=x onerror=alert(1)>');
    assert.equal(a.document.querySelector('main img'), null);
    const reloaded = app('#perfil', null, accountData(a));
    try { assert.equal(reloaded.document.querySelector('#name').value, 'Ana Érica'); } finally { reloaded.dom.window.close(); }
    await a.navigate('simulador');
    a.document.querySelector('#save-current').click();
    a.document.querySelector('#simulation-name').value = 'Preservar'; a.submit(a.document.querySelector('#save-form'));
    const history = a.window.localStorage.getItem('investlab.simulations.v1');
    const changed = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
    a.document.querySelector('#logout').click(); await changed;
    assert.equal(a.window.location.hash, '#login');
    assert.equal(a.window.localStorage.getItem(sessionKey), null);
    assert.equal(a.window.localStorage.getItem('investlab.simulations.v1'), history);
    const signedOut = app('#login', history, accountData(a));
    try {
      assert.match(signedOut.document.querySelector('.demo-credentials').textContent, /ana@example.com/);
      signedOut.set('email', 'ana@example.com'); signedOut.set('password', 'InvestLab123!');
      const entered = new Promise(resolve => signedOut.window.addEventListener('hashchange', resolve, { once: true }));
      signedOut.submit(); await entered;
      await signedOut.navigate('perfil');
      assert.equal(signedOut.document.querySelector('#bio').value, '<img src=x onerror=alert(1)>');
    } finally { signedOut.dom.window.close(); }
  } finally { a.dom.window.close(); }
});

test('perfil sem sessão leva ao login e retorna ao perfil após entrar', async () => {
  const a = app('#perfil');
  try {
    await new Promise(resolve => a.window.setTimeout(resolve, 20));
    assert.equal(a.window.location.hash, '#login');
    assert.equal(a.document.querySelector('#profile-form'), null);
    await enterAccount(a);
    assert.equal(a.window.location.hash, '#perfil');
  } finally { a.dom.window.close(); }
});

test('falhas ao salvar e sair preservam formulário, perfil e sessão', async () => {
  const a = app('#login');
  try {
    await enterAccount(a);
    const original = a.window.localStorage.getItem(accountKey);
    a.set('name', 'Nome atualizado');
    const proto = Object.getPrototypeOf(a.window.localStorage);
    const originalSet = proto.setItem;
    proto.setItem = () => { throw new a.window.DOMException('Quota', 'QuotaExceededError'); };
    a.submit();
    assert.match(a.document.querySelector('#auth-error').textContent, /Sem espaço/);
    assert.equal(a.document.querySelector('#name').value, 'Nome atualizado');
    assert.equal(a.window.localStorage.getItem(accountKey), original);
    proto.setItem = originalSet;
    a.submit();
    assert.equal(JSON.parse(a.window.localStorage.getItem(accountKey)).name, 'Nome atualizado');
    proto.removeItem = () => { throw new a.window.DOMException('Bloqueado', 'SecurityError'); };
    a.document.querySelector('#logout').click();
    assert.ok(a.window.localStorage.getItem(sessionKey));
    assert.ok(a.document.querySelector('#logout'));
    assert.match(a.document.querySelector('#toast').textContent, /não foi concluída/);
  } finally { a.dom.window.close(); }
});

test('alteração em outra aba bloqueia formulário desatualizado; logout externo exige login', async () => {
  const a = app('#login');
  try {
    await enterAccount(a);
    a.set('bio', 'Rascunho desta aba');
    const external = JSON.parse(a.window.localStorage.getItem(accountKey));
    external.name = 'Outra aba'; external.revision = 'external-revision';
    a.window.localStorage.setItem(accountKey, JSON.stringify(external));
    a.window.dispatchEvent(new a.window.StorageEvent('storage', { key: accountKey }));
    assert.equal(a.document.querySelector('#bio').value, 'Rascunho desta aba');
    a.submit();
    assert.match(a.document.querySelector('#auth-error').textContent, /outra aba/);
    assert.equal(JSON.parse(a.window.localStorage.getItem(accountKey)).name, 'Outra aba');
    a.document.querySelector('#reload-profile').click();
    assert.equal(a.document.querySelector('#name').value, 'Outra aba');
    const changed = new Promise(resolve => a.window.addEventListener('hashchange', resolve, { once: true }));
    a.window.localStorage.removeItem(sessionKey);
    a.window.dispatchEvent(new a.window.StorageEvent('storage', { key: sessionKey }));
    await changed;
    assert.equal(a.window.location.hash, '#login');
    assert.equal(a.document.querySelector('#profile-form'), null);
  } finally { a.dom.window.close(); }
});

test('perfil corrompido não é sobrescrito e não interrompe áreas públicas', async () => {
  const a = app('#login', null, { [accountKey]: '{broken' });
  try {
    assert.match(a.document.querySelector('#auth-error').textContent, /corrompido/);
    assert.equal(a.window.localStorage.getItem(accountKey), '{broken');
    await a.navigate('simulador'); a.submit();
    assert.ok(a.document.querySelector('[data-testid=gross-result]'));
  } finally { a.dom.window.close(); }
});

test('armazenamento bloqueado explica a falha no login e mantém o simulador utilizável', async () => {
  const a = app('#login', null, {}, window => {
    Object.defineProperty(window, 'localStorage', { get() { throw new window.DOMException('Bloqueado', 'SecurityError'); } });
  });
  try {
    assert.match(a.document.querySelector('#auth-error').textContent, /bloqueou/);
    a.set('email', 'usuario@investlab.local'); a.set('password', 'InvestLab123!'); a.submit();
    assert.match(a.document.querySelector('#auth-error').textContent, /não foi concluída/);
    assert.equal(a.document.querySelector('#logout'), null);
    await a.navigate('simulador'); a.submit();
    assert.ok(a.document.querySelector('[data-testid=gross-result]'));
  } finally { a.dom.window.close(); }
});

test('falha de quota no login não anuncia sucesso nem cria sessão', () => {
  const a = app('#login');
  try {
    Object.getPrototypeOf(a.window.localStorage).setItem = () => { throw new a.window.DOMException('Quota', 'QuotaExceededError'); };
    a.set('email', 'usuario@investlab.local'); a.set('password', 'InvestLab123!'); a.submit();
    assert.match(a.document.querySelector('#auth-error').textContent, /Sem espaço/);
    assert.equal(a.window.localStorage.getItem(sessionKey), null);
    assert.equal(a.window.location.hash, '#login');
    assert.equal(a.document.querySelector('#logout'), null);
  } finally { a.dom.window.close(); }
});
