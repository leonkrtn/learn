// Financial Derivatives: procedural generators for option bounds and parity, trading strategies, the binomial model,
// Black-Scholes and the lognormal model, structured products, and forwards, futures and swaps.
// Conventions: continuous compounding (discount factor e^(−rT)), days/365, months/12, 252 trading days a year.
import { C, K, N, P, Q, calc, chance, chooseParts, eur, fmtNum, p_, pick, rint, roundTo, rstep, shuffle, table, tn, tp, tq, withCalc, type Item } from '@/lib/engine/gen-helpers';
import { mcText } from '@/lib/engine/mc';
import type { Part, Question } from '@/lib/engine/types';

export const f2 = (x: number) => fmtNum(x, 2);
export const f4 = (x: number) => fmtNum(x, 4);
export const e2 = (x: number) => eur(x, 2);
export const e4 = (x: number) => eur(x, 4);
const pp = (x: number, d = 2) => P(x, d);
/** "+ x" or "− x" for a term added in a formula. */
const sg = (x: number) => (x < 0 ? '− ' : '+ ') + f4(Math.abs(x));
export const NOTE_PCT = 'Rates, probabilities and volatilities may be entered in percent (12.5) or as decimals (0.125).';
export const CONT = 'All rates are annual with continuous compounding.';

// ---------------------------------------------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------------------------------------------

/** Standard normal cumulative distribution (erfc, Numerical Recipes, error below 1.2e-7). */
export function Phi(x: number): number {
  const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - r / 2 : r / 2;
}

/** Black-Scholes-Merton with a continuous yield q (q = 0 for no income). */
export function bs(S: number, X: number, T: number, r: number, sig: number, q = 0) {
  const sq = sig * Math.sqrt(T);
  const d1 = (Math.log(S / X) + (r - q + sig * sig / 2) * T) / sq, d2 = d1 - sq;
  const Sq = S * Math.exp(-q * T), PVX = X * Math.exp(-r * T);
  return { d1, d2, Nd1: Phi(d1), Nd2: Phi(d2), c: Sq * Phi(d1) - PVX * Phi(d2), p: PVX * Phi(-d2) - Sq * Phi(-d1), PVX };
}

/** Volatility that reproduces a call price (bisection). */
export function impliedVol(c: number, S: number, X: number, T: number, r: number, q = 0): number {
  let lo = 0.001, hi = 3;
  if (bs(S, X, T, r, lo, q).c > c || bs(S, X, T, r, hi, q).c < c) return NaN;
  for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (bs(S, X, T, r, m, q).c < c) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

export type Tree = { S: number[][]; V: number[][]; ex: boolean[][]; delta: number[][]; pi: number; u: number; d: number };

/** Recombining binomial tree. `growth` is the per-step factor in π = (growth − d)/(u − d), `disc` the per-step discount
 *  factor. `add(i)` is added to the share price at step i (present value of dividends still to come). */
export function binom(o: { S: number; X: number; n: number; u: number; d: number; growth: number; disc: number; put?: boolean; american?: boolean; add?: (i: number) => number }): Tree {
  const { n, u, d } = o, pi = (o.growth - d) / (u - d), add = o.add || (() => 0);
  const pay = (s: number) => Math.max(o.put ? o.X - s : s - o.X, 0);
  const S: number[][] = [], V: number[][] = [], ex: boolean[][] = [], delta: number[][] = [];
  for (let i = 0; i <= n; i++) S.push(Array.from({ length: i + 1 }, (_, j) => o.S * u ** (i - j) * d ** j + add(i)));
  V[n] = S[n].map(pay); ex[n] = S[n].map(() => false);
  for (let i = n - 1; i >= 0; i--) {
    V[i] = []; ex[i] = []; delta[i] = [];
    for (let j = 0; j <= i; j++) {
      const cont = o.disc * (pi * V[i + 1][j] + (1 - pi) * V[i + 1][j + 1]);
      const now = pay(S[i][j]);
      const early = !!o.american && now > cont + 1e-9;
      V[i][j] = early ? now : cont; ex[i][j] = early;
      delta[i][j] = (V[i + 1][j] - V[i + 1][j + 1]) / (S[i + 1][j] - S[i + 1][j + 1]);
    }
  }
  return { S, V, ex, delta, pi, u, d };
}

const nodeName = (i: number, j: number) => i === 0 ? 'today' : (i - j ? 'u'.repeat(i - j) : '') + (j ? 'd'.repeat(j) : '');
/** Tree as a table: one column per date, nodes from the top. */
export function treeTable(t: Tree, label: string, fmtV = e2, dates?: string[], fmtS = e2): string {
  const n = t.S.length - 1;
  const head = ['Node', ...Array.from({ length: n + 1 }, (_, i) => dates ? dates[i] : 't = ' + i)];
  const rows: string[][] = [];
  for (let j = 0; j <= n; j++) {
    rows.push([j === 0 ? (fmtS === e2 ? 'Share price' : 'Index') : '', ...Array.from({ length: n + 1 }, (_, i) => j <= i ? fmtS(t.S[i][j]) : '')]);
  }
  for (let j = 0; j <= n; j++) {
    rows.push([j === 0 ? label : '', ...Array.from({ length: n + 1 }, (_, i) => j <= i ? fmtV(t.V[i][j]) + (t.ex[i]?.[j] ? ' (exercise)' : '') : '')]);
  }
  return table(head, rows);
}
export const nodes = nodeName;

type Calc = ReturnType<typeof calc>;
/** A result step when the part has a key, otherwise a plain step. */
const rr = (k: Calc, md: string, key?: string, v?: number) => (key ? k.r(md, key, v) : k.s(md));
/** Backward-induction formula with a node's numbers: discount × [π V_up + (1 − π) V_down] (formula body, no dollar signs). */
export const bwd = (disc: number, pi: number, vu: number, vd: number) => {
  const cont = pi * vu + (1 - pi) * vd;
  return `${tn(disc, 6)} \\times [${tn(pi, 6)} \\times ${tn(vu, 4)} + ${tn(1 - pi, 6)} \\times ${tn(vd, 4)}] = ${tn(disc, 6)} \\times [${tn(pi * vu, 4)} + ${tn((1 - pi) * vd, 4)}] = ${tn(disc, 6)} \\times ${tn(cont, 4)} = ${tn(disc * cont, 4)}`;
};
/** Black-Scholes(-Merton) worked out step by step: σ√T, ln(S/X), drift, d1, d2, N(d), discount factors and the prices.
 *  `keys` attaches result steps to parts; `only` restricts the price steps to the call or the put; `nScale` scales the N(d2) value (100 for a percent part). */
export function bsSteps(k: Calc, o: { S: number; X: number; T: number; r: number; sig: number; q?: number; keys?: { d1?: string; d2?: string; Nd2?: string; c?: string; p?: string }; only?: 'c' | 'p'; nScale?: number }) {
  const { S, X, T, r, sig } = o, q = o.q || 0, b = bs(S, X, T, r, sig, q), sq = sig * Math.sqrt(T), key = o.keys || {};
  const drift = (r - q + sig * sig / 2) * T, Sq = S * Math.exp(-q * T), eT = Math.exp(-r * T), qs = q ? `${tn(r, 4)} - ${tn(q, 4)} + ` : `${tn(r, 4)} + `;
  k.s(`**Volatility over the life:** $\\sigma\\sqrt{T} = ${tn(sig, 4)} \\times \\sqrt{${tn(T, 6)}} = ${tn(sig, 4)} \\times ${tn(Math.sqrt(T), 6)} = ${tn(sq, 6)}$.`);
  k.s(`**Log of S/X:** $\\ln\\frac{S}{X} = \\ln\\frac{${tn(S, 4)}}{${tn(X, 4)}} = \\ln ${tn(S / X, 6)} = ${tn(Math.log(S / X), 6)}$.`);
  k.s(`**Drift term:** $(r${q ? ' - q' : ''} + \\frac{\\sigma^2}{2})T = (${qs}\\frac{${tn(sig, 4)}^{2}}{2}) \\times ${tn(T, 6)} = (${qs}${tn(sig * sig / 2, 6)}) \\times ${tn(T, 6)} = ${tn(r - q + sig * sig / 2, 6)} \\times ${tn(T, 6)} = ${tn(drift, 6)}$.`);
  rr(k, `**d1:** $d_1 = \\frac{\\ln(S/X) + (r${q ? ' - q' : ''} + \\sigma^2/2)T}{\\sigma\\sqrt{T}} = \\frac{${tn(Math.log(S / X), 6)} + ${tq(drift, 6)}}{${tn(sq, 6)}} = \\frac{${tn(Math.log(S / X) + drift, 6)}}{${tn(sq, 6)}} = ${tn(b.d1, 4)}$.`, key.d1, b.d1);
  rr(k, `**d2:** $d_2 = d_1 - \\sigma\\sqrt{T} = ${tn(b.d1, 4)} - ${tn(sq, 6)} = ${tn(b.d2, 4)}$.`, key.d2, b.d2);
  rr(k, `**Normal probabilities:** $N(d_1) = N(${tn(b.d1, 4)}) = ${tn(b.Nd1, 6)}$ and $N(d_2) = N(${tn(b.d2, 4)}) = ${tn(b.Nd2, 6)}$.`, key.Nd2, b.Nd2 * (o.nScale || 1));
  if (q) k.s(`**Dividend yield adjustment:** $S e^{-qT} = ${tn(S, 4)} \\times e^{-${tn(q, 4)} \\times ${tn(T, 6)}} = ${tn(S, 4)} \\times ${tn(Math.exp(-q * T), 6)} = ${tn(Sq, 4)}$.`);
  k.s(`**Discounting the strike:** $e^{-rT} = e^{-${tn(r, 4)} \\times ${tn(T, 6)}} = ${tn(eT, 6)}$, so $Xe^{-rT} = ${tn(X, 4)} \\times ${tn(eT, 6)} = ${tn(b.PVX, 4)}$.`);
  const sS = q ? 'Se^{-qT}' : 'S';
  if (o.only !== 'p') rr(k, `**Call value:** $c = ${sS} N(d_1) - Xe^{-rT} N(d_2) = ${tn(Sq, 4)} \\times ${tn(b.Nd1, 6)} - ${tn(b.PVX, 4)} \\times ${tn(b.Nd2, 6)} = ${tn(Sq * b.Nd1, 4)} - ${tn(b.PVX * b.Nd2, 4)} = ${tn(b.c, 4)}$.`, key.c, b.c);
  if (o.only !== 'c') rr(k, `**Put value:** $N(-d_2) = 1 - ${tn(b.Nd2, 6)} = ${tn(1 - b.Nd2, 6)}$ and $N(-d_1) = 1 - ${tn(b.Nd1, 6)} = ${tn(1 - b.Nd1, 6)}$, so $p = Xe^{-rT} N(-d_2) - ${sS} N(-d_1) = ${tn(b.PVX, 4)} \\times ${tn(1 - b.Nd2, 6)} - ${tn(Sq, 4)} \\times ${tn(1 - b.Nd1, 6)} = ${tn(b.PVX * (1 - b.Nd2), 4)} - ${tn(Sq * (1 - b.Nd1), 4)} = ${tn(b.p, 4)}$.`, key.p, b.p);
  return b;
}

const months = (T: number) => { const m = Math.round(T * 12); return m === 12 ? '1 year' : m % 12 === 0 ? m / 12 + ' years' : m === 1 ? '1 month' : m + ' months'; };
export const mText = months;

/** Strike near S on a round grid. */
export function strikeNear(S: number, lo = 0.85, hi = 1.15): number {
  const g = S >= 200 ? 10 : S >= 60 ? 5 : S >= 20 ? 1 : 0.5;
  return roundTo(S * rstep(lo, hi, 0.01), g);
}

// =====================================================================
// LECTURE 1 — Bounds, put-call parity and early exercise
// =====================================================================

export function boundsDraw() {
  for (;;) {
    const put = chance(0.45), S = rstep(15, 120, 0.5), X = strikeNear(S, 0.8, 1.2), r = rstep(0.02, 0.08, 0.0025);
    const days = pick([30, 45, 60, 90, 100, 120, 180, 270]), T = days / 365, sig = rstep(0.2, 0.5, 0.05);
    const PVX = X * Math.exp(-r * T), fair = bs(S, X, T, r, sig);
    const intrinsic = put ? Math.max(X - S, 0) : Math.max(S - X, 0);
    const lower = put ? Math.max(PVX - S, 0) : Math.max(S - PVX, 0), upper = put ? PVX : S;
    const violate = lower > 0.6 && chance(0.4);
    const price = violate ? roundTo(lower - rstep(0.15, Math.min(1.2, lower * 0.4), 0.05), 0.05) : roundTo((put ? fair.p : fair.c) * rstep(0.92, 1.08, 0.01), 0.05);
    if (price <= 0.05 || price >= upper) continue;
    if (!violate && price < lower + 0.02) continue;
    if (violate && price >= lower - 0.1) continue;
    return { put, S, X, r, days, T, PVX, intrinsic, lower, upper, price, violate, time: price - intrinsic, profit: lower - price };
  }
}

/** Intrinsic and time value, lower and upper bounds of a European option, and the arbitrage when a bound is broken. */
export function L1_bounds(): Question {
  const d = boundsDraw(), k = d.put ? 'put' : 'call';
  const html = p_(`A share that pays no dividends trades at ${e2(d.S)}. A European ${k} on the share with strike ${e2(d.X)} and ${d.days} days to maturity trades at ${e2(d.price)}. The risk-free rate is ${pp(d.r)}. ${CONT} Use days/365.`);
  const opts = ['No: the price lies between the lower and the upper bound',
    d.put ? 'Yes: the put is below its lower bound; buy the put and the share and borrow PV(X)' : 'Yes: the call is below its lower bound; buy the call, short the share and invest PV(X)',
    d.put ? 'Yes: the put is above its upper bound; sell the put and invest the premium' : 'Yes: the call is above its upper bound; sell the call and buy the share'];
  const parts: Part[] = [
    N(`What is the intrinsic value of the ${k}?`, d.intrinsic, 'eur', { key: 'intr' }),
    N(`What is its time value?`, d.time, 'eur', { key: 'time' }),
    N(`What is the lower bound on the value of the ${k}?`, d.lower, 'eur', { key: 'lower' }),
    N(`What is the upper bound?`, d.upper, 'eur', { key: 'upper' }),
    C('Is there an arbitrage opportunity?', opts, d.violate ? 1 : 0, 'arb'),
  ];
  if (d.violate) parts.push(N('What is the riskless profit today per option?', d.profit, 'eur', { key: 'profit' }));
  const lb = d.put ? `max(PV(X) − S, 0) = max(${f2(d.PVX)} − ${f2(d.S)}, 0)` : `max(S − PV(X), 0) = max(${f2(d.S)} − ${f2(d.PVX)}, 0)`;
  const sol = p_(`PV(X) = ${f2(d.X)} × e<sup>−${f4(d.r)} × ${d.days}/365</sup> = ${f4(d.PVX)}. Intrinsic value: ${d.put ? 'max(X − S, 0)' : 'max(S − X, 0)'} = ${e2(d.intrinsic)}; time value = price − intrinsic value = ${e2(d.time)}${d.put && d.time < 0 ? ' (a European put deep in the money can have a negative time value)' : ''}.`) +
    p_(`Lower bound: ${lb} = ${e2(d.lower)}. Upper bound: ${d.put ? 'PV(X)' : 'S'} = ${e2(d.upper)}.`) +
    p_(d.violate ? `The price ${e2(d.price)} is below the lower bound. ${d.put ? `Buy the put and the share (${e2(d.price + d.S)}) and borrow ${e2(d.PVX)}` : `Buy the call (${e2(d.price)}), short the share (+${e2(d.S)}) and invest ${e2(d.PVX)}`}: you receive ${e2(d.profit)} today, and at maturity the position pays ${d.put ? 'max(X, S<sub>T</sub>) − X ≥ 0' : 'max(S<sub>T</sub>, X) − S<sub>T</sub> ≥ 0'}.` : 'The price lies within the bounds, so the bounds alone show no arbitrage.');
  const kk = calc(), eT = Math.exp(-d.r * d.T);
  kk.s(`**Present value of the strike:** $PV(X) = Xe^{-rT} = ${tn(d.X)} \\times e^{-${tn(d.r, 4)} \\times ${d.days}/365} = ${tn(d.X)} \\times e^{-${tn(d.r * d.T, 6)}} = ${tn(d.X)} \\times ${tn(eT, 6)} = ${tn(d.PVX, 4)}$.`);
  kk.r(d.put ? `**Intrinsic value:** $\\max(X - S, 0) = \\max(${tn(d.X)} - ${tn(d.S)}, 0) = \\max(${tn(d.X - d.S)}, 0) = ${tn(d.intrinsic)}$.`
    : `**Intrinsic value:** $\\max(S - X, 0) = \\max(${tn(d.S)} - ${tn(d.X)}, 0) = \\max(${tn(d.S - d.X)}, 0) = ${tn(d.intrinsic)}$.`, 'intr', d.intrinsic);
  kk.r(`**Time value:** price minus intrinsic value: $${tn(d.price)} - ${tq(d.intrinsic)} = ${tn(d.time)}$.`, 'time', d.time);
  kk.r(d.put ? `**Lower bound:** $\\max(PV(X) - S, 0) = \\max(${tn(d.PVX, 4)} - ${tn(d.S)}, 0) = \\max(${tn(d.PVX - d.S, 4)}, 0) = ${tn(d.lower, 4)}$.`
    : `**Lower bound:** $\\max(S - PV(X), 0) = \\max(${tn(d.S)} - ${tn(d.PVX, 4)}, 0) = \\max(${tn(d.S - d.PVX, 4)}, 0) = ${tn(d.lower, 4)}$.`, 'lower', d.lower);
  kk.r(d.put ? `**Upper bound:** a European put can never be worth more than the present value of the strike, $PV(X) = ${tn(d.PVX, 4)}$.` : `**Upper bound:** a call can never be worth more than the share, $S = ${tn(d.S)}$.`, 'upper', d.upper);
  kk.r(d.violate ? `**Arbitrage check:** the price ${tn(d.price)} is below the lower bound ${tn(d.lower, 4)}, so there is an arbitrage opportunity.`
    : `**Arbitrage check:** ${tn(d.lower, 4)} ≤ ${tn(d.price)} ≤ ${tn(d.upper, 4)}, so the price lies between the bounds and there is no arbitrage.`, 'arb');
  if (d.violate) kk.r(`**Riskless profit:** lower bound minus price: $${tn(d.lower, 4)} - ${tn(d.price)} = ${tn(d.profit, 4)}$.`, 'profit', d.profit);
  return { ...withCalc(Q('L1.bounds', 1, html, parts), kk.steps), solution: sol };
}

export function parityDraw() {
  for (;;) {
    const S = rstep(20, 120, 0.5), X = strikeNear(S, 0.85, 1.15), r = rstep(0.02, 0.07, 0.0025), T = pick([2, 3, 4, 6, 9, 12]) / 12, sig = rstep(0.2, 0.45, 0.05);
    const div = chance(0.35), D = div ? rstep(0.5, Math.max(0.6, S * 0.04), 0.1) : 0, tD = div ? T * pick([0.25, 0.5, 0.75]) : 0;
    const PVD = D * Math.exp(-r * tD), PVX = X * Math.exp(-r * T), f = bs(S - PVD, X, T, r, sig);
    const wrong = chance(0.7), side = chance(0.5) ? 1 : -1, eps = wrong ? side * rstep(0.25, 1.2, 0.05) : 0;
    const c = roundTo(f.c + (side > 0 ? eps : 0), 0.05), p = roundTo(f.p - (side < 0 ? eps : 0), 0.05);
    if (c <= 0.1 || p <= 0.1) continue;
    const theo = S - PVD - PVX, mkt = c - p, gap = mkt - theo;
    if (wrong && Math.abs(gap) < 0.2) continue;
    if (!wrong && Math.abs(gap) > 0.06) continue;
    return { S, X, r, T, D, tD, PVD, PVX, c, p, theo, mkt, gap, wrong: Math.abs(gap) > 0.06 };
  }
}

/** Put-call parity with or without a known dividend: check the quotes and exploit a violation. */
export function L1_parity(): Question {
  const d = parityDraw();
  const html = p_(`A share trades at ${e2(d.S)}. European calls and puts on the share with strike ${e2(d.X)} and maturity in ${months(d.T)} trade at ${e2(d.c)} and ${e2(d.p)}. ${d.D ? `The share pays a dividend of ${e2(d.D)} in ${months(d.tD)}.` : 'The share pays no dividend before maturity.'} The risk-free rate is ${pp(d.r)}. ${CONT}`);
  const opts = ['Parity holds (within rounding): no arbitrage',
    `The call is too expensive relative to the put: sell the call, buy the put and the share, borrow PV(X)${d.D ? ' + PV(D)' : ''}`,
    `The call is too cheap relative to the put: buy the call, sell the put, short the share, invest PV(X)${d.D ? ' + PV(D)' : ''}`];
  const parts: Part[] = [
    N('What is the present value of the strike?', d.PVX, 'eur', { key: 'pvx' }),
    ...(d.D ? [N('What is the present value of the dividend?', d.PVD, 'eur', { key: 'pvd' })] : []),
    N(`What should c − p be according to put-call parity?`, d.theo, 'eur', { key: 'theo' }),
    C('What do the quotes imply?', opts, !d.wrong ? 0 : d.gap > 0 ? 1 : 2, 'arb'),
  ];
  if (d.wrong) parts.push(N('What is the riskless profit today per pair of options?', Math.abs(d.gap), 'eur', { key: 'profit' }));
  const sol = p_(`Parity: c − p = S − ${d.D ? 'PV(D) − ' : ''}PV(X). PV(X) = ${f2(d.X)}e<sup>−${f4(d.r)} × ${f4(d.T)}</sup> = ${f4(d.PVX)}${d.D ? `; PV(D) = ${f2(d.D)}e<sup>−${f4(d.r)} × ${f4(d.tD)}</sup> = ${f4(d.PVD)}` : ''}. So c − p should be ${f2(d.S)} − ${d.D ? f4(d.PVD) + ' − ' : ''}${f4(d.PVX)} = ${f4(d.theo)}.`) +
    p_(`Market: ${f2(d.c)} − ${f2(d.p)} = ${f2(d.mkt)}. ${!d.wrong ? 'The difference is only rounding: no arbitrage.' : d.gap > 0 ? `The call is too expensive by ${f4(d.gap)}: sell the call, buy the put and the share, and borrow the present value of what the share will pay off at maturity (X) ${d.D ? 'and of the dividend ' : ''}— a synthetic short call against a real long one. Cash today ${f4(d.gap)}, nothing owed at maturity.` : `The call is too cheap by ${f4(-d.gap)}: buy the call, sell the put, short the share and invest PV(X)${d.D ? ' + PV(D) (to pay the dividend you owe as short seller)' : ''}. Cash today ${f4(-d.gap)}, and at maturity the long call and short put buy the share back for X.`}`);
  const kk = calc();
  kk.r(`**Present value of the strike:** $PV(X) = ${tn(d.X)} \\times e^{-${tn(d.r, 4)} \\times ${tn(d.T, 6)}} = ${tn(d.X)} \\times e^{-${tn(d.r * d.T, 6)}} = ${tn(d.X)} \\times ${tn(Math.exp(-d.r * d.T), 6)} = ${tn(d.PVX, 4)}$.`, 'pvx', d.PVX);
  if (d.D) kk.r(`**Present value of the dividend:** $PV(D) = ${tn(d.D)} \\times e^{-${tn(d.r, 4)} \\times ${tn(d.tD, 6)}} = ${tn(d.D)} \\times e^{-${tn(d.r * d.tD, 6)}} = ${tn(d.D)} \\times ${tn(Math.exp(-d.r * d.tD), 6)} = ${tn(d.PVD, 4)}$.`, 'pvd', d.PVD);
  kk.r(`**Parity value:** $c - p = S - ${d.D ? 'PV(D) - ' : ''}PV(X) = ${tn(d.S)} - ${d.D ? tn(d.PVD, 4) + ' - ' : ''}${tn(d.PVX, 4)} = ${tn(d.theo, 4)}$.`, 'theo', d.theo);
  kk.s(`**Market quotes:** $c - p = ${tn(d.c)} - ${tn(d.p)} = ${tn(d.mkt)}$, so the market minus parity is $${tn(d.mkt)} - ${tq(d.theo, 4)} = ${tn(d.gap, 4)}$.`);
  kk.r(!d.wrong ? `**Verdict:** the difference ${tn(d.gap, 4)} is only rounding, so parity holds and there is no arbitrage.`
    : d.gap > 0 ? `**Verdict:** the market difference ${tn(d.mkt)} is above the parity value ${tn(d.theo, 4)}, so the call is too expensive relative to the put: sell the call, buy the put and the share, borrow the present values.`
    : `**Verdict:** the market difference ${tn(d.mkt)} is below the parity value ${tn(d.theo, 4)}, so the call is too cheap relative to the put: buy the call, sell the put, short the share, invest the present values.`, 'arb');
  if (d.wrong) kk.r(`**Riskless profit:** $|${tn(d.gap, 4)}| = ${tn(Math.abs(d.gap), 4)}$ per pair of options.`, 'profit', Math.abs(d.gap));
  return { ...withCalc(Q('L1.parity', 1, html, parts), kk.steps), solution: sol };
}

export function putIntervalDraw() {
  for (;;) {
    const S = rstep(8, 60, 0.5), r = rstep(0.03, 0.09, 0.005), T = pick([1, 2, 3, 4, 6]) / 12, sig = rstep(0.25, 0.5, 0.05);
    const X = strikeNear(S, 0.9, 1.6), f = bs(S, X, T, r, sig), half = rstep(0.05, 0.35, 0.05);
    const bid = roundTo(Math.max(0.05, f.c - half), 0.05), ask = roundTo(f.c + half, 0.05);
    if (ask <= bid) continue;
    const PVX = X * Math.exp(-r * T), lo = bid - S + PVX, hi = ask - S + PVX;
    if (lo <= 0) continue;
    return { S, r, T, X, bid, ask, PVX, lo, hi };
  }
}

/** Bid and ask of a European put consistent with call quotes (problem set 1, exercise 2A). */
export function L1_putInterval(): Question {
  const d = putIntervalDraw();
  const html = p_(`European calls with strike ${e2(d.X)} and ${months(d.T)} to maturity on a share that pays no income are quoted at ${e2(d.bid)} bid and ${e2(d.ask)} ask. The share trades at ${e2(d.S)} and the risk-free rate is ${pp(d.r)}. ${CONT} Ignore the bid-ask spread on the share.`);
  const parts: Part[] = [
    N('What is the lowest ask price of the European put (same strike and maturity) that rules out arbitrage?', d.lo, 'eur', { key: 'lo' }),
    N('What is the highest bid price of the put that rules out arbitrage?', d.hi, 'eur', { key: 'hi' }),
  ];
  const sol = p_(`Put-call parity: p = c − S + PV(X), PV(X) = ${f2(d.X)}e<sup>−${f4(d.r)} × ${f4(d.T)}</sup> = ${f4(d.PVX)}.`) +
    p_(`If the put were too cheap you would buy it (at the ask) and sell the synthetic put: sell the call at the bid, buy the share, borrow PV(X). This earns c<sup>bid</sup> − S + PV(X) − p<sup>ask</sup>, so p<sup>ask</sup> ≥ ${f2(d.bid)} − ${f2(d.S)} + ${f4(d.PVX)} = ${e2(d.lo)}.`) +
    p_(`If the put were too expensive you would sell it (at the bid) and buy the synthetic put at c<sup>ask</sup> − S + PV(X): p<sup>bid</sup> ≤ ${f2(d.ask)} − ${f2(d.S)} + ${f4(d.PVX)} = ${e2(d.hi)}.`);
  const kk = calc();
  kk.s(`**Present value of the strike:** $PV(X) = ${tn(d.X)} \\times e^{-${tn(d.r, 4)} \\times ${tn(d.T, 6)}} = ${tn(d.X)} \\times e^{-${tn(d.r * d.T, 6)}} = ${tn(d.X)} \\times ${tn(Math.exp(-d.r * d.T), 6)} = ${tn(d.PVX, 4)}$.`);
  kk.r(`**Lowest put ask:** parity $p = c - S + PV(X)$ with the call at its bid: $${tn(d.bid)} - ${tn(d.S)} + ${tn(d.PVX, 4)} = ${tn(d.lo, 4)}$.`, 'lo', d.lo);
  kk.r(`**Highest put bid:** parity with the call at its ask: $${tn(d.ask)} - ${tn(d.S)} + ${tn(d.PVX, 4)} = ${tn(d.hi, 4)}$.`, 'hi', d.hi);
  return { ...withCalc(Q('L1.putInterval', 1, html, parts), kk.steps), solution: sol };
}

/** Early exercise of an American put on a share without income. */
export function L1_earlyPut(): Question {
  for (;;) {
    const X = rstep(20, 80, 1), r = rstep(0.03, 0.1, 0.005), T = pick([3, 6, 9, 12]) / 12, crit = X * (1 - Math.exp(-r * T));
    const S = roundTo(crit * rstep(0.3, 1.8, 0.05), 0.05);
    if (S <= 0.05 || Math.abs(S - crit) < 0.05) continue;
    const fv = (X - S) * Math.exp(r * T), yes = fv > X;
    const html = p_(`An American put on a share that pays no dividends has strike ${e2(X)} and ${months(T)} to maturity. The share has fallen to ${e2(S)}. The risk-free rate is ${pp(r)}. ${CONT}`);
    const parts: Part[] = [
      N('If you exercise now and invest the proceeds at the risk-free rate, how much do you have at maturity?', fv, 'eur', { key: 'fv' }),
      N('What is the most the put can pay at maturity if you wait?', X, 'eur', { key: 'maxPay' }),
      N('Below which share price is immediate exercise certainly optimal by this comparison?', crit, 'eur', { key: 'crit' }),
      C('Is immediate exercise certainly optimal?', ['Yes: exercising and investing gives more than the most the put can ever pay at maturity', 'This comparison does not show it: waiting can still be worth more'], yes ? 0 : 1, 'verdict'),
    ];
    const sol = p_(`Exercise now: (X − S)e<sup>rT</sup> = (${f2(X)} − ${f2(S)}) × e<sup>${f4(r)} × ${f4(T)}</sup> = ${e2(fv)}. Waiting pays at most X = ${e2(X)} (if the share falls to zero).`) +
      p_(`Exercise dominates when (X − S)e<sup>rT</sup> > X, i.e. S &lt; X(1 − e<sup>−rT</sup>) = ${e2(crit)}. ${yes ? 'The share is below that level, so exercising now beats any outcome of waiting: the interest on X is worth more than the remaining upside.' : 'The share is above that level. This sufficient condition does not hold; the true exercise boundary of an American put lies higher, so the put may or may not be exercised, but the comparison alone does not show it.'} An American call on a share without dividends is never exercised early.`);
    const kk = calc();
    kk.r(`**Exercise now and invest:** $(X - S)e^{rT} = (${tn(X)} - ${tn(S)}) \\times e^{${tn(r, 4)} \\times ${tn(T, 6)}} = ${tn(X - S)} \\times ${tn(Math.exp(r * T), 6)} = ${tn(fv, 4)}$.`, 'fv', fv);
    kk.r(`**Most the put can pay if you wait:** the share can at best fall to zero, so the payoff is at most $X = ${tn(X)}$.`, 'maxPay', X);
    kk.r(`**Critical share price:** exercising wins when $(X - S)e^{rT} > X$, i.e. $S < X(1 - e^{-rT}) = ${tn(X)} \\times (1 - e^{-${tn(r * T, 6)}}) = ${tn(X)} \\times (1 - ${tn(Math.exp(-r * T), 6)}) = ${tn(X)} \\times ${tn(1 - Math.exp(-r * T), 6)} = ${tn(crit, 4)}$.`, 'crit', crit);
    kk.r(yes ? `**Verdict:** ${tn(fv, 4)} > ${tn(X)} (equivalently ${tn(S)} < ${tn(crit, 4)}), so immediate exercise is certainly optimal.` : `**Verdict:** ${tn(fv, 4)} ≤ ${tn(X)} (equivalently ${tn(S)} ≥ ${tn(crit, 4)}), so this comparison does not show that exercising now is optimal.`, 'verdict');
    return { ...withCalc(Q('L1.earlyPut', 1, html, parts), kk.steps), solution: sol };
  }
}

/** Bounds with a known dividend and the early-exercise test for an American call just before the ex-date. */
export function L1_dividend(): Question {
  for (;;) {
    const S = rstep(30, 120, 1), X = strikeNear(S, 0.85, 1.1), r = rstep(0.03, 0.08, 0.005), T = pick([4, 6, 9, 12]) / 12;
    const tD = roundTo(T * rstep(0.3, 0.8, 0.05), 1 / 12), D = rstep(0.5, Math.max(1, S * 0.05), 0.1);
    if (tD <= 0 || tD >= T) continue;
    const PVD = D * Math.exp(-r * tD), PVX = X * Math.exp(-r * T), lc = Math.max(S - PVD - PVX, 0), lp = Math.max(PVX + PVD - S, 0);
    const thr = X * (1 - Math.exp(-r * (T - tD))), yes = D > thr;
    if (Math.abs(D - thr) < 0.08) continue;
    const html = p_(`A share trades at ${e2(S)} and will pay a dividend of ${e2(D)} in ${months(tD)}. Options on the share have strike ${e2(X)} and mature in ${months(T)}. The risk-free rate is ${pp(r)}. ${CONT}`);
    const parts: Part[] = [
      N('What is the lower bound on the European call?', lc, 'eur', { key: 'lc' }),
      N('What is the lower bound on the European put?', lp, 'eur', { key: 'lp' }),
      N('An American call may be exercised just before the ex-dividend date only if the dividend exceeds the interest on the strike over the remaining life, X(1 − e^(−r(T − t))). What is this threshold?', thr, 'eur', { key: 'thr' }),
      C('Can early exercise of the American call just before the dividend be optimal?', ['Yes: the dividend exceeds the threshold', 'No: the dividend is smaller than the threshold, so the call is never exercised early'], yes ? 0 : 1, 'verdict'),
    ];
    const sol = p_(`PV(D) = ${f2(D)}e<sup>−${f4(r)} × ${f4(tD)}</sup> = ${f4(PVD)}, PV(X) = ${f4(PVX)}. Call: c ≥ max(S − D − PV(X), 0) with D in present value = ${e2(lc)}. Put: p ≥ max(PV(X) + PV(D) − S, 0) = ${e2(lp)}.`) +
      p_(`Exercising just before the ex-date captures the dividend but gives up the interest on X for the remaining ${months(T - tD)} (and the time value). Threshold X(1 − e<sup>−r(T − t)</sup>) = ${e2(thr)}. ${yes ? 'The dividend is larger, so early exercise can be optimal (if the call is deep enough in the money).' : 'The dividend is smaller, so it is never optimal to exercise early: C = c.'}`);
    const kk = calc();
    kk.s(`**Present value of the dividend:** $PV(D) = ${tn(D)} \\times e^{-${tn(r, 4)} \\times ${tn(tD, 6)}} = ${tn(D)} \\times ${tn(Math.exp(-r * tD), 6)} = ${tn(PVD, 4)}$.`);
    kk.s(`**Present value of the strike:** $PV(X) = ${tn(X)} \\times e^{-${tn(r, 4)} \\times ${tn(T, 6)}} = ${tn(X)} \\times ${tn(Math.exp(-r * T), 6)} = ${tn(PVX, 4)}$.`);
    kk.r(`**Call lower bound:** $\\max(S - PV(D) - PV(X), 0) = \\max(${tn(S)} - ${tn(PVD, 4)} - ${tn(PVX, 4)}, 0) = \\max(${tn(S - PVD - PVX, 4)}, 0) = ${tn(lc, 4)}$.`, 'lc', lc);
    kk.r(`**Put lower bound:** $\\max(PV(X) + PV(D) - S, 0) = \\max(${tn(PVX, 4)} + ${tn(PVD, 4)} - ${tn(S)}, 0) = \\max(${tn(PVX + PVD - S, 4)}, 0) = ${tn(lp, 4)}$.`, 'lp', lp);
    kk.r(`**Threshold:** $X(1 - e^{-r(T-t)}) = ${tn(X)} \\times (1 - e^{-${tn(r, 4)} \\times ${tn(T - tD, 6)}}) = ${tn(X)} \\times (1 - ${tn(Math.exp(-r * (T - tD)), 6)}) = ${tn(X)} \\times ${tn(1 - Math.exp(-r * (T - tD)), 6)} = ${tn(thr, 4)}$.`, 'thr', thr);
    kk.r(yes ? `**Verdict:** the dividend ${tn(D)} exceeds the threshold ${tn(thr, 4)}, so early exercise just before the ex-date can be optimal.` : `**Verdict:** the dividend ${tn(D)} is below the threshold ${tn(thr, 4)}, so the call is never exercised early.`, 'verdict');
    return { ...withCalc(Q('L1.dividend', 1, html, parts), kk.steps), solution: sol };
  }
}

// =====================================================================
// LECTURE 2 — Trading strategies with options
// =====================================================================

export type Leg = { k: 'c' | 'p'; X: number; q: number };
export type Strat = { name: string; view: string; legs: (x: number[]) => Leg[]; n: 1 | 2 | 3 };
export const STRATS: Strat[] = [
  { name: 'bull spread with calls', view: 'a rise in the share price within a limited range', n: 2, legs: ([a, b]) => [{ k: 'c', X: a, q: 1 }, { k: 'c', X: b, q: -1 }] },
  { name: 'bull spread with puts', view: 'a rise in the share price within a limited range', n: 2, legs: ([a, b]) => [{ k: 'p', X: a, q: 1 }, { k: 'p', X: b, q: -1 }] },
  { name: 'bear spread with calls', view: 'a fall in the share price within a limited range', n: 2, legs: ([a, b]) => [{ k: 'c', X: a, q: -1 }, { k: 'c', X: b, q: 1 }] },
  { name: 'bear spread with puts', view: 'a fall in the share price within a limited range', n: 2, legs: ([a, b]) => [{ k: 'p', X: a, q: -1 }, { k: 'p', X: b, q: 1 }] },
  { name: 'straddle', view: 'high volatility: a big move in either direction', n: 1, legs: ([a]) => [{ k: 'c', X: a, q: 1 }, { k: 'p', X: a, q: 1 }] },
  { name: 'inverted straddle', view: 'stability, with unlimited risk', n: 1, legs: ([a]) => [{ k: 'c', X: a, q: -1 }, { k: 'p', X: a, q: -1 }] },
  { name: 'strangle', view: 'high volatility, cheaper than a straddle', n: 2, legs: ([a, b]) => [{ k: 'p', X: a, q: 1 }, { k: 'c', X: b, q: 1 }] },
  { name: 'inverted strangle', view: 'stability over a range of prices', n: 2, legs: ([a, b]) => [{ k: 'p', X: a, q: -1 }, { k: 'c', X: b, q: -1 }] },
  { name: 'butterfly spread with calls', view: 'stability, with limited risk', n: 3, legs: ([a, b, c]) => [{ k: 'c', X: a, q: 1 }, { k: 'c', X: b, q: -2 }, { k: 'c', X: c, q: 1 }] },
  { name: 'butterfly spread with puts', view: 'stability, with limited risk', n: 3, legs: ([a, b, c]) => [{ k: 'p', X: a, q: 1 }, { k: 'p', X: b, q: -2 }, { k: 'p', X: c, q: 1 }] },
];

export const payoff = (legs: Leg[], s: number) => legs.reduce((t, l) => t + l.q * Math.max(l.k === 'c' ? s - l.X : l.X - s, 0), 0);
const legPay = (l: Leg, s: number) => l.q * Math.max(l.k === 'c' ? s - l.X : l.X - s, 0);
/** One leg's payoff at the share price s as a formula: quantity × max(…, 0) = value. */
const legStr = (l: Leg, s: number) => `${tq(l.q, 0)} \\times \\max(${l.k === 'c' ? `${tn(s)} - ${tn(l.X)}` : `${tn(l.X)} - ${tn(s)}`}, 0) = ${tn(legPay(l, s))}`;
export const legText = (l: Leg) => `${l.q > 0 ? 'buy' : 'sell'} ${Math.abs(l.q)} ${l.k === 'c' ? 'call' : 'put'}${Math.abs(l.q) > 1 ? 's' : ''} with strike ${f2(l.X)}`;

/** Zeros of a piecewise linear payoff with kinks at the strikes. */
export function breakevens(f: (s: number) => number, kinks: number[], hi: number): number[] {
  const pts = [0, ...[...new Set(kinks)].sort((a, b) => a - b), hi];
  const out: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], fa = f(a), fb = f(b);
    if (Math.abs(fa) < 1e-12 && i > 0) continue;
    if (fa === 0 && i === 0) { out.push(0); continue; }
    if (fa * fb < 0) out.push(a + (b - a) * fa / (fa - fb));
  }
  return out;
}

export function stratDraw(si?: number) {
  for (;;) {
    const st = STRATS[si ?? rint(0, STRATS.length - 1)], S = rstep(20, 120, 1), g = S >= 60 ? 5 : S >= 30 ? 2.5 : 1;
    const h = g * rint(1, 3), mid = roundTo(S * rstep(0.95, 1.05, 0.01), g);
    const xs = st.n === 1 ? [mid] : st.n === 2 ? [mid - h, mid + h] : [mid - h, mid, mid + h];
    if (xs[0] <= 0) continue;
    const r = rstep(0.02, 0.07, 0.0025), T = pick([2, 3, 4, 6]) / 12, sig = rstep(0.2, 0.45, 0.05);
    const legs = st.legs(xs);
    const prem = new Map<string, number>();
    for (const l of legs) { const b = bs(S, l.X, T, r, sig); prem.set(l.k + l.X, roundTo(l.k === 'c' ? b.c : b.p, 0.01)); }
    if ([...prem.values()].some(x => x < 0.05)) continue;
    const cf0 = -legs.reduce((t, l) => t + l.q * prem.get(l.k + l.X)!, 0), fv = cf0 * Math.exp(r * T);
    const net = (s: number) => payoff(legs, s) + fv;
    const hi = xs[xs.length - 1] * 3, be = breakevens(net, xs, hi);
    const kinkVals = [0, ...xs].map(net);
    const slopeHi = net(hi) - net(hi - 1), slopeLo = net(1) - net(0);
    const maxP = slopeHi > 1e-9 ? Infinity : Math.max(...kinkVals), maxL = slopeHi < -1e-9 ? -Infinity : Math.min(...kinkVals);
    if (!be.length) continue;
    const s1 = roundTo(xs[0] - h * rstep(0.4, 1.5, 0.1), 0.5), s2 = roundTo(st.n === 1 ? mid + h * rstep(0.3, 1.5, 0.1) : (xs[0] + xs[xs.length - 1]) / 2 + rstep(-0.3, 0.3, 0.1) * h, 0.5);
    if (s1 <= 0) continue;
    return { st, S, xs, r, T, legs, prem, cf0, fv, net, be, maxP, maxL, slopeLo, slopeHi, s1, s2 };
  }
}

export function quoteTable(d: { legs: Leg[]; prem: Map<string, number> }): string {
  const seen = new Set<string>(), rows: string[][] = [];
  for (const l of [...d.legs].sort((a, b) => a.X - b.X || (a.k < b.k ? -1 : 1))) {
    const k = l.k + l.X; if (seen.has(k)) continue; seen.add(k);
    rows.push([(l.k === 'c' ? 'Call' : 'Put') + ', strike ' + f2(l.X), e2(d.prem.get(k)!)]);
  }
  return table(['Option', 'Premium'], rows);
}

/** Payoff of an option strategy at maturity including the initial cash flow, break-evens and the view it expresses. */
export const L2_strategy = () => strategyQ();
export function strategyQ(si?: number): Question {
  const d = stratDraw(si);
  const html = p_(`A share trades at ${e2(d.S)}. A trader sets up the following position in European options maturing in ${months(d.T)}: ${d.legs.map(legText).join('; ')}. The risk-free rate is ${pp(d.r)}. ${CONT}`) + quoteTable(d) +
    p_('“Net payoff” is the payoff at maturity plus the initial cash flow carried forward to the maturity date (its future value).');
  const viewOpts = [...new Set(STRATS.map(s => s.view))];
  const items: Item[] = [
    { part: N('What is the initial cash flow (positive for an inflow, negative for an outflow)?', d.cf0, 'eur', { key: 'cf0' }), must: true },
    { part: N('What is the initial cash flow measured at the maturity date?', d.fv, 'eur', { key: 'fv' }), w: 0.5 },
    { part: N(`What is the net payoff if the share ends at ${e2(d.s1)}?`, d.net(d.s1), 'eur', { key: 'net1' }), w: 0.8 },
    { part: N(`What is the net payoff if the share ends at ${e2(d.s2)}?`, d.net(d.s2), 'eur', { key: 'net2' }), w: 0.8 },
    { part: N(d.be.length > 1 ? 'What is the lower break-even share price at maturity?' : 'What is the break-even share price at maturity?', d.be[0], 'eur', { key: 'be1' }), w: 0.7 },
    ...(d.be.length > 1 ? [{ part: N('What is the upper break-even share price?', d.be[d.be.length - 1], 'eur', { key: 'be2' }), w: 0.6 }] : []),
    ...(Number.isFinite(d.maxP) ? [{ part: N('What is the largest possible net payoff?', d.maxP, 'eur', { key: 'maxP' }), w: 0.5 }] : []),
    ...(Number.isFinite(d.maxL) ? [{ part: N('What is the worst possible net payoff (a loss is negative)?', d.maxL, 'eur', { key: 'maxL' }), w: 0.5 }] : []),
    { part: C('What does this position bet on?', shuffle(viewOpts.map(v => STRATS.find(s => s.view === v)!).map(s => s.view)), 0, 'view'), w: 0.5 },
  ];
  const parts = chooseParts(items, 4, 6).map(p => p.type === 'choice' ? { ...p, correct: p.options.indexOf(d.st.view) } : p);
  const sol = p_(`This is a <b>${d.st.name}</b>, a bet on ${d.st.view}.`) +
    p_(`Initial cash flow: ${d.legs.map(l => `${l.q > 0 ? '−' : '+'}${Math.abs(l.q) > 1 ? Math.abs(l.q) + ' × ' : ''}${f2(d.prem.get(l.k + l.X)!)}`).join(' ')} = ${e2(d.cf0)}; at maturity ${e2(d.cf0)} × e<sup>${f4(d.r)} × ${f4(d.T)}</sup> = ${e4(d.fv)}.`) +
    p_(`Net payoff = Σ payoffs ${sg(d.fv)}. At S<sub>T</sub> = ${f2(d.s1)}: ${f4(payoff(d.legs, d.s1))} ${sg(d.fv)} = ${e2(d.net(d.s1))}. At S<sub>T</sub> = ${f2(d.s2)}: ${f4(payoff(d.legs, d.s2))} ${sg(d.fv)} = ${e2(d.net(d.s2))}.`) +
    p_(`Break-even${d.be.length > 1 ? 's' : ''}: ${d.be.map(e2).join(' and ')}.${Number.isFinite(d.maxP) ? ` Largest net payoff ${e2(d.maxP)}.` : ' The upside is unlimited.'}${Number.isFinite(d.maxL) ? ` Worst case ${e2(d.maxL)}.` : ' The loss is unlimited if the share rises.'}`);
  const kk = calc(), pr = (l: Leg) => d.prem.get(l.k + l.X)!;
  kk.r(`**Initial cash flow:** buying costs the premium, selling brings it in. In the order of the legs (${d.legs.map(legText).join('; ')}): $CF_0 = ${d.legs.map(l => `${tq(-l.q, 0)} \\times ${tn(pr(l))}`).join(' + ')} = ${d.legs.map(l => tq(-l.q * pr(l))).join(' + ')} = ${tn(d.cf0)}$.`, 'cf0', d.cf0);
  kk.r(`**Carried to maturity:** $CF_0 e^{rT} = ${tq(d.cf0)} \\times e^{${tn(d.r, 4)} \\times ${tn(d.T, 6)}} = ${tq(d.cf0)} \\times ${tn(Math.exp(d.r * d.T), 6)} = ${tn(d.fv, 4)}$.`, 'fv', d.fv);
  const netStep = (s: number, key: string) => kk.r(`**Net payoff at ${tn(s)}:** leg payoffs $${d.legs.map(l => legStr(l, s)).join('$; $')}$. Their sum is $${tn(payoff(d.legs, s))}$, plus the carried cash flow: $${tn(payoff(d.legs, s), 4)} + ${tq(d.fv, 4)} = ${tn(d.net(s), 4)}$.`, key, d.net(s));
  netStep(d.s1, 'net1'); netStep(d.s2, 'net2');
  const pts = [0, ...[...new Set(d.xs)].sort((a, c) => a - c), d.xs[d.xs.length - 1] * 3];
  const beStep = (b: number, key: string, label: string) => {
    let i = 0;
    for (; i < pts.length - 2; i++) if (b >= pts[i] - 1e-9 && b <= pts[i + 1] + 1e-9) break;
    const lo = pts[i], up = pts[i + 1], m = Math.round((d.net(up) - d.net(lo)) / (up - lo) * 1e6) / 1e6, a0 = d.net(lo) - m * lo;
    kk.r(`**${label}:** between ${tn(lo)} and ${tn(up)} the net payoff is $${tn(a0, 4)} ${m < 0 ? '-' : '+'} ${tn(Math.abs(m), 0)} \\cdot S_T$. Setting it to zero gives $S_T = \\frac{${tn(-a0, 4)}}{${tn(m, 0)}} = ${tn(b, 4)}$.`, key, b);
  };
  beStep(d.be[0], 'be1', d.be.length > 1 ? 'Lower break-even' : 'Break-even');
  if (d.be.length > 1) beStep(d.be[d.be.length - 1], 'be2', 'Upper break-even');
  const kinkLine = [0, ...d.xs].map(s => `\\text{net}(${tn(s)}) = ${tn(payoff(d.legs, s), 4)} + ${tq(d.fv, 4)} = ${tn(d.net(s), 4)}`);
  const kinkText = `The net payoff is piecewise linear with kinks at 0 and at the strikes, so the extremes sit there: $${kinkLine.join('$; $')}$.`;
  if (Number.isFinite(d.maxP)) kk.r(`**Largest net payoff:** ${kinkText} The largest value is ${tn(d.maxP, 4)}.`, 'maxP', d.maxP);
  if (Number.isFinite(d.maxL)) kk.r(`**Worst net payoff:** ${kinkText} The smallest value is ${tn(d.maxL, 4)}.`, 'maxL', d.maxL);
  kk.r(`**Reading the position:** ${d.legs.map(legText).join('; ')} is a ${d.st.name}, a bet on ${d.st.view}.`, 'view');
  return { ...withCalc(Q('L2.strategy', 2, html, parts), kk.steps), solution: sol };
}

export function butterflyDraw() {
  for (;;) {
    const S = rstep(10, 60, 0.5), g = S >= 30 ? 5 : 2.5, X2 = roundTo(S * rstep(0.9, 1.15, 0.01), g), X1 = X2 - g, X3 = X2 + g;
    if (X1 <= 0) continue;
    const r = rstep(0.03, 0.08, 0.005), T = pick([2, 3, 4, 6]) / 12, sig = rstep(0.25, 0.5, 0.05);
    const q = (X: number, put: boolean, tilt: number) => {
      const b = bs(S, X, T, r, sig), mid = (put ? b.p : b.c) * tilt, h = roundTo(rstep(0.01, 0.08, 0.01) * Math.max(0.5, mid), 0.01) + 0.01;
      return { bid: roundTo(Math.max(0.01, mid - h), 0.01), ask: roundTo(mid + h, 0.01) };
    };
    const tc = rstep(0.97, 1.03, 0.01), tp = rstep(0.97, 1.03, 0.01);
    const C1 = q(X1, false, tc), C2 = q(X2, false, 1), C3 = q(X3, false, tc), P1 = q(X1, true, tp), P2 = q(X2, true, 1), P3 = q(X3, true, tp);
    const costC = C1.ask + C3.ask - 2 * C2.bid, costP = P1.ask + P3.ask - 2 * P2.bid;
    if (costC <= 0.02 || costP <= 0.02 || Math.abs(costC - costP) < 0.03 || Math.max(costC, costP) > 0.9 * g) continue;
    const puts = costP < costC, cost = Math.min(costC, costP), fv = cost * Math.exp(r * T);
    return { S, X1, X2, X3, r, T, C1, C2, C3, P1, P2, P3, costC, costP, puts, cost, fv, peak: X2 - X1 - fv };
  }
}

/** The cheapest way to build a butterfly from bid-ask quotes, and its net payoff (problem set 1, exercise 2B). */
export function L2_butterfly(): Question {
  const d = butterflyDraw();
  const html = p_(`European options on a share that pays no income mature in ${months(d.T)}. The share trades at ${e2(d.S)} and the risk-free rate is ${pp(d.r)}. ${CONT}`) +
    table(['Strike', 'Call bid', 'Call ask', 'Put bid', 'Put ask'], ([[d.X1, d.C1, d.P1], [d.X2, d.C2, d.P2], [d.X3, d.C3, d.P3]] as const)
      .map(([X, c, p]) => [f2(X), e2(c.bid), e2(c.ask), e2(p.bid), e2(p.ask)]));
  const parts: Part[] = [
    N('What does a butterfly spread with calls cost to set up (buy at the ask, sell at the bid)?', d.costC, 'eur', { key: 'costC' }),
    N('What does a butterfly spread with puts cost?', d.costP, 'eur', { key: 'costP' }),
    C('Which is cheaper?', ['With calls', 'With puts'], d.puts ? 1 : 0, 'cheap'),
    N('For the cheaper butterfly, what is the net payoff at maturity (including the future value of the cost) if the share ends below the lowest strike?', -d.fv, 'eur', { key: 'low' }),
    N('… and the net payoff if the share ends exactly at the middle strike?', d.peak, 'eur', { key: 'peak' }),
  ];
  const sol = p_(`Calls: buy ${f2(d.X1)} and ${f2(d.X3)} at the ask, sell two ${f2(d.X2)} at the bid: ${f2(d.C1.ask)} + ${f2(d.C3.ask)} − 2 × ${f2(d.C2.bid)} = ${e2(d.costC)}. Puts: ${f2(d.P1.ask)} + ${f2(d.P3.ask)} − 2 × ${f2(d.P2.bid)} = ${e2(d.costP)}. The ${d.puts ? 'puts' : 'calls'} are cheaper.`) +
    p_(`Future value of the cost: ${f4(d.cost)} × e<sup>${f4(d.r)} × ${f4(d.T)}</sup> = ${f4(d.fv)}. Net payoff: −${f2(d.fv)} below ${f2(d.X1)} and above ${f2(d.X3)}; S<sub>T</sub> − ${f2(d.X1 + d.fv)} between ${f2(d.X1)} and ${f2(d.X2)}; ${f2(d.X3 - d.fv)} − S<sub>T</sub> between ${f2(d.X2)} and ${f2(d.X3)}; peak ${f2(d.X2 - d.X1)} − ${f2(d.fv)} = ${e2(d.peak)} at ${f2(d.X2)}.`);
  const kk = calc();
  kk.r(`**Butterfly with calls:** buy the ${tn(d.X1)} and ${tn(d.X3)} calls at the ask, sell two ${tn(d.X2)} calls at the bid: $C_1^{ask} + C_3^{ask} - 2C_2^{bid} = ${tn(d.C1.ask)} + ${tn(d.C3.ask)} - 2 \\times ${tn(d.C2.bid)} = ${tn(d.C1.ask + d.C3.ask)} - ${tn(2 * d.C2.bid)} = ${tn(d.costC)}$.`, 'costC', d.costC);
  kk.r(`**Butterfly with puts:** buy the ${tn(d.X1)} and ${tn(d.X3)} puts at the ask, sell two ${tn(d.X2)} puts at the bid: $P_1^{ask} + P_3^{ask} - 2P_2^{bid} = ${tn(d.P1.ask)} + ${tn(d.P3.ask)} - 2 \\times ${tn(d.P2.bid)} = ${tn(d.P1.ask + d.P3.ask)} - ${tn(2 * d.P2.bid)} = ${tn(d.costP)}$.`, 'costP', d.costP);
  kk.r(`**Cheaper side:** calls cost ${tn(d.costC)} and puts cost ${tn(d.costP)}, so the butterfly with ${d.puts ? 'puts' : 'calls'} is cheaper (cost ${tn(d.cost)}).`, 'cheap');
  kk.s(`**Cost carried to maturity:** $${tn(d.cost)} \\times e^{rT} = ${tn(d.cost)} \\times e^{${tn(d.r, 4)} \\times ${tn(d.T, 6)}} = ${tn(d.cost)} \\times ${tn(Math.exp(d.r * d.T), 6)} = ${tn(d.fv, 4)}$.`);
  kk.r(`**Share below the lowest strike:** all options expire worthless, so only the carried cost remains: net payoff $= -${tn(d.fv, 4)}$.`, 'low', -d.fv);
  kk.r(`**Share at the middle strike ${tn(d.X2)}:** only the long ${d.puts ? 'put at ' + tn(d.X3) : 'call at ' + tn(d.X1)} is in the money, paying $${d.puts ? tn(d.X3) + ' - ' + tn(d.X2) : tn(d.X2) + ' - ' + tn(d.X1)} = ${tn(d.X2 - d.X1)}$. Net payoff $= ${tn(d.X2 - d.X1)} - ${tn(d.fv, 4)} = ${tn(d.peak, 4)}$.`, 'peak', d.peak);
  return { ...withCalc(Q('L2.butterfly', 2, html, parts), kk.steps), solution: sol };
}

export function portfolioDraw() {
  for (;;) {
    const S = rstep(15, 80, 1), g = S >= 40 ? 5 : 2.5, X1 = roundTo(S * rstep(0.85, 0.97, 0.01), g), X2 = roundTo(S * rstep(1.03, 1.2, 0.01), g);
    if (X2 <= X1) continue;
    const r = rstep(0.02, 0.06, 0.005), T = pick([3, 6]) / 12, sig = rstep(0.2, 0.45, 0.05);
    const a = rint(1, 4), b = rint(2, 6), c = rint(1, 4), kb = chance(0.5) ? X1 : X2;
    if (a === b && kb === X1) continue;
    const legs: Leg[] = [{ k: 'c', X: X1, q: a }, { k: 'c', X: kb, q: -b }, { k: 'p', X: X2, q: c }];
    const c2 = (x: number) => roundTo(x, 0.01), pc1 = c2(bs(S, X1, T, r, sig).c), pcb = c2(bs(S, kb, T, r, sig).c), pp2 = c2(bs(S, X2, T, r, sig).p);
    const value = a * pc1 - b * pcb + c * pp2;
    const sA = roundTo(X1 * rstep(0.6, 0.9, 0.05), 0.5), sB = roundTo((X1 + X2) / 2, 0.5), sC = roundTo(X2 * rstep(1.15, 1.5, 0.05), 0.5);
    return { S, X1, X2, r, T, sig, a, b, c, kb, legs, pc1, pcb, pp2, value, sA, sB, sC, slope: a - b };
  }
}

/** Value and payoff of a portfolio of long and short calls and puts (problem set 1, exercise 4C–E). */
export function L2_portfolio(): Question {
  const d = portfolioDraw();
  const html = p_(`A trader holds ${d.a} long call${d.a > 1 ? 's' : ''} with strike ${e2(d.X1)}, ${d.b} short calls with strike ${e2(d.kb)} and ${d.c} long put${d.c > 1 ? 's' : ''} with strike ${e2(d.X2)}, all European on one share each and maturing in ${months(d.T)}. Current premiums: ` +
    `call(${f2(d.X1)}) ${e2(d.pc1)}${d.kb !== d.X1 ? `, call(${f2(d.kb)}) ${e2(d.pcb)}` : ''}, put(${f2(d.X2)}) ${e2(d.pp2)}. The share trades at ${e2(d.S)}.`);
  const parts: Part[] = [
    N('What is the current value of the portfolio (negative if it is a liability)?', d.value, 'eur', { key: 'value' }),
    N(`What is the payoff of the portfolio at maturity if the share ends at ${e2(d.sA)}?`, payoff(d.legs, d.sA), 'eur', { key: 'pA' }),
    N(`… if it ends at ${e2(d.sB)}?`, payoff(d.legs, d.sB), 'eur', { key: 'pB' }),
    N(`… if it ends at ${e2(d.sC)}?`, payoff(d.legs, d.sC), 'eur', { key: 'pC' }),
    N('By how much does the payoff change for each €1 rise in the share price above the highest strike?', d.slope, 'n', { key: 'slope' }),
  ];
  const sol = p_(`Value: ${d.a} × ${f2(d.pc1)} − ${d.b} × ${f2(d.pcb)} + ${d.c} × ${f2(d.pp2)} = ${e2(d.value)}.`) +
    p_(`Payoff = ${d.a} max(S − ${f2(d.X1)}, 0) − ${d.b} max(S − ${f2(d.kb)}, 0) + ${d.c} max(${f2(d.X2)} − S, 0). At ${f2(d.sA)}: ${e2(payoff(d.legs, d.sA))}; at ${f2(d.sB)}: ${e2(payoff(d.legs, d.sB))}; at ${f2(d.sC)}: ${e2(payoff(d.legs, d.sC))}. Above ${f2(Math.max(d.X2, d.kb))} only the calls pay, with slope ${d.a} − ${d.b} = ${fmtNum(d.slope, 0)}.`);
  const kk = calc();
  kk.r(`**Current value:** $${d.a} \\times ${tn(d.pc1)} - ${d.b} \\times ${tn(d.pcb)} + ${d.c} \\times ${tn(d.pp2)} = ${tn(d.a * d.pc1)} - ${tn(d.b * d.pcb)} + ${tn(d.c * d.pp2)} = ${tn(d.value)}$ (long calls and puts at their premiums, short calls with a minus sign).`, 'value', d.value);
  const payStep = (s: number, key: string) => kk.r(`**Payoff at ${tn(s)}:** $${d.legs.map(l => legStr(l, s)).join('$; $')}$, so the portfolio pays $${d.legs.map(l => tq(legPay(l, s))).join(' + ')} = ${tn(payoff(d.legs, s))}$.`, key, payoff(d.legs, s));
  payStep(d.sA, 'pA'); payStep(d.sB, 'pB'); payStep(d.sC, 'pC');
  kk.r(`**Slope above the highest strike ${tn(Math.max(d.X2, d.kb))}:** the puts expire worthless and only the calls pay, so each €1 rise adds $${d.a} - ${d.b} = ${d.slope}$.`, 'slope', d.slope);
  return { ...withCalc(Q('L2.portfolio', 2, html, parts), kk.steps), solution: sol };
}

/** Name the strategy from its legs. */
export function L2_identify(): Question {
  const st = pick(STRATS), S = 50, xs = st.n === 1 ? [50] : st.n === 2 ? [45, 55] : [45, 50, 55];
  const legs = st.legs(xs);
  const html = p_(`A trader takes these positions in European options on the same share and with the same maturity (share at €${S}): ${legs.map(legText).join('; ')}. What is this position?`);
  const names = STRATS.map(s => s.name).filter(n => n !== st.name);
  return mcText('L2.identify', '2', html, st.name, shuffle(names), p_(`${legs.map(legText).join('; ')}: a ${st.name}, a bet on ${st.view}.`), false);
}

// =====================================================================
// LECTURE 3 — The binomial model
// =====================================================================

/** One-period replication with a per-period rate r, as in the lecture examples: m, B, price and arbitrage. */
export function L3_replicate(): Question {
  for (;;) {
    const put = chance(0.35), S = rstep(40, 120, 5), u = rstep(1.08, 1.3, 0.01), d = rstep(0.78, 0.95, 0.01), r = rstep(0.01, 0.07, 0.0025);
    if (!(d < 1 + r && 1 + r < u)) continue;
    const X = strikeNear(S, 0.9, 1.15), Su = S * u, Sd = S * d, pay = (s: number) => Math.max(put ? X - s : s - X, 0);
    const cu = pay(Su), cd = pay(Sd);
    if (cu === cd) continue;
    const m = (cu - cd) / (Su - Sd), B = (m * Su - cu) / (1 + r), c0 = m * S - B, pi = (1 + r - d) / (u - d);
    const mis = chance(0.6), mkt = mis ? roundTo(c0 + pick([-1, 1]) * rstep(0.4, 2, 0.1), 0.05) : roundTo(c0, 0.01);
    if (mkt <= 0) continue;
    const gap = mkt - c0, k = put ? 'put' : 'call';
    const html = p_(`A share trades at ${e2(S)}. Next period it will be worth either ${e2(Su)} (u = ${f2(u)}) or ${e2(Sd)} (d = ${f2(d)}). The risk-free rate is ${pp(r)} per period (simple). A European ${k} with strike ${e2(X)} matures at the end of the period and trades at ${e2(mkt)}.`);
    const opts = ['No arbitrage: the market price equals the value of the replicating portfolio',
      `The ${k} is overpriced: sell it and buy the replicating portfolio`, `The ${k} is underpriced: buy it and sell the replicating portfolio`];
    const parts: Part[] = [
      N('How many shares m does the replicating portfolio hold (negative = short)?', m, 'n'),
      N('How much does it borrow, B (negative = lend)?', B, 'eur'),
      N(`What is the value of the ${k}?`, c0, 'eur'),
      N('What is the risk-neutral probability π of the up move?', pi * 100, 'pct'),
      C('What does the market price imply?', opts, Math.abs(gap) < 0.02 ? 0 : gap > 0 ? 1 : 2),
    ];
    const sol = p_(`Payoffs: ${k}<sup>u</sup> = ${e2(cu)}, ${k}<sup>d</sup> = ${e2(cd)}. m = (${f2(cu)} − ${f2(cd)}) / (${f2(Su)} − ${f2(Sd)}) = ${f4(m)}; B = (m S<sup>u</sup> − ${k}<sup>u</sup>) / (1 + r) = (${f4(m)} × ${f2(Su)} − ${f2(cu)}) / ${f4(1 + r)} = ${f4(B)}.`) +
      p_(`Value = mS − B = ${f4(m)} × ${f2(S)} − ${f4(B)} = ${e2(c0)}. The same with π = (1 + r − d)/(u − d) = ${f4(pi)}: [${f4(pi)} × ${f2(cu)} + ${f4(1 - pi)} × ${f2(cd)}] / ${f4(1 + r)} = ${e2(c0)}.`) +
      p_(Math.abs(gap) < 0.02 ? 'The market price matches: no arbitrage.' : gap > 0 ? `Market ${e2(mkt)} > ${e2(c0)}: sell the ${k}, buy m shares and borrow B; riskless profit ${e2(gap)} today.` : `Market ${e2(mkt)} < ${e2(c0)}: buy the ${k}, short m shares and lend B; riskless profit ${e2(-gap)} today.`);
    return { ...Q('L3.replicate', 3, html, parts), solution: sol };
  }
}

/** Two-period tree with u = e^(σ√Δt): European call or put, risk-neutral probability and delta. */
export function L3_twoStep(): Question {
  for (;;) {
    const put = chance(0.45), S = rstep(30, 120, 1), X = strikeNear(S, 0.9, 1.15), sig = rstep(0.15, 0.5, 0.05), r = rstep(0.02, 0.08, 0.005), T = pick([2, 4, 6, 12]) / 12;
    const dt = T / 2, u = Math.exp(sig * Math.sqrt(dt)), d = 1 / u, t = binom({ S, X, n: 2, u, d, growth: Math.exp(r * dt), disc: Math.exp(-r * dt), put });
    if (t.V[0][0] < 0.05) continue;
    const k = put ? 'put' : 'call';
    const html = p_(`A share that pays no income trades at ${e2(S)} and has a volatility of ${pp(sig, 0)}. Value a European ${k} with strike ${e2(X)} maturing in ${months(T)} with a two-period binomial tree (u = e<sup>σ√Δt</sup>, d = 1/u). The risk-free rate is ${pp(r)}. ${CONT}`);
    const parts = chooseParts([
      { part: N('What is the up factor u?', u, 'n'), w: 0.6 },
      { part: N('What is the risk-neutral probability of an up move?', t.pi * 100, 'pct'), w: 0.7 },
      { part: N(`What is the value of the ${k} at the up node after one period?`, t.V[1][0], 'eur'), w: 0.5 },
      { part: N(`What is the value of the ${k} today?`, t.V[0][0], 'eur'), must: true },
      { part: N(`What is the delta of the ${k} today?`, t.delta[0][0], 'n'), w: 0.7 },
    ], 3, 5);
    const sol = p_(`Δt = ${f4(dt)}, u = e<sup>${f2(sig)}√${f4(dt)}</sup> = ${f4(u)}, d = ${f4(d)}, π = (e<sup>rΔt</sup> − d)/(u − d) = (${f4(Math.exp(r * dt))} − ${f4(d)}) / (${f4(u)} − ${f4(d)}) = ${f4(t.pi)}.`) +
      treeTable(t, k[0].toUpperCase() + k.slice(1) + ' value') +
      p_(`Backward: each node = e<sup>−rΔt</sup>[π V<sup>u</sup> + (1 − π)V<sup>d</sup>]. Today ${e2(t.V[0][0])}. Delta = (V<sup>u</sup> − V<sup>d</sup>)/(S<sup>u</sup> − S<sup>d</sup>) = (${f4(t.V[1][0])} − ${f4(t.V[1][1])}) / (${f2(t.S[1][0])} − ${f2(t.S[1][1])}) = ${f4(t.delta[0][0])}.`);
    return { ...Q('L3.twoStep', 3, html, parts), solution: sol };
  }
}

/** American versus European put in a two-period tree with the lecture parameters (per-period rate). */
export function L3_american(): Question {
  for (;;) {
    const cont = chance(0.5), S = rstep(40, 120, 5), X = strikeNear(S, 1, 1.2);
    let u: number, d: number, growth: number, setup: string;
    if (cont) {
      const sig = rstep(0.2, 0.45, 0.05), r = rstep(0.03, 0.1, 0.005), T = pick([6, 12]) / 12, dt = T / 2;
      u = Math.exp(sig * Math.sqrt(dt)); d = 1 / u; growth = Math.exp(r * dt);
      setup = `The share has a volatility of ${pp(sig, 0)} and the risk-free rate is ${pp(r)} (annual, continuous compounding). Use a two-period tree for ${months(T)} with u = e<sup>σ√Δt</sup> and d = 1/u.`;
    } else {
      u = rstep(1.08, 1.25, 0.01); d = rstep(0.8, 0.94, 0.01); const r = rstep(0.01, 0.05, 0.0025); growth = 1 + r;
      if (!(d < growth && growth < u)) continue;
      setup = `Each period the share rises by the factor u = ${f2(u)} or falls by d = ${f2(d)}; the risk-free rate is ${pp(r)} per period (simple). Use two periods.`;
    }
    const base = { S, X, n: 2, u, d, growth, disc: 1 / growth, put: true };
    const eu = binom(base), am = binom({ ...base, american: true });
    const early = am.ex[1][1] ? 2 : am.ex[1][0] ? 1 : 0;
    if (am.ex[0][0] || am.V[0][0] - eu.V[0][0] < 0.01 && early) continue;
    const html = p_(`A share that pays no income trades at ${e2(S)}. ${setup} Consider puts with strike ${e2(X)}.`);
    const parts: Part[] = [
      N('What is the value of the European put?', eu.V[0][0], 'eur'),
      N('What is the value of the American put?', am.V[0][0], 'eur'),
      C('At which node after one period is early exercise optimal?', ['Neither', 'The up node', 'The down node'], early),
    ];
    const sol = p_(`π = (${f4(growth)} − ${f4(d)}) / (${f4(u)} − ${f4(d)}) = ${f4(eu.pi)}.`) + treeTable(am, 'American put') +
      p_(`At each node compare keeping the option alive, ${f4(1 / growth)}[π P<sup>u</sup> + (1 − π)P<sup>d</sup>], with killing it, X − S. ${early ? `At the ${early === 1 ? 'up' : 'down'} node exercise gives ${e2(X - am.S[1][early - 1])} against ${e2(eu.V[1][early - 1])} alive, so the put is exercised there.` : 'Keeping the put alive is worth more at both nodes, so the American put equals the European one.'} European put ${e2(eu.V[0][0])}, American put ${e2(am.V[0][0])}.`);
    return { ...Q('L3.american', 3, html, parts), solution: sol };
  }
}

const binomC = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return c; };

/** n-period formula for a European call with per-period u, d and r (lecture example with T = 4). */
export function L3_nPeriod(): Question {
  for (;;) {
    const n = pick([3, 4]), S = rstep(50, 150, 10), u = rstep(1.05, 1.15, 0.01), d = rstep(0.88, 0.97, 0.01), r = rstep(0.01, 0.05, 0.01);
    if (!(d < 1 + r && 1 + r < u)) continue;
    const X = roundTo(S * rstep(1, 1.2, 0.01), 5), pi = (1 + r - d) / (u - d);
    const terms = Array.from({ length: n + 1 }, (_, j) => ({ j, w: binomC(n, j) * pi ** j * (1 - pi) ** (n - j), S: S * u ** j * d ** (n - j) }));
    const itm = terms.filter(t => t.S > X);
    if (itm.length < 1 || itm.length > n) continue;
    const c = terms.reduce((s, t) => s + t.w * Math.max(t.S - X, 0), 0) / (1 + r) ** n, pItm = itm.reduce((s, t) => s + t.w, 0);
    const html = p_(`A share trades at ${e2(S)}. Each period it moves up by u = ${f2(u)} or down by d = ${f2(d)}, and the risk-free rate is ${pp(r, 0)} per period (simple). A European call with strike ${e2(X)} matures after ${n} periods.`);
    const parts: Part[] = [
      N('What is the risk-neutral probability π?', pi * 100, 'pct'),
      N('What is the risk-neutral probability that the call ends in the money?', pItm * 100, 'pct'),
      N('What is the value of the call today?', c, 'eur'),
    ];
    const sol = p_(`π = (1 + r − d)/(u − d) = (${f2(1 + r)} − ${f2(d)}) / (${f2(u)} − ${f2(d)}) = ${f4(pi)}.`) +
      table(['Up moves j', 'Probability C(n, j)π<sup>j</sup>(1 − π)<sup>n−j</sup>', 'S<sub>T</sub>', 'Payoff'], terms.slice().reverse().map(t => [String(t.j), f4(t.w), f2(t.S), f2(Math.max(t.S - X, 0))])) +
      p_(`c = [1/(1 + r)]<sup>${n}</sup> Σ C(n, j) π<sup>j</sup>(1 − π)<sup>n−j</sup> max(S u<sup>j</sup>d<sup>n−j</sup> − X, 0) = ${e2(c)}. Probability of ending in the money: ${pp(pItm)}.`);
    return { ...Q('L3.nPeriod', 3, html, parts), solution: sol };
  }
}

export function divTreeDraw() {
  for (;;) {
    const S = rstep(50, 120, 5), X = strikeNear(S, 1, 1.2), sig = rstep(0.2, 0.4, 0.05), r = rstep(0.03, 0.08, 0.01), D = rstep(1, Math.max(1.5, S * 0.07), 0.5);
    const T = 0.5, dt = 0.25, u = Math.exp(sig * Math.sqrt(dt)), d = 1 / u, PVD = D * Math.exp(-r * dt), Ss = S - PVD;
    const add = (i: number) => i === 0 ? PVD : i === 1 ? D : 0;
    const base = { S: Ss, X, n: 2, u, d, growth: Math.exp(r * dt), disc: Math.exp(-r * dt), add };
    const eu = binom(base), am = binom({ ...base, american: true }), pe = binom({ ...base, put: true });
    if (eu.V[0][0] < 0.1) continue;
    const PVX = X * Math.exp(-r * T), parity = eu.V[0][0] - S + PVD + PVX;
    return { S, X, sig, r, D, T, dt, u, d, PVD, Ss, eu, am, pe, PVX, parity, early: am.ex[1][0] || am.ex[1][1] };
  }
}

/** Two-period tree with a discrete dividend: tree for S − PV(D), European and American call, put by parity and by tree
 *  (problem set 1, exercise 3). */
export function L3_dividendTree(): Question {
  const d = divTreeDraw();
  const html = p_(`A share trades at ${e2(d.S)}, has a volatility of ${pp(d.sig, 0)} and pays a dividend of ${e2(d.D)} in 3 months. Options on the share have strike ${e2(d.X)} and mature in 6 months; the risk-free rate is ${pp(d.r, 0)}. ${CONT}`) +
    p_(`Use a two-period tree with 3-month steps for S* = S − PV(dividend), with u = e<sup>σ√Δt</sup>, d = 1/u. The share price at a node is S* plus the present value of the dividends still to come; at the 3-month nodes the price just before the dividend is S* + ${f2(d.D)}.`);
  const parts = chooseParts([
    { part: N('What is S* today?', d.Ss, 'eur'), w: 0.5 },
    { part: N('What is the value of the European call?', d.eu.V[0][0], 'eur'), must: true },
    { part: N('What is the delta of the call today?', d.eu.delta[0][0], 'n'), w: 0.5 },
    { part: N('What is the value of the American call (exercise possible just before the dividend)?', d.am.V[0][0], 'eur'), w: 0.8 },
    { part: N('What is the value of the European put with the same strike and maturity?', d.pe.V[0][0], 'eur'), w: 0.7 },
  ], 3, 5);
  const sol = p_(`PV(D) = ${f2(d.D)}e<sup>−${f2(d.r)} × 0.25</sup> = ${f4(d.PVD)}, S* = ${f4(d.Ss)}; u = ${f4(d.u)}, d = ${f4(d.d)}, π = ${f4(d.eu.pi)}.`) +
    treeTable(d.am, 'American call', e2, ['today', '3 months (cum)', '6 months']) +
    p_(`European call: discount the 6-month payoffs, ${e2(d.eu.V[0][0])} (delta ${f4(d.eu.delta[0][0])}). American call: at the 3-month nodes compare exercising just before the dividend, S* + D − X, with keeping it alive; ${d.early ? 'early exercise pays at the up node' : 'keeping it alive is better at both nodes'}, value ${e2(d.am.V[0][0])}.`) +
    p_(`European put by parity: p = c − S + PV(D) + PV(X) = ${f4(d.eu.V[0][0])} − ${f2(d.S)} + ${f4(d.PVD)} + ${f4(d.PVX)} = ${e2(d.parity)}; the tree gives the same, ${e2(d.pe.V[0][0])}. At each node the put delta equals the call delta minus 1.`);
  return { ...Q('L3.dividendTree', 3, html, parts), solution: sol };
}

/** Tree for an index with a continuous dividend yield (problem set 1, exercise 5). */
export function L3_yield(): Question {
  for (;;) {
    const put = chance(0.45), S = rstep(2000, 5000, 100), X = roundTo(S * (put ? rstep(0.9, 1, 0.01) : rstep(1, 1.1, 0.01)), 50);
    const sig = rstep(0.15, 0.35, 0.05), q = rstep(0.01, 0.04, 0.005), r = rstep(0.02, 0.06, 0.005), dt = 1 / 12;
    const u = Math.exp(sig * Math.sqrt(dt)), d = 1 / u, t = binom({ S, X, n: 2, u, d, growth: Math.exp((r - q) * dt), disc: Math.exp(-r * dt), put });
    if (t.V[0][0] < 1) continue;
    const k = put ? 'put' : 'call';
    const html = p_(`An index stands at ${fmtNum(S, 0)}, has a volatility of ${pp(sig, 0)} and a dividend yield of ${pp(q)} (continuous). The risk-free rate is ${pp(r)}. ${CONT} Using a binomial tree with monthly steps, value a European ${k} with strike ${fmtNum(X, 0)} maturing in 2 months.`);
    const parts: Part[] = [
      N('What is the risk-neutral probability of an up move?', t.pi * 100, 'pct'),
      N(`What is the value of one ${k} (in index points)?`, t.V[0][0], 'n'),
      N(`What is the current delta of the ${k}?`, t.delta[0][0], 'n'),
    ];
    const sol = p_(`u = e<sup>${f2(sig)}√(1/12)</sup> = ${f4(u)}, d = ${f4(d)}; with a dividend yield π = (e<sup>(r − q)Δt</sup> − d)/(u − d) = (${f4(Math.exp((r - q) * dt))} − ${f4(d)}) / (${f4(u)} − ${f4(d)}) = ${f4(t.pi)}.`) +
      treeTable(t, k[0].toUpperCase() + k.slice(1), x => fmtNum(x, 2), undefined, x => fmtNum(x, 2)) +
      p_(`Value ${f2(t.V[0][0])}; delta = (${f2(t.V[1][0])} − ${f2(t.V[1][1])}) / (${f2(t.S[1][0])} − ${f2(t.S[1][1])}) = ${f4(t.delta[0][0])}.`);
    return { ...Q('L3.yield', 3, html, parts), solution: sol };
  }
}

/** Historical volatility from daily closing prices (lecture slide: 252 trading days). */
export function L3_vol(): Question {
  const n = rint(6, 9), p = [rstep(8, 40, 0.5)];
  for (let i = 1; i < n; i++) p.push(Math.max(1, roundTo(p[i - 1] * Math.exp(rstep(-0.03, 0.03, 0.0025)), 0.05)));
  const u = p.slice(1).map((x, i) => Math.log(x / p[i]));
  const m = u.reduce((s, x) => s + x, 0) / u.length, v = u.reduce((s, x) => s + (x - m) ** 2, 0) / (u.length - 1), sig = Math.sqrt(v * 252);
  const html = p_('Closing prices of a share on consecutive trading days:') + table(['Day', ...p.map((_, i) => String(i + 1))], [['Price', ...p.map(x => f2(x))]]) +
    p_(`Estimate the annual volatility from the continuously compounded daily returns u<sub>t</sub> = ln(S<sub>t</sub>/S<sub>t−1</sub>), with the sample variance (divide by n − 1) and 252 trading days a year. ${NOTE_PCT}`);
  const parts: Part[] = [
    N('What is the average daily return?', m * 100, 'pct', { abs: 0.01 }),
    N('What is the sample variance of the daily returns?', v, 'n', { abs: 0.00002 }),
    N('What is the estimated annual volatility?', sig * 100, 'pct'),
  ];
  const sol = table(['Day', 'u<sub>t</sub>'], u.map((x, i) => [String(i + 2), f4(x)])) +
    p_(`Mean ${f4(m)} (${pp(m, 3)}); variance Σ(u<sub>t</sub> − ū)²/(n − 1) = ${fmtNum(v, 6)}; σ = √(${fmtNum(v, 6)} × 252) = ${pp(sig)}.`);
  return { ...Q('L3.vol', 3, html, parts), solution: sol };
}

// =====================================================================
// LECTURE 4 — Black-Scholes and the lognormal model
// =====================================================================

/** Black-Scholes price of a call and a put, d1, d2 and the delta hedge. */
export function L4_bs(): Question {
  const S = rstep(10, 120, 0.5), X = strikeNear(S, 0.85, 1.2), sig = rstep(0.15, 0.6, 0.05), r = rstep(0.01, 0.08, 0.005), T = pick([1, 2, 3, 4, 6, 9, 12]) / 12;
  const b = bs(S, X, T, r, sig), n = pick([100, 500, 1000, 2000]);
  const html = p_(`A share that pays no dividends trades at ${e2(S)} and has a volatility of ${pp(sig, 0)}. The risk-free rate is ${pp(r)}. ${CONT} Consider European options with strike ${e2(X)} maturing in ${months(T)}.`);
  const parts = chooseParts([
    { part: N('What is d1?', b.d1, 'n'), w: 0.6 },
    { part: N('What is d2?', b.d2, 'n'), w: 0.6 },
    { part: N('What is the Black-Scholes value of the call?', b.c, 'eur'), must: true },
    { part: N('What is the value of the put?', b.p, 'eur'), w: 0.8 },
    { part: N(`How many shares must a trader who has written ${n} calls hold to be delta-neutral?`, n * b.Nd1, 'n'), w: 0.5 },
  ], 3, 5);
  const sol = p_(`d1 = [ln(${f2(S)}/${f2(X)}) + (${f4(r)} + ${f4(sig)}²/2) × ${f4(T)}] / (${f2(sig)}√${f4(T)}) = ${f4(b.d1)}; d2 = d1 − σ√T = ${f4(b.d2)}. N(d1) = ${f4(b.Nd1)}, N(d2) = ${f4(b.Nd2)}.`) +
    p_(`c = S N(d1) − X e<sup>−rT</sup> N(d2) = ${f2(S)} × ${f4(b.Nd1)} − ${f4(b.PVX)} × ${f4(b.Nd2)} = ${e2(b.c)}. p = X e<sup>−rT</sup> N(−d2) − S N(−d1) = ${e2(b.p)} (check: c − p = S − PV(X) = ${f4(S - b.PVX)}).`) +
    p_(`The call delta is N(d1) = ${f4(b.Nd1)}, so ${n} written calls are hedged with ${f2(n * b.Nd1)} shares.`);
  return { ...Q('L4.bs', 4, html, parts), solution: sol };
}

/** Real-world and risk-neutral probability of exercise, Black-Scholes value and implied volatility (problem set 1, exercise 6). */
export function L4_probability(): Question {
  for (;;) {
    const S = rstep(8, 60, 0.5), X = roundTo(S * rstep(1.02, 1.15, 0.01), S > 20 ? 1 : 0.5), mu = rstep(0.08, 0.25, 0.01), sig = rstep(0.2, 0.5, 0.05), r = rstep(0.02, 0.1, 0.01);
    const weeks = pick([3, 4, 6, 8, 10, 13]), T = weeks / 52, b = bs(S, X, T, r, sig);
    const d2mu = (Math.log(S / X) + (mu - sig * sig / 2) * T) / (sig * Math.sqrt(T)), pReal = Phi(d2mu);
    const mkt = roundTo(b.c * rstep(0.7, 1.3, 0.01), 0.01), iv = impliedVol(mkt, S, X, T, r);
    if (mkt < 0.03 || !Number.isFinite(iv) || Math.abs(mkt - b.c) < 0.01) continue;
    const html = p_(`The share price of a company follows dS = ${f2(mu)} S dt + ${f2(sig)} S dz, where dz is a Wiener process. European calls with strike ${e2(X)} maturing in ${weeks} weeks trade at ${e2(mkt)}; the share trades at ${e2(S)}. The risk-free rate is ${pp(r, 0)}. ${CONT} Use weeks/52. ${NOTE_PCT}`);
    const parts = chooseParts([
      { part: N('What is the (real-world) probability that the call is exercised?', pReal * 100, 'pct'), must: true },
      { part: N('What is the risk-neutral probability that the call is exercised?', b.Nd2 * 100, 'pct'), must: true },
      { part: N('What is the Black-Scholes value of the call?', b.c, 'eur'), w: 0.8 },
      { part: N('What volatility is implied by the market price?', iv * 100, 'pct', { abs: 0.3 }), w: 0.6 },
      { part: C('How does the market price compare with the Black-Scholes value, and what does that say?', ['Higher: the market prices in a higher volatility than the historical estimate', 'Lower: the market prices in a lower volatility than the historical estimate'], mkt > b.c ? 0 : 1), w: 0.5 },
    ], 3, 5);
    const sol = p_(`ln S<sub>T</sub> is normal. Real world: P(S<sub>T</sub> > X) = N(d2 with μ) with d2 = [ln(S/X) + (μ − σ²/2)T]/(σ√T) = [ln(${f2(S)}/${f2(X)}) + (${f2(mu)} − ${f4(sig * sig / 2)}) × ${f4(T)}] / (${f2(sig)}√${f4(T)}) = ${f4(d2mu)}, probability ${pp(pReal)}.`) +
      p_(`Risk-neutral: replace μ by r: d2 = ${f4(b.d2)}, N(d2) = ${pp(b.Nd2)}. The two differ because investors are not risk-neutral; only the risk-neutral probability is used for pricing.`) +
      p_(`Black-Scholes: c = ${f2(S)} × ${f4(b.Nd1)} − ${f4(b.PVX)} × ${f4(b.Nd2)} = ${e2(b.c)}. The market price ${e2(mkt)} is ${mkt > b.c ? 'higher' : 'lower'}; the volatility that reproduces it is ${pp(iv)} (σ from history: ${pp(sig, 0)}).`);
    return { ...Q('L4.probability', 4, html, parts), solution: sol };
  }
}

/** Black-Scholes with a discrete dividend (subtract its present value) or a continuous dividend yield. */
export function L4_dividends(): Question {
  const yieldCase = chance(0.4), S = yieldCase ? rstep(1000, 5000, 50) : rstep(5, 80, 0.5), X = yieldCase ? roundTo(S * rstep(0.9, 1.1, 0.01), 50) : strikeNear(S, 0.85, 1.2);
  const sig = rstep(0.2, 0.6, 0.05), r = rstep(0.02, 0.06, 0.005), T = pick([2, 3, 6, 12]) / 12;
  const q = yieldCase ? rstep(0.01, 0.04, 0.005) : 0, D = yieldCase ? 0 : roundTo(S * rstep(0.02, 0.12, 0.01), 0.05), tD = T / 2;
  const PVD = D * Math.exp(-r * tD), Sadj = S - PVD, b = bs(Sadj, X, T, r, sig, q), fmt = yieldCase ? (x: number) => fmtNum(x, 2) : e2, unit = yieldCase ? 'n' as const : 'eur' as const;
  const html = yieldCase
    ? p_(`An index stands at ${fmtNum(S, 0)} with a volatility of ${pp(sig, 0)} and a dividend yield of ${pp(q)} (continuous). The risk-free rate is ${pp(r)}. ${CONT} Value European options with strike ${fmtNum(X, 0)} maturing in ${months(T)} (in index points).`)
    : p_(`A share trades at ${e2(S)} and has a volatility of ${pp(sig, 0)}. It will pay a dividend of ${e2(D)} in ${months(tD)}. The risk-free rate is ${pp(r)}. ${CONT} Value European options with strike ${e2(X)} maturing in ${months(T)}.`);
  const parts: Part[] = [
    ...(yieldCase ? [N('What is S e^(−qT), the index level net of the dividend yield?', S * Math.exp(-q * T), 'n')] : [N('What share price goes into the Black-Scholes formula?', Sadj, 'eur')]),
    N('What is the value of the call?', b.c, unit),
    N('What is the value of the put?', b.p, unit),
  ];
  const sol = (yieldCase ? p_(`With a continuous yield replace S by S e<sup>−qT</sup> = ${fmtNum(S * Math.exp(-q * T), 2)}: d1 = [ln(S/X) + (r − q + σ²/2)T]/(σ√T) = ${f4(b.d1)}, d2 = ${f4(b.d2)}.`)
    : p_(`Subtract the present value of the dividend: ${f2(S)} − ${f2(D)}e<sup>−${f4(r)} × ${f4(tD)}</sup> = ${e2(Sadj)}; d1 = ${f4(b.d1)}, d2 = ${f4(b.d2)}.`)) +
    p_(`c = ${fmt(b.c)}, p = ${fmt(b.p)}. The dividend lowers the call and raises the put.`);
  return { ...Q('L4.dividends', 4, html, parts), solution: sol };
}

/** Implied volatility from a market price. */
export function L4_implied(): Question {
  for (;;) {
    const S = rstep(10, 100, 0.5), X = strikeNear(S, 0.9, 1.1), r = rstep(0.01, 0.06, 0.005), T = pick([1, 2, 3, 6]) / 12, sig = rstep(0.15, 0.7, 0.01);
    const c = roundTo(bs(S, X, T, r, sig).c, 0.01), iv = impliedVol(c, S, X, T, r);
    if (c < 0.2 || !Number.isFinite(iv)) continue;
    const html = p_(`A European call on a share without dividends has strike ${e2(X)}, matures in ${months(T)} and trades at ${e2(c)}. The share trades at ${e2(S)}; the risk-free rate is ${pp(r)}. ${CONT} ${NOTE_PCT}`);
    const sol = p_(`Solve c<sub>BS</sub>(σ) = ${f2(c)} by trial: the call value rises with σ, so bisect between a low and a high volatility. σ = ${pp(iv)} gives c = ${e2(bs(S, X, T, r, iv).c)}.`);
    return { ...Q('L4.implied', 4, html, [N('What is the implied volatility?', iv * 100, 'pct', { abs: 0.3 })]), solution: sol };
  }
}

/** Distribution of S_T under the lognormal model: mean and sd of ln S_T, expected value, interval and probability. */
export function L4_lognormal(): Question {
  const S = rstep(20, 100, 1), mu = rstep(0.06, 0.2, 0.01), sig = rstep(0.15, 0.45, 0.05), T = pick([0.5, 1, 2, 3]);
  const m = Math.log(S) + (mu - sig * sig / 2) * T, s = sig * Math.sqrt(T), K = roundTo(S * rstep(0.8, 1.4, 0.05), 1);
  const lo = Math.exp(m - 1.96 * s), hi = Math.exp(m + 1.96 * s), pK = 1 - Phi((Math.log(K) - m) / s);
  const html = p_(`A share trades at ${e2(S)}, has an expected return of ${pp(mu, 0)} and a volatility of ${pp(sig, 0)} a year (dS = μS dt + σS dz). Consider the share price in ${T === 1 ? 'one year' : T + ' years'}. ${NOTE_PCT}`);
  const parts = chooseParts([
    { part: N('What is the mean of ln S_T?', m, 'n'), w: 0.7 },
    { part: N('What is the standard deviation of ln S_T?', s, 'n'), w: 0.7 },
    { part: N('What is the expected share price E[S_T]?', S * Math.exp(mu * T), 'eur'), w: 0.6 },
    { part: N('What is the lower end of the 95% confidence interval for S_T?', lo, 'eur'), w: 0.5 },
    { part: N('What is the upper end of the 95% confidence interval?', hi, 'eur'), w: 0.5 },
    { part: N(`What is the probability that the share ends above ${e2(K)}?`, pK * 100, 'pct'), w: 0.7 },
  ], 3, 5);
  const sol = p_(`ln S<sub>T</sub> ~ N(ln S<sub>0</sub> + (μ − σ²/2)T, σ²T): mean ln ${f2(S)} + (${f2(mu)} − ${f4(sig * sig / 2)}) × ${T} = ${f4(m)}, sd ${f2(sig)}√${T} = ${f4(s)}.`) +
    p_(`E[S<sub>T</sub>] = S<sub>0</sub>e<sup>μT</sup> = ${e2(S * Math.exp(mu * T))}. 95% interval: e<sup>${f4(m)} ± 1.96 × ${f4(s)}</sup> = ${e2(lo)} to ${e2(hi)}. P(S<sub>T</sub> > ${f2(K)}) = N([${f4(m)} − ln ${f2(K)}]/${f4(s)}) = ${pp(pK)}.`);
  return { ...Q('L4.lognormal', 4, html, parts), solution: sol };
}

// =====================================================================
// LECTURE 5 — Structured products
// =====================================================================

/** Guaranteed product plus a multiple α of an option: solve α for the issuer's margin (problem set 1, exercise 9D–E). */
export const L5_guaranteed = () => guaranteedQ();
export function guaranteedQ(forcePut?: boolean): Question {
  for (;;) {
    const put = forcePut ?? chance(0.5), S = rstep(4, 60, 0.5), X = put ? roundTo(S * rstep(1, 2, 0.05), 0.5) : roundTo(S * rstep(0.9, 1.1, 0.05), 0.5);
    const sig = rstep(0.3, 0.7, 0.05), r = rstep(0.01, 0.05, 0.005), T = pick([2, 3, 6, 12]) / 12, price = 1000, G = pick([900, 950, 970, 980, 1000]), mar = pick([0.02, 0.03, 0.05]);
    const b = bs(S, X, T, r, sig), opt = put ? b.p : b.c, pvG = G * Math.exp(-r * T), budget = price * (1 - mar) - pvG, alpha = budget / opt;
    if (budget <= 1 || opt < 0.05 || alpha > 2000) continue;
    const sT = roundTo(put ? X * rstep(0.3, 0.9, 0.05) : X * rstep(1.1, 1.6, 0.05), 0.5), pay = G + alpha * Math.max(put ? X - sT : sT - X, 0);
    const html = p_(`A bank sells a structured product at €${price} per unit, maturing in ${months(T)}. At maturity it pays a guaranteed €${G} plus α × max(${put ? `${f2(X)} − S<sub>T</sub>` : `S<sub>T</sub> − ${f2(X)}`}, 0), where S<sub>T</sub> is the price of a share that trades at ${e2(S)} today, pays no dividends and has a volatility of ${pp(sig, 0)}. The risk-free rate is ${pp(r)}. ${CONT} The bank wants a margin of ${P(mar, 0)} of the selling price.`);
    const parts = chooseParts([
      { part: N('What is the present value of the guaranteed amount?', pvG, 'eur'), w: 0.7 },
      { part: N(`What is the Black-Scholes value of one ${put ? 'put' : 'call'} with strike ${f2(X)}?`, opt, 'eur'), must: true },
      { part: N('What is α?', alpha, 'n'), must: true },
      { part: N(`What does one unit pay if the share ends at ${e2(sT)}?`, pay, 'eur'), w: 0.5 },
    ], 3, 4);
    const sol = p_(`Building blocks: a zero-coupon bond paying €${G} plus α European ${put ? 'puts' : 'calls'} with strike ${f2(X)}. PV(guarantee) = ${G}e<sup>−${f4(r)} × ${f4(T)}</sup> = ${e2(pvG)}; one option (Black-Scholes) = ${e4(opt)}.`) +
      p_(`Value to the buyer must be ${price} × (1 − ${P(mar, 0)}) = ${f2(price * (1 - mar))}: α = (${f2(price * (1 - mar))} − ${f2(pvG)}) / ${f4(opt)} = ${f2(alpha)}. At S<sub>T</sub> = ${f2(sT)} the unit pays ${G} + ${f2(alpha)} × ${f2(Math.max(put ? X - sT : sT - X, 0))} = ${e2(pay)}.`);
    return { ...Q('L5.guaranteed', 5, html, parts), solution: sol };
  }
}

export function floorDraw() {
  for (;;) {
    const S = rstep(300, 900, 50), A = 1000, B = A + roundTo(S * rstep(0.4, 0.9, 0.05), 50), K = B - A;
    const r = rstep(0.02, 0.06, 0.01), y = rstep(0.01, 0.04, 0.01), u = rstep(0.02, 0.07, 0.01), T = pick([1, 2, 3]);
    const mw = rstep(-0.002, 0.008, 0.001), sw = rstep(0.02, 0.05, 0.005), sig = sw * Math.sqrt(52), q = y - u;
    const b = bs(S, K, T, r, sig, q), value = A * Math.exp(-r * T) + b.p;
    const mReal = Math.log(S) + 52 * T * mw, sReal = sw * Math.sqrt(52 * T), pReal = 1 - Phi((Math.log(K) - mReal) / sReal);
    if (b.p < 1) continue;
    return { S, A, B, K, r, y, u, T, mw, sw, sig, q, b, value, mReal, sReal, pReal, pRN: b.Nd2 };
  }
}

/** Commodity-linked product max(A, B − S_T): bond plus put, value with storage costs and convenience yield (problem set 1, exercise 7). */
export function L5_floor(): Question {
  const d = floorDraw();
  const html = p_(`A battery producer issues a ${d.T}-year structured product linked to the price of lead. Each unit pays at maturity max(€${d.A}, €${d.B} − S<sub>T</sub>), where S<sub>T</sub> is the spot price of lead per ton. Lead trades at €${fmtNum(d.S, 0)} per ton; its convenience yield is ${pp(d.y, 0)} and its storage cost ${pp(d.u, 0)} a year; the risk-free rate is ${pp(d.r, 0)}. ${CONT}`) +
    p_(`Weekly log price changes have a historical mean of ${pp(d.mw, 1)} and a standard deviation of ${pp(d.sw, 1)} (52 weeks a year). ${NOTE_PCT}`);
  const parts = chooseParts([
    { part: C('How does the product decompose?', [`A zero-coupon bond paying €${d.A} plus a put on lead with strike €${fmtNum(d.K, 0)}`, `A zero-coupon bond paying €${d.B} minus a call on lead with strike €${fmtNum(d.K, 0)}`, `A zero-coupon bond paying €${d.A} minus a put on lead with strike €${fmtNum(d.B, 0)}`, `A forward on lead plus a call with strike €${fmtNum(d.A, 0)}`], 0), w: 0.6 },
    { part: N('What is the annual volatility of the lead price?', d.sig * 100, 'pct'), w: 0.6 },
    { part: N(`What is the (real-world) probability that a unit pays exactly €${d.A}?`, d.pReal * 100, 'pct'), w: 0.6 },
    { part: N(`What is the risk-neutral probability that a unit pays exactly €${d.A}?`, d.pRN * 100, 'pct'), w: 0.6 },
    { part: N('What is the value of the option component per unit?', d.b.p, 'eur'), w: 0.7 },
    { part: N('What is the theoretical value of one unit?', d.value, 'eur'), must: true },
  ], 3, 5);
  const sol = p_(`max(${d.A}, ${d.B} − S<sub>T</sub>) = ${d.A} + max(${fmtNum(d.K, 0)} − S<sub>T</sub>, 0): a bond paying ${d.A} plus a put with strike ${fmtNum(d.K, 0)}. It pays exactly ${d.A} when S<sub>T</sub> ≥ ${fmtNum(d.K, 0)}.`) +
    p_(`σ = ${pp(d.sw, 1)} × √52 = ${pp(d.sig)}. Real world: ln S<sub>T</sub> ~ N(ln ${fmtNum(d.S, 0)} + ${52 * d.T} × ${f4(d.mw)}, ${f4(d.sw)}² × ${52 * d.T}) = N(${f4(d.mReal)}, ${f4(d.sReal)}²), so P(S<sub>T</sub> ≥ ${fmtNum(d.K, 0)}) = ${pp(d.pReal)}.`) +
    p_(`Risk-neutral, lead grows at r + u − y = ${pp(d.r + d.u - d.y, 0)}: it is priced like an asset with yield q = y − u = ${pp(d.q, 0)}. N(d2) = ${pp(d.pRN)}. Put (Black-Scholes with q): ${e2(d.b.p)}. Value = ${d.A}e<sup>−${f2(d.r)} × ${d.T}</sup> + ${f2(d.b.p)} = ${e2(d.value)}.`) +
    p_('The issuer is short a put on lead: it pays more when lead is cheap, which is when its own input costs are low, so the product hedges its exposure.');
  return { ...Q('L5.floor', 5, html, parts), solution: sol };
}

/** Product paying K(1 + |R|): bond plus K/S0 straddles at the money; solve K for the margin (problem set 1, exercise 8). */
export function L5_absolute(): Question {
  for (;;) {
    const S = rstep(5, 50, 0.5), sig = rstep(0.2, 0.6, 0.05), r = rstep(0.01, 0.05, 0.005), T = pick([2, 3, 6]) / 12, mar = pick([0.03, 0.05]), price = 1000;
    const b = bs(S, S, T, r, sig), per = Math.exp(-r * T) + (b.c + b.p) / S, K = price * (1 - mar) / per;
    if (K >= price) continue;
    const Rx = pick([-1, 1]) * rstep(0.05, 0.3, 0.01), sT = S * (1 + Rx), pay = K * (1 + Math.abs(Rx));
    const html = p_(`A bank sells a product at €${price} per unit that pays after ${months(T)} K(1 + R) if R > 0 and K(1 − R) if R ≤ 0, where R is the return on a share between today and maturity. The share trades at ${e2(S)}, pays no dividends and has a volatility of ${pp(sig, 0)}; the risk-free rate is ${pp(r)}. ${CONT} The bank wants a margin of ${P(mar, 0)} of the selling price.`);
    const parts = chooseParts([
      { part: C('Which building blocks replicate one unit?', ['A zero-coupon bond paying K plus K/S₀ calls and K/S₀ puts with strike S₀', 'A zero-coupon bond paying K plus K/S₀ calls with strike S₀', 'K/S₀ shares plus K/S₀ puts with strike S₀', 'A zero-coupon bond paying K minus K/S₀ puts with strike S₀'], 0), w: 0.5 },
      { part: N('What is the value of an at-the-money call?', b.c, 'eur'), w: 0.6 },
      { part: N('What is the value of an at-the-money put?', b.p, 'eur'), w: 0.6 },
      { part: N('What is K?', K, 'eur'), must: true },
      { part: N(`What does a unit pay if the share ends at ${e2(sT)}?`, pay, 'eur'), w: 0.5 },
    ], 3, 5);
    const sol = p_(`K(1 + |R|) = K + (K/S<sub>0</sub>)|S<sub>T</sub> − S<sub>0</sub>| = K + (K/S<sub>0</sub>)[max(S<sub>T</sub> − S<sub>0</sub>, 0) + max(S<sub>0</sub> − S<sub>T</sub>, 0)]: a bond plus K/S<sub>0</sub> at-the-money straddles.`) +
      p_(`c = ${e4(b.c)}, p = ${e4(b.p)}. Value per € of K: e<sup>−rT</sup> + (c + p)/S<sub>0</sub> = ${f4(Math.exp(-r * T))} + ${f4((b.c + b.p) / S)} = ${f4(per)}. K = ${price} × ${f2(1 - mar)} / ${f4(per)} = ${e2(K)}. At S<sub>T</sub> = ${f2(sT)}, |R| = ${pp(Math.abs(Rx))}: pays ${e2(pay)}.`);
    return { ...Q('L5.absolute', 5, html, parts), solution: sol };
  }
}

/** Capital-protected note: participation rate in the upside of an index. */
export function L5_participation(): Question {
  for (;;) {
    const S = rstep(2000, 6000, 100), sig = rstep(0.15, 0.3, 0.05), r = rstep(0.02, 0.05, 0.005), q = rstep(0, 0.03, 0.005), T = pick([2, 3, 4, 5]), N0 = 1000, mar = pick([0.01, 0.02, 0.03]), prot = pick([1, 1, 0.95, 0.9]);
    const b = bs(S, S, T, r, sig, q), pv = prot * N0 * Math.exp(-r * T), budget = N0 * (1 - mar) - pv, part = budget / (N0 / S * b.c);
    if (budget <= 0 || part > 2) continue;
    const up = rstep(0.1, 0.6, 0.05), pay = prot * N0 + part * N0 * up;
    const html = p_(`A capital-protected note costs €${N0} and matures in ${T} years. At maturity it pays ${prot === 1 ? 'the full €1,000' : P(prot, 0) + ' of the €1,000'} plus a participation rate × €1,000 × max(S<sub>T</sub>/S<sub>0</sub> − 1, 0) in the rise of an index that stands at ${fmtNum(S, 0)}. Index volatility ${pp(sig, 0)}, dividend yield ${pp(q, 1)}, risk-free rate ${pp(r, 1)}. ${CONT} The issuer keeps a margin of ${P(mar, 0)} of the price. ${NOTE_PCT}`);
    const parts: Part[] = [
      N('What is the present value of the protected amount?', pv, 'eur'),
      N('What is the value of one at-the-money call on the index (in index points)?', b.c, 'n'),
      N('What participation rate can the issuer offer?', part * 100, 'pct'),
      N(`What does the note pay if the index rises by ${P(up, 0)}?`, pay, 'eur'),
    ];
    const sol = p_(`Building blocks: a zero-coupon bond paying ${f2(prot * N0)} plus participation × (1000/S<sub>0</sub>) at-the-money calls. PV(bond) = ${e2(pv)}. Call (Black-Scholes with yield) = ${f2(b.c)} points, i.e. ${e4(N0 / S * b.c)} per €1,000 of notional.`) +
      p_(`Budget for options: 1000 × (1 − ${P(mar, 0)}) − ${f2(pv)} = ${f2(budget)}; participation = ${f2(budget)} / ${f4(N0 / S * b.c)} = ${pp(part)}. A ${P(up, 0)} rise pays ${f2(prot * N0)} + ${pp(part)} × 1000 × ${f2(up)} = ${e2(pay)}.`);
    return { ...Q('L5.participation', 5, html, parts), solution: sol };
  }
}

/** Reverse convertible: bond minus puts; coupon for a given margin. */
export function L5_reverse(): Question {
  for (;;) {
    const S = rstep(10, 80, 0.5), sig = rstep(0.2, 0.5, 0.05), r = rstep(0.01, 0.05, 0.005), T = pick([6, 12]) / 12, N0 = 1000, mar = pick([0.01, 0.02, 0.03]);
    const b = bs(S, S, T, r, sig), shares = N0 / S, k = (N0 * (1 - mar) + shares * b.p) * Math.exp(r * T) / N0 - 1;
    if (k <= 0 || k > 0.4) continue;
    const sT = roundTo(S * rstep(0.6, 0.95, 0.05), 0.5), pay = N0 * k + Math.min(N0, shares * sT);
    const html = p_(`A reverse convertible costs €${N0} and matures in ${months(T)}. It pays a coupon of k × €${N0} at maturity and, in addition, €${N0} if the share ends at or above its current price of ${e2(S)}, otherwise ${f2(shares)} shares (€${N0}/S<sub>0</sub>). The share pays no dividends and has a volatility of ${pp(sig, 0)}; the risk-free rate is ${pp(r)}. ${CONT} The issuer wants a margin of ${P(mar, 0)}. ${NOTE_PCT}`);
    const parts: Part[] = [
      C('Which building blocks replicate the note?', [`A zero-coupon bond paying ${N0}(1 + k) minus ${f2(shares)} puts with strike S₀`, `A zero-coupon bond paying ${N0}(1 + k) plus ${f2(shares)} calls with strike S₀`, `${f2(shares)} shares plus ${f2(shares)} puts with strike S₀`, `A zero-coupon bond paying ${N0} minus ${f2(shares)} calls with strike S₀`], 0),
      N('What is the value of one at-the-money put?', b.p, 'eur'),
      N('What coupon rate k can the issuer offer?', k * 100, 'pct'),
      N(`What does the note pay if the share ends at ${e2(sT)}?`, pay, 'eur'),
    ];
    const sol = p_(`Payoff = ${N0}k + min(${N0}, (${N0}/S<sub>0</sub>)S<sub>T</sub>) = ${N0}(1 + k) − ${f2(shares)} max(S<sub>0</sub> − S<sub>T</sub>, 0): the investor has sold puts to the issuer.`) +
      p_(`Value = ${N0}(1 + k)e<sup>−rT</sup> − ${f2(shares)} × ${f4(b.p)} = ${N0} × ${f2(1 - mar)}, so 1 + k = (${f2(N0 * (1 - mar))} + ${f2(shares * b.p)}) × e<sup>${f4(r)} × ${f4(T)}</sup> / ${N0}: k = ${pp(k)}. At ${f2(sT)}: ${f2(N0 * k)} + ${f2(Math.min(N0, shares * sT))} = ${e2(pay)}.`);
    return { ...Q('L5.reverse', 5, html, parts), solution: sol };
  }
}

// =====================================================================
// LECTURE 6 — Forwards, futures and swaps
// =====================================================================

/** Forward price of a financial asset or a commodity, and cash-and-carry arbitrage. */
export function L6_forward(): Question {
  for (;;) {
    const kind = pick(['none', 'income', 'yield', 'fx', 'commodity'] as const), r = rstep(0.01, 0.06, 0.0025), T = pick([3, 6, 9, 12]) / 12;
    let S = rstep(20, 150, 0.5), F = 0, html = '', how = '', unit: 'eur' | 'n' = 'eur';
    if (kind === 'none') { F = S * Math.exp(r * T); html = `A share that pays no dividends trades at ${e2(S)}.`; how = `F = S e<sup>rT</sup> = ${f2(S)}e<sup>${f4(r)} × ${f4(T)}</sup>`; }
    if (kind === 'income') {
      const D = roundTo(S * rstep(0.01, 0.04, 0.005), 0.05), tD = T / 2, I = D * Math.exp(-r * tD);
      F = (S - I) * Math.exp(r * T); html = `A share trades at ${e2(S)} and pays a dividend of ${e2(D)} in ${months(tD)}.`; how = `F = (S − PV(D))e<sup>rT</sup> = (${f2(S)} − ${f4(I)})e<sup>${f4(r)} × ${f4(T)}</sup>`;
    }
    if (kind === 'yield') { S = rstep(2000, 6000, 50); const q = rstep(0.01, 0.04, 0.005); F = S * Math.exp((r - q) * T); unit = 'n'; html = `An index stands at ${fmtNum(S, 0)} and has a dividend yield of ${pp(q)}.`; how = `F = S e<sup>(r − q)T</sup> = ${fmtNum(S, 0)}e<sup>(${f4(r)} − ${f4(q)}) × ${f4(T)}</sup>`; }
    if (kind === 'fx') { S = rstep(0.8, 1.6, 0.0005); const rf = rstep(0.005, 0.06, 0.0025); F = S * Math.exp((r - rf) * T); unit = 'n'; html = `The spot exchange rate is ${f4(S)} euros per unit of a foreign currency whose risk-free rate is ${pp(rf)} (the euro rate is the domestic rate).`; how = `F = S e<sup>(r − r<sub>f</sub>)T</sup> = ${f4(S)}e<sup>(${f4(r)} − ${f4(rf)}) × ${f4(T)}</sup>`; }
    if (kind === 'commodity') { const u = rstep(0.01, 0.05, 0.005), y = rstep(0.005, 0.04, 0.005); F = S * Math.exp((r + u - y) * T); html = `A commodity trades at ${e2(S)} per unit, has a storage cost of ${pp(u)} and a convenience yield of ${pp(y)} a year (both continuous, proportional to the price).`; how = `F = S e<sup>(r + u − y)T</sup> = ${f2(S)}e<sup>(${f4(r)} + ${f4(u)} − ${f4(y)}) × ${f4(T)}</sup>`; }
    const arb = kind !== 'commodity', quoted = unit === 'n' && kind === 'fx' ? roundTo(F * (1 + pick([-1, 1]) * rstep(0.005, 0.02, 0.001)), 0.0001) : roundTo(F * (1 + pick([-1, 1]) * rstep(0.01, 0.04, 0.005)), unit === 'n' ? 1 : 0.05);
    if (Math.abs(quoted - F) < (kind === 'fx' ? 0.002 : 0.1)) continue;
    const fmt = kind === 'fx' ? f4 : unit === 'n' ? f2 : e2;
    const intro = p_(`${html} The risk-free rate is ${pp(r)}. ${CONT}`);
    const parts: Part[] = [N(`What is the fair forward price for delivery in ${months(T)}?`, F, unit, kind === 'fx' ? { abs: 0.0005 } : {})];
    if (arb) {
      parts.push(C(`A dealer quotes a forward price of ${fmt(quoted)}. What is the arbitrage?`, ['Cash and carry: borrow, buy the asset, sell it forward', 'Reverse cash and carry: short the asset, invest the proceeds, buy it forward', 'There is none'], quoted > F ? 0 : 1));
      parts.push(N('What is the riskless profit at maturity per unit of the asset?', Math.abs(quoted - F), unit, kind === 'fx' ? { abs: 0.0002 } : {}));
    }
    const sol = p_(`${how} = ${fmt(F)}.`) + (arb ? p_(quoted > F ? `The quote ${fmt(quoted)} is above the fair price: borrow, buy the asset (keeping its income), sell it forward at ${fmt(quoted)}; at maturity repaying the loan costs ${fmt(F)}, so you earn ${fmt(quoted - F)}.` : `The quote ${fmt(quoted)} is below the fair price: short the asset, invest the proceeds, buy it forward at ${fmt(quoted)}; the investment grows to ${fmt(F)}, so you earn ${fmt(F - quoted)}.`) : p_('For a consumption commodity the convenience yield is what holders give up by lending it, so only the cash-and-carry side gives a clean arbitrage.'));
    return { ...Q('L6.forward', 6, intro, parts), solution: sol };
  }
}

/** Value of an existing forward contract. */
export function L6_value(): Question {
  const S = rstep(20, 150, 0.5), r = rstep(0.01, 0.06, 0.0025), q = chance(0.4) ? rstep(0.01, 0.04, 0.005) : 0, T = pick([2, 3, 4, 6, 9]) / 12;
  const K = roundTo(S * rstep(0.9, 1.1, 0.01), 0.5), F0 = S * Math.exp((r - q) * T), f = (F0 - K) * Math.exp(-r * T);
  const html = p_(`Some time ago a trader entered a long forward contract to buy one unit of an asset for ${e2(K)}; delivery is in ${months(T)}. The asset trades at ${e2(S)} today${q ? ` and pays a continuous yield of ${pp(q)}` : ' and pays no income'}. The risk-free rate is ${pp(r)}. ${CONT}`);
  const parts: Part[] = [
    N('What is the forward price for the same delivery date today?', F0, 'eur'),
    N('What is the value of the long forward contract?', f, 'eur'),
    N('What is the value of the short side?', -f, 'eur'),
  ];
  const sol = p_(`F<sub>0</sub> = S e<sup>${q ? '(r − q)T' : 'rT'}</sup> = ${e2(F0)}. Value of the long position: f = (F<sub>0</sub> − K)e<sup>−rT</sup> = (${f2(F0)} − ${f2(K)}) × ${f4(Math.exp(-r * T))} = ${e2(f)}${q ? `, equivalently S e<sup>−qT</sup> − K e<sup>−rT</sup>` : ', equivalently S − K e<sup>−rT</sup>'}. The short side is worth ${e2(-f)}.`);
  return { ...Q('L6.value', 6, html, parts), solution: sol };
}

/** Minimum-variance hedge ratio and the number of futures contracts, or a stock-index hedge with beta. */
export function L6_hedge(): Question {
  if (chance(0.5)) {
    const sS = rstep(0.02, 0.08, 0.005), sF = rstep(0.02, 0.09, 0.005), rho = rstep(0.6, 0.98, 0.01), QA = pick([500000, 1000000, 2000000, 5000000]), QF = pick([42000, 50000, 25000, 100000]);
    const h = rho * sS / sF, n = h * QA / QF, long = chance(0.5);
    const html = p_(`A company will ${long ? 'buy' : 'sell'} ${fmtNum(QA, 0)} units of a commodity in three months and hedges with futures on a related commodity (contract size ${fmtNum(QF, 0)} units). The standard deviation of the change in the spot price over three months is ${f4(sS)}, that of the futures price ${f4(sF)} (per unit), and their correlation is ${f2(rho)}.`);
    const parts: Part[] = [
      N('What is the minimum-variance hedge ratio?', h, 'n'),
      N('How many futures contracts should it trade (unrounded)?', n, 'n'),
      C('Which side of the futures?', ['Long futures', 'Short futures'], long ? 0 : 1),
    ];
    const sol = p_(`h* = ρ σ<sub>S</sub>/σ<sub>F</sub> = ${f2(rho)} × ${f4(sS)}/${f4(sF)} = ${f4(h)}. N* = h* Q<sub>A</sub>/Q<sub>F</sub> = ${f4(h)} × ${fmtNum(QA, 0)}/${fmtNum(QF, 0)} = ${f2(n)} contracts. A future ${long ? 'purchase is hedged with a long' : 'sale is hedged with a short'} futures position.`);
    return { ...Q('L6.hedge', 6, html, parts), solution: sol };
  }
  const V = pick([5, 10, 20, 50]) * 1e6, beta = rstep(0.6, 1.6, 0.05), F = rstep(3000, 5500, 10), mult = pick([10, 25, 50]), target = pick([0, 0, 0.5, beta + 0.4]);
  const n = (target - beta) * V / (F * mult);
  const html = p_(`A fund manager holds a share portfolio worth €${fmtNum(V / 1e6, 0)} million with a beta of ${f2(beta)}. Index futures trade at ${fmtNum(F, 0)} points with a multiplier of €${mult} per point.`);
  const parts: Part[] = [
    N(target === 0 ? 'How many contracts hedge the portfolio completely (negative = sell)?' : `How many contracts change the beta to ${f2(target)} (negative = sell)?`, n, 'n'),
  ];
  const sol = p_(`N = (β* − β) × V/(F × multiplier) = (${f2(target)} − ${f2(beta)}) × ${fmtNum(V, 0)}/(${fmtNum(F, 0)} × ${mult}) = ${f2(n)} contracts${n < 0 ? ' (sell)' : ' (buy)'}.`);
  return { ...Q('L6.hedge', 6, html, parts), solution: sol };
}

/** Daily settlement of a futures position and margin calls. */
export function L6_margin(): Question {
  for (;;) {
    const long = chance(0.5), n = rint(2, 10), size = pick([100, 1000, 5000]), F0 = rstep(20, 120, 0.5), init = roundTo(F0 * size * rstep(0.06, 0.12, 0.01), 100), maint = roundTo(init * 0.75, 100);
    const days = 4, F = [F0];
    for (let i = 0; i < days; i++) F.push(roundTo(F[i] * (1 + rstep(-0.02, 0.012, 0.001) * (long ? 1 : -1)), 0.05));
    let bal = init * n, call1 = 0, callDay = 0;
    const bals: number[] = [];
    for (let i = 1; i <= days; i++) {
      bal += (long ? 1 : -1) * n * size * (F[i] - F[i - 1]);
      if (bal < maint * n) { if (!callDay) { callDay = i; call1 = init * n - bal; } bal = init * n; }
      bals.push(bal);
    }
    if (!callDay) continue;
    const gain = (long ? 1 : -1) * n * size * (F[days] - F0);
    const html = p_(`An investor takes a ${long ? 'long' : 'short'} position in ${n} futures contracts of ${fmtNum(size, 0)} units each at ${e2(F0)}. The initial margin is ${eur(init, 0)} and the maintenance margin ${eur(maint, 0)} per contract; a margin call restores the initial margin. Settlement prices on the next ${days} days:`) +
      table(['Day', ...F.slice(1).map((_, i) => String(i + 1))], [['Settlement price', ...F.slice(1).map(e2)]]);
    const parts: Part[] = [
      N('What is the balance of the margin account at the end of day 1 (before any margin call)?', init * n + (long ? 1 : -1) * n * size * (F[1] - F0), 'eur'),
      C('On which day is the first margin call?', ['Day 1', 'Day 2', 'Day 3', 'Day 4'], callDay - 1),
      N('How much must be paid in at the first margin call?', call1, 'eur'),
      N(`What is the cumulative gain (negative for a loss) on the position after day ${days}?`, gain, 'eur'),
    ];
    const sol = p_(`Each day the account changes by ${long ? '+' : '−'}${n} × ${fmtNum(size, 0)} × (F<sub>t</sub> − F<sub>t−1</sub>). Start: ${eur(init * n, 0)}; maintenance level ${eur(maint * n, 0)}.`) +
      table(['Day', 'Price', 'Balance after settlement and call'], F.slice(1).map((x, i) => [String(i + 1), e2(x), e2(bals[i])])) +
      p_(`First call on day ${callDay}: top up by ${e2(call1)} to ${eur(init * n, 0)}. Cumulative gain ${long ? '' : '−'}${n} × ${fmtNum(size, 0)} × (${f2(F[days])} − ${f2(F0)}) = ${e2(gain)}.`);
    return { ...Q('L6.margin', 6, html, parts), solution: sol };
  }
}

/** Par swap rate from zero rates and the value of an existing interest rate swap. */
export function L6_swap(): Question {
  const n = pick([2, 3, 4, 5]), L = pick([10, 20, 50, 100]), z0 = rstep(0.01, 0.04, 0.0025);
  const z = Array.from({ length: n }, (_, i) => +(z0 + i * rstep(0, 0.004, 0.0005)).toFixed(4));
  const DF = z.map((r, i) => Math.exp(-r * (i + 1))), A = DF.reduce((s, x) => s + x, 0), s = (1 - DF[n - 1]) / A;
  const K = +(s + pick([-1, 1]) * rstep(0.0025, 0.015, 0.0025)).toFixed(4), Bfix = K * L * A + L * DF[n - 1], V = Bfix - L;
  const html = p_(`Continuously compounded zero rates: ${z.map((r, i) => `${i + 1} year${i ? 's' : ''} ${pp(r)}`).join(', ')}. An interest rate swap with notional €${L} million exchanges annual fixed payments for 12-month floating rates for ${n} years; the floating rate has just been reset, so the floating leg is worth par. Amounts in millions.`);
  const parts: Part[] = [
    N(`What is the ${n}-year discount factor?`, DF[n - 1], 'n', { abs: 0.0005 }),
    N('What is the par swap rate (annual payments)?', s * 100, 'pct', { abs: 0.01 }),
    N(`An existing swap of this kind has a fixed rate of ${pp(K)}. What is the value of the fixed-rate bond (in € million)?`, Bfix, 'm'),
    N('What is the value of the swap to the party that receives fixed (in € million)?', V, 'm'),
  ];
  const sol = p_(`Discount factors e<sup>−z<sub>t</sub>t</sup>: ${DF.map(f4).join(', ')}; their sum is ${f4(A)}. Par rate s = (1 − DF<sub>${n}</sub>)/ΣDF = (1 − ${f4(DF[n - 1])}) / ${f4(A)} = ${pp(s, 3)}.`) +
    p_(`Fixed bond: ${pp(K)} × ${L} × ${f4(A)} + ${L} × ${f4(DF[n - 1])} = ${f4(Bfix)}; floating bond = ${L}. Receive-fixed swap = B<sub>fix</sub> − B<sub>fl</sub> = ${f4(V)} million (= (K − s) × L × ΣDF); the payer of fixed has the opposite value.`);
  return { ...Q('L6.swap', 6, html, parts), solution: sol };
}
