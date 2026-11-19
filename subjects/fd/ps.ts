// Financial Derivatives: problem set 1 rebuilt exercise by exercise, with new numbers on every call. The exercises are
// grouped by lecture; each group also covers lecture content that the problem set leaves out.
import { C, N, Q, calc, chance, p_, pick, rint, roundTo, rstep, table, tn, tq, withCalc } from '@/lib/engine/gen-helpers';
import { shortAnswer } from '@/lib/engine/mc';
import type { Part, Question } from '@/lib/engine/types';
import { BANK } from './concepts';
import { L2_diagram, L2_points } from './diagram';
import * as G from './generators';
import { CONT, bs, bsSteps, e2, f2, f4 } from './generators';

const retag = (key: string, g: () => Question) => () => ({ ...g(), fam: key });

// =====================================================================
// Exercise 1 — American options on a share without dividends
// =====================================================================

/** American put by a 100-step tree. */
const amPut = (S: number, X: number, T: number, r: number, sig: number) => {
  const n = 100, dt = T / n, u = Math.exp(sig * Math.sqrt(dt));
  return G.binom({ S, X, n, u, d: 1 / u, growth: Math.exp(r * dt), disc: Math.exp(-r * dt), put: true, american: true }).V[0][0];
};

export function ex1Draw() {
  for (;;) {
    const S = rstep(60, 200, 0.25), g = S >= 120 ? 5 : 2.5, base = roundTo(S - 1.5 * g, g), X = [0, 1, 2, 3].map(i => base + i * g);
    const days = [rint(8, 20), rint(30, 60), rint(80, 120)], r0 = rstep(0.02, 0.05, 0.0002), rs = [r0, r0 + rstep(0.001, 0.004, 0.0002), r0 + rstep(0.004, 0.008, 0.0002)];
    const sig = rstep(0.18, 0.35, 0.01), q = (x: number) => roundTo(x, 0.01);
    const call = X.map(x => days.map((dd, j) => q(bs(S, x, dd / 365, rs[j], sig).c)));
    const put = X.map(x => days.map((dd, j) => q(amPut(S, x, dd / 365, rs[j], sig))));
    // Occasionally one call below its lower bound or one put below its exercise value.
    const badCall = chance(0.45) ? [rint(0, 1), rint(0, 2)] : null, badPut = chance(0.4) ? [rint(2, 3), rint(0, 2)] : null;
    if (badCall) { const [i, j] = badCall, lb = S - X[i] * Math.exp(-rs[j] * days[j] / 365); call[i][j] = q(lb - rstep(0.25, 1, 0.05)); }
    if (badPut) { const [i, j] = badPut, iv = X[i] - S; if (iv > 0.8) put[i][j] = q(iv - rstep(0.25, 0.6, 0.05)); }
    if (call.flat().some(x => x <= 0) || put.flat().some(x => x <= 0)) continue;
    return { S, X, days, rs, call, put, badCall, badPut };
  }
}

export function PS1_ex1(): Question {
  const d = ex1Draw(), PV = (i: number, j: number) => d.X[i] * Math.exp(-d.rs[j] * d.days[j] / 365);
  const html = p_('You are given current prices of American options on the shares of a company:') +
    table(['Strike', ...d.days.map(x => `Call ${x} days`), ...d.days.map(x => `Put ${x} days`)], d.X.map((x, i) => [f2(x), ...d.call[i].map(v => f2(v)), ...d.put[i].map(v => f2(v))])) +
    p_(`The company pays no dividends over the next months and its share trades at ${e2(d.S)}. Risk-free rates: ${d.days.map((x, j) => `${x} days ${G.f2(d.rs[j] * 100)}%`).join(', ')}. ${CONT} Use days/365.`);
  // Questions only about options that are clearly inside or clearly outside a bound, so rounding of quotes never decides.
  const clear = (x: number, ...lims: number[]) => lims.every(l => Math.abs(x - l) > 0.04);
  const pairs = [0, 1, 2, 3].flatMap(i => [0, 1, 2].map(j => [i, j] as [number, number]));
  const callOk = ([i, j]: [number, number]) => clear(d.call[i][j], Math.max(d.S - PV(i, j), 0));
  const [ci, cj] = d.badCall && chance(0.6) ? d.badCall : pick(pairs.filter(callOk).length ? pairs.filter(callOk) : pairs);
  const cx = d.X[ci], cT = d.days[cj], cp = d.call[ci][cj], lb = Math.max(d.S - PV(ci, cj), 0), iv = Math.max(d.S - cx, 0), viol = cp < lb - 1e-9;
  const parOk = ([i, j]: [number, number]) => clear(d.call[i][j] - d.put[i][j], d.S - d.X[i], d.S - PV(i, j));
  const [pi, pj] = pick(pairs.filter(parOk).length ? pairs.filter(parOk) : pairs), diff = d.call[pi][pj] - d.put[pi][pj], lo = d.S - d.X[pi], hi = d.S - PV(pi, pj);
  const parity = diff > hi + 1e-9 ? 1 : diff < lo - 1e-9 ? 2 : 0;
  const putOk = ([i, j]: [number, number]) => i >= 2 && clear(d.put[i][j], d.X[i] - d.S);
  const [qi, qj] = d.badPut && chance(0.6) ? d.badPut : pick(pairs.filter(putOk).length ? pairs.filter(putOk) : pairs.filter(([i]) => i >= 2));
  const qx = d.X[qi], qp = d.put[qi][qj], exNow = qp < qx - d.S - 1e-9;
  const parts: Part[] = [
    N(`Call (X = ${f2(cx)}, ${cT} days): what is its intrinsic value?`, iv, 'eur', { key: 'iv' }),
    N('… its time value?', cp - iv, 'eur', { key: 'tv' }),
    N('… its lower bound?', lb, 'eur', { key: 'lb' }),
    N('… its upper bound?', d.S, 'eur', { key: 'ub' }),
    C('… is there an arbitrage opportunity?', ['No', 'Yes: the call is below its lower bound; buy the call, short the share and invest PV(X)'], viol ? 1 : 0, 'arb'),
    C(`Are the call and the put with X = ${f2(d.X[pi])} and ${d.days[pj]} days consistent with put-call parity for American options?`,
      ['Yes: S − X ≤ C − P ≤ S − PV(X)', 'No: C − P is above S − PV(X); sell the call, buy the put and the share, borrow PV(X)', 'No: C − P is below S − X; buy the call, sell the put, short the share and invest X'], parity, 'parity'),
    C(`Should the put with X = ${f2(qx)} and ${d.days[qj]} days be exercised immediately?`, ['No: it is worth more alive than its exercise value X − S', 'Yes: it trades below X − S, so buying and exercising it earns a riskless profit'], exNow ? 1 : 0, 'exNow'),
  ];
  const sol = p_(`Call: intrinsic max(S − X, 0) = ${e2(iv)}; time value ${f4(cp)} − ${f2(iv)} = ${e2(cp - iv)}. An American call without dividends is worth the European one, so its bounds are max(S − PV(X), 0) = max(${f2(d.S)} − ${f4(PV(ci, cj))}, 0) = ${e2(lb)} and S = ${e2(d.S)}. ${viol ? `The price ${f4(cp)} is below ${f4(lb)}: buy it, short the share, invest PV(X), and pocket ${e2(lb - cp)}.` : 'The price is within the bounds.'}`) +
    p_(`Parity for American options without income: S − X ≤ C − P ≤ S − PV(X). Here C − P = ${f4(d.call[pi][pj])} − ${f4(d.put[pi][pj])} = ${f4(diff)}, against ${f4(lo)} and ${f4(hi)}. ${parity === 0 ? 'Consistent.' : parity === 1 ? 'Above the upper limit: sell the call, buy the put and the share, borrow PV(X).' : 'Below the lower limit: buy the call, sell the put, short the share and invest X (enough to pay X whenever the put is exercised against you).'}`) +
    p_(`Put: exercise value X − S = ${f2(qx)} − ${f2(d.S)} = ${f4(qx - d.S)} against a price of ${f4(qp)}. ${exNow ? 'It trades below its exercise value: buy it and exercise at once.' : 'Its price exceeds the exercise value, so it is worth more alive (or sold) than exercised.'}`);
  const kk = calc(), eC = Math.exp(-d.rs[cj] * cT / 365), eP = Math.exp(-d.rs[pj] * d.days[pj] / 365);
  kk.s(`**Present value of the strike (call):** $PV(X) = ${tn(cx)} \\times e^{-${tn(d.rs[cj], 4)} \\times ${cT}/365} = ${tn(cx)} \\times ${tn(eC, 6)} = ${tn(PV(ci, cj), 4)}$.`);
  kk.r(`**Intrinsic value:** $\\max(S - X, 0) = \\max(${tn(d.S)} - ${tn(cx)}, 0) = \\max(${tn(d.S - cx)}, 0) = ${tn(iv)}$.`, 'iv', iv);
  kk.r(`**Time value:** price minus intrinsic value $= ${tn(cp)} - ${tn(iv)} = ${tn(cp - iv, 4)}$.`, 'tv', cp - iv);
  kk.r(`**Lower bound:** $\\max(S - PV(X), 0) = \\max(${tn(d.S)} - ${tn(PV(ci, cj), 4)}, 0) = \\max(${tn(d.S - PV(ci, cj), 4)}, 0) = ${tn(lb, 4)}$.`, 'lb', lb);
  kk.r(`**Upper bound:** an American call without dividends is worth at most the share, $S = ${tn(d.S)}$.`, 'ub', d.S);
  kk.r(viol ? `**Arbitrage check:** the price ${tn(cp)} is below the lower bound ${tn(lb, 4)}: buy the call, short the share and invest PV(X).` : `**Arbitrage check:** ${tn(lb, 4)} ≤ ${tn(cp)} ≤ ${tn(d.S)}, so the price lies within the bounds: no arbitrage.`, 'arb');
  kk.s(`**Parity limits** for X = ${tn(d.X[pi])} and ${d.days[pj]} days: $PV(X) = ${tn(d.X[pi])} \\times e^{-${tn(d.rs[pj], 4)} \\times ${d.days[pj]}/365} = ${tn(d.X[pi])} \\times ${tn(eP, 6)} = ${tn(PV(pi, pj), 4)}$, so $S - X = ${tn(d.S)} - ${tn(d.X[pi])} = ${tn(lo, 4)}$ and $S - PV(X) = ${tn(d.S)} - ${tn(PV(pi, pj), 4)} = ${tn(hi, 4)}$.`);
  kk.r(`**Parity check:** $C - P = ${tn(d.call[pi][pj])} - ${tn(d.put[pi][pj])} = ${tn(diff, 4)}$, compared with the interval from ${tn(lo, 4)} to ${tn(hi, 4)}: ${parity === 0 ? 'it lies inside, so the prices are consistent.' : parity === 1 ? 'it is above the upper limit: sell the call, buy the put and the share, borrow PV(X).' : 'it is below the lower limit: buy the call, sell the put, short the share and invest X.'}`, 'parity');
  kk.r(`**Immediate exercise:** the exercise value is $X - S = ${tn(qx)} - ${tn(d.S)} = ${tn(qx - d.S, 4)}$ against a put price of ${tn(qp)}. ${exNow ? 'The put trades below its exercise value, so buy it and exercise at once.' : 'The price is above the exercise value, so the put is worth more alive than exercised.'}`, 'exNow');
  return { ...withCalc(Q('PS1.ex1', '1', html, parts), kk.steps), solution: sol };
}

/** Exercise 4A–B: fill in the table of values and bounds from the time values given; arbitrage at a given call price. */
export function PS1_ex4(): Question {
  for (;;) {
    const S = rstep(10, 60, 0.5), r = rstep(0.02, 0.07, 0.005), T = 0.25, sig = rstep(0.2, 0.4, 0.05);
    const X1 = roundTo(S * rstep(0.85, 0.94, 0.01), 0.5), X2 = roundTo(S * rstep(1.06, 1.2, 0.01), 0.5);
    const b1 = bs(S, X1, T, r, sig), b2 = bs(S, X2, T, r, sig), tv1 = +(b1.c - (S - X1)).toFixed(3), tv2 = +b2.c.toFixed(3);
    if (tv1 < 0.05 || tv2 < 0.05) continue;
    const c1 = S - X1 + tv1, c2 = tv2, PV1 = X1 * Math.exp(-r * T), PV2 = X2 * Math.exp(-r * T), p2 = c2 - S + PV2;
    const lb1 = S - PV1, quote = roundTo(chance(0.55) ? lb1 - rstep(0.05, 0.4, 0.05) : c1 + rstep(-0.1, 0.2, 0.05), 0.05), viol = quote < lb1;
    const html = p_(`A share trades at ${e2(S)} and pays no dividends over the next three months. The risk-free rate is ${G.f2(r * 100)}%. ${CONT} The options below are European, on one share, and mature in 3 months.`) +
      table(['', 'Intrinsic value', 'Time value', 'Lower bound', 'Upper bound'], [[`Call (X = ${f2(X1)})`, '?', f4(tv1), '?', '?'], [`Call (X = ${f2(X2)})`, '?', f4(tv2), '?', '?'], [`Put (X = ${f2(X2)})`, '?', '?', '?', '?']]);
    const parts: Part[] = [
      N(`Call (X = ${f2(X1)}): intrinsic value?`, S - X1, 'eur', { key: 'i1' }),
      N(`Call (X = ${f2(X1)}): lower bound?`, lb1, 'eur', { key: 'lb1' }),
      N(`Call (X = ${f2(X2)}): upper bound?`, S, 'eur', { key: 'ub2' }),
      N(`Put (X = ${f2(X2)}): intrinsic value?`, X2 - S, 'eur', { key: 'pi2' }),
      N(`Put (X = ${f2(X2)}): time value?`, p2 - (X2 - S), 'eur', { key: 'ptv' }),
      N(`Put (X = ${f2(X2)}): lower bound?`, Math.max(PV2 - S, 0), 'eur', { key: 'plb' }),
      N(`Put (X = ${f2(X2)}): upper bound?`, PV2, 'eur', { key: 'pub' }),
      C(`The call with X = ${f2(X1)} trades at ${e2(quote)}. Is there an arbitrage?`, ['No', 'Yes: buy the call, short the share and invest PV(X)', 'Yes: sell the call and buy the share'], viol ? 1 : 0, 'arb'),
    ];
    const sol = p_(`Call ${f2(X1)}: intrinsic ${f2(S)} − ${f2(X1)} = ${e2(S - X1)}, price = intrinsic + time value = ${f4(c1)}; bounds S − PV(X) = ${f2(S)} − ${f4(PV1)} = ${e2(lb1)} and S = ${e2(S)}. Call ${f2(X2)}: intrinsic 0, price ${f4(c2)}, lower bound max(S − PV(X), 0) = ${e2(Math.max(S - PV2, 0))}, upper bound ${e2(S)}.`) +
      p_(`Put ${f2(X2)} by parity: p = c − S + PV(X) = ${f4(c2)} − ${f2(S)} + ${f4(PV2)} = ${e2(p2)}. Intrinsic ${e2(X2 - S)}, time value ${e2(p2 - (X2 - S))} (negative is possible for a European put), lower bound max(PV(X) − S, 0) = ${e2(Math.max(PV2 - S, 0))}, upper bound PV(X) = ${e2(PV2)}.`) +
      p_(viol ? `At ${e2(quote)} the call is below its lower bound ${e2(lb1)}: buy it, short the share, invest PV(X) and earn ${e2(lb1 - quote)} today.` : `At ${e2(quote)} the call is within its bounds: no arbitrage from the bounds.`);
    const kk = calc();
    kk.r(`**Call ${f2(X1)}, intrinsic value:** $S - X = ${tn(S)} - ${tn(X1)} = ${tn(S - X1)}$.`, 'i1', S - X1);
    kk.s(`**Present value of the strike ${f2(X1)}:** $PV(X) = ${tn(X1)} \\times e^{-${tn(r, 4)} \\times ${tn(T, 2)}} = ${tn(X1)} \\times ${tn(Math.exp(-r * T), 6)} = ${tn(PV1, 4)}$.`);
    kk.r(`**Call ${f2(X1)}, lower bound:** $S - PV(X) = ${tn(S)} - ${tn(PV1, 4)} = ${tn(lb1, 4)}$.`, 'lb1', lb1);
    kk.r(`**Call ${f2(X2)}, upper bound:** a call is never worth more than the share, $S = ${tn(S)}$.`, 'ub2', S);
    kk.s(`**Present value of the strike ${f2(X2)}:** $PV(X) = ${tn(X2)} \\times e^{-${tn(r, 4)} \\times ${tn(T, 2)}} = ${tn(X2)} \\times ${tn(Math.exp(-r * T), 6)} = ${tn(PV2, 4)}$.`);
    kk.s(`**Put ${f2(X2)} by parity:** $p = c - S + PV(X) = ${tn(c2, 4)} - ${tn(S)} + ${tn(PV2, 4)} = ${tn(p2, 4)}$ (the call at ${f2(X2)} is worth its time value ${tn(c2, 4)}).`);
    kk.r(`**Put ${f2(X2)}, intrinsic value:** $\\max(X - S, 0) = \\max(${tn(X2)} - ${tn(S)}, 0) = ${tn(X2 - S)}$.`, 'pi2', X2 - S);
    kk.r(`**Put ${f2(X2)}, time value:** $${tn(p2, 4)} - ${tn(X2 - S)} = ${tn(p2 - (X2 - S), 4)}$.`, 'ptv', p2 - (X2 - S));
    kk.r(`**Put ${f2(X2)}, lower bound:** $\\max(PV(X) - S, 0) = \\max(${tn(PV2, 4)} - ${tn(S)}, 0) = \\max(${tn(PV2 - S, 4)}, 0) = ${tn(Math.max(PV2 - S, 0), 4)}$.`, 'plb', Math.max(PV2 - S, 0));
    kk.r(`**Put ${f2(X2)}, upper bound:** a European put is worth at most $PV(X) = ${tn(PV2, 4)}$.`, 'pub', PV2);
    kk.r(viol ? `**Arbitrage check:** the quote ${tn(quote)} is below the lower bound ${tn(lb1, 4)} of the call: buy it, short the share and invest PV(X).` : `**Arbitrage check:** the quote ${tn(quote)} is not below the lower bound ${tn(lb1, 4)}; it also does not exceed the share price ${tn(S)}: no arbitrage.`, 'arb');
    return { ...withCalc(Q('PS1.ex4', '1', html, parts), kk.steps), solution: sol };
  }
}

/** Exercise 9A–C: deep in-the-money put and call by Black-Scholes, then with a dividend. */
export function PS4_ex9(): Question {
  const S = rstep(3, 20, 0.5), X = roundTo(S * rstep(1.5, 2.2, 0.05), 0.5), sig = rstep(0.4, 0.8, 0.05), r = rstep(0.02, 0.06, 0.005), T = 2 / 12;
  const D = roundTo(S * rstep(0.06, 0.15, 0.01), 0.05), tD = 1 / 12, S2 = S - D * Math.exp(-r * tD), a = bs(S, X, T, r, sig), b = bs(S2, X, T, r, sig);
  const html = p_(`A troubled company’s share trades at ${e2(S)}; its volatility is ${G.f2(sig * 100)}% and the risk-free rate is ${G.f2(r * 100)}%. ${CONT} Consider European options on one share with strike ${e2(X)} maturing in 2 months; first assume no dividends.`);
  const parts: Part[] = [
    N('What is the Black-Scholes value of the put?', a.p, 'eur', { key: 'p' }),
    N('What is the value of the call?', a.c, 'eur', { key: 'c' }),
    N(`The company now announces a dividend of ${e2(D)} per share in 1 month. What is the put worth?`, b.p, 'eur', { key: 'p2' }),
    N('… and the call?', b.c, 'eur', { key: 'c2' }),
  ];
  const sol = p_(`Without dividends: d1 = ${f4(a.d1)}, d2 = ${f4(a.d2)}; p = Xe<sup>−rT</sup>N(−d2) − S N(−d1) = ${e2(a.p)}; c = p + S − PV(X) = ${e2(a.c)}. A put this deep in the money is worth less than X − S = ${e2(X - S)}: as a European option it cannot be exercised early.`) +
    p_(`With the dividend use S − PV(D) = ${f2(S)} − ${f2(D)}e<sup>−${f4(r)}/12</sup> = ${f4(S2)}: p = ${e2(b.p)}, c = ${e2(b.c)}. The dividend lowers the share price at the ex-date, which helps the put and hurts the call.`);
  const kk = calc();
  bsSteps(kk, { S, X, T, r, sig, keys: { c: 'c', p: 'p' } });
  kk.s(`**With the dividend:** $PV(D) = ${tn(D)} \\times e^{-${tn(r, 4)} \\times ${tn(tD, 6)}} = ${tn(D)} \\times ${tn(Math.exp(-r * tD), 6)} = ${tn(D * Math.exp(-r * tD), 4)}$, so the share price in the formula is $S - PV(D) = ${tn(S)} - ${tn(D * Math.exp(-r * tD), 4)} = ${tn(S2, 4)}$.`);
  bsSteps(kk, { S: S2, X, T, r, sig, keys: { c: 'c2', p: 'p2' } });
  return { ...withCalc(Q('PS4.ex9', '4', html, parts), kk.steps), solution: sol };
}

const T = (key: string, name: string, gen: () => Question, fromPs = true) => ({ key, name, gen, fromPs });
const short = (key: string, topic: string) => () => shortAnswer(key, topic, BANK[topic].MC);

export const PROBLEM_SETS: { id: string; title: string; topic: string; types: { key: string; name: string; gen: () => Question; fromPs: boolean }[] }[] = [
  { id: '1', topic: '1', title: 'Bounds, parity and early exercise (exercises 1, 2A, 4A–B)', types: [
    T('PS1.ex1', 'American options: values, bounds, parity and immediate exercise (ex. 1)', PS1_ex1),
    T('PS1.ex2a', 'Arbitrage-free bid and ask of puts from call quotes (ex. 2A)', retag('PS1.ex2a', G.L1_putInterval)),
    T('PS1.ex4', 'Table of values and bounds, arbitrage at a quoted price (ex. 4A–B)', PS1_ex4),
    T('PS1.bounds', 'Bounds and arbitrage for a single option', retag('PS1.bounds', G.L1_bounds), false),
    T('PS1.parity', 'Put-call parity with and without dividends', retag('PS1.parity', G.L1_parity), false),
    T('PS1.earlyPut', 'Early exercise of an American put', retag('PS1.earlyPut', G.L1_earlyPut), false),
    T('PS1.dividend', 'Dividends: bounds and early exercise of calls', retag('PS1.dividend', G.L1_dividend), false),
    T('PS1.short', 'Short answers', short('PS1.short', '1'), false),
  ] },
  { id: '2', topic: '2', title: 'Trading strategies (exercises 2B, 3F, 4C–E)', types: [
    T('PS2.ex2b', 'Cheapest butterfly and its payoff table (ex. 2B)', retag('PS2.ex2b', G.L2_butterfly)),
    T('PS2.ex3f', 'Straddle: a bet on a big move (ex. 3F)', retag('PS2.ex3f', () => G.strategyQ(4))),
    T('PS2.ex4', 'Portfolio of long and short options: value and payoff (ex. 4C–E)', retag('PS2.ex4', G.L2_portfolio)),
    T('PS2.strategy', 'Spreads, strangles and butterflies', retag('PS2.strategy', G.L2_strategy), false),
    T('PS2.identify', 'Name the strategy', retag('PS2.identify', G.L2_identify), false),
    T('PS2.diagram', 'Read the payoff diagram: strike, costs, break-even', retag('PS2.diagram', L2_diagram), false),
    T('PS2.points', 'Points of the payoff diagram without a plot', retag('PS2.points', L2_points), false),
    T('PS2.short', 'Short answers', short('PS2.short', '2'), false),
  ] },
  { id: '3', topic: '3', title: 'Binomial trees (exercises 3A–E, 5C–D)', types: [
    T('PS3.ex3', 'Two-period tree with a discrete dividend: call, American call, put (ex. 3)', retag('PS3.ex3', G.L3_dividendTree)),
    T('PS3.ex5', 'Index options with a dividend yield, monthly tree (ex. 5)', retag('PS3.ex5', G.L3_yield)),
    T('PS3.replicate', 'One-period replication and arbitrage', retag('PS3.replicate', G.L3_replicate), false),
    T('PS3.american', 'American versus European put', retag('PS3.american', G.L3_american), false),
    T('PS3.nPeriod', 'n-period binomial formula', retag('PS3.nPeriod', G.L3_nPeriod), false),
    T('PS3.vol', 'Volatility from historical prices', retag('PS3.vol', G.L3_vol), false),
    T('PS3.short', 'Short answers', short('PS3.short', '3'), false),
  ] },
  { id: '4', topic: '4', title: 'Black-Scholes and the lognormal model (exercises 6, 9A–C)', types: [
    T('PS4.ex6', 'Real-world and risk-neutral exercise probability, implied volatility (ex. 6)', retag('PS4.ex6', G.L4_probability)),
    T('PS4.ex9', 'Deep in-the-money put and call, then with a dividend (ex. 9A–C)', PS4_ex9),
    T('PS4.bs', 'Black-Scholes prices and delta', retag('PS4.bs', G.L4_bs), false),
    T('PS4.lognormal', 'Distribution of the share price', retag('PS4.lognormal', G.L4_lognormal), false),
    T('PS4.implied', 'Implied volatility', retag('PS4.implied', G.L4_implied), false),
    T('PS4.short', 'Short answers', short('PS4.short', '4'), false),
  ] },
  { id: '5', topic: '5', title: 'Structured products (exercises 7, 8, 9D–E)', types: [
    T('PS5.ex7', 'Commodity-linked product: distributions, decomposition, value (ex. 7)', retag('PS5.ex7', G.L5_floor)),
    T('PS5.ex8', 'Absolute-return product K(1 + |R|) (ex. 8)', retag('PS5.ex8', G.L5_absolute)),
    T('PS5.ex9', 'Guaranteed product with puts: α for the margin (ex. 9D–E)', retag('PS5.ex9', () => G.guaranteedQ(true))),
    T('PS5.participation', 'Capital-protected note: participation rate', retag('PS5.participation', G.L5_participation), false),
    T('PS5.reverse', 'Reverse convertible: coupon', retag('PS5.reverse', G.L5_reverse), false),
    T('PS5.short', 'Short answers', short('PS5.short', '5'), false),
  ] },
];

