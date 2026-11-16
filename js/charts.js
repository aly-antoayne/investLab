import Chart from 'chart.js/auto';
import { PRODUCTS, currency } from './finance.js';

const charts = new Map();
const palette = ['#0f4c81', '#00805b', '#6554c0', '#bf8421', '#556c9e'];
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.color = '#526073';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 7;
Chart.defaults.plugins.legend.labels.padding = 22;
Chart.defaults.animation.duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;

export function clearCharts() { charts.forEach(chart => chart.destroy()); charts.clear(); }

function draw(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  charts.get(id)?.destroy();
  try { charts.set(id, new Chart(canvas, config)); }
  catch { const message = document.createElement('p'); message.textContent = 'Gráfico indisponível. Consulte os valores na tabela abaixo.'; canvas.replaceWith(message); }
}

const axis = {
  x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0 } },
  y: { beginAtZero: true, border: { display: false }, grid: { color: '#e5ebf4' }, ticks: { maxTicksLimit: 5, callback: value => new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value) } },
};
export function evolution(id, results, invested = true) {
  const steps = results[0].result.series.filter((point, i, all) => i % Math.max(1, Math.ceil(all.length / 100)) === 0 || i === all.length - 1).map(point => point.month);
  const datasets = results.map((item, index) => ({ label: item.name ?? PRODUCTS[item.input.type].name, data: steps.map(month => item.result.series[month].gross), borderColor: palette[index % palette.length], backgroundColor: 'rgba(15,76,129,.08)', fill: results.length === 1, tension: 0.32, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2.5 }));
  if (invested) datasets.push({ label: 'Total investido', data: steps.map(month => results[0].result.series[month].invested), borderColor: '#8498b1', backgroundColor: 'transparent', borderDash: [5, 5], pointRadius: 0, borderWidth: 1.5 });
  draw(id, { type: 'line', data: { labels: steps.map(month => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(month / 12)} ano(s)`), datasets }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${currency(ctx.parsed.y)}` } } }, scales: axis } });
}

export function comparisonChart(id, items) {
  draw(id, { type: 'bar', data: { labels: items.map(item => item.name ?? PRODUCTS[item.input.type].name), datasets: [{ label: 'Patrimônio bruto', data: items.map(item => item.result.gross), backgroundColor: items.map((_, index) => palette[index % palette.length]), borderRadius: 6, maxBarThickness: 65 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => currency(ctx.parsed.y) } } }, scales: axis } });
}

export function composition(id, input, result) {
  const loss = result.earnings < 0;
  draw(id, { type: loss ? 'bar' : 'doughnut', data: { labels: loss ? ['Total investido', 'Patrimônio bruto', 'Perda'] : ['Capital inicial', 'Aportes mensais', 'Rendimentos brutos'], datasets: [{ data: loss ? [result.invested, result.gross, -result.earnings] : [input.initial, result.contributions, result.earnings], backgroundColor: loss ? ['#a2b5cc', '#0f4c81', '#c44d4a'] : ['#00355f', '#4385b9', '#6ac8ab'], borderWidth: 0, borderRadius: 3 }] }, options: { responsive: true, maintainAspectRatio: false, ...(loss ? { scales: axis } : { cutout: '74%' }), plugins: { legend: { display: !loss, position: 'bottom' }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${currency(loss ? ctx.parsed.y : ctx.parsed)}` } } } } });
}
