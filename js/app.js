import '../css/styles.css';
import { PRODUCTS, RULES_VERSION, annualRate, currency, defaults, isCrypto, numberBR, parseBR, percent, rateDescription, resultLabel, simulate, validate } from './finance.js';
import { deleteSimulation, readHistory, saveSimulation } from './storage.js';
import { clearCharts, comparisonChart, composition, evolution } from './charts.js';
import { createAuthUI } from './auth-ui.js';

const paths = {
  growth: '<path d="M4 19v-5m6 5V9m6 10V5m4 14V2M3 9l7-5 5 2 6-4"/>',
  home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  sliders: '<path d="M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6"/>',
  compare: '<path d="M5 20V10h5v10m4 0V4h5v16M3 20h18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sprout: '<path d="M12 21V11M12 14C3 15 2 7 3 5c6 0 9 3 9 9Zm0-3C12 4 17 2 21 3c1 5-2 9-9 8Z"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  up: '<path d="m4 16 6-6 4 3 6-9m-6 0h6v6"/>',
  wallet: '<path d="M20 8V5H5a2 2 0 0 0 0 4h16v11H5a2 2 0 0 1-2-2V7m18 5h-6v5h6m-3-2.5h.01"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 4 12 4 12 0V6M3 11v5c0 2 4 3 7 3m6-8c3 0 5 1 5 3s-2 3-5 3m-4-2v5c2 3 9 2 9-1v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  save: '<path d="M5 3h12l4 4v14H3V3h2Zm2 0v7h10V3M7 21v-7h10v7"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  leaf: '<path d="M5 20c1-6 5-9 12-12M5 16C1 5 13 2 21 3c0 9-3 17-12 16"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const $ = (selector, root = document) => root.querySelector(selector);
const main = $('#main');
let currentInput = defaults();
let currentResult = simulate(currentInput);
let compareInputs = ['cdb', 'lci', 'treasury', 'bitcoin'].map(type => defaults(type));
// Preserve a successful comparison until a new simulation becomes its source.
let compareSharedInput = null;
let compareSourceInput = currentInput;
let toastTimer;
const routeNames = { inicio: 'Início', simulador: 'Simulador', comparador: 'Comparador', dashboard: 'Dashboard', historico: 'Histórico', premissas: 'Fórmulas e premissas', login: 'Entrar', perfil: 'Meu perfil' };

function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
function notify(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 9000 : 5000);
}
function storageMessage(error) {
  if (error.name === 'QuotaExceededError') return 'Sem espaço no armazenamento local. Exclua uma simulação ou libere espaço no navegador.';
  if (error.name === 'SecurityError') return 'O navegador bloqueou o armazenamento local. Você ainda pode simular e comparar.';
  return error.message || 'Não foi possível acessar o histórico local.';
}
function updateCount() { try { $('#history-count').textContent = readHistory().length; } catch { $('#history-count').textContent = '!'; } }
const heading = (eyebrow, title, subtitle, badge = 'Planeje com perspectiva') => `<div class="page-heading"><div><div class="eyebrow"><span class="status-dot"></span>${eyebrow}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><span class="heading-mark">${icon('leaf')}${badge}</span></div>`;
const disclaimer = () => `<p class="disclaimer">${icon('info')}<span>Simulação educacional. Taxas são hipóteses, não promessas. Os resultados não representam garantia de rentabilidade, oferta ou recomendação de investimento. <a class="underline" href="#premissas">Conheça as premissas.</a></span></p>`;
const errorSlot = name => `<p class="error-text" id="error-${name}" data-error="${name}"></p>`;

function field(name, label, value, { prefix = '', suffix = '', hint = '', type = 'text', inputmode = 'decimal' } = {}) {
  return `<div class="field"><label for="${name}">${label}</label><div class="input-wrap ${suffix ? 'suffix' : ''}">${prefix ? `<span class="input-prefix">${prefix}</span>` : ''}<input id="${name}" name="${name}" type="${type}" ${type === 'text' ? `inputmode="${inputmode}"` : ''} value="${esc(type === 'text' ? numberBR(value) : value)}" aria-describedby="error-${name}${hint ? ` hint-${name}` : ''}" ${type === 'date' ? 'min="2000-01-01" max="2100-12-31"' : ''} />${suffix ? `<span class="input-suffix">${suffix}</span>` : ''}</div>${hint ? `<p id="hint-${name}" class="field-hint">${hint}</p>` : ''}${errorSlot(name)}</div>`;
}
function selectField(name, label, value, options) {
  return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}" aria-describedby="error-${name}">${options.map(([id, text]) => `<option value="${id}" ${value === id ? 'selected' : ''}>${text}</option>`).join('')}</select>${errorSlot(name)}</div>`;
}
const productOptions = Object.entries(PRODUCTS).map(([key, value]) => [key, value.name]);
const modeNames = { fixed: 'Taxa prefixada / hipotética', cdi: 'Percentual do CDI', indexed: 'IPCA + taxa adicional' };

function sharedFields(input) {
  const years = input.months % 12 === 0;
  return `${field('initial', 'Investimento inicial', input.initial, { prefix: 'R$', hint: 'De zero a R$ 1 bilhão.' })}${field('monthly', 'Aporte mensal', input.monthly, { prefix: 'R$', hint: 'No final de cada mês. Até R$ 10 milhões.' })}<div class="field"><label for="duration">Por quanto tempo?</label><div class="period-row"><input id="duration" name="duration" inputmode="decimal" value="${numberBR(years ? input.months / 12 : input.months)}" aria-describedby="error-duration hint-duration" /><select id="unit" name="unit" aria-label="Unidade do período"><option value="years" ${years ? 'selected' : ''}>Anos</option><option value="months" ${years ? '' : 'selected'}>Meses</option></select></div><p id="hint-duration" class="field-hint">De 1 a 600 meses inteiros (até 50 anos).</p>${errorSlot('duration')}</div>${field('start', 'Data inicial', input.start, { type: 'date', hint: 'Usada para calcular a idade de cada aporte.' })}`;
}
function configFields(input, prefix = '') {
  const name = key => prefix + key;
  return `${selectField(name('type'), 'Modalidade', input.type, productOptions)}${selectField(name('mode'), 'Modelo de rentabilidade', input.mode, PRODUCTS[input.type].modes.map(mode => [mode, modeNames[mode]]))}${field(name('rate'), input.mode === 'cdi' ? 'Percentual do CDI' : input.mode === 'indexed' ? 'Taxa adicional anual' : 'Rentabilidade anual', input.rate, { suffix: input.mode === 'cdi' ? '% CDI' : '% a.a.', hint: 'Hipótese configurável. Não é taxa de mercado.' })}<div data-reference="${prefix}" ${input.mode === 'fixed' ? 'hidden' : ''}>${field(name('reference'), input.mode === 'indexed' ? 'IPCA anual hipotético' : 'CDI anual hipotético', input.reference, { suffix: '% a.a.' })}</div><div data-fee="${prefix}" ${input.type === 'treasury' ? '' : 'hidden'}>${field(name('fee'), 'Custódia anual estimada', input.fee, { suffix: '% a.a.', hint: 'Aproximação mensal; não contempla Selic, Renda+ ou Educa+.' })}</div>`;
}
function refreshConfig(form, prefix = '', changed = 'type') {
  const type = form.elements[prefix + 'type'].value;
  const modeEl = form.elements[prefix + 'mode'];
  if (changed === 'type') {
    modeEl.innerHTML = PRODUCTS[type].modes.map(mode => `<option value="${mode}">${modeNames[mode]}</option>`).join('');
    form.elements[prefix + 'rate'].value = numberBR(defaults(type).rate);
    form.elements[prefix + 'fee'].value = numberBR(defaults(type).fee);
  } else form.elements[prefix + 'rate'].value = modeEl.value === 'cdi' ? '110' : modeEl.value === 'indexed' ? '6' : numberBR(defaults(type).rate);
  const mode = modeEl.value;
  const rateLabel = form.querySelector(`label[for="${prefix}rate"]`);
  rateLabel.textContent = mode === 'cdi' ? 'Percentual do CDI' : mode === 'indexed' ? 'Taxa adicional anual' : 'Rentabilidade anual';
  form.elements[prefix + 'rate'].parentElement.querySelector('.input-suffix').textContent = mode === 'cdi' ? '% CDI' : '% a.a.';
  form.querySelector(`[data-reference="${prefix}"]`).hidden = mode === 'fixed';
  form.querySelector(`label[for="${prefix}reference"]`).textContent = mode === 'indexed' ? 'IPCA anual hipotético' : 'CDI anual hipotético';
  form.querySelector(`[data-fee="${prefix}"]`).hidden = type !== 'treasury';
}
function readInput(form, prefix = '') {
  const el = key => form.elements[prefix + key];
  const shared = key => form.elements[key];
  const rawMonths = parseBR(shared('duration').value) * (shared('unit').value === 'years' ? 12 : 1);
  const months = Math.abs(rawMonths - Math.round(rawMonths)) < 1e-7 ? Math.round(rawMonths) : rawMonths;
  const type = el('type').value;
  const mode = el('mode').value;
  return { initial: parseBR(shared('initial').value), monthly: parseBR(shared('monthly').value), months, start: shared('start').value, type, mode, rate: parseBR(el('rate').value), reference: mode === 'fixed' ? 0 : parseBR(el('reference').value), fee: type === 'treasury' ? parseBR(el('fee').value) : 0 };
}
function showErrors(form, errors) {
  form.querySelectorAll('[data-error]').forEach(el => { el.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  Object.entries(errors).forEach(([key, message]) => {
    const slot = form.querySelector(`[data-error="${key}"]`);
    if (slot) slot.textContent = message;
    form.elements[key]?.setAttribute('aria-invalid', 'true');
  });
  if (Object.keys(errors).length) {
    form.querySelector('[aria-invalid=true]')?.focus();
    notify('Revise os campos indicados antes de calcular.', true);
    return false;
  }
  return true;
}
function attachFormBehavior(form, onDirty = () => {}) {
  let previousUnit = form.elements.unit.value;
  form.addEventListener('change', event => {
    const name = event.target.name;
    if (name === 'unit') {
      const value = parseBR(form.elements.duration.value);
      if (Number.isFinite(value)) {
        const converted = value * (previousUnit === 'years' ? 12 : 1 / 12);
        form.elements.duration.value = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 12, useGrouping: false }).format(converted);
      }
      previousUnit = event.target.value;
    }
    const match = /^(slot\d+_)?(type|mode)$/.exec(name);
    if (match) refreshConfig(form, match[1] ?? '', match[2]);
  });
  form.addEventListener('input', onDirty);
  form.addEventListener('change', onDirty);
}

function metric(title, value, note, symbol = 'wallet', className = '') {
  return `<div class="panel metric"><div class="metric-top">${title}${icon(symbol)}</div><div class="metric-value ${className}">${value}</div><div class="metric-note">${note}</div></div>`;
}
function resultHero(input, result) {
  return `<div class="panel result-hero"><div class="eyebrow">PATRIMÔNIO FINAL PROJETADO · BRUTO</div><div class="hero-value" data-testid="gross-result">${currency(result.gross)}</div><div class="hero-caption">${icon('shield')} Hipótese educacional</div><div class="hero-bottom"><span class="chip">${esc(PRODUCTS[input.type].name)}</span><span>${numberBR(input.months / 12)} anos</span><span aria-hidden="true">·</span><span>${percent(result.annual * 100)} a.a. efetivos</span></div></div>`;
}
function metrics(input, result) {
  return `<div class="metrics">${metric('Total investido', currency(result.invested), 'Capital inicial + todos os aportes', 'wallet')}${metric(result.earnings < 0 ? 'Perda projetada' : 'Rendimentos brutos', currency(result.earnings), 'Antes de impostos e custos', 'up', result.earnings < 0 ? 'negative' : 'positive')}${metric('Rentabilidade acumulada', percent(result.accumulated), 'Rendimento bruto ÷ total investido', 'coins', result.earnings < 0 ? 'negative' : 'positive')}</div>`;
}
function deductions(input, result) {
  const crypto = isCrypto(input.type);
  return `<div class="panel details-panel"><details><summary>Impostos, custos e resultado ${crypto ? 'bruto' : 'após deduções'}</summary><div class="details-content"><p>${esc(rateDescription(input))}. Aportes no fim do mês. Pessoa física residente no Brasil.</p><dl class="deduction-list"><dt>IR estimado por aporte</dt><dd>${crypto ? 'Não modelado' : currency(result.ir)}</dd><dt>IOF estimado por aporte</dt><dd>${crypto ? 'Não modelado' : currency(result.iof)}</dd><dt>Custódia estimada</dt><dd>${crypto ? 'Custos não modelados' : currency(result.fees)}</dd><dt>${resultLabel(input)}</dt><dd>${currency(result.net ?? result.gross)}</dd>${crypto ? '' : `<dt>Rendimento após deduções</dt><dd>${currency(result.netEarnings)}</dd><dt>Rentabilidade após deduções</dt><dd>${percent(result.netAccumulated)}</dd>`}</dl><p>${crypto ? 'Criptomoedas: tributação, corretagem e spread não modelados. O valor exibido é bruto e pode sofrer perdas.' : input.type === 'lci' ? 'Isenção de IR para pessoa física na regra de referência adotada. Custos de distribuição assumidos zero. Carências, vencimentos e disponibilidade dos títulos não são simulados.' : input.type === 'treasury' ? 'Estimativa parcial: IR e IOF por aporte; custódia aproximada sobre o saldo bruto mensal, sem desconto antecipado. Não modela marcação a mercado, cupons, reinvestimento, taxa da instituição ou regras especiais de títulos. Não representa um líquido completo.' : 'IR regressivo e IOF sobre ganhos positivos, considerando os dias de cada aporte na data de resgate. Corretagem assumida zero; não modela inadimplência, vencimentos ou reinvestimento.'}</p><p>As regras de referência são mantidas constantes como hipótese. <a class="underline" href="#premissas">Ver fontes, fórmulas e limitações ↗</a></p></div></details></div>`;
}
function yearlyTable(result) {
  const rows = result.series.filter(point => point.month === 0 || point.month % 12 === 0 || point.month === result.series.length - 1);
  return `<div class="panel details-panel"><details><summary>Ver evolução em valores</summary><div class="details-content table-scroll" role="region" aria-label="Evolução em valores" tabindex="0"><table><caption class="sr-only">Evolução do patrimônio bruto</caption><thead><tr><th>Tempo</th><th>Total investido</th><th>Patrimônio bruto</th><th>Rendimento bruto</th></tr></thead><tbody>${rows.map(point => `<tr><td>${point.month} meses</td><td>${currency(point.invested)}</td><td>${currency(point.gross)}</td><td>${currency(point.gross - point.invested)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
}
function renderSimulator() {
  main.innerHTML = heading('DO PRESENTE PARA O SEU FUTURO', 'Dê tempo aos seus planos.', 'Explore o potencial do seu dinheiro, um mês de cada vez.') + `<div class="sim-layout"><section class="panel parameter-panel" aria-labelledby="parameters-title"><div class="panel-head"><div><h2 id="parameters-title" class="panel-title">Sua próxima possibilidade</h2><p class="panel-subtitle">Ajuste os valores. Imagine o amanhã.</p></div><span class="panel-icon">${icon('sliders')}</span></div><form id="sim-form" novalidate><div class="sim-form-fields">${sharedFields(currentInput)}<div class="form-divider"></div>${configFields(currentInput)}</div><button type="submit" class="button primary w-full">Simular meu investimento ${icon('arrow')}</button><p class="form-footnote">Sem cadastro. Sem compromisso. Só possibilidades.</p></form></section><section class="results" aria-label="Resultado da simulação"><div id="stale-sim" class="stale-banner" role="status" hidden>Parâmetros alterados. Clique em “Simular meu investimento” para atualizar os resultados.</div><div id="sim-results" class="results"></div></section></div>`;
  paintSimResults();
  const form = $('#sim-form');
  attachFormBehavior(form, () => { $('#stale-sim').hidden = false; $('#save-current').disabled = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = readInput(form);
    if (!showErrors(form, validate(input))) return;
    try {
      const result = simulate(input);
      currentInput = input;
      currentResult = result;
      $('#stale-sim').hidden = true;
      paintSimResults();
      notify('Simulação atualizada. Seu próximo passo está em perspectiva.');
    } catch (error) { notify(error.message, true); }
  });
}
function paintSimResults() {
  $('#sim-results').innerHTML = `${resultHero(currentInput, currentResult)}${metrics(currentInput, currentResult)}<div class="panel chart-panel"><div class="panel-head"><div><h2 class="panel-title">O tempo trabalha com você</h2><p class="panel-subtitle">Evolução do patrimônio bruto durante ${currentInput.months} meses</p></div><span class="chart-tag">Aportes no fim do mês</span></div><div class="chart-area"><canvas id="sim-chart" role="img" aria-label="Evolução do patrimônio bruto e do total investido. Valores na tabela abaixo."></canvas></div></div><div class="results-toolbar"><button id="save-current" class="button" type="button">${icon('save')} Salvar simulação</button><a href="#comparador" class="subtle-link">Compare possibilidades ${icon('arrow')}</a></div>${deductions(currentInput, currentResult)}${yearlyTable(currentResult)}${disclaimer()}`;
  evolution('sim-chart', [{ input: currentInput, result: currentResult }]);
  $('#save-current').addEventListener('click', openSaveDialog);
}

function comparisonTable(items, saved = false) {
  return `<div class="table-scroll" role="region" aria-label="Resultados da comparação" tabindex="0"><table><caption class="sr-only">Comparação de investimentos com premissas e deduções</caption><thead><tr><th>Investimento / hipótese</th>${saved ? '<th>Parâmetros</th>' : ''}<th>Investido</th><th>Bruto / rendimento</th><th>IR / IOF / custos</th><th>Após deduções</th><th>Rentabilidade</th></tr></thead><tbody>${items.map(item => {
    const { input, result } = item;
    return `<tr><td><strong>${esc(item.name ?? PRODUCTS[input.type].name)}</strong><small>${esc(PRODUCTS[input.type].name)} · ${esc(rateDescription(input))}</small></td>${saved ? `<td>${currency(input.initial)} iniciais<small>${currency(input.monthly)}/mês · ${input.months} meses<br>Início: ${esc(input.start.split('-').reverse().join('/'))}</small></td>` : ''}<td>${currency(result.invested)}</td><td><strong>${currency(result.gross)}</strong><small class="${result.earnings < 0 ? 'negative' : 'positive'}">${currency(result.earnings)} em rendimentos</small></td><td>${isCrypto(input.type) ? 'Não modelados' : `${currency(result.ir)} / ${currency(result.iof)} / ${currency(result.fees)}`}</td><td>${result.net === null ? 'Não calculado' : currency(result.net)}<small>${resultLabel(input)}</small></td><td class="${result.earnings < 0 ? 'negative' : 'positive'}">${percent(result.accumulated)} bruto<small>${result.netAccumulated === null ? 'Líquida não modelada' : percent(result.netAccumulated) + ' após deduções'}</small></td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderComparator() {
  if (compareSourceInput !== currentInput) {
    compareSharedInput = null;
    compareSourceInput = currentInput;
  }
  main.innerHTML = heading('MAIS CLAREZA PARA ESCOLHER', 'Compare possibilidades.', 'O mesmo ponto de partida. Diferentes caminhos para o seu patrimônio.') + `<form id="compare-form" class="panel wide-panel" novalidate><div class="panel-head"><div><h2 class="panel-title">Um ponto de partida em comum</h2><p class="panel-subtitle">Capital, aporte, prazo e data iguais para todas as alternativas.</p></div><span class="panel-icon">${icon('compare')}</span></div><div class="shared-fields">${sharedFields(compareSharedInput ?? currentInput)}</div><div class="comparison-grid">${compareInputs.map((input, index) => `<div class="comparison-option"><div class="option-number">ALTERNATIVA 0${index + 1}<span class="option-color" style="background:${PRODUCTS[input.type].color}"></span></div>${configFields(input, `slot${index}_`)}</div>`).join('')}</div><button class="button primary" type="submit">Comparar investimentos ${icon('arrow')}</button><p id="compare-dirty" class="field-hint" role="status" hidden>Parâmetros alterados. Atualize a comparação para aplicar as mudanças.</p></form><div id="compare-results" class="compare-results"></div>`;
  const form = $('#compare-form');
  attachFormBehavior(form, () => { $('#compare-dirty').hidden = false; });
  const run = () => {
    const inputs = compareInputs.map((_, index) => readInput(form, `slot${index}_`));
    const errors = {};
    inputs.forEach((input, index) => Object.entries(validate(input)).forEach(([key, message]) => { errors[['initial', 'monthly', 'duration', 'start'].includes(key) ? key : `slot${index}_${key}`] = message; }));
    if (!showErrors(form, errors)) return;
    try {
      const items = inputs.map(input => ({ input, result: simulate(input) }));
      compareInputs = inputs;
      compareSharedInput = { ...inputs[0] };
      $('#compare-dirty').hidden = true;
      $('#compare-results').innerHTML = `<div class="panel chart-panel"><div class="panel-head"><div><h2 class="panel-title">Quatro caminhos, lado a lado</h2><p class="panel-subtitle">Comparação bruta para manter a mesma base. Confira as deduções na tabela.</p></div><span class="chart-tag">${inputs[0].months} meses</span></div><div class="chart-area"><canvas id="compare-chart" role="img" aria-label="Comparação de patrimônios brutos. Valores na tabela abaixo."></canvas></div></div><div class="panel">${comparisonTable(items)}</div>${disclaimer()}`;
      comparisonChart('compare-chart', items);
    } catch (error) { notify(error.message, true); }
  };
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  run();
}

function renderDashboard() {
  const result = currentResult;
  const input = currentInput;
  const scenarioBase = Math.min(100, result.annual * 100);
  main.innerHTML = heading('ENXERGUE O CAMINHO INTEIRO', 'Seu futuro, em perspectiva.', 'Uma visão da última simulação válida. Cada indicador conta uma parte da história.') + `${resultHero(input, result)}<div class="section-spacing">${metrics(input, result)}</div><div class="dashboard-grid"><div class="panel chart-panel"><div class="panel-head"><div><h2 class="panel-title">Evolução do patrimônio</h2><p class="panel-subtitle">Projeção bruta · ${esc(PRODUCTS[input.type].name)}</p></div><span class="chart-tag">${input.months} meses</span></div><div class="chart-area"><canvas id="dashboard-line" role="img" aria-label="Evolução patrimonial. Valores na tabela de evolução."></canvas></div></div><div class="panel chart-panel"><div class="panel-head"><div><h2 class="panel-title">${result.earnings < 0 ? 'Patrimônio e perda' : 'De onde vem seu patrimônio'}</h2><p class="panel-subtitle">Composição desta simulação, em valores brutos</p></div></div><div class="chart-area"><canvas id="dashboard-composition" role="img" aria-label="Composição do patrimônio. Valores abaixo."></canvas></div><dl class="deduction-list"><dt>Capital inicial</dt><dd>${currency(input.initial)}</dd><dt>Aportes mensais acumulados</dt><dd>${currency(result.contributions)}</dd><dt>${result.earnings < 0 ? 'Perda' : 'Rendimentos brutos'}</dt><dd>${currency(result.earnings)}</dd></dl></div></div><section class="panel wide-panel"><div class="panel-head"><div><h2 class="panel-title">E se o cenário mudar?</h2><p class="panel-subtitle">Ajuste três taxas anuais efetivas hipotéticas. Capital, aportes e prazo permanecem os da simulação.</p></div><span class="panel-icon">${icon('sliders')}</span></div><p class="field-hint mb-4">As taxas sugeridas se limitam a 100% a.a.; podem ser ajustadas abaixo.</p><form id="scenario-form" novalidate><div class="scenario-fields">${field('pessimistic', 'Pessimista · taxa anual', Math.max(isCrypto(input.type) ? -99.99 : 0, scenarioBase - 3), { suffix: '% a.a.' })}${field('moderate', 'Moderado · taxa anual', scenarioBase, { suffix: '% a.a.' })}${field('optimistic', 'Otimista · taxa anual', Math.min(100, scenarioBase + 3), { suffix: '% a.a.' })}</div><button type="submit" class="button light">Atualizar cenários ${icon('arrow')}</button><p id="scenario-dirty" class="field-hint" role="status" hidden>Taxas alteradas. Atualize os cenários para aplicar.</p></form><div id="scenario-results" class="section-spacing"></div></section><div class="results">${deductions(input, result)}${yearlyTable(result)}${disclaimer()}</div>`;
  evolution('dashboard-line', [{ input, result }]);
  composition('dashboard-composition', input, result);
  const form = $('#scenario-form');
  form.addEventListener('input', () => { $('#scenario-dirty').hidden = false; });
  const run = () => {
    const names = ['pessimistic', 'moderate', 'optimistic'];
    const labels = ['Pessimista', 'Moderado', 'Otimista'];
    const inputs = names.map(key => ({ ...input, mode: 'fixed', rate: parseBR(form.elements[key].value), reference: 0 }));
    const errors = {};
    inputs.forEach((value, index) => { const error = validate(value).rate; if (error) errors[names[index]] = error; });
    if (inputs[0].rate > inputs[1].rate || inputs[1].rate > inputs[2].rate) errors.moderate = 'Use taxas em ordem: pessimista ≤ moderado ≤ otimista.';
    if (!showErrors(form, errors)) return;
    try {
      const items = inputs.map((value, index) => ({ input: value, result: simulate(value), name: labels[index] }));
      $('#scenario-results').innerHTML = `<div class="chart-area"><canvas id="scenario-chart" role="img" aria-label="Comparação dos três cenários. Valores na tabela abaixo."></canvas></div>${comparisonTable(items)}`;
      comparisonChart('scenario-chart', items);
      $('#scenario-dirty').hidden = true;
    } catch (error) { notify(error.message, true); }
  };
  form.addEventListener('submit', event => { event.preventDefault(); run(); });
  run();
}

function renderHistory() {
  main.innerHTML = heading('RETOME DE ONDE SONHOU', 'Planos que merecem ficar.', 'Suas simulações salvas, prontas para uma nova perspectiva.') + `<div id="history-content"></div>`;
  let records;
  try { records = readHistory(); } catch (error) {
    $('#history-content').innerHTML = `<div class="panel empty-state">${icon('info')}<h2>Não foi possível ler o histórico</h2><p>${esc(storageMessage(error))}</p><a class="button primary" href="#simulador">Continuar simulando ${icon('arrow')}</a></div>`;
    return;
  }
  if (!records.length) {
    $('#history-content').innerHTML = `<div class="panel empty-state">${icon('clock')}<h2>Uma página para seus próximos planos.</h2><p>Salve sua primeira simulação e volte sempre que quiser explorar uma nova possibilidade. Os dados ficam apenas neste navegador.</p><a class="button primary" href="#simulador">Criar uma simulação ${icon('arrow')}</a></div>`;
    return;
  }
  $('#history-content').innerHTML = `<div class="history-toolbar"><p class="subtitle">${records.length} de 100 simulações · dados locais, sem sincronização</p><button id="compare-saved" class="button primary" disabled>Comparar selecionadas (0)</button></div><div class="panel table-scroll" role="region" aria-label="Histórico de simulações" tabindex="0"><table><caption class="sr-only">Simulações salvas no navegador</caption><thead><tr><th>Selecionar</th><th>Simulação</th><th>Premissas</th><th>Patrimônio bruto</th><th>Ações</th></tr></thead><tbody>${records.map(record => {
    const result = simulate(record.input);
    return `<tr><td><input class="accent-forest h-4 w-4" type="checkbox" name="saved" value="${esc(record.id)}" aria-label="Selecionar ${esc(record.name)}" /></td><td><strong>${esc(record.name)}</strong><small>${new Date(record.createdAt).toLocaleDateString('pt-BR')} · ${esc(PRODUCTS[record.input.type].name)}</small></td><td>${currency(record.input.initial)} + ${currency(record.input.monthly)}/mês<small>${record.input.months} meses · ${esc(rateDescription(record.input))}</small></td><td>${currency(result.gross)}<small>${percent(result.accumulated)} bruto acumulado</small></td><td><div class="history-actions"><button class="button" data-open="${esc(record.id)}">Abrir</button><button class="button danger" data-delete="${esc(record.id)}" aria-label="Excluir ${esc(record.name)}">${icon('trash')}</button></div></td></tr>`;
  }).join('')}</tbody></table></div><p class="field-hint mt-3">Selecione de 2 a 6 registros para comparar. Capital, aporte, data e prazo diferentes serão identificados. Limpar os dados do navegador apaga o histórico.</p><div id="saved-results" class="compare-results section-spacing"></div>`;
  const selection = () => [...main.querySelectorAll('input[name=saved]:checked')].map(el => el.value);
  main.querySelectorAll('input[name=saved]').forEach(el => el.addEventListener('change', () => {
    const count = selection().length;
    $('#compare-saved').textContent = `Comparar selecionadas (${count})`;
    $('#compare-saved').disabled = count < 2 || count > 6;
    $('#saved-results').innerHTML = '';
  }));
  main.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => {
    const record = records.find(item => item.id === el.dataset.open);
    try { const result = simulate(record.input); currentInput = { ...record.input }; currentResult = result; location.hash = 'simulador'; notify(`“${record.name}” aberta. Salvar criará uma nova simulação.`); }
    catch (error) { notify(error.message, true); }
  }));
  main.querySelectorAll('[data-delete]').forEach(el => el.addEventListener('click', () => {
    const record = records.find(item => item.id === el.dataset.delete);
    if (!window.confirm(`Excluir a simulação “${record.name}”? Esta ação remove apenas este registro.`)) return;
    try { deleteSimulation(record.id); updateCount(); renderHistory(); notify('Simulação excluída do histórico.'); }
    catch (error) { notify(storageMessage(error), true); }
  }));
  $('#compare-saved').addEventListener('click', () => {
    try {
      const ids = selection();
      const items = records.filter(record => ids.includes(record.id)).map(record => ({ name: record.name, input: record.input, result: simulate(record.input) }));
      $('#saved-results').innerHTML = `<div class="panel chart-panel"><div class="panel-head"><div><h2 class="panel-title">Seus planos, lado a lado</h2><p class="panel-subtitle">Cenários alternativos. Valores não representam uma carteira somada. Confira as diferenças de parâmetros abaixo.</p></div></div><div class="chart-area"><canvas id="saved-chart" role="img" aria-label="Comparação das simulações selecionadas. Valores e parâmetros na tabela abaixo."></canvas></div></div><div class="panel">${comparisonTable(items, true)}</div>${disclaimer()}`;
      comparisonChart('saved-chart', items);
    } catch (error) { notify(error.message, true); }
  });
}

function renderHome() {
  const sample = simulate(defaults());
  main.innerHTML = `<section class="panel intro-hero"><div><div class="eyebrow">UM LABORATÓRIO DE POSSIBILIDADES</div><h1>O futuro se constrói.<br>Um mês de cada vez.</h1><p>Transforme perguntas sobre dinheiro em perspectivas para o amanhã. Simule, compare e descubra o poder de começar.</p><a class="button primary" href="#simulador">Explore seu próximo plano ${icon('arrow')}</a></div><div class="intro-visual" aria-label="Exemplo hipotético de investimento"><div class="mini-card"><small>UMA POSSIBILIDADE EM 20 ANOS · BRUTO</small><strong>${currency(sample.gross)}</strong><small>R$ 5 mil iniciais + R$ 500/mês · 10% a.a. hipotéticos</small><div class="mini-bars" aria-hidden="true">${[20, 27, 34, 42, 53, 65, 80, 100].map(height => `<span style="--h:${height}%"></span>`).join('')}</div></div></div></section><div class="feature-grid">${[['sliders', 'Simule o amanhã', 'Descubra como aportes, taxas e tempo podem transformar seu patrimônio.', 'simulador', 'Começar a simular'], ['compare', 'Encontre perspectivas', 'CDB, LCI/LCA, Tesouro e cripto. Explore as diferenças com as mesmas premissas.', 'comparador', 'Comparar investimentos'], ['clock', 'Guarde seus planos', 'Salve cenários, retome suas hipóteses e acompanhe suas possibilidades.', 'historico', 'Ver meu histórico']].map(([symbol, title, text, route, cta]) => `<section class="panel feature-card"><span class="panel-icon inline-flex">${icon(symbol)}</span><h2>${title}</h2><p>${text}</p><a class="subtle-link" href="#${route}">${cta}${icon('arrow')}</a></section>`).join('')}</div><div class="section-spacing">${disclaimer()}</div>`;
}

function renderAssumptions() {
  main.innerHTML = heading('TRANSPARÊNCIA FAZ PARTE DO PLANO', 'Entenda cada hipótese.', 'Uma projeção é tão útil quanto as premissas que a acompanham.') + `<article class="panel wide-panel prose"><h2>Juros compostos, mês a mês</h2><p>Os aportes ocorrem no final do mês, depois do rendimento do saldo anterior. A taxa é anual efetiva e permanece constante. A projeção usa precisão numérica completa; a apresentação monetária é arredondada para centavos.</p><pre class="formula">r = (1 + taxa_anual / 100)^(1/12) − 1
Saldo do mês = saldo anterior × (1 + r) + aporte
Total investido = capital inicial + aporte × meses
Rendimento bruto = patrimônio bruto − total investido
Rentabilidade acumulada = rendimento / total investido × 100</pre><p>A rentabilidade acumulada não é uma taxa anualizada: relaciona o rendimento ao total desembolsado, sem ponderação temporal.</p><h2>Taxas e indicadores hipotéticos</h2><p>Todos os valores sugeridos são hipóteses editáveis, sem cotação em tempo real. CDI: convertemos o CDI anual em taxa diária de 252 dias úteis, aplicamos o percentual à taxa diária e recompomos 252 dias. É uma aproximação com CDI constante. IPCA + taxa: composição anual multiplicativa, (1 + IPCA) × (1 + adicional) − 1. A inflação não é descontada do poder de compra nesta versão.</p><h2>Impostos por aporte</h2><p>Perfil adotado: pessoa física residente no Brasil. No CDB e no Tesouro, cada aporte constitui um lote separado, com IR sobre ganho positivo após IOF: 22,5% até 180 dias; 20% de 181 a 360; 17,5% de 361 a 720; 15% acima de 720. IOF segue a tabela regressiva até o 29º dia; a partir do 30º, zero. Um aporte feito no dia do resgate não tem rendimento.</p><p>Usamos dias corridos em UTC, sem horário de liquidação, contando os aniversários mensais da data inicial. Datas como dia 31 são limitadas ao último dia do mês de destino. A regra de referência é mantida constante durante a projeção, sem prever mudanças legais.</p><p>LCI/LCA: isenção de IR no perfil adotado e custos de distribuição assumidos zero. Trata-se de projeção matemática: carências, prazos de emissão, elegibilidade, disponibilidade e reinvestimento não são modelados.</p><h2>Custos e limitações</h2><p>Tesouro: aproximação de custódia de 0,2% a.a., editável, sobre o saldo bruto após rendimento e antes do aporte, proporcional aos dias de cada mês / 365. Custos são provisionados e descontados somente ao final. O resultado é parcial: não modela marcação a mercado, cupons, descontos diários exatos, taxa da instituição ou títulos com isenções especiais. Não simula Tesouro Selic, Renda+ ou Educa+.</p><p>Criptomoedas: somente resultado bruto. Tributação, spread, corretagem e regras conforme local de custódia não são modelados. O valor pode cair; taxas acima de −100% e até 100% a.a. são aceitas (mínimo operacional: −99,99%).</p><p>CDB: corretagem assumida zero. Todos os produtos usam taxas constantes, sem inadimplência ou negociação real. Não consideramos vencimentos intermediários, carências ou viabilidade de resgate conjunto dos aportes.</p><h2>Fontes oficiais e referência</h2><p>Consultadas em 16/11/2026; versão das premissas: ${RULES_VERSION}. Não constituem validação fiscal individual.</p><ul class="list-disc pl-5"><li><a target="_blank" rel="noopener noreferrer" href="https://www.tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento">Tesouro Direto — regras, IR e custódia</a></li><li><a target="_blank" rel="noopener noreferrer" href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/preenchimento/manual-mir/rendimentos/rendimentos-do-capital">Receita Federal — rendimentos do capital e isenções</a></li><li><a target="_blank" rel="noopener noreferrer" href="https://www2.camara.leg.br/legin/fed/decret/2007/decreto-6306-14-dezembro-2007-566561-normaatualizada-pe.html">Câmara dos Deputados — Decreto 6.306/2007 e tabela do IOF</a></li></ul><h2>Seus dados e as comparações</h2><p>O histórico fica somente no localStorage deste navegador e endereço. Há uma conta demonstrativa local, sem sincronização. O login não altera o histórico. Limpar dados do navegador remove os registros. As alternativas do comparador não são somadas como uma carteira: cada uma recebe o mesmo capital e aporte. A distribuição do dashboard representa a composição de uma simulação individual.</p>${disclaimer()}</article>`;
}

function openSaveDialog() {
  $('#simulation-name').value = `${PRODUCTS[currentInput.type].name} · ${numberBR(currentInput.months / 12)} anos`;
  $('#save-error').textContent = '';
  $('#save-dialog').showModal();
}
$('#save-form').addEventListener('submit', event => {
  event.preventDefault();
  try { saveSimulation($('#simulation-name').value, currentInput); $('#save-dialog').close(); updateCount(); notify('Simulação salva. Você pode retomá-la no histórico.'); }
  catch (error) { $('#save-error').textContent = storageMessage(error); }
});
$('[data-close-dialog]').addEventListener('click', () => $('#save-dialog').close());

function renderRoute(focus = false) {
  const route = location.hash.slice(1) || 'simulador';
  if (!routeNames[route]) { location.replace('#simulador'); return; }
  clearCharts();
  $('#breadcrumb').textContent = routeNames[route];
  document.title = `${routeNames[route]} — InvestLab`;
  document.querySelectorAll('[data-route]').forEach(el => {
    const active = el.dataset.route === route;
    el.classList.toggle('active', active);
    if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
  authUI.updateHeader();
  ({ inicio: renderHome, simulador: renderSimulator, comparador: renderComparator, dashboard: renderDashboard, historico: renderHistory, premissas: renderAssumptions, login: authUI.renderLogin, perfil: authUI.renderProfile })[route]();
  if (focus) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
}
// A skip link changes focus, not the hash used by the application router.
$('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
});
const authUI = createAuthUI({ main, heading, notify });
hydrateIcons();
updateCount();
renderRoute();
window.addEventListener('hashchange', () => renderRoute(true));
window.addEventListener('storage', event => { if (event.key === 'investlab.simulations.v1') { updateCount(); if (location.hash === '#historico') renderHistory(); } });
