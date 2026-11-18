// Shared building blocks for procedural question generators.
import type { CalcStep, ChoicePart, NumPart, Part, Question, Unit } from './types';

export const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const rstep = (a: number, b: number, s: number) => { const n = Math.round((b - a) / s); return +(a + s * rint(0, n)).toFixed(8); };
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const chance = (p: number) => Math.random() < p;
export const shuffle = <T,>(a: readonly T[]): T[] => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const r2 = (x: number) => Math.round(x * 100) / 100;
export const roundTo = (x: number, s: number) => Math.round(x / s) * s;

export function fmtNum(x: number, maxd = 2): string {
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: maxd });
  return (x < 0 ? '−' : '') + s;
}
export const eur = (x: number, d = 2): string => {
  const a = Math.abs(x);
  const s = (d > 0 && Math.abs(a - Math.round(a)) > 1e-9 && a < 1000)
    ? a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, d) })
    : fmtNum(a, d);
  return (x < 0 ? '−' : '') + '€' + s;
};
/** Formatter for € million amounts; the spelling varies between questions. */
export function mk() { const s = pick(['million', 'million', 'm']); return (x: number, d = 2) => eur(x, d) + (s === 'm' ? 'm' : ' million'); }
export const P = (x: number, d = 2) => fmtNum(x * 100, d) + '%';
export const v = (...a: string[]) => pick(a);
export const sh = (x: number) => fmtNum(x, 0);
export const poss = (n: string) => n + (/s$/.test(n) ? '’' : '’s');

const NAME_A = ['Arden', 'Belmont', 'Calder', 'Dunmore', 'Elstree', 'Falkner', 'Garrow', 'Halden', 'Iverson', 'Jarrow', 'Kestrel', 'Lindqvist', 'Marlow', 'Norland', 'Orwell', 'Pemberton', 'Quillon', 'Radley', 'Sandvik', 'Thorne', 'Ulston', 'Varga', 'Westmoor', 'Yardley', 'Alcora', 'Brixton', 'Corvel', 'Delphin', 'Ostara', 'Pellam', 'Rivoli', 'Selwyn', 'Tarvos', 'Vireo', 'Harlow', 'Kinross', 'Mercer', 'Ashby', 'Brennan', 'Crestline', 'Dalton', 'Everly', 'Fenwick', 'Glenmore', 'Hartwell', 'Larkspur', 'Montague', 'Northgate', 'Prescott', 'Redfern', 'Stanmore', 'Talbot', 'Whitcombe', 'Aldous', 'Bramwell', 'Castellan', 'Draycott', 'Ellington', 'Ferrand', 'Greaves'];
const NAME_B = ['Industries', 'Holdings', 'Corporation', 'Group', 'Systems', 'Logistics', 'Energy', 'Foods', 'Technologies', 'Shipping', 'Pharma', 'Materials', 'Retail', 'Motors', 'Manufacturing', 'Chemicals', 'Textiles', 'Electronics', 'Networks', 'Instruments'];
let used = new Set<string>();
/** A fictional company name, unique within one question. */
export function co(suffixes?: string[]): string {
  for (let i = 0; i < 50; i++) { const n = pick(NAME_A) + ' ' + pick(suffixes || NAME_B); if (!used.has(n)) { used.add(n); return n; } }
  return pick(NAME_A) + ' ' + pick(NAME_B);
}
export function resetNames() { used = new Set(); }

export const N = (prompt: string, ans: number, unit: Unit, o: { alts?: number[]; abs?: number; key?: string } = {}): NumPart =>
  ({ type: 'num', prompt, ans, unit, alts: o.alts || [], abs: o.abs, ...(o.key ? { key: o.key } : {}) });
export const C = (prompt: string, options: string[], correct: number, key?: string): ChoicePart =>
  ({ type: 'choice', prompt, options, correct, ...(key ? { key } : {}) });
/** Gives a part the key of its result step in `Question.calc`. */
export const K = <T extends Part>(part: T, key: string): T => ({ ...part, key });

// ---------------------------------------------------------------------------------------------------------------
// Worked calculation with the question's own numbers
// ---------------------------------------------------------------------------------------------------------------

/** A number for a formula: fixed decimals, thousands as {,}, a real minus sign. */
export function tn(x: number, d = 2): string {
  if (!Number.isFinite(x)) return String(x);
  // Shown values are rounded to two decimals; `d` only matters for whole numbers (d = 0). Small values such as
  // rates and daily returns keep two significant digits instead of collapsing to 0.00 or 0.09.
  const a = Math.abs(x);
  let t: string;
  if (d === 0) t = a.toFixed(0);
  else if (a === 0 || a >= 0.1) t = a.toFixed(2);
  else { t = a.toPrecision(2); if (/e/.test(t)) t = a.toFixed(8); }
  const [i, f] = t.split('.');
  const s = i.replace(/\B(?=(\d{3})+$)/g, '{,}') + (f ? '.' + f : '');
  return (x < 0 && +t !== 0 ? '-' : '') + s;
}
/** A fraction as a percentage for a formula: 0.125 → 12.50\%. */
export const tp = (x: number, d = 2) => tn(x * 100, d) + '\\%';
/** A number in parentheses when negative, for use after an operator. */
export const tq = (x: number, d = 2) => (x < 0 ? '(' + tn(x, d) + ')' : tn(x, d));

/**
 * Collects the steps of a worked calculation. `s(md)` adds an explanatory step, `r(md, key, value)` the step that
 * yields the answer of the part with that key (value in the part's units).
 */
export function calc() {
  const steps: CalcStep[] = [];
  return {
    steps,
    s(md: string) { steps.push({ md }); },
    r(md: string, key: string, value?: number) { steps.push(value == null ? { md, key } : { md, key, value }); },
  };
}
/** Attaches a worked calculation to a question. */
export const withCalc = (q: Question, steps: CalcStep[]): Question => ({ ...q, calc: steps });

export type Item = { part: Part | Part[]; w?: number; must?: boolean };
/** Random ordered subset of sub-questions: `must` items always, others with probability w. */
export function chooseParts(items: Item[], minN: number, maxN: number): Part[] {
  let chosen: Item[] = [];
  for (let t = 0; t < 30; t++) {
    chosen = items.filter(it => it.must || chance(it.w == null ? 0.6 : it.w));
    if (chosen.length >= minN && chosen.length <= maxN) break;
  }
  if (chosen.length > maxN) {
    const must = chosen.filter(c => c.must);
    const rest = shuffle(chosen.filter(c => !c.must)).slice(0, Math.max(0, maxN - must.length));
    chosen = items.filter(it => must.includes(it) || rest.includes(it));
  }
  if (chosen.length < minN) {
    const rest = shuffle(items.filter(i => !chosen.includes(i)));
    while (chosen.length < minN && rest.length) chosen.push(rest.pop()!);
    chosen = items.filter(i => chosen.includes(i));
  }
  return chosen.flatMap(c => Array.isArray(c.part) ? c.part : [c.part]);
}

export const Q = (fam: string, topic: number | string, html: string, parts: Part[]): Question => ({ fam, topic: String(topic), html, parts });
export const p_ = (s: string) => '<p>' + s + '</p>';
export const ul = (arr: string[]) => '<ul>' + arr.map(x => '<li>' + x + '</li>').join('') + '</ul>';
export function table(head: string[], rows: string[][], cls = ''): string {
  return '<table class="data ' + cls + '"><thead><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map((c, i) => (i === 0 ? '<th scope="row">' : '<td>') + c + (i === 0 ? '</th>' : '</td>')).join('') + '</tr>').join('') + '</tbody></table>';
}
