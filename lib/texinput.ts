// Symbols and formula templates for the note and cheatsheet editor, and the text logic behind
// "/beta" or "\beta" turning into β as you type. Kept free of React so it can be tested.

export type Sym = {
  /** Command after / or \ */
  cmd: string;
  /** Text inserted into the note */
  out: string;
  /** LaTeX inserted into the visual formula editor */
  tex: string;
  /** What the picker shows */
  label: string;
  group: 'Greek' | 'Operators' | 'Sub & superscript' | 'Finance';
  keys?: string;
};

const greek: [string, string][] = [
  ['alpha', 'α'], ['beta', 'β'], ['gamma', 'γ'], ['delta', 'δ'], ['epsilon', 'ε'], ['zeta', 'ζ'], ['eta', 'η'], ['theta', 'θ'],
  ['iota', 'ι'], ['kappa', 'κ'], ['lambda', 'λ'], ['mu', 'μ'], ['nu', 'ν'], ['xi', 'ξ'], ['pi', 'π'], ['rho', 'ρ'], ['sigma', 'σ'],
  ['tau', 'τ'], ['upsilon', 'υ'], ['phi', 'φ'], ['chi', 'χ'], ['psi', 'ψ'], ['omega', 'ω'],
  ['Gamma', 'Γ'], ['Delta', 'Δ'], ['Theta', 'Θ'], ['Lambda', 'Λ'], ['Xi', 'Ξ'], ['Pi', 'Π'], ['Sigma', 'Σ'], ['Phi', 'Φ'], ['Psi', 'Ψ'], ['Omega', 'Ω'],
];

const ops: [string, string, string, string?][] = [
  ['cdot', '·', '\\cdot', 'times multiply dot'], ['times', '×', '\\times', 'multiply cross'], ['div', '÷', '\\div', 'divide'],
  ['pm', '±', '\\pm', 'plus minus'], ['mp', '∓', '\\mp', 'minus plus'], ['approx', '≈', '\\approx', 'about roughly'],
  ['neq', '≠', '\\neq', 'not equal ne'], ['leq', '≤', '\\leq', 'less equal le'], ['geq', '≥', '\\geq', 'greater equal ge'],
  ['ll', '≪', '\\ll', 'much less'], ['gg', '≫', '\\gg', 'much greater'], ['equiv', '≡', '\\equiv', 'identical defined'],
  ['propto', '∝', '\\propto', 'proportional'], ['sim', '∼', '\\sim', 'distributed tilde'], ['sqrt', '√', '\\sqrt{}', 'root square'],
  ['sum', '∑', '\\sum', 'sigma total'], ['prod', '∏', '\\prod', 'product'], ['int', '∫', '\\int', 'integral'],
  ['infty', '∞', '\\infty', 'infinity inf'], ['partial', '∂', '\\partial', 'derivative'], ['nabla', '∇', '\\nabla', 'gradient'],
  ['deg', '°', '^\\circ', 'degree'], ['prime', '′', "'", 'derivative dash'], ['to', '→', '\\to', 'arrow right implies'],
  ['bar', 'x̄', '\\bar{x}', 'mean average overline'], ['hat', 'x̂', '\\hat{x}', 'estimate'],
];

const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹', sub = '₀₁₂₃₄₅₆₇₈₉';
const scripts: Sym[] = [
  ...[...sup].map((c, i) => ({ cmd: 'sup' + i, out: c, tex: `^{${i}}`, label: c, group: 'Sub & superscript' as const, keys: i === 2 ? 'squared' : i === 3 ? 'cubed' : 'power' })),
  { cmd: 'squared', out: '²', tex: '^{2}', label: '²', group: 'Sub & superscript', keys: 'power two' },
  { cmd: 'supn', out: 'ⁿ', tex: '^{n}', label: 'ⁿ', group: 'Sub & superscript', keys: 'power n' },
  { cmd: 'supt', out: 'ᵗ', tex: '^{t}', label: 'ᵗ', group: 'Sub & superscript', keys: 'power t' },
  { cmd: 'supminus', out: '⁻', tex: '^{-}', label: '⁻', group: 'Sub & superscript', keys: 'power negative inverse' },
  ...[...sub].map((c, i) => ({ cmd: 'sub' + i, out: c, tex: `_{${i}}`, label: c, group: 'Sub & superscript' as const, keys: 'index' })),
  ...([['t', 'ₜ'], ['i', 'ᵢ'], ['j', 'ⱼ'], ['n', 'ₙ'], ['e', 'ₑ'], ['m', 'ₘ'], ['p', 'ₚ']] as const)
    .map(([l, c]) => ({ cmd: 'sub' + l, out: c, tex: `_{${l}}`, label: c, group: 'Sub & superscript' as const, keys: 'index' })),
];

const finance: Sym[] = [
  { cmd: 'permille', out: '‰', tex: '\\text{‰}', label: '‰', group: 'Finance', keys: 'per mille basis' },
  { cmd: 'euro', out: '€', tex: '\\text{€}', label: '€', group: 'Finance', keys: 'eur currency' },
  { cmd: 'half', out: '½', tex: '\\frac{1}{2}', label: '½', group: 'Finance', keys: 'fraction' },
  { cmd: 'third', out: '⅓', tex: '\\frac{1}{3}', label: '⅓', group: 'Finance', keys: 'fraction' },
  { cmd: 'quarter', out: '¼', tex: '\\frac{1}{4}', label: '¼', group: 'Finance', keys: 'fraction' },
];

/** Formula templates: inserted as an inline formula in text, as LaTeX in the formula editor. */
const templates: [string, string, string][] = [
  ['wacc', 'WACC', 'r_{wacc} = \\frac{E}{E+D} r_E + \\frac{D}{E+D} r_D (1-\\tau_c)'],
  ['capm', 'CAPM', 'r_i = r_f + \\beta_i (E[r_m] - r_f)'],
  ['npv', 'NPV', 'NPV = -C_0 + \\sum_{t=1}^{T} \\frac{C_t}{(1+r)^t}'],
  ['annuity', 'Annuity', 'PV = \\frac{C}{r}\\left(1 - \\frac{1}{(1+r)^N}\\right)'],
  ['perpetuity', 'Perpetuity', 'PV = \\frac{C}{r}'],
  ['gperp', 'Growing perpetuity', 'PV = \\frac{C}{r - g}'],
  ['mm2', 'MM II', 'r_E = r_U + \\frac{D}{E}(r_U - r_D)'],
  ['levbeta', 'Levered beta', '\\beta_L = \\beta_U \\left[1 + (1-\\tau_c)\\frac{D}{E}\\right]'],
  ['its', 'Tax shield', 'PV(ITS) = \\tau_c D'],
  ['frac', 'Fraction', '\\frac{a}{b}'],
];

export const SYMBOLS: Sym[] = [
  ...greek.map(([cmd, c]) => ({ cmd, out: c, tex: '\\' + cmd, label: c, group: 'Greek' as const })),
  ...ops.map(([cmd, c, tex, keys]) => ({ cmd, out: c, tex, label: c, group: 'Operators' as const, keys })),
  ...scripts,
  ...finance,
  ...templates.map(([cmd, name, tex]) => ({ cmd, out: `$${tex}$`, tex, label: name, group: 'Finance' as const, keys: 'formula template ' + name.toLowerCase() })),
];

export const GROUPS: Sym['group'][] = ['Greek', 'Operators', 'Sub & superscript', 'Finance'];

/** Commands match exactly (case matters: delta is δ, Delta is Δ). */
export const exact = (q: string) => SYMBOLS.find(s => s.cmd === q);

/** Best matches for a typed command or a search: exact, then prefix, then a word of the name or keywords. */
export function search(q: string, limit = 8): Sym[] {
  const s = q.trim();
  if (!s) return SYMBOLS.slice(0, limit);
  const lo = s.toLowerCase();
  const score = (x: Sym) => x.cmd === s ? 0 : x.cmd.toLowerCase() === lo ? 1 : x.cmd.toLowerCase().startsWith(lo) ? 2
    : x.label.toLowerCase().startsWith(lo) ? 3 : (x.label + ' ' + (x.keys || '')).toLowerCase().split(/\s+/).some(w => w.startsWith(lo)) ? 4 : 9;
  return SYMBOLS.map(x => [score(x), x] as const).filter(([n]) => n < 9).sort((a, b) => a[0] - b[0] || a[1].cmd.length - b[1].cmd.length).slice(0, limit).map(([, x]) => x);
}

/** Formula segments ($…$ and $$…$$) in a text, with their positions; \$ is a literal dollar. */
export function mathSegments(text: string): { start: number; end: number; tex: string; display: boolean }[] {
  const out: { start: number; end: number; tex: string; display: boolean }[] = [];
  const re = /\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;
  for (let m; (m = re.exec(text));) out.push({ start: m.index, end: m.index + m[0].length, tex: (m[1] ?? m[2]).trim(), display: m[1] !== undefined });
  return out;
}

/** The formula the caret is in (between or on its dollar signs), if any. */
export const mathAt = (text: string, pos: number) => mathSegments(text).find(m => pos > m.start && pos < m.end);

/** A command being typed right before the caret: "/be" or "\be" at the start of a word, outside formulas. */
export function commandAt(text: string, pos: number): { start: number; query: string } | null {
  const m = /(^|[\s([{])([/\\])([A-Za-z0-9]*)$/.exec(text.slice(0, pos));
  if (!m) return null;
  const start = pos - m[3].length - 1;
  if (mathAt(text, start + 1) || inOpenMath(text, start)) return null;
  return { start, query: m[3] };
}

/** True when an odd number of unescaped $ precede pos, i.e. a formula is open but not yet closed. */
function inOpenMath(text: string, pos: number) {
  const before = text.slice(0, pos).replace(/\\\$/g, '').replace(/\$\$[\s\S]*?\$\$/g, '');
  return (before.match(/\$/g) || []).length % 2 === 1;
}

/** Replaces text[start, end) with insert and returns the new text and caret. */
export function splice(text: string, start: number, end: number, insert: string) {
  return { text: text.slice(0, start) + insert + text.slice(end), caret: start + insert.length };
}
