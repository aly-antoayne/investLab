export const RULES_VERSION = 'br-pf-2026-11-v1';
export const PRODUCTS = {
  cdb: { name: 'CDB', short: 'CDB', color: '#3f6749', modes: ['fixed', 'cdi'] },
  lci: { name: 'LCI / LCA', short: 'LCI / LCA', color: '#8caa68', modes: ['fixed', 'cdi'] },
  treasury: { name: 'Tesouro Direto', short: 'Tesouro', color: '#6b85b2', modes: ['fixed', 'indexed'] },
  bitcoin: { name: 'Bitcoin', short: 'Bitcoin', color: '#d4a24c', modes: ['fixed'] },
  ethereum: { name: 'Ethereum', short: 'Ethereum', color: '#9982ba', modes: ['fixed'] },
};
export const isCrypto = type => type === 'bitcoin' || type === 'ethereum';
export const currency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const percent = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value) + '%';
export const numberBR = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);

// Interface monetária brasileira: ponto para milhar, vírgula para decimais.
export function parseBR(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const text = String(value ?? '').trim();
  if (!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(text)) return NaN;
  return Number(text.replaceAll('.', '').replace(',', '.'));
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCFullYear() >= 2000 && date.getUTCFullYear() <= 2100;
}

export function addMonths(dateString, months) {
  const start = new Date(dateString + 'T00:00:00Z');
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months + 1, 0));
  end.setUTCDate(Math.min(start.getUTCDate(), end.getUTCDate()));
  return end;
}

export function validate(input) {
  const errors = {};
  if (!Number.isFinite(input.initial) || input.initial < 0 || input.initial > 1e9) errors.initial = 'Informe de R$ 0 a R$ 1 bilhão.';
  if (!Number.isFinite(input.monthly) || input.monthly < 0 || input.monthly > 1e7) errors.monthly = 'Informe de R$ 0 a R$ 10 milhões.';
  if (input.initial === 0 && input.monthly === 0) errors.initial = 'Informe capital inicial ou aporte maior que zero.';
  if (!Number.isInteger(input.months) || input.months < 1 || input.months > 600) errors.duration = 'Use de 1 a 600 meses inteiros (até 50 anos).';
  if (!validDate(input.start)) errors.start = 'Informe uma data válida entre 2000 e 2100.';
  const product = PRODUCTS[input.type];
  if (!product) errors.type = 'Selecione uma modalidade válida.';
  if (!product?.modes.includes(input.mode)) errors.mode = 'Regime incompatível com a modalidade.';
  const minRate = isCrypto(input.type) ? -99.99 : 0;
  const maxRate = input.mode === 'cdi' ? 300 : 100;
  if (!Number.isFinite(input.rate) || input.rate < minRate || input.rate > maxRate) errors.rate = `Informe uma taxa de ${numberBR(minRate)}% a ${maxRate}%.`;
  if (input.mode !== 'fixed' && (!Number.isFinite(input.reference) || input.reference < 0 || input.reference > 50)) errors.reference = 'Indicador hipotético deve estar entre 0% e 50% a.a.';
  if (!Number.isFinite(input.fee) || input.fee < 0 || input.fee > 5) errors.fee = 'Custódia deve estar entre 0% e 5% a.a.';
  return errors;
}

export function annualRate(input) {
  if (input.mode === 'cdi') {
    // Aproximação educacional: CDI constante, 252 dias úteis, percentual diário.
    const daily = Math.expm1(Math.log1p(input.reference / 100) / 252);
    return Math.expm1(252 * Math.log1p(daily * input.rate / 100));
  }
  if (input.mode === 'indexed') return (1 + input.reference / 100) * (1 + input.rate / 100) - 1;
  return input.rate / 100;
}

export function incomeTaxRate(days) {
  return days <= 180 ? 0.225 : days <= 360 ? 0.20 : days <= 720 ? 0.175 : 0.15;
}

// Percentual do rendimento, anexo do Decreto 6.306/2007. Dia 30: isento.
const IOF = [100, 96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3];
export function iofRate(days) { return days >= 30 ? 0 : IOF[Math.max(0, Math.floor(days))] / 100; }

export function simulate(input) {
  const errors = validate(input);
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
  const annual = annualRate(input);
  const monthlyRate = Math.expm1(Math.log1p(annual) / 12);
  let balance = input.initial;
  let fees = 0;
  const series = [{ month: 0, gross: balance, invested: balance }];
  for (let month = 1; month <= input.months; month++) {
    const beforeContribution = balance * (1 + monthlyRate);
    const days = (addMonths(input.start, month) - addMonths(input.start, month - 1)) / 86400000;
    if (input.type === 'treasury') fees += beforeContribution * (input.fee / 100) * days / 365;
    balance = beforeContribution + input.monthly;
    if (!Number.isFinite(balance) || balance > 1e18) throw new Error('A projeção excede o limite de R$ 1 quintilhão. Reduza taxa, capital ou período.');
    series.push({ month, gross: balance, invested: input.initial + month * input.monthly });
  }
  const taxable = input.type === 'cdb' || input.type === 'treasury';
  const end = addMonths(input.start, input.months);
  const lots = [];
  let ir = 0;
  let iof = 0;
  for (let month = 0; month <= input.months; month++) {
    const principal = month === 0 ? input.initial : input.monthly;
    if (!principal) continue;
    const gross = principal * Math.pow(1 + monthlyRate, input.months - month);
    const gain = Math.max(0, gross - principal);
    const days = Math.round((end - addMonths(input.start, month)) / 86400000);
    const lotIOF = taxable ? gain * iofRate(days) : 0;
    const lotIR = taxable ? (gain - lotIOF) * incomeTaxRate(days) : 0;
    ir += lotIR;
    iof += lotIOF;
    lots.push({ month, principal, gross, days, ir: lotIR, iof: lotIOF });
  }
  const invested = input.initial + input.monthly * input.months;
  const net = isCrypto(input.type) ? null : balance - ir - iof - fees;
  return {
    annual, monthlyRate, gross: balance, invested, contributions: input.monthly * input.months,
    earnings: balance - invested, accumulated: (balance - invested) / invested * 100,
    ir: isCrypto(input.type) ? null : ir, iof: isCrypto(input.type) ? null : iof,
    fees: isCrypto(input.type) ? null : fees, net, netEarnings: net === null ? null : net - invested,
    netAccumulated: net === null ? null : (net - invested) / invested * 100,
    partial: input.type === 'treasury', series, lots,
  };
}

export function rateDescription(input) {
  if (input.mode === 'cdi') return `${numberBR(input.rate)}% do CDI de ${numberBR(input.reference)}% a.a. (hipótese)`;
  if (input.mode === 'indexed') return `IPCA de ${numberBR(input.reference)}% + ${numberBR(input.rate)}% a.a. (hipóteses)`;
  return `${numberBR(input.rate)}% a.a. efetivos (hipótese)`;
}

export function resultLabel(input) {
  return isCrypto(input.type) ? 'Bruto · tributos não modelados' : input.type === 'treasury' ? 'Após deduções estimadas · parcial' : 'Líquido estimado';
}

export function defaults(type = 'cdb') {
  return { initial: 5000, monthly: 500, months: 240, start: new Date().toISOString().slice(0, 10), type,
    mode: 'fixed', rate: { cdb: 10, lci: 9, treasury: 12, bitcoin: 15, ethereum: 12 }[type], reference: 10, fee: type === 'treasury' ? 0.2 : 0 };
}
