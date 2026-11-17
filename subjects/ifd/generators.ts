// Investment and Financing Decisions: procedural generators for equity financing, debt financing, incentives and
// information, and capital budgeting. Inputs are drawn fresh each time; every solution is computed from the same inputs.
import { C, N, P, Q, chance, co, fmtNum, p_, pick, rint, roundTo, rstep, table } from '@/lib/engine/gen-helpers';
import type { Part, Question, Unit } from '@/lib/engine/types';

const pp = (x: number, d = 2) => P(x, d);
const f2 = (x: number) => fmtNum(x, 2);
const NOTE_PCT = 'Returns and rates may be entered in percent (15.6) or as decimals (0.156).';

/** Currency of a question: symbol and the units for amounts in millions and in single units. */
type Cur = { s: string; m: Unit; u: Unit; mil: (x: number, d?: number) => string; one: (x: number, d?: number) => string };
export function cur(): Cur {
  const s = pick(['€', '$']);
  return {
    s, m: s === '€' ? 'm' : 'musd', u: s === '€' ? 'eur' : 'usd',
    mil: (x, d = 2) => (x < 0 ? '−' : '') + s + fmtNum(Math.abs(x), d) + ' million',
    one: (x, d = 2) => (x < 0 ? '−' : '') + s + fmtNum(Math.abs(x), d),
  };
}
export const inMillions = (c: Cur) => `Express amounts in millions (e.g. 10 for ${c.s}10 million).`;

/** Smallest face value F with E[min(F, V)] = target (bisection; E is increasing in F). */
export function solveFace(V: number[], p: number[], target: number): number {
  const ev = (F: number) => V.reduce((s, v, i) => s + p[i] * Math.min(F, v), 0);
  let lo = 0, hi = Math.max(...V);
  if (ev(hi) < target - 1e-9) return NaN;
  for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (ev(mid) < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// =====================================================================
// LECTURE 1 — Equity financing
// =====================================================================

export function ipoDraw() {
  for (;;) {
    const c = cur(), name = co(), n0 = rint(5, 30), nNew = rint(2, 12), P0 = rstep(10, 40, 1), s = pick([0.07, 0.07, 0.05, 0.06]);
    const P1 = roundTo(P0 * rstep(1.1, 2.6, 0.05), 1);
    if (P1 <= P0) continue;
    const raised = nNew * P0 * (1 - s), mv = (n0 + nNew) * P1, pre = mv - raised, price = pre / n0, newSh = raised / price;
    return { c, name, n0, nNew, P0, s, P1, raised, mv, pre, price, newSh, under: nNew * (P1 - P0), direct: nNew * P0 * s, total: pre - n0 * P1 };
  }
}

/** IPO: proceeds, market value, perfect-market benchmark and the cost of underpricing and the spread. */
export function L1_ipo(): Question {
  const d = ipoDraw(), { c } = d;
  const html = p_(`${d.name} has ${d.n0} million shares outstanding and is about to issue ${d.nNew} million new shares in an IPO. The IPO price has been set at ${c.one(d.P0, 0)} per share, and the underwriting spread is ${P(d.s, 0)}. The IPO is a big success with investors, and the share price rises to ${c.one(d.P1, 0)} on the first day of trading. ${inMillions(c)}`);
  const parts: Part[] = [
    N('How much money did the firm ultimately receive from its IPO?', d.raised, c.m),
    N('What is the market value of the firm after the first day of trading?', d.mv, c.m),
    N('Suppose the firm could have sold shares directly at their fair value (the first-day value) in a perfect market, raising the same amount. What would the share price have been?', d.price, c.u),
    N('… and how many new shares (in millions) would it have issued?', d.newSh, 'msh'),
    N('What is the total cost to the original shareholders due to market imperfections?', d.total, c.m),
    N('… of which underpricing:', d.under, c.m),
    N('… and direct costs (underwriting spread):', d.direct, c.m),
  ];
  const sol = p_(`Proceeds: ${d.nNew}m × ${c.one(d.P0, 0)} × (1 − ${P(d.s, 0)}) = ${c.mil(d.raised)}. Market value: (${d.n0} + ${d.nNew})m × ${c.one(d.P1, 0)} = ${c.mil(d.mv)}.`) +
    p_(`In a perfect market the original shareholders would own the firm minus the cash raised: ${c.mil(d.mv)} − ${c.mil(d.raised)} = ${c.mil(d.pre)}, or ${c.one(d.price)} per share, and ${c.mil(d.raised)} / ${c.one(d.price)} = ${f2(d.newSh)}m new shares.`) +
    p_(`Actual value of their shares: ${d.n0}m × ${c.one(d.P1, 0)} = ${c.mil(d.n0 * d.P1)}, so the cost is ${c.mil(d.total)}: underpricing ${d.nNew}m × (${c.one(d.P1, 0)} − ${c.one(d.P0, 0)}) = ${c.mil(d.under)} plus the spread ${c.mil(d.direct)}.`);
  return { ...Q('L1.ipo', 1, html, parts), solution: sol };
}

export function rightsDraw() {
  for (;;) {
    const c = cur(), name = co(), n = rint(5, 30), P0 = rstep(20, 80, 1), k = pick([2, 3, 4, 5, 5, 10]);
    const X = roundTo(P0 * rstep(0.5, 0.85, 0.05), k);
    if (X <= 0 || X >= P0) continue;
    const raised = n / k * X, post = (n * P0 + raised) / (n + n / k), X2 = X / k, post2 = (n * P0 + raised) / (2 * n);
    return { c, name, n, P0, k, X, raised, post, X2, post2 };
  }
}

/** Rights issue: proceeds and price; a cheaper one-for-one plan raises the same and leaves shareholders as well off. */
export function L1_rights(): Question {
  const d = rightsDraw(), { c } = d;
  const html = p_(`${d.name} has ${d.n} million shares outstanding at a price of ${c.one(d.P0, 0)} per share. It announces a rights issue: every shareholder receives one right per share, and ${d.k} rights buy one new share at ${c.one(d.X, 0)}. Assume all rights are exercised. ${inMillions(c)}`) +
    p_(`Alternatively, each right could buy one new share at ${c.one(d.X2)}.`);
  const parts: Part[] = [
    N('How much money does the original plan raise?', d.raised, c.m),
    N('What is the share price after the rights issue?', d.post, c.u),
    N('How much does the alternative plan raise?', d.raised, c.m),
    N('What is the share price after the alternative rights issue?', d.post2, c.u),
    C('Which plan makes the shareholders better off?', ['The original plan', 'The alternative plan', 'Shareholders are indifferent'], 2),
  ];
  const sol = p_(`Original plan: ${d.n}m / ${d.k} = ${f2(d.n / d.k)}m new shares × ${c.one(d.X, 0)} = ${c.mil(d.raised)}. Price: (${d.n}m × ${c.one(d.P0, 0)} + ${c.mil(d.raised)}) / ${f2(d.n + d.n / d.k)}m = ${c.one(d.post)}.`) +
    p_(`Alternative: ${d.n}m × ${c.one(d.X2)} = ${c.mil(d.raised)}; price (${c.mil(d.n * d.P0)} + ${c.mil(d.raised)}) / ${2 * d.n}m = ${c.one(d.post2)}. Every shareholder gets the same rights in proportion to their holding and the same amount is raised, so the subscription price only splits value between old and new shares: shareholders are indifferent (as long as they exercise or sell their rights).`);
  return { ...Q('L1.rights', 1, html, parts), solution: sol };
}

export function winnersDraw() {
  for (;;) {
    const p1 = pick([0.1, 0.15, 0.2]), p3 = pick([0.1, 0.15, 0.2]), p2 = +(1 - p1 - p3).toFixed(2);
    const r1 = rstep(0.4, 1, 0.05), r2 = rstep(0.05, 0.2, 0.01), r3 = -rstep(0.1, 0.3, 0.05);
    const a1 = pick([0.1, 0.2]), a2 = pick([0.3, 0.4, 0.5]), a3 = 1;
    const avg = p1 * r1 + p2 * r2 + p3 * r3, rat = p1 * a1 * r1 + p2 * a2 * r2 + p3 * a3 * r3;
    const xmin = -(p1 * a1 * r1 + p3 * a3 * r3) / (p2 * a2);
    if (xmin <= 0.005 || Math.abs(rat) < 0.002) continue;
    return { p: [p1, p2, p3], r: [r1, r2, r3], a: [a1, a2, a3], avg, rat, xmin, broker: co(['Brokers', 'Securities', 'Capital Markets', 'Partners']) };
  }
}

/** Winner's curse: average underpricing, the return under rationing and the break-even return for the uninformed. */
export function L1_winners(): Question {
  const d = winnersDraw(), [p1, p2, p3] = d.p, [r1, r2, r3] = d.r, [a1, a2] = d.a;
  const html = p_(`${d.broker} promises to include its clients in all IPOs it manages. ${P(p1, 0)} of these IPOs have a very strong debut and rise by ${pp(r1, 0)} on the first day, ${P(p2, 0)} rise by ${pp(r2, 0)}, and ${P(p3, 0)} have a disappointing debut and fall by ${pp(-r3, 0)}. ${NOTE_PCT}`);
  const parts: Part[] = [
    N('What is the average first-day return (the average underpricing)?', d.avg * 100, 'pct'),
    N(`Because of oversubscription, a bidder receives ${P(a1, 0)} of the shares bid for in a very strong debut, ${P(a2, 0)} in a moderate one and 100% when the IPO disappoints. Bidding the same amount in every IPO, with a zero return on the amount not allocated, what is the expected one-day return of this strategy?`, d.rat * 100, 'pct', { abs: 0.02 }),
    N('Suppose the broker can set the price only in the moderate cases. What is the minimum first-day return uninformed investors must get in those cases for investing in every IPO to break even?', d.xmin * 100, 'pct', { abs: 0.02 }),
  ];
  const sol = p_(`Average: ${f2(p1)} × ${pp(r1, 0)} + ${f2(p2)} × ${pp(r2, 0)} + ${f2(p3)} × (${pp(r3, 0)}) = ${pp(d.avg)}.`) +
    p_(`With rationing, the return per unit bid weights each outcome by the allocation: ${f2(p1)} × ${f2(a1)} × ${pp(r1, 0)} + ${f2(p2)} × ${f2(a2)} × ${pp(r2, 0)} + ${f2(p3)} × 1 × (${pp(r3, 0)}) = ${pp(d.rat, 3)}. Uninformed investors get most of the bad IPOs and little of the good ones: the winner’s curse.`) +
    p_(`Break-even: ${f2(p1 * a1)} × ${pp(r1, 0)} + ${f2(p2 * a2)} × x + ${f2(p3)} × (${pp(r3, 0)}) = 0 gives x = ${pp(d.xmin, 3)}.`);
  return { ...Q('L1.winners', 1, html, parts), solution: sol };
}

// =====================================================================
// LECTURE 2 — Debt financing
// =====================================================================

/** Default spreads by rating, matched to the nearest value (Lecture 2, slide 22; reconstructed). */
export const RATINGS: [string, number][] = [
  ['AAA', 0.006], ['AA', 0.008], ['A+', 0.01], ['A', 0.0115], ['A-', 0.013], ['BBB', 0.016], ['BB+', 0.02], ['BB', 0.025],
  ['B+', 0.035], ['B', 0.05], ['B-', 0.07], ['CCC', 0.1], ['CC', 0.14], ['C', 0.17], ['D', 0.2],
];
export const RATING_NAMES = RATINGS.map(r => r[0]);
export const ratingOf = (s: number) => RATINGS.reduce((b, r, i) => Math.abs(r[1] - s) < Math.abs(RATINGS[b][1] - s) ? i : b, 0);
/** True when the spread is clearly closer to one rating than to its neighbours. */
export function clearRating(s: number): boolean {
  const d = RATINGS.map(r => Math.abs(r[1] - s)).sort((a, b) => a - b);
  return d[1] - d[0] > 0.002;
}
export const ratingTable = () => p_('Typical default spreads by credit rating (match the nearest):') +
  table(['Rating', ...RATINGS.slice(0, 8).map(r => r[0])], [['Spread', ...RATINGS.slice(0, 8).map(r => pp(r[1]))]]) +
  table(['Rating', ...RATINGS.slice(8).map(r => r[0])], [['Spread', ...RATINGS.slice(8).map(r => pp(r[1]))]]);

export function ardenDraw() {
  for (;;) {
    const c = cur(), name = co(['Medical Technologies', 'Robotics', 'Diagnostics', 'Biosystems', 'Devices']);
    const I = rstep(40, 100, 5), H = roundTo(I * rstep(1.4, 1.9, 0.05), 1), L = roundTo(I * rstep(0.7, 0.98, 0.02), 1);
    const p = pick([0.5, 0.5, 0.6, 0.4]), rf = rstep(0.02, 0.06, 0.01);
    const F = (I * (1 + rf) - (1 - p) * L) / p;
    if (!(F > L + 1 && F < H - 5)) continue;
    const y = F / I - 1, s = y - rf;
    if (!clearRating(s) || s > 0.155) continue;
    const E = p * (H - F) / (1 + rf);
    // Second, subordinated investment financed with junior debt maturing at the same time.
    const I2 = rstep(5, 20, 1), dH = roundTo(I2 * rstep(1.3, 2.5, 0.1), 1), dL = roundTo(I2 * rstep(0.3, 0.9, 0.1), 1);
    const H2 = H + dH, L2 = L + dL, need = I2 * (1 + rf);
    const lowSur = Math.max(0, L2 - F), highSur = H2 - F;
    let F2 = need;
    if (F2 > lowSur) F2 = (need - (1 - p) * lowSur) / p;
    if (!(F2 > 0 && F2 < highSur - 1) || (F2 > lowSur && F2 < lowSur + 0.5)) continue;
    const B1 = (p * F + (1 - p) * Math.min(F, L2)) / (1 + rf), y1 = F / B1 - 1, s1 = y1 - rf;
    if (!clearRating(s1) || ratingOf(s1) === ratingOf(s)) continue;
    const E2 = (p * Math.max(0, H2 - F - F2) + (1 - p) * Math.max(0, L2 - F - F2)) / (1 + rf);
    return { c, name, I, H, L, p, rf, F, y, s, E, I2, dH, dL, F2, B1, y1, s1, E2 };
  }
}

const prob = (p: number) => p === 0.5 ? 'Both scenarios are equally likely' : `The high-demand scenario has a probability of ${P(p, 0)}`;
const ardenText = (d: ReturnType<typeof ardenDraw>) => p_(`${d.name} is a newly established company planning to develop a new product. The project requires an initial investment of ${d.c.mil(d.I, 0)} and generates a single cash flow in one year: ${d.c.mil(d.H, 0)} if demand is high and ${d.c.mil(d.L, 0)} if it is low. ${prob(d.p)}, and the outcome is uncorrelated with the market. The company finances the entire investment with one-year zero-coupon bonds. The risk-free rate is ${pp(d.rf, 0)}, there are no bankruptcy costs and no other assets or liabilities. ${inMillions(d.c)}`);

/** Risky zero-coupon debt: face value, yield, default spread, rating and equity value. */
export function L2_riskyDebt(): Question {
  const d = ardenDraw(), { c } = d;
  const parts: Part[] = [
    N('What is the total face value of the debt?', d.F, c.m),
    N('What is the yield to maturity of the bonds?', d.y * 100, 'pct'),
    N('What is the default spread?', d.s * 100, 'pct'),
    C('Which credit rating is most consistent with the default spread?', RATING_NAMES, ratingOf(d.s)),
    N('What is the market value of the equity right after the investment?', d.E, c.m),
  ];
  const sol = p_(`The cash flows have a beta of zero, so the bonds are priced at the risk-free rate: ${c.mil(d.I, 0)} = [${f2(d.p)} × F + ${f2(1 - d.p)} × ${f2(d.L)}] / ${f2(1 + d.rf)}, so F = ${c.mil(d.F)} (bondholders take the whole ${c.mil(d.L, 0)} in the low state).`) +
    p_(`Yield: F/B<sub>0</sub> − 1 = ${f2(d.F)}/${f2(d.I)} − 1 = ${pp(d.y)}; spread ${pp(d.y)} − ${pp(d.rf, 0)} = ${pp(d.s)}, closest to ${RATING_NAMES[ratingOf(d.s)]}. Equity: ${f2(d.p)} × (${f2(d.H)} − ${f2(d.F)}) / ${f2(1 + d.rf)} = ${c.mil(d.E)}.`);
  return { ...Q('L2.riskyDebt', 2, ardenText(d) + ratingTable(), parts), solution: sol };
}

/** A second project financed with subordinated debt: junior face value, value and rating of the senior bonds, equity. */
export function L2_seniority(): Question {
  const d = ardenDraw(), { c } = d;
  const html = ardenText(d) + p_(`Right after financing the project, but before any cash flow is realised, the company finds an additional investment of ${c.mil(d.I2, 0)} that raises the cash flows by ${c.mil(d.dH, 0)} if demand is high and by ${c.mil(d.dL, 0)} if it is low. It is financed entirely with new one-year zero-coupon bonds that mature with the existing bonds but are subordinated to them.`) + ratingTable();
  const parts: Part[] = [
    N('What is the face value of the original debt?', d.F, c.m),
    N('What is the market value of the equity right after the first investment?', d.E, c.m),
    N('What is the face value of the newly issued (junior) debt?', d.F2, c.m),
    N('What is the value of the original (senior) bonds after the second investment?', d.B1, c.m),
    C('Which credit rating fits the original bonds now?', RATING_NAMES, ratingOf(d.s1)),
    N('What is the new market value of the equity?', d.E2, c.m),
  ];
  const L2 = d.L + d.dL, H2 = d.H + d.dH;
  const sol = p_(`Original debt: ${c.mil(d.I, 0)} × ${f2(1 + d.rf)} = ${f2(d.p)}F + ${f2(1 - d.p)} × ${f2(d.L)} gives F = ${c.mil(d.F)}; equity ${c.mil(d.E)}.`) +
    p_(`After the second project the low state pays ${f2(L2)}. ${L2 >= d.F ? 'That covers the senior bonds in full, so they become risk-free' : `Senior bondholders now receive ${f2(L2)} instead of ${f2(d.L)}`}: their value rises to [${f2(d.p)} × ${f2(d.F)} + ${f2(1 - d.p)} × ${f2(Math.min(d.F, L2))}] / ${f2(1 + d.rf)} = ${c.mil(d.B1)}, a yield of ${pp(d.y1)} and a spread of ${pp(d.s1)} (${RATING_NAMES[ratingOf(d.s1)]} instead of ${RATING_NAMES[ratingOf(d.s)]}).`) +
    p_(`Junior bondholders are paid only after the senior debt: in the low state they get ${f2(Math.max(0, L2 - d.F))}. Their face value F<sub>2</sub> solves ${c.mil(d.I2, 0)} × ${f2(1 + d.rf)} = expected payoff, so F<sub>2</sub> = ${c.mil(d.F2)}. Equity: [${f2(d.p)} × (${f2(H2)} − ${f2(d.F)} − ${f2(d.F2)})${L2 > d.F + d.F2 ? ` + ${f2(1 - d.p)} × (${f2(L2 - d.F - d.F2)})` : ''}] / ${f2(1 + d.rf)} = ${c.mil(d.E2)}. Part of the second project’s value went to the senior bondholders.`);
  return { ...Q('L2.seniority', 2, html, parts), solution: sol };
}

export function bpDraw() {
  for (;;) {
    const c = cur(), name = co(['Robotics', 'Systems', 'Technologies', 'Instruments']);
    const A = rstep(100, 300, 10), n = rint(20, 60);
    const probs = pick([[0.3, 0.6, 0.1], [0.2, 0.6, 0.2], [0.25, 0.6, 0.15], [0.3, 0.5, 0.2], [0.4, 0.5, 0.1]]);
    const cf = [roundTo(A * rstep(1.8, 3, 0.1), 10), roundTo(A * rstep(0.7, 1.2, 0.1), 10), 0];
    const Ecf = probs.reduce((s, p, i) => s + p * cf[i], 0);
    const I = roundTo(Ecf * rstep(0.8, 0.95, 0.01), 5), npv = Ecf - I;
    if (npv <= 1) continue;
    const V = cf.map(x => A + x);
    const F = solveFace(V, probs, I);
    if (!(F > V[2] + 2 && F < V[1] - 2)) continue;
    const K = roundTo(V[2] * rstep(0.55, 0.95, 0.05), 10);
    if (K >= V[2] || K <= 0) continue;
    // Convertible: bondholders take max(min(K, V), q·V) with q = x/(n + x); solve E[payoff] = I for q.
    const pay = (q: number) => V.map(v => Math.max(Math.min(K, v), q * v));
    const ev = (q: number) => pay(q).reduce((s, x, i) => s + probs[i] * x, 0);
    if (ev(0) >= I || ev(0.999) < I) continue;
    let lo = 0, hi = 0.999;
    for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (ev(m) < I) lo = m; else hi = m; }
    const q = (lo + hi) / 2, x = q * n / (1 - q);
    const conv = V.map(v => q * v > K + 1e-9);
    if (V.some(v => Math.abs(q * v - K) < 1)) continue;
    return { c, name, A, n, probs, cf, I, npv, V, F, K, q, x, conv };
  }
}

const SCEN = ['Good', 'Mediocre', 'Bad'];
const bpText = (d: ReturnType<typeof bpDraw>) => p_(`${d.name} is an all-equity firm. Its existing assets will generate a certain cash flow of ${d.c.mil(d.A, 0)} next year and nothing thereafter. It has ${d.n} million shares outstanding. The discount rate is zero for all cash flows and there are no taxes. The firm can invest ${d.c.mil(d.I, 0)} today in a project with a single uncertain cash flow next year:`) +
  table(['Scenario', 'Cash flow (t = 1)', 'Probability'], SCEN.map((s, i) => [s, f2(d.cf[i]), P(d.probs[i], 0)])) + p_(`Amounts in millions except where per share or per bond. ${inMillions(d.c)}`);

/** Straight debt: price before, project NPV, face value, bond price, payoffs per share, price after. */
export function L2_straight(): Question {
  const d = bpDraw(), { c } = d;
  const pay = d.V.map(v => Math.max(0, v - d.F) / d.n), price = pay.reduce((s, x, i) => s + d.probs[i] * x, 0);
  const html = bpText(d) + p_(`The firm finances the project by issuing straight debt maturing next year.`);
  const parts: Part[] = [
    N('What is the share price before the investment opportunity appears?', d.A / d.n, c.u),
    N('What is the stand-alone NPV of the project?', d.npv, c.m),
    N(`What total face value must the firm promise to raise ${c.mil(d.I, 0)}?`, d.F, c.m),
    N(`What is the price of a single bond with a face value of ${c.s}100?`, d.I / d.F * 100, c.u),
    ...SCEN.map((s, i) => N(`Payoff per share next year, ${s.toLowerCase()} scenario:`, pay[i], c.u)),
    N('What is the share price after the debt issue is announced, taking the investment into account?', price, c.u),
  ];
  const sol = p_(`Before: ${c.mil(d.A, 0)} / ${d.n}m = ${c.one(d.A / d.n, 3)}. NPV = ${d.probs.map((p, i) => `${f2(p)} × ${f2(d.cf[i])}`).join(' + ')} − ${f2(d.I)} = ${c.mil(d.npv)}.`) +
    p_(`Firm value next year is ${d.V.map(f2).join(' / ')}. Debt pays F in the good and mediocre scenarios and all ${f2(d.V[2])} in the bad one: ${f2(1 - d.probs[2])}F + ${f2(d.probs[2])} × ${f2(d.V[2])} = ${f2(d.I)}, so F = ${c.mil(d.F)} and a ${c.s}100 bond costs ${c.one(d.I / d.F * 100)}.`) +
    p_(`Per share: ${pay.map(x => c.one(x, 3)).join(' / ')}; expected value ${c.one(price, 3)} = (${f2(d.A)} + ${f2(d.npv)}) / ${d.n}: with fairly priced debt the shareholders get the whole NPV.`);
  return { ...Q('L2.straight', 2, html, parts), solution: sol };
}

/** Convertible debt: conversion shares, bond price and conversion ratio, payoffs, price; and how it compares. */
export function L2_convertible(): Question {
  const d = bpDraw(), { c } = d;
  const pay = d.V.map((v, i) => d.conv[i] ? v * (1 - d.q) / d.n : (v - Math.min(d.K, v)) / d.n);
  const own = d.conv.map(cv => cv ? d.n / (d.n + d.x) : 1);
  const price = pay.reduce((s, x, i) => s + d.probs[i] * x, 0);
  const html = bpText(d) + p_(`The firm finances the project with a convertible bond with a principal of ${c.mil(d.K, 0)}. At maturity, bondholders can take the principal or convert into x new shares.`);
  const convWhere = SCEN.filter((_, i) => d.conv[i]).map(s => s.toLowerCase()).join(' and ');
  const parts: Part[] = [
    N(`What is the minimum number of shares x (in millions) the bonds must convert into to raise ${c.mil(d.I, 0)}?`, d.x, 'msh'),
    N(`What is the price of a single convertible bond with a face value of ${c.s}100?`, d.I / d.K * 100, c.u),
    N('… and its conversion ratio (shares per bond)?', d.x / (d.K / 100), 'n'),
    ...SCEN.map((s, i) => N(`Payoff per share next year, ${s.toLowerCase()} scenario:`, pay[i], c.u)),
    N('What share of the firm do the initial shareholders hold in the good scenario?', own[0] * 100, 'pct'),
    N('What is the share price after the issue is announced, taking the investment into account?', price, c.u),
    C('Which security makes the shareholders better off?', ['Straight debt', 'Convertible debt', 'They are equally well off with either'], 2),
    C('How would bankruptcy costs change the share price?', ['Not at all, with either security', 'With either security', 'Only with straight debt', 'Only with convertible debt'], 2),
  ];
  const sol = p_(`Bondholders convert where x/(${d.n} + x) of the firm is worth more than ${f2(d.K)}: here in the ${convWhere} scenario${d.conv.filter(Boolean).length > 1 ? 's' : ''}. With q = x/(${d.n} + x), fair pricing requires ${d.V.map((v, i) => d.conv[i] ? `${f2(d.probs[i])} × q × ${f2(v)}` : `${f2(d.probs[i])} × ${f2(Math.min(d.K, v))}`).join(' + ')} = ${f2(d.I)}, so q = ${fmtNum(d.q, 4)} and x = q·${d.n}/(1 − q) = ${f2(d.x)}m shares.`) +
    p_(`A ${c.s}100 bond costs ${f2(d.I)}/${f2(d.K)} × 100 = ${c.one(d.I / d.K * 100)} and converts into ${f2(d.x)}m / ${f2(d.K / 100)}m bonds = ${f2(d.x / (d.K / 100))} shares. Payoffs per share: ${pay.map(x => c.one(x, 3)).join(' / ')}; expected ${c.one(price, 3)}, the same as with straight debt because both are fairly priced and markets are perfect.`) +
    p_(`The straight debt defaults in the bad scenario (${f2(d.V[2])} < ${f2(d.F)}), the convertible never does (${f2(d.K)} ≤ ${f2(d.V[2])}). Bankruptcy costs would lower the price only with straight debt.`);
  return { ...Q('L2.convertible', 2, html, parts), solution: sol };
}

// =====================================================================
// LECTURE 3 — Financing choices: incentives and information
// =====================================================================

export function effortDraw() {
  for (;;) {
    const c = cur(), three = chance(0.6);
    let V: number[], ph: number[], pl: number[], I: number;
    if (three) {
      I = rstep(50, 150, 10);
      V = [roundTo(I * rstep(1.15, 1.5, 0.05), 5), roundTo(I * rstep(0.5, 0.85, 0.05), 5), 0];
      const a = rstep(0.5, 0.8, 0.05), m = +(1 - a).toFixed(2), z = rstep(0.05, 0.2, 0.05);
      ph = [a, m, 0]; pl = [+(a - z).toFixed(2), m, z];
    } else {
      I = rstep(40, 100, 5);
      V = [roundTo(I * rstep(2, 3.2, 0.1), 1), roundTo(I * rstep(0.3, 0.6, 0.05), 1)];
      const a = pick([0.75, 0.7, 0.8, 0.6]), b = pick([0.25, 0.3, 0.4]);
      ph = [a, +(1 - a).toFixed(2)]; pl = [b, +(1 - b).toFixed(2)];
    }
    const Eh = V.reduce((s, v, i) => s + ph[i] * v, 0), El = V.reduce((s, v, i) => s + pl[i] * v, 0);
    if (Eh <= I * 1.02 || El >= Eh) continue;
    const alpha = I / Eh, kE = (1 - alpha) * (Eh - El);
    const F = solveFace(V, ph, I);
    if (!(F > V[1] + 1 && F < V[0] - 1)) continue;
    const kD = V.reduce((s, v, i) => s + (ph[i] - pl[i]) * Math.max(0, v - F), 0);
    if (kD <= kE + 0.05) continue;
    return { c, three, I, V, ph, pl, Eh, El, alpha, kE, F, kD };
  }
}

export const effortText = (d: ReturnType<typeof effortDraw>) => {
  const { c } = d;
  const amt = (v: number) => v ? c.mil(v, 0) : 'nothing';
  const out = (p: number[]) => d.V.map((v, i) => p[i] ? `${amt(v)} with probability ${P(p[i], 0)}` : '').filter(Boolean).join(', ');
  return p_(`An entrepreneur has an idea for a start-up that requires an investment of ${c.mil(d.I, 0)} today. Later it will be worth ${d.V.map(amt).join(', ').replace(/, ([^,]*)$/, ' or $1')}, depending on the entrepreneur’s effort. With high effort: ${out(d.ph)}. With low effort: ${out(d.pl)}. Effort costs the entrepreneur the monetary equivalent κ. Investors can neither observe nor control effort. The discount rate is zero. ${inMillions(c)}`);
};

/** Moral hazard: the largest effort cost for which high effort is chosen, with own cash, outside equity and debt. */
export function L3_effort(): Question {
  const d = effortDraw(), { c } = d;
  const html = effortText(d) + p_('If the entrepreneur needs outside money, investors believe she will choose high effort.');
  const parts: Part[] = [
    N('With her own cash, up to which κ does the entrepreneur choose high effort?', d.Eh - d.El, c.m),
    N('With outside equity: what fraction α of the firm must investors receive?', d.alpha * 100, 'pct'),
    N('… and up to which κ does she still choose high effort?', d.kE, c.m),
    N('With debt instead: what face value must she promise?', d.F, c.m),
    N('… and up to which κ does she still choose high effort?', d.kD, c.m),
  ];
  const sol = p_(`Expected values: ${c.mil(d.Eh)} with high effort and ${c.mil(d.El)} with low effort. With her own money she gains the whole difference, so κ ≤ ${f2(d.Eh - d.El)}.`) +
    p_(`Equity: investors break even if α × ${f2(d.Eh)} = ${f2(d.I)}, so α = ${fmtNum(d.alpha, 4)}. She keeps 1 − α of the gain from effort: κ ≤ ${fmtNum(1 - d.alpha, 4)} × ${f2(d.Eh - d.El)} = ${f2(d.kE)}.`) +
    p_(`Debt: E<sub>high</sub>[min(F, V)] = ${f2(d.I)} gives F = ${c.mil(d.F)}. She keeps everything above F: κ ≤ Σ(p<sub>high</sub> − p<sub>low</sub>) × max(V − F, 0) = ${f2(d.kD)}. Debt leaves her the full upside, so it sustains high effort for higher effort costs than equity.`);
  return { ...Q('L3.effort', 3, html, parts), solution: sol };
}

export function lemonsDraw() {
  for (;;) {
    const c = cur(), I = rstep(40, 100, 5), H = roundTo(I * rstep(1.3, 1.8, 0.05), 1), L = roundTo(I * rstep(0.4, 0.8, 0.05), 1);
    const pg = pick([0.7, 0.75, 0.8, 0.85]), pb = pick([0.3, 0.4, 0.5]), q = pick([0.5, 0.5, 0.4, 0.6]);
    const Eg = pg * H + (1 - pg) * L, Eb = pb * H + (1 - pb) * L, avg = q * Eg + (1 - q) * Eb;
    if (Eb < I - 1e-9 || avg <= I) continue;
    const alpha = I / avg, pbar = q * pg + (1 - q) * pb, F = (I - (1 - pbar) * L) / pbar;
    if (!(F > L + 1 && F < H - 1)) continue;
    const ue = alpha * Eg - I, ud = pg * F + (1 - pg) * L - I;
    if (ud >= ue - 0.05) continue;
    return { c, I, H, L, pg, pb, q, Eg, Eb, alpha, F, ue, ud, keepE: (1 - alpha) * Eg, keepD: pg * (H - F) };
  }
}

export const lemonsText = (d: ReturnType<typeof lemonsDraw>) => p_(`Entrepreneurs need ${d.c.mil(d.I, 0)} for a project worth ${d.c.mil(d.H, 0)} if it succeeds and ${d.c.mil(d.L, 0)} if it fails. A good type succeeds with probability ${P(d.pg, 0)}, a bad type with ${P(d.pb, 0)}. ${d.q === 0.5 ? 'Half of the entrepreneurs are good types' : `${P(d.q, 0)} of the entrepreneurs are good types`}; each knows her type, investors do not. The discount rate is zero. ${inMillions(d.c)}`);

/** Adverse selection: pooled prices of equity and debt, the underpricing good types suffer, and their preference. */
export function L3_lemons(): Question {
  const d = lemonsDraw(), { c } = d;
  const parts: Part[] = [
    N('If every type issues equity, what fraction of the firm must new investors receive?', d.alpha * 100, 'pct'),
    N('If every type issues debt, what face value must be promised?', d.F, c.m),
    N('By how much is a good type’s equity underpriced?', d.ue, c.m),
    N('By how much is a good type’s debt underpriced?', d.ud, c.m),
    N('What is the good type’s stake worth when she issues debt?', d.keepD, c.m),
    C('Which security does a good type prefer?', ['Debt', 'Equity', 'She is indifferent'], 0),
  ];
  const sol = p_(`Expected values: good ${f2(d.Eg)}, bad ${f2(d.Eb)}; pooled ${f2(d.q * d.Eg + (1 - d.q) * d.Eb)}. Equity: α × pooled value = ${f2(d.I)}, α = ${fmtNum(d.alpha, 4)}. Debt: the average success probability is ${fmtNum(d.q * d.pg + (1 - d.q) * d.pb, 3)}, so F = (${f2(d.I)} − ${fmtNum(1 - d.q * d.pg - (1 - d.q) * d.pb, 3)} × ${f2(d.L)}) / ${fmtNum(d.q * d.pg + (1 - d.q) * d.pb, 3)} = ${c.mil(d.F)}.`) +
    p_(`For a good type, the equity sold is worth ${fmtNum(d.alpha, 4)} × ${f2(d.Eg)} = ${f2(d.alpha * d.Eg)}, ${c.mil(d.ue)} more than she receives; the debt is worth ${f2(d.pg)} × ${f2(d.F)} + ${f2(1 - d.pg)} × ${f2(d.L)} = ${f2(d.ud + d.I)}, only ${c.mil(d.ud)} more. She keeps ${c.mil(d.keepD)} with debt and ${c.mil(d.keepE)} with equity. Debt is less information-sensitive, so good types prefer it; bad types imitate them (pooling on debt), the pecking order.`);
  return { ...Q('L3.lemons', 3, lemonsText(d), parts), solution: sol };
}

// =====================================================================
// LECTURE 4 — Capital budgeting
// =====================================================================

const pv = (cfs: number[], r: number) => cfs.reduce((s, x, t) => s + x / (1 + r) ** t, 0);

export function npvDraw() {
  const c = cur(), T = rint(2, 4), r = rstep(0.06, 0.14, 0.01), I = rstep(1000, 5000, 100);
  const cf = Array.from({ length: T }, () => roundTo(I * rstep(0.25, 0.6, 0.05), 10));
  const study = roundTo(I * rstep(0.05, 0.2, 0.05), 10), machine = roundTo(I * rstep(0.1, 0.3, 0.05), 10);
  const cann = roundTo(cf[0] * rstep(0.05, 0.2, 0.05), 10), hq = roundTo(cf[0] * rstep(0.05, 0.15, 0.05), 10);
  const flows = [-I - machine, ...cf.map(x => x - cann)];
  const html = p_(`A firm considers a project that requires equipment costing ${c.one(I, 0)} today and is expected to bring cash flows of ${cf.map(x => c.one(x, 0)).join(', ')} in years 1 to ${T}. The discount rate is ${pp(r, 0)}. Further facts:`) +
    '<ul><li>' + [
      `A feasibility study for the project, completed last month, cost ${c.one(study, 0)}.`,
      `The project uses a currently unused machine the firm could sell today for ${c.one(machine, 0)}.`,
      `The new product will reduce the cash flows of an existing product by ${c.one(cann, 0)} a year.`,
      `Headquarters allocates ${c.one(hq, 0)} a year of its electricity costs to the project; total HQ costs do not change.`,
    ].join('</li><li>') + '</li></ul>';
  return { c, T, r, I, cf, study, machine, cann, hq, flows, html, npv: pv(flows, r), wrong: pv([-I - study, ...cf.map(x => x - hq)], r), pv };
}

export const npvSolution = (d: ReturnType<typeof npvDraw>) => p_(`Only cash flows that differ with and without the project count. The study is sunk and the allocated HQ costs do not change total costs: both are irrelevant. The machine’s resale value is an opportunity cost at t = 0 and the lost sales of the existing product are a negative externality every year.`) +
  p_(`Cash flows: ${d.flows.map(x => d.c.one(x, 0)).join(', ')}. NPV at ${pp(d.r, 0)} = ${d.c.one(d.npv)}. (Including the sunk study and the HQ allocation instead would give ${d.c.one(d.wrong)}.)`);

/** NPV with only incremental cash flows: sunk and allocated costs out, opportunity costs and cannibalisation in. */
export function L4_npv(): Question {
  const d = npvDraw(), { c } = d;
  const parts: Part[] = [
    N('What is the incremental cash flow at t = 0?', d.flows[0], c.u),
    N('What is the incremental cash flow in year 1?', d.flows[1], c.u),
    N('What is the NPV of the project?', d.npv, c.u, { abs: 1 }),
    C('Should the firm undertake the project?', ['Yes', 'No'], d.npv > 0 ? 0 : 1),
  ];
  return { ...Q('L4.npv', 4, d.html, parts), solution: npvSolution(d) };
}

export function fsDraw() {
  for (;;) {
    const k = 1000, rnd = (x: number) => roundTo(x, 500);
    const rev = rnd(rstep(200, 600, 10) * k), cogs = rnd(rev * rstep(0.6, 0.72, 0.01)), opex = rnd(rev * rstep(0.2, 0.28, 0.01));
    const ebitda = rev - cogs - opex, dep = rnd(rstep(1, 5, 0.5) * k), ebit = ebitda - dep;
    const int = rnd(rstep(0.5, 2, 0.5) * k), tax = pick([0.2, 0.25, 0.3]), ti = ebit - int;
    if (ebit <= 2000 || ti <= 0) continue;
    const taxes = roundTo(ti * tax, 50), ni = ti - taxes;
    if (Math.abs(taxes / ti - tax) > 1e-9) continue;
    const div = rnd(ni * rstep(0.2, 0.6, 0.05));
    const s = rev / 370000;
    const b25 = { cash: rnd(3500 * s), inv: rnd(27500 * s), ar: rnd(27000 * s), ap: rnd(30000 * s), std: rnd(1500 * s), loans: rnd(5000 * s), bld: rnd(16000 * s), comp: rnd(5500 * s), pic: rnd(30000 * s) };
    const capex = rnd(dep + rstep(0, 6, 0.5) * k);
    const bld26 = b25.bld + rnd(capex * 0.6) - rnd(dep * 0.6), comp26 = b25.comp + (capex - rnd(capex * 0.6)) - (dep - rnd(dep * 0.6));
    const b26 = { inv: rnd(b25.inv * rstep(0.9, 1.15, 0.01)), ar: rnd(b25.ar * rstep(0.85, 1.15, 0.01)), ap: rnd(b25.ap * rstep(0.8, 1.1, 0.01)), std: rnd(b25.std * rstep(0.8, 1.5, 0.1)), loans: rnd(b25.loans * rstep(0.8, 2, 0.1)), bld: bld26, comp: comp26 };
    const nca25 = b25.bld + b25.comp, nca26 = bld26 + comp26;
    const tot25 = b25.cash + b25.inv + b25.ar + nca25;
    const re25fix = tot25 - (b25.ap + b25.std + b25.loans + b25.pic);
    if (re25fix <= 0) continue;
    const re26 = re25fix + ni - div;
    const tot26 = b26.ap + b26.std + b26.loans + b25.pic + re26;
    const cash26 = tot26 - (b26.inv + b26.ar + nca26);
    if (cash26 <= 500 || bld26 <= 0 || comp26 <= 0) continue;
    const nwc25 = b25.cash + b25.inv + b25.ar - b25.ap, nwc26 = cash26 + b26.inv + b26.ar - b26.ap;
    const fcf = ebitda - tax * ebit - capex - (nwc26 - nwc25);
    return { rev, cogs, opex, ebitda, dep, ebit, int, ti, taxes, ni, div, tax, capex, b25: { ...b25, re: re25fix, nca: nca25, tot: tot25 }, b26: { ...b26, cash: cash26, re: re26, nca: nca26, tot: tot26 }, nwc25, nwc26, fcf };
  }
}

export function fsTables(d: ReturnType<typeof fsDraw>): string {
  const e = (x: number) => fmtNum(x, 0);
  const a = d.b25, b = d.b26;
  return table(['Balance sheet (€)', '2025', '2026'], [
    ['Cash and cash equivalents', e(a.cash), e(b.cash)], ['Inventory', e(a.inv), e(b.inv)], ['Accounts receivable', e(a.ar), e(b.ar)],
    ['Buildings', e(a.bld), e(b.bld)], ['Computer equipment', e(a.comp), e(b.comp)], ['<b>Total assets</b>', e(a.tot), e(b.tot)],
    ['Accounts payable', e(a.ap), e(b.ap)], ['Short-term debt', e(a.std), e(b.std)], ['Loans', e(a.loans), e(b.loans)],
    ['Paid-in capital', e(a.pic), e(a.pic)], ['Retained earnings', e(a.re), e(b.re)], ['<b>Total liabilities and equity</b>', e(a.tot), e(b.tot)],
  ]) + table(['Income statement 2026 (€)', ''], [
    ['Revenue', e(d.rev)], ['Cost of goods sold', e(d.cogs)], ['Other operating expenses', e(d.opex)], ['EBITDA', e(d.ebitda)], ['Depreciation', e(d.dep)],
    ['EBIT', e(d.ebit)], ['Interest expense', e(d.int)], ['Taxable income', e(d.ti)], ['Taxes', e(d.taxes)], ['Net income', e(d.ni)],
  ]);
}

/** Free cash flow from a balance sheet and an income statement. */
export function L4_fcf(): Question {
  const d = fsDraw();
  const html = p_(`Consider the financial statements of ${co()}. In 2026 the company pays ${fmtNum(d.capex, 0)} € for new buildings and computers and ${fmtNum(d.div, 0)} € in dividends. Treat all cash as operating cash. Amounts in €.`) + fsTables(d);
  const parts: Part[] = [
    N('What is the net working capital at the end of 2025?', d.nwc25, 'eur'),
    N('What is the change in net working capital in 2026?', d.nwc26 - d.nwc25, 'eur'),
    N('What is the tax rate?', d.tax * 100, 'pct'),
    N('What are the unlevered taxes (τ × EBIT)?', d.tax * d.ebit, 'eur'),
    N('What is the free cash flow for 2026?', d.fcf, 'eur', { abs: 1 }),
  ];
  const sol = p_(`NWC = cash + inventory + receivables − payables: ${fmtNum(d.nwc25, 0)} in 2025 and ${fmtNum(d.nwc26, 0)} in 2026, ΔNWC = ${fmtNum(d.nwc26 - d.nwc25, 0)}. Tax rate ${fmtNum(d.taxes, 0)}/${fmtNum(d.ti, 0)} = ${P(d.tax, 0)}; unlevered taxes ${P(d.tax, 0)} × ${fmtNum(d.ebit, 0)} = ${fmtNum(d.tax * d.ebit, 0)} (interest is a financing flow and is left out).`) +
    p_(`CapEx = change in non-current assets + depreciation = ${fmtNum(d.b26.nca - d.b25.nca, 0)} + ${fmtNum(d.dep, 0)} = ${fmtNum(d.capex, 0)}. FCF = EBITDA − τ·EBIT − CapEx − ΔNWC = ${fmtNum(d.ebitda, 0)} − ${fmtNum(d.tax * d.ebit, 0)} − ${fmtNum(d.capex, 0)} − ${fmtNum(d.nwc26 - d.nwc25, 0)} = ${fmtNum(d.fcf, 0)} €. Dividends are a financing flow and do not enter.`);
  return { ...Q('L4.fcf', 4, html, parts), solution: sol };
}

/** Last-year free cash flow with after-tax salvage and NWC recovery, or a continuation value as a growing perpetuity. */
export function L4_terminal(): Question {
  const c = cur(), tau = pick([0.2, 0.25, 0.3]), r = rstep(0.07, 0.12, 0.01);
  if (chance(0.5)) {
    const ebit = rstep(2, 10, 0.5), dep = rstep(1, 4, 0.5), sale = rstep(2, 8, 0.5), book = rstep(0, 6, 0.5), nwc = rstep(1, 5, 0.5), T = rint(3, 6);
    const salv = sale - tau * (sale - book), fcf = ebit * (1 - tau) + dep + salv + nwc;
    const html = p_(`In the last year (year ${T}) of a project, EBIT is ${c.mil(ebit)} and depreciation ${c.mil(dep)}. The equipment, with a book value of ${c.mil(book)}, is sold for ${c.mil(sale)}, and the ${c.mil(nwc)} of net working capital is fully recovered. The tax rate is ${P(tau, 0)}. ${inMillions(c)}`);
    const parts: Part[] = [
      N('What is the after-tax salvage value of the equipment?', salv, c.m),
      N(`What is the free cash flow in year ${T}?`, fcf, c.m),
      N(`What is its present value at a discount rate of ${pp(r, 0)}?`, fcf / (1 + r) ** T, c.m),
    ];
    const sol = p_(`Gains over book value are taxed (losses give a tax credit): ${f2(sale)} − ${P(tau, 0)} × (${f2(sale)} − ${f2(book)}) = ${f2(salv)}. FCF = EBIT(1 − τ) + depreciation + after-tax salvage + NWC recovered = ${f2(ebit * (1 - tau))} + ${f2(dep)} + ${f2(salv)} + ${f2(nwc)} = ${c.mil(fcf)}. PV = ${f2(fcf)} / ${f2(1 + r)}<sup>${T}</sup> = ${c.mil(fcf / (1 + r) ** T)}.`);
    return { ...Q('L4.terminal', 4, html, parts), solution: sol };
  }
  const T = rint(3, 5), g = rstep(0.01, 0.04, 0.005), fcfT = rstep(5, 30, 0.5), tv = fcfT * (1 + g) / (r - g);
  const html = p_(`A project’s free cash flow in year ${T}, the last year of the explicit forecast, is ${c.mil(fcfT)}. Afterwards it is expected to grow at ${pp(g, 1)} a year forever. The discount rate is ${pp(r, 0)}. ${inMillions(c)}`);
  const parts: Part[] = [
    N(`What is the continuation (terminal) value at the end of year ${T}?`, tv, c.m),
    N('What is its present value today?', tv / (1 + r) ** T, c.m),
  ];
  const sol = p_(`TV<sub>${T}</sub> = FCF<sub>${T + 1}</sub>/(r − g) = ${f2(fcfT)} × ${fmtNum(1 + g, 3)} / (${pp(r, 0)} − ${pp(g, 1)}) = ${c.mil(tv)}. It is a cash flow at year ${T}: PV = ${f2(tv)} / ${f2(1 + r)}<sup>${T}</sup> = ${c.mil(tv / (1 + r) ** T)}.`);
  return { ...Q('L4.terminal', 4, html, parts), solution: sol };
}

export function apvDraw() {
  const c = cur(), T = rint(4, 6), C0 = rstep(8, 20, 1), rU = rstep(0.08, 0.14, 0.01), rD = rstep(0.04, 0.08, 0.005), tau = pick([0.25, 0.3, 0.3]);
  const m = rint(2, T - 1), inst = rstep(5, 15, 1), D0 = inst * m, I = D0;
  const debt = Array.from({ length: m + 1 }, (_, t) => D0 - inst * t);
  const dts = debt.slice(0, m).map(Dt => tau * rD * Dt);
  const pvDts = dts.reduce((s, x, t) => s + x / (1 + rD) ** (t + 1), 0);
  const npvU = -I + Array.from({ length: T }, (_, t) => C0 / (1 + rU) ** (t + 1)).reduce((a, b) => a + b, 0);
  return { c, T, C0, rU, rD, tau, m, inst, D0, I, dts, pvDts, npvU, apv: npvU + pvDts };
}

/** APV with a predetermined debt schedule: unlevered NPV plus the PV of the interest tax shields at r_D. */
export function L4_apv(): Question {
  const d = apvDraw(), { c } = d;
  const html = p_(`A firm considers a project that generates free cash flows of ${c.mil(d.C0, 0)} a year for ${d.T} years. The capital expenditure of ${c.mil(d.I, 0)} is financed with a loan of the same amount, repaid in ${d.m} equal instalments of ${c.mil(d.inst, 0)} at the end of years 1 to ${d.m}. The new debt does not otherwise change the firm’s capital structure and lenders require ${pp(d.rD, 1)}. The project’s cost of capital is ${pp(d.rU, 0)} and the tax rate ${P(d.tau, 0)}. ${inMillions(c)}`);
  const parts: Part[] = [
    N('What is the NPV of the project if it were all-equity financed?', d.npvU, c.m),
    N('What is the interest tax shield in year 1?', d.dts[0], c.m),
    N('What is the present value of all interest tax shields?', d.pvDts, c.m),
    N('What is the APV (NPV including the financing side effect)?', d.apv, c.m),
  ];
  const sol = p_(`Unlevered: −${f2(d.I)} + ${f2(d.C0)} × annuity factor (${pp(d.rU, 0)}, ${d.T} years) = ${c.mil(d.npvU)}.`) +
    p_(`Debt outstanding at the start of each year: ${Array.from({ length: d.m }, (_, t) => f2(d.D0 - d.inst * t)).join(', ')}. Tax shields τ·r<sub>D</sub>·D<sub>t−1</sub>: ${d.dts.map(x => fmtNum(x, 3)).join(', ')}. The schedule is fixed, so they are as risky as the debt and are discounted at r<sub>D</sub>: PV = ${c.mil(d.pvDts, 3)}. APV = ${f2(d.npvU)} + ${fmtNum(d.pvDts, 3)} = ${c.mil(d.apv)}.`);
  return { ...Q('L4.apv', 4, html, parts), solution: sol };
}

export function waccDraw() {
  for (;;) {
    const c = cur(), name = co(['Airlines', 'Logistics', 'Energy', 'Retail']);
    const rU = rstep(0.08, 0.15, 0.005), dv = pick([0.2, 0.25, 0.3, 0.4, 0.5]), rD = rstep(0.04, rU - 0.02, 0.005), tau = pick([0.25, 0.3]);
    const rE = rU + dv / (1 - dv) * (rU - rD), wacc = (1 - dv) * rE + dv * rD * (1 - tau);
    const g = chance(0.3) ? rstep(0.01, 0.03, 0.005) : 0, fcf = rstep(5, 50, 0.1);
    if (wacc - g < 0.03) continue;
    const VL = fcf / (wacc - g), VU = fcf / (rU - g);
    return { c, name, rU, dv, rD, tau, rE, wacc, g, fcf, VL, VU };
  }
}

/** WACC with a constant leverage ratio, value of a perpetuity, and the APV cross-check. */
export function L4_wacc(): Question {
  const d = waccDraw(), { c } = d;
  const html = p_(`${d.name} is an all-equity company with a cost of capital of ${pp(d.rU, 1)}. Management decides to lever up to a debt-to-value ratio of ${P(d.dv, 0)} and to keep it constant. At this leverage, debtholders expect ${pp(d.rD, 1)}. The tax rate is ${P(d.tau, 0)}. The company expects free cash flows of ${c.mil(d.fcf, 1)} next year${d.g ? `, growing at ${pp(d.g, 1)} a year forever` : ' and every year forever'}. ${inMillions(c)} ${NOTE_PCT}`);
  const parts: Part[] = [
    N('What is the cost of equity after the recapitalisation?', d.rE * 100, 'pct'),
    N('What is the WACC?', d.wacc * 100, 'pct'),
    N('What is the value of the levered company?', d.VL, c.m),
    N('What would the company be worth unlevered?', d.VU, c.m),
    N('What is the present value of the interest tax shields?', d.VL - d.VU, c.m),
  ];
  const sol = p_(`r<sub>E</sub> = r<sub>U</sub> + D/E (r<sub>U</sub> − r<sub>D</sub>) = ${pp(d.rU, 1)} + ${fmtNum(d.dv / (1 - d.dv), 3)} × (${pp(d.rU, 1)} − ${pp(d.rD, 1)}) = ${pp(d.rE)}. WACC = E/V·r<sub>E</sub> + D/V·r<sub>D</sub>(1 − τ) = ${pp(d.wacc)} (equivalently r<sub>U</sub> − D/V·τ·r<sub>D</sub>).`) +
    p_(`V<sup>L</sup> = ${f2(d.fcf)} / (${pp(d.wacc)}${d.g ? ` − ${pp(d.g, 1)}` : ''}) = ${c.mil(d.VL)}; V<sup>U</sup> = ${f2(d.fcf)} / (${pp(d.rU, 1)}${d.g ? ` − ${pp(d.g, 1)}` : ''}) = ${c.mil(d.VU)}. The difference, ${c.mil(d.VL - d.VU)}, is the PV of the tax shields; with a constant leverage ratio they carry the risk of the operations and are discounted at r<sub>U</sub>, so APV gives the same value.`);
  return { ...Q('L4.wacc', 4, html, parts), solution: sol };
}

export function betaDraw() {
  const rf = rstep(0.02, 0.05, 0.005), mrp = rstep(0.04, 0.07, 0.005), bE = rstep(0.8, 2, 0.05), de = pick([0.25, 0.4, 0.5, 0.6, 1]), bD = pick([0, 0, 0.1, 0.2]);
  const bU = (bE + de * bD) / (1 + de), de2 = pick([0.25, 0.5, 0.6, 0.8].filter(x => x !== de)), bE2 = bU + de2 * (bU - bD), tau = pick([0.25, 0.3]);
  const rU = rf + bU * mrp, rE2 = rf + bE2 * mrp, rD2 = rf + bD * mrp, w = de2 / (1 + de2), wacc = (1 - w) * rE2 + w * rD2 * (1 - tau);
  return { rf, mrp, bE, de, bD, bU, de2, bE2, rU, rE2, rD2, wacc, tau, twin: co() };
}

/** Twin-firm beta: unlever the comparable, relever at the project’s capital structure, CAPM costs and WACC. */
export function L4_beta(): Question {
  const d = betaDraw();
  const html = p_(`A firm wants to value a project in a new line of business. ${d.twin}, a pure player in that business, has an equity beta of ${f2(d.bE)} and a debt-to-equity ratio of ${f2(d.de)}; its debt beta is ${f2(d.bD)}. The project will be financed with a debt-to-equity ratio of ${f2(d.de2)} and debt with a beta of ${f2(d.bD)}. The risk-free rate is ${pp(d.rf, 1)}, the market risk premium ${pp(d.mrp, 1)} and the tax rate ${P(d.tau, 0)}. ${NOTE_PCT}`);
  const parts: Part[] = [
    N('What is the unlevered (asset) beta of the business?', d.bU, 'n'),
    N('What is the project’s cost of capital if it were all-equity financed?', d.rU * 100, 'pct'),
    N('What is the project’s equity beta at its own capital structure?', d.bE2, 'n'),
    N('What is the project’s cost of equity?', d.rE2 * 100, 'pct'),
    N('What is the project’s WACC?', d.wacc * 100, 'pct'),
  ];
  const sol = p_(`β<sub>U</sub> = E/V·β<sub>E</sub> + D/V·β<sub>D</sub> = (${f2(d.bE)} + ${f2(d.de)} × ${f2(d.bD)}) / (1 + ${f2(d.de)}) = ${fmtNum(d.bU, 4)}; r<sub>U</sub> = ${pp(d.rf, 1)} + ${fmtNum(d.bU, 4)} × ${pp(d.mrp, 1)} = ${pp(d.rU)}. Use the twin’s business risk, not the firm’s own beta.`) +
    p_(`β<sub>E′</sub> = β<sub>U</sub> + D′/E′ (β<sub>U</sub> − β<sub>D′</sub>) = ${fmtNum(d.bE2, 4)}, r<sub>E′</sub> = ${pp(d.rE2)}, r<sub>D′</sub> = ${pp(d.rD2)}. WACC = ${fmtNum(1 / (1 + d.de2), 4)} × ${pp(d.rE2)} + ${fmtNum(d.de2 / (1 + d.de2), 4)} × ${pp(d.rD2)} × (1 − ${P(d.tau, 0)}) = ${pp(d.wacc)}.`);
  return { ...Q('L4.beta', 4, html, parts), solution: sol };
}

