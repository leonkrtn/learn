// Firm Valuation problem sets: the extra questions of lectures 2, 3, 4, 6, 7 and 8 and the past exams 2021–2024,
// rebuilt question by question with new numbers on every call. Multiple-choice questions keep the exam format
// (five options A–E); cases keep their sub-questions as number entry. Each extra-question set also offers the
// lecture's other types in the same format.
import { C, N, P, Q, calc, chance, chooseParts, co, fmtNum, p_, pick, poss, rint, roundTo, rstep, shuffle, table, tn, tp, withCalc, type Item } from '@/lib/engine/gen-helpers';
import { NONE_ABOVE, mcText, shortAnswer } from '@/lib/engine/mc';
import { fmtSolution } from '@/lib/engine/grade';
import type { ConceptMc, Question } from '@/lib/engine/types';
import { caseAccounts, caseApv, caseGrowth } from './case';
import { BANK } from './concepts';
import * as G from './generators';
import * as G3 from './gen3';
import * as G4 from './gen4';
import * as G6 from './gen6';
import { EUR, JPY, USD, pv, sum } from './util';

const f2 = (x: number) => fmtNum(x, 2);
const pcs = (x: number, d = 2) => P(x, d);

/** A worked solution in words for the problem-set page: every part with its answer. */
function withSolution(q: Question): Question {
  if (q.solution) return q;
  const lines = q.parts.map((p, i) => {
    const lab = q.parts.length > 1 ? `(${String.fromCharCode(97 + i)}) ` : '';
    if (p.type === 'num') return `${lab}${fmtSolution(p)}`;
    return `${lab}${p.options[p.correct]}`;
  });
  return { ...q, solution: p_('<b>Answers:</b> ' + lines.join('; ') + '. Click an answer field for the worked calculation.') };
}
const retag = (key: string, g: () => Question) => () => withSolution({ ...g(), fam: key });

// =====================================================================
// Exam-style multiple choice: five numeric options A–E in descending order
// =====================================================================

function mc5(fam: string, topic: string, html: string, ans: number, wrongs: number[], fmt: (x: number) => string, steps: ReturnType<typeof calc>['steps']): Question {
  const far = (a: number, b: number) => Math.abs(a - b) > 0.04 * Math.max(Math.abs(a), Math.abs(b), 1e-9) && fmt(a) !== fmt(b);
  const pool: number[] = [];
  for (const w of shuffle(wrongs)) if (Number.isFinite(w) && far(w, ans) && pool.every(p => far(p, w)) && pool.length < 4) pool.push(w);
  for (let k = 1; pool.length < 4 && k < 80; k++) {
    const w = ans * (1 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * rstep(0.07, 0.13, 0.01));
    if (far(w, ans) && pool.every(p => far(p, w))) pool.push(w);
  }
  const opts = [ans, ...pool].sort((a, b) => b - a);
  const options = opts.map(fmt);
  const correct = opts.indexOf(ans);
  return withSolution({ ...Q(fam, topic, html, [{ type: 'mc', options, correct, key: 'ans', ans }]), calc: steps });
}
const fp = (x: number) => fmtNum(x * 100, 2) + '%';

// =====================================================================
// "Which of the following statements is TRUE?" with All / None of the above
// =====================================================================

const S = {
  betaT: [
    'All else equal, high operating leverage companies should have higher betas than low operating leverage companies.',
    'Firms with high CapEx needs and rigid cost structures should have higher unlevered betas.',
    'All else equal, cyclical companies should have higher betas than non-cyclical companies.',
    'The reinvestment ratio measures the percentage of after-tax operating profit reinvested in operating assets.',
    'Bottom-up betas are more precise than regression betas because averaging across firms reduces the standard error.',
  ],
  betaF: [
    'Regression analysis yields the unlevered beta of a company.',
    'If you regress the daily excess returns of a company on the daily excess returns of the market, you get the unlevered beta of the company.',
    'The higher the operating leverage, the lower the unlevered beta of a company.',
    'All else equal, cyclical companies should have lower betas than non-cyclical companies.',
    'In the process of firm valuation, your best option for a proxy of the risk-free rate is the short-term government bond yield.',
    'Increasing leverage lowers the beta of equity.',
  ],
  dcfT: [
    'When ROE is higher than the cost of equity, increasing the payout ratio will result in a drop in share price.',
    'The APV is easier to apply than the WACC method when the company keeps a fixed amount of debt.',
    'FCFF is discounted at the WACC and FCFE at the cost of equity.',
    'The terminal growth rate should not exceed the long-run growth rate of the economy.',
  ],
  dcfF: [
    'Increasing debt will always result in increased firm value.',
    'The APV is easier to apply, compared to the WACC methodology, when the company maintains a constant debt-to-equity ratio.',
    'The Dividend Discount Model and the Discounted Cash Flow model are theoretically equivalent and should yield the same value.',
    'The Dividend discount model and the Discounted Free Cash Flows to the Equity model are theoretically equivalent and will yield the same equity value.',
    'When ROE is lower than the cost of equity, increasing the retention ratio will raise the share price.',
    'An increase in operating working capital increases free cash flow to the firm.',
  ],
};

/** Three statements A–C plus "All of the above" and "None of the above"; never exactly two true ones. */
function allNone(fam: string, topic: string, T: string[], F: string[]): Question {
  const r = Math.random(), nT = r < 0.62 ? 1 : r < 0.8 ? 3 : 0;
  const st = shuffle([...shuffle(T).slice(0, nT).map(s => ({ s, ok: true })), ...shuffle(F).slice(0, 3 - nT).map(s => ({ s, ok: false }))]);
  const options = [...st.map(x => x.s), 'All of the above.', NONE_ABOVE + '.'];
  const correct = nT === 3 ? 3 : nT === 0 ? 4 : st.findIndex(x => x.ok);
  const sol = p_(st.map((x, i) => `${'ABC'[i]} is ${x.ok ? 'true' : 'false'}.`).join(' ') + ` So the answer is ${'ABCDE'[correct]}.`);
  return { ...Q(fam, topic, p_('Which of the following statements is TRUE?'), [{ type: 'mc', options, correct }]), solution: sol };
}

// =====================================================================
// Extra questions, lecture 2
// =====================================================================

export function X2_q1(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), roe = rstep(0.08, 0.14, 0.005), b0 = rstep(0.3, 0.6, 0.05), b1 = +(b0 + rstep(0.1, 0.3, 0.05)).toFixed(2), eps = rstep(2, 9, 0.25), ke0 = roe;
    if (b1 > 0.85) continue;
    const g0 = b0 * roe, price = roundTo(eps * (1 - b0) * (1 + g0) / (ke0 - g0), 0.01), ke = (eps * (1 - b0) * (1 + g0) + price * g0) / price;
    const hi = roe + rstep(0.01, 0.03, 0.005), lo = roe - rstep(0.02, 0.04, 0.005);
    const newP = (r: number) => eps * (1 + b0 * r) * (1 - b1) / (ke - b1 * r);
    if (ke - b1 * hi < 0.01 || lo < 0.03) continue;
    const body = p_(`${name} has a return on equity of ${pcs(roe, 1)}. It has just paid its annual dividend and announces that from next year it will raise its retention ratio from ${pcs(b0, 0)} to ${pcs(b1, 0)} to fund expansion. After this year’s dividend (retention ${pcs(b0, 0)}) and before the announcement, the share price was €${f2(price)}. The last reported EPS was €${f2(eps)}; the next dividend is due in one year. Markets are efficient.`);
    const parts = [
      N('What cost of equity is implied by the share price before the announcement?', ke * 100, 'pct', { key: 'ke' }),
      N('(a) What share price do you expect after the announcement?', newP(roe), 'eur', { key: 'pa' }),
      N(`(b) What is the share price if ROE is ${pcs(hi, 1)} instead (cost of equity unchanged)?`, newP(hi), 'eur', { key: 'pb' }),
      N(`(c) What is the share price if ROE is ${pcs(lo, 1)}?`, newP(lo), 'eur', { key: 'pc' }),
    ];
    const c = calc();
    c.r(`**Implied cost of equity:** $g_0 = ${tn(b0)} \\times ${tn(roe, 4)} = ${tn(g0 * 100)}\\%$; $D_1 = ${tn(eps)} \\times ${tn(1 - b0)} \\times (1 + ${tp(g0)}) = ${tn(eps * (1 - b0) * (1 + g0))}$; $k_e = \\frac{D_1}{P_0} + g_0 = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    const line = (r: number, key: string, lab: string) => c.r(`**${lab}:** next year’s EPS still grows with the old retention, $${tn(eps)} \\times (1 + ${tn(b0)} \\times ${tn(r, 4)}) = ${tn(eps * (1 + b0 * r))}$; dividend $\\times ${tn(1 - b1)} = ${tn(eps * (1 + b0 * r) * (1 - b1))}$; growth $${tn(b1)} \\times ${tn(r, 4)} = ${tn(b1 * r * 100)}\\%$; $P = \\frac{${tn(eps * (1 + b0 * r) * (1 - b1))}}{${tn(ke, 4)} - ${tn(b1 * r, 4)}} = ${tn(newP(r))}$ (€). ${r > ke + 1e-9 ? 'ROE above k_e: retention creates value.' : r < ke - 1e-9 ? 'ROE below k_e: retention destroys value.' : 'ROE equals k_e: the price does not change.'}`, key, newP(r));
    line(roe, 'pa', '(a) Same ROE'); line(hi, 'pb', '(b) Higher ROE'); line(lo, 'pc', '(c) Lower ROE');
    return withSolution(withCalc(Q('X2.q1', '2', body, parts), c.steps));
  }
  throw new Error('X2_q1');
}

// =====================================================================
// Extra questions, lecture 4
// =====================================================================

export function X4_q1(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(['Telecom', 'Networks', 'Communications']), sh = rstep(50, 300, 10), price = rstep(20, 300, 5), F = rstep(2, 20, 0.5) * 1000, cpn = rstep(0.04, 0.08, 0.0025), I = F * cpn, n = rint(4, 10);
    const t = pick([0.25, 0.3, 0.35]), rf = rstep(0.03, 0.06, 0.0025), rm = rf + rstep(0.04, 0.07, 0.0025), bu = rstep(0.6, 1.2, 0.05);
    const lo = rstep(2, 5, 0.5), hi = lo + 1, cov = rstep(lo + 0.1, hi - 0.1, 0.05), ebit = roundTo(I * cov, 10), rating = pick(['A-', 'BBB', 'BBB-', 'BB+']), spread = rstep(0.008, 0.03, 0.0025);
    if (ebit / I < lo || ebit / I >= hi) continue;
    const kd = rf + spread, mv = I * (1 - Math.pow(1 + kd, -n)) / kd + F / Math.pow(1 + kd, n), E = sh * price, wd = mv / (mv + E), de = mv / E;
    const bl = bu * (1 + (1 - t) * de), ke = rf + bl * (rm - rf), wacc = (1 - wd) * ke + wd * kd * (1 - t);
    const body = p_(`You are estimating the cost of capital of ${name}. It has ${fmtNum(sh)} million shares trading at $${f2(price)}. The book value of its debt, with an average maturity of ${n} years, is $${fmtNum(F)} million, and annual interest is $${fmtNum(I, 1)} million. The firm is not rated, but its operating income last year was $${fmtNum(ebit)} million; firms with an interest coverage ratio between ${fmtNum(lo, 1)} and ${fmtNum(hi, 1)} are rated ${rating}, with a default spread of ${pcs(spread)}. The tax rate is ${pcs(t, 0)}, the Treasury bond rate ${pcs(rf)}, the unlevered beta of other firms in the sector ${f2(bu)} (use β<sub>L</sub> = β<sub>U</sub>[1 + (1 − t)D/E]) and the expected market return ${pcs(rm)}.`);
    const parts: Item[] = [
      { part: N('What is the pre-tax cost of debt?', kd * 100, 'pct', { key: 'kd' }), w: 0.4 },
      { part: N('(a) What is the market value of the debt ($ million)?', mv, 'musd', { key: 'mv' }), must: true },
      { part: N('What is the levered beta?', bl, 'n', { key: 'bl' }), w: 0.5 },
      { part: N('What is the cost of equity?', ke * 100, 'pct', { key: 'ke' }), w: 0.5 },
      { part: N('(b) What is the cost of capital?', wacc * 100, 'pct', { key: 'wacc' }), must: true },
    ];
    const c = calc();
    c.r(`**Rating:** coverage $\\frac{${tn(ebit)}}{${tn(I)}} = ${tn(ebit / I)}$ → ${rating}; $k_d = ${tn(rf * 100)}\\% + ${tn(spread * 100)}\\% = ${tn(kd * 100)}\\%$.`, 'kd', kd * 100);
    c.r(`**Market value of debt:** $${tn(I)} \\times \\frac{1 - (1 + ${tp(kd)})^{-${n}}}{${tn(kd, 4)}} + \\frac{${tn(F, 0)}}{(1 + ${tp(kd)})^{${n}}} = ${tn(mv)}$ (\\$ million).`, 'mv', mv);
    c.r(`**Levered beta:** $E = ${tn(sh, 0)} \\times ${tn(price)} = ${tn(E)}$, $D/E = ${tn(de, 4)}$; $${tn(bu)} \\times [1 + ${tn(1 - t)} \\times ${tn(de, 4)}] = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times (${tn(rm * 100)}\\% - ${tn(rf * 100)}\\%) = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    c.r(`**Cost of capital:** $\\frac{D}{D + E} = ${tn(wd, 4)}$; $${tn(1 - wd, 4)} \\times ${tn(ke * 100)}\\% + ${tn(wd, 4)} \\times ${tn(kd * 100)}\\% \\times ${tn(1 - t)} = ${tn(wacc * 100)}\\%$.`, 'wacc', wacc * 100);
    return withSolution(withCalc(Q('X4.q1', '4', body, chooseParts(parts, 3, 5)), c.steps));
  }
  throw new Error('X4_q1');
}

export function X4_q3(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), sh = rstep(5, 50, 1), fcfe = rstep(10, 120, 1), g = rstep(0.02, 0.06, 0.005);
    const dec = rstep(0.8, 1.5, 0.1), blc = rstep(1.2, 1.8, 0.05), bd = rstep(0.3, 0.6, 0.02), de = rstep(0.2, 0.6, 0.05), t = pick([0.25, 0.3, 0.35]), rf = rstep(0.02, 0.04, 0.0025), rm = rf + rstep(0.06, 0.1, 0.0025);
    const fac = 1 + (1 - t) * dec, bu = (blc + bd * (1 - t) * dec) / fac, bl = bu * (1 + (1 - t) * de), ke = rf + bl * (rm - rf), wd = de / (1 + de), wacc = (1 - wd) * ke + wd * rf * (1 - t);
    if (ke - g < 0.03) continue;
    const price = fcfe / (ke - g) / sh;
    const body = p_(`${name} is a newly listed firm with ${fmtNum(sh)} million shares outstanding. You expect free cash flow to equity of £${fmtNum(fcfe)} million in the coming year, growing at ${pcs(g, 1)} per year. Other firms in the industry, with an average debt-to-equity ratio of ${f2(dec)}, have an average equity beta of ${f2(blc)} and a debt beta of ${f2(bd)}. ${name} keeps a stable debt-to-equity ratio of ${f2(de)} and its debt is risk-free. The tax rate is ${pcs(t, 0)}, the risk-free rate ${pcs(rf)} and the expected market return ${pcs(rm)}. Use β<sub>L</sub> = β<sub>U</sub>[1 + (1 − t)D/E] − β<sub>D</sub>(1 − t)D/E.`);
    const parts: Item[] = [
      { part: N('What is the unlevered beta of the industry?', bu, 'n', { key: 'bu' }), w: 0.5 },
      { part: N(`What is the equity beta of ${name}?`, bl, 'n', { key: 'bl' }), w: 0.5 },
      { part: N('What is the cost of equity?', ke * 100, 'pct', { key: 'ke' }), w: 0.6 },
      { part: N(`(a) What is ${poss(name)} WACC?`, wacc * 100, 'pct', { key: 'wacc' }), must: true },
      { part: N('(b) What is the share price (in £)?', price, 'n', { key: 'price' }), must: true },
    ];
    const c = calc();
    c.r(`**Unlever:** $${tn(blc)} = \\beta_U \\times ${tn(fac, 4)} - ${tn(bd)} \\times ${tn(1 - t)} \\times ${tn(dec)}$, so $\\beta_U = \\frac{${tn(blc + bd * (1 - t) * dec, 4)}}{${tn(fac, 4)}} = ${tn(bu, 4)}$.`, 'bu', bu);
    c.r(`**Relever (risk-free debt):** $${tn(bu, 4)} \\times [1 + ${tn(1 - t)} \\times ${tn(de)}] = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times ${tn((rm - rf) * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    c.r(`**WACC:** $\\frac{E}{V} = \\frac{1}{${tn(1 + de)}} = ${tn(1 - wd, 4)}$; $${tn(1 - wd, 4)} \\times ${tn(ke * 100)}\\% + ${tn(wd, 4)} \\times ${tn(rf * 100)}\\% \\times ${tn(1 - t)} = ${tn(wacc * 100)}\\%$.`, 'wacc', wacc * 100);
    c.r(`**Share price:** FCFE is discounted at the cost of equity: $\\frac{${tn(fcfe)}}{${tp(ke)} - ${tp(g)}} = ${tn(fcfe / (ke - g))}$; per share $\\frac{${tn(fcfe / (ke - g))}}{${tn(sh, 0)}} = ${tn(price)}$ (£).`, 'price', price);
    return withSolution(withCalc(Q('X4.q3', '4', body, chooseParts(parts, 3, 5)), c.steps));
  }
  throw new Error('X4_q3');
}

// =====================================================================
// Extra questions, lecture 6: ABV options (b) and (c)
// =====================================================================

export function X6_q2(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), ebit = rstep(100, 600, 10), g = rstep(0.03, 0.06, 0.005), t = pick([0.3, 0.35, 0.4]), w = rstep(0.08, 0.12, 0.005), rr = pick([0.25, 1 / 3, 0.4, 0.5]);
    if (w - g < 0.03) continue;
    const sh = rstep(100, 400, 10), cash = rstep(200, 800, 50), debt = rstep(300, 1200, 50);
    const fcff = ebit * (1 + g) * (1 - t) * (1 - rr), fv = fcff / (w - g), eq = fv + cash - debt;
    if (eq <= 0) continue;
    const nOpt = roundTo(sh * rstep(0.1, 0.3, 0.05), 5), ov = roundTo(eq / sh * rstep(0.2, 0.6, 0.05), 0.5), K = roundTo(eq / sh * rstep(0.4, 0.8, 0.05), 0.5);
    const a = eq / sh, b = (eq - nOpt * ov) / sh, cc = (eq + nOpt * K) / (sh + nOpt);
    const body = p_(`${name} has EBIT of $${fmtNum(ebit)} million, expected to grow at ${pcs(g, 1)} a year forever; the tax rate is ${pcs(t, 0)}. Its cost of capital is ${pcs(w, 1)}, its reinvestment rate ${pcs(rr, 2)} and it has ${fmtNum(sh)} million shares outstanding. It has $${fmtNum(cash)} million in cash and marketable securities and $${fmtNum(debt)} million of debt.`);
    const parts = [
      N('(a) What is the value of equity per share?', a, 'usd', { key: 'a' }),
      N(`(b) ${name} also has options outstanding on ${fmtNum(nOpt)} million shares, each valued at $${f2(ov)}. What is the value per share now?`, b, 'usd', { key: 'b' }),
      N(`(c) The average exercise price of these options is $${f2(K)}. What is the value per share with the treasury stock approach?`, cc, 'usd', { key: 'c' }),
    ];
    const c = calc();
    c.r(`**(a)** $FCFF_1 = ${tn(ebit)} \\times (1 + ${tp(g)}) \\times ${tn(1 - t)} \\times ${tn(1 - rr, 4)} = ${tn(fcff)}$; firm $\\frac{${tn(fcff)}}{${tn(w - g, 4)}} = ${tn(fv)}$; equity $${tn(fv)} + ${tn(cash)} - ${tn(debt)} = ${tn(eq)}$; per share $\\frac{${tn(eq)}}{${tn(sh, 0)}} = ${tn(a)}$.`, 'a', a);
    c.r(`**(b)** subtract the option value: $\\frac{${tn(eq)} - ${tn(nOpt, 0)} \\times ${tn(ov)}}{${tn(sh, 0)}} = ${tn(b)}$.`, 'b', b);
    c.r(`**(c)** treasury stock: $\\frac{${tn(eq)} + ${tn(nOpt, 0)} \\times ${tn(K)}}{${tn(sh, 0)} + ${tn(nOpt, 0)}} = ${tn(cc)}$.`, 'c', cc);
    return withSolution(withCalc(Q('X6.q2', '6', body, parts), c.steps));
  }
  throw new Error('X6_q2');
}

// =====================================================================
// Extra questions, lecture 7: concepts from the class and the extra slides
// =====================================================================

const X7_SHORT: ConceptMc[] = [
  { q: 'What kind of company would have a low P/E ratio but a high P/B ratio?', correct: ['One with a high ROE but a high cost of equity, or a high ROE with low growth'], distractors: ['One with a low ROE and a low cost of equity', 'One with negative earnings', 'One with high growth and low risk'] },
  { q: 'In valuation, which multiple is the most appropriate one to use?', correct: ['The one that gives a value closest to the intrinsic (fair) value'], distractors: ['The one that gives the lowest value (conservative)', 'The one that gives the highest value', 'The one that reproduces the current stock price'] },
  { q: 'True or false: for growth companies, an intrinsic valuation will always be lower than a relative valuation.', correct: ['False: intrinsic value can be higher or lower, depending on sentiment, the sector outlook and assumptions'], distractors: ['True: growth is always overpriced by the market', 'True: DCF ignores growth', 'False: intrinsic value is always higher for growth firms'] },
  { q: 'A stock trades at $28, its DCF value is $22 and its P/E-based value is $35. What is the right reading?', correct: ['It looks overvalued against fundamentals but undervalued against peers; the methods answer different questions'], distractors: ['Both methods say it is undervalued', 'The market price must be wrong because it is between the two', 'The DCF must be wrong because peers are priced higher'] },
];

// =====================================================================
// Extra question, lecture 8: a private firm (Barrista Espresso)
// =====================================================================

function barrista() {
  for (let att = 0; att < 3000; att++) {
    const rev = rstep(20, 120, 5), ebit = roundTo(rev * rstep(0.12, 0.25, 0.005), 0.05), sal = roundTo(ebit * rstep(0.05, 0.15, 0.01), 0.05), t = pick([0.3, 0.35, 0.36, 0.4]);
    const owc = rstep(0.05, 0.15, 0.01), capex = roundTo(rev * rstep(0.05, 0.12, 0.005), 0.1), dep = roundTo(capex * rstep(0.2, 0.5, 0.05), 0.1);
    const g1 = rstep(0.15, 0.35, 0.05), g2 = rstep(0.03, 0.06, 0.005), n = 5;
    const bc = rstep(1, 1.6, 0.0001), dec = rstep(0.08, 0.3, 0.0005), rho = rstep(0.4, 0.7, 0.05), wd = rstep(0.08, 0.2, 0.01), kd = rstep(0.06, 0.1, 0.0025), rf = rstep(0.03, 0.06, 0.0025), mrp = rstep(0.045, 0.06, 0.0025);
    const de = wd / (1 - wd), bu = bc / (1 + dec), tbu = bu / rho, bl = tbu * (1 + de), ke = rf + bl * mrp, wacc = ke * (1 - wd) + wd * kd * (1 - t);
    const blM = bu * (1 + de), keM = rf + blM * mrp, waccM = keM * (1 - wd) + wd * kd * (1 - t);
    const f1 = (ebit - sal) * (1 + g1) * (1 - t) - (capex - dep) * (1 + g1) - owc * rev * g1;
    const val = (w: number) => {
      const pvH = f1 * (1 - Math.pow((1 + g1) / (1 + w), n)) / (w - g1), pvT = f1 * Math.pow(1 + g1, n - 1) * (1 + g2) / (w - g2) / Math.pow(1 + w, n);
      return { pvH, pvT, fv: pvH + pvT };
    };
    if (f1 <= 0 || wacc - g2 < 0.04 || waccM - g2 < 0.03 || Math.abs(wacc - g1) < 0.01 || Math.abs(waccM - g1) < 0.01) continue;
    return { rev, ebit, sal, t, owc, capex, dep, g1, g2, n, bc, dec, rho, wd, kd, rf, mrp, de, bu, tbu, bl, ke, wacc, blM, keM, waccM, f1, V: val(wacc), VM: val(waccM) };
  }
  throw new Error('barrista');
}

function barristaText(d: ReturnType<typeof barrista>, name: string) {
  return p_(`The owner of a public company has asked you to value ${name}, a chain of espresso bars. It had EBIT of $${f2(d.ebit)} million in the most recent year on revenues of $${fmtNum(d.rev)} million. The founders have never paid themselves a salary, which would have amounted to $${f2(d.sal)} million based on comparable companies. The tax rate is ${pcs(d.t, 0)} for all firms. Operating working capital is ${pcs(d.owc, 0)} of revenues. Capital expenditure last year was $${f2(d.capex)} million and depreciation only $${f2(d.dep)} million.`) +
    p_(`Earnings, revenues and net capital expenditure are expected to grow at ${pcs(d.g1, 0)} per year for five years and ${pcs(d.g2, 1)} thereafter, forever. Comparable listed firms have an average beta of ${fmtNum(d.bc, 4)}, an average debt-to-equity ratio of ${pcs(d.dec, 2)} and an average correlation with the market of ${f2(d.rho)}. ${name} will keep a debt-to-value ratio of ${pcs(d.wd, 0)} at a cost of debt of ${pcs(d.kd)}. The risk-free rate is ${pcs(d.rf)} and the market risk premium ${pcs(d.mrp)}. Ignore taxes when unlevering and relevering betas: β<sub>L</sub> = β<sub>U</sub>(1 + D/E).`);
}

export function X8_q1(): Question {
  const d = barrista(), name = co(['Espresso', 'Coffee', 'Roasters']);
  const items: Item[] = [
    { part: N('What is the FCFF in year 1 ($ million)?', d.f1, 'musd', { key: 'f1' }), w: 0.7 },
    { part: N('What is the total unlevered beta for an undiversified owner?', d.tbu, 'n', { key: 'tbu' }), w: 0.5 },
    { part: N('What is the total levered beta?', d.bl, 'n', { key: 'bl' }), w: 0.5 },
    { part: N('What is the cost of capital?', d.wacc * 100, 'pct', { key: 'wacc' }), w: 0.7 },
    { part: N('What is the present value of the FCFF in the high-growth period?', d.V.pvH, 'musd', { key: 'pvH' }), w: 0.4 },
    { part: N('What is the present value of the terminal value?', d.V.pvT, 'musd', { key: 'pvT' }), w: 0.4 },
    { part: N('(a) What is the value of the firm?', d.V.fv, 'musd', { key: 'fv' }), must: true },
    { part: N('(b) What is the value of the equity?', d.V.fv * (1 - d.wd), 'musd', { key: 'eq' }), must: true },
  ];
  const c = calc();
  c.r(`**FCFF year 1:** EBIT after the salary $${tn(d.ebit)} - ${tn(d.sal)} = ${tn(d.ebit - d.sal)}$; $${tn(d.ebit - d.sal)} \\times (1 + ${tp(d.g1)}) \\times (1 - ${tn(d.t)}) - (${tn(d.capex)} - ${tn(d.dep)}) \\times (1 + ${tp(d.g1)}) - ${tn(d.owc)} \\times ${tn(d.rev)} \\times ${tn(d.g1)} = ${tn(d.f1)}$ (\\$ million).`, 'f1', d.f1);
  c.r(`**Total unlevered beta:** $\\frac{${tn(d.bc, 4)} / (1 + ${tn(d.dec, 4)})}{${tn(d.rho)}} = \\frac{${tn(d.bu, 4)}}{${tn(d.rho)}} = ${tn(d.tbu, 4)}$.`, 'tbu', d.tbu);
  c.r(`**Total levered beta:** $D/E = \\frac{${tn(d.wd)}}{${tn(1 - d.wd)}} = ${tn(d.de, 4)}$; $${tn(d.tbu, 4)} \\times (1 + ${tn(d.de, 4)}) = ${tn(d.bl, 4)}$.`, 'bl', d.bl);
  c.r(`**Cost of capital:** $k_e = ${tn(d.rf * 100)}\\% + ${tn(d.bl, 4)} \\times ${tn(d.mrp * 100)}\\% = ${tn(d.ke * 100)}\\%$; $WACC = ${tn(d.ke * 100)}\\% \\times ${tn(1 - d.wd)} + ${tn(d.wd)} \\times ${tn(d.kd * 100)}\\% \\times ${tn(1 - d.t)} = ${tn(d.wacc * 100)}\\%$.`, 'wacc', d.wacc * 100);
  c.r(`**High-growth period** (growing annuity, 5 years): $${tn(d.f1)} \\times \\frac{1 - ((1 + ${tp(d.g1)}) / (1 + ${tp(d.wacc)}))^5}{${tn(d.wacc, 4)} - ${tn(d.g1)}} = ${tn(d.V.pvH)}$.`, 'pvH', d.V.pvH);
  c.r(`**Terminal value:** $FCFF_6 = ${tn(d.f1)} \\times (1 + ${tp(d.g1)})^4 \\times (1 + ${tp(d.g2)}) = ${tn(d.f1 * Math.pow(1 + d.g1, 4) * (1 + d.g2))}$; $\\frac{${tn(d.f1 * Math.pow(1 + d.g1, 4) * (1 + d.g2))} / (${tp(d.wacc)} - ${tp(d.g2)})}{(1 + ${tp(d.wacc)})^5} = ${tn(d.V.pvT)}$.`, 'pvT', d.V.pvT);
  c.r(`**Firm value:** $${tn(d.V.pvH)} + ${tn(d.V.pvT)} = ${tn(d.V.fv)}$ (\\$ million).`, 'fv', d.V.fv);
  c.r(`**Equity:** debt is ${tn(d.wd * 100, 0)}% of value: $${tn(d.V.fv)} \\times ${tn(1 - d.wd)} = ${tn(d.V.fv * (1 - d.wd))}$ (\\$ million).`, 'eq', d.V.fv * (1 - d.wd));
  return withSolution(withCalc(Q('X8.q1', '4', barristaText(d, name), chooseParts(items, 4, 6)), c.steps));
}

export function X8_q2(): Question {
  const d = barrista(), name = co(['Espresso', 'Coffee', 'Roasters']);
  const why = ['IPO investors are diversified, so only market risk counts and the beta is not divided by the correlation', 'An IPO raises the tax rate', 'An IPO removes the need for the salary adjustment', 'Diversified investors require a higher return, so the beta rises'];
  const parts = [
    N('(c) If you value the firm for an IPO instead, what levered beta do you use?', d.blM, 'n', { key: 'blM' }),
    N('What is the cost of capital for the IPO valuation?', d.waccM * 100, 'pct', { key: 'waccM' }),
    N('What is the value of the firm for the IPO?', d.VM.fv, 'musd', { key: 'fvM' }),
    C('Why does the value change?', why, 0, 'why'),
  ];
  const c = calc();
  c.r(`**Market beta:** $\\frac{${tn(d.bc, 4)}}{1 + ${tn(d.dec, 4)}} = ${tn(d.bu, 4)}$, relevered $${tn(d.bu, 4)} \\times (1 + ${tn(d.de, 4)}) = ${tn(d.blM, 4)}$, without the correlation adjustment.`, 'blM', d.blM);
  c.r(`**Cost of capital:** $k_e = ${tn(d.rf * 100)}\\% + ${tn(d.blM, 4)} \\times ${tn(d.mrp * 100)}\\% = ${tn(d.keM * 100)}\\%$; $WACC = ${tn(d.keM * 100)}\\% \\times ${tn(1 - d.wd)} + ${tn(d.wd)} \\times ${tn(d.kd * 100)}\\% \\times ${tn(1 - d.t)} = ${tn(d.waccM * 100)}\\%$.`, 'waccM', d.waccM * 100);
  c.r(`**Firm value:** FCFF in year 1 $= ${tn(d.f1)}$; high growth $${tn(d.VM.pvH)}$ + terminal $${tn(d.VM.pvT)}$ $= ${tn(d.VM.fv)}$ (\\$ million), higher than for the private buyer.`, 'fvM', d.VM.fv);
  c.r(`**Why:** the total beta charges the undiversified owner for firm-specific risk; IPO investors hold diversified portfolios and price only market risk.`, 'why');
  return withSolution(withCalc(Q('X8.q2', '4', barristaText(d, name), parts), c.steps));
}

// =====================================================================
// Exam 2021/22
// =====================================================================

export function E21_q1(): Question {
  const name = co(['Retail', 'Apparel', 'Stores']), ebit = rstep(80, 400, 5), t = pick([0.25, 0.3, 0.35]), dep = roundTo(ebit * rstep(0.3, 0.6, 0.01), 1), capex = roundTo(dep * rstep(1.2, 2, 0.05), 1), dowc = roundTo(ebit * rstep(0.02, 0.12, 0.01), 1);
  const bve = roundTo(ebit * rstep(4, 8, 0.5), 10), bvd = roundTo(ebit * rstep(2, 5, 0.5), 10), cash = roundTo(ebit * rstep(0.5, 2, 0.1), 10);
  const nopat = ebit * (1 - t), rir = (capex - dep + dowc) / nopat, roc = nopat / (bve + bvd - cash), g = rir * roc;
  const html = p_(`${name} earned $${fmtNum(ebit)} million in EBIT. It reported CapEx of $${fmtNum(capex)} million, depreciation of $${fmtNum(dep)} million and an increase in operating working capital of $${fmtNum(dowc)} million. At the beginning of the year its book value of equity was $${fmtNum(bve)} million, its book value of debt $${fmtNum(bvd)} million, and it held $${fmtNum(cash)} million in excess cash. The marginal tax rate is ${pcs(t, 0)}. Assuming the return on capital and reinvestment ratio remain unchanged, the growth in EBIT next year is closest to:`);
  const c = calc();
  c.s(`**Reinvestment ratio:** $\\frac{${tn(capex)} - ${tn(dep)} + ${tn(dowc)}}{${tn(ebit)} \\times (1 - ${tn(t)})} = \\frac{${tn(capex - dep + dowc)}}{${tn(nopat)}} = ${tn(rir * 100)}\\%$.`);
  c.s(`**Return on capital:** $\\frac{${tn(nopat)}}{${tn(bve)} + ${tn(bvd)} - ${tn(cash)}} = ${tn(roc * 100)}\\%$.`);
  c.r(`**Growth:** $${tn(rir, 4)} \\times ${tn(roc, 4)} = ${tn(g * 100)}\\%$.`, 'ans', g);
  return mc5('E21.q1', '3', html, g, [nopat / (bve + bvd) * rir, (capex + dowc) / nopat * roc, rir * ebit / (bve + bvd - cash), (capex - dep) / nopat * roc], fp, c.steps);
}

export function E21_q2(): Question {
  const P0 = rstep(1500, 6000, 100), y = rstep(0.015, 0.04, 0.0025), g = rstep(0.02, 0.06, 0.005), rf = rstep(0.01, 0.04, 0.0025);
  const r = y * (1 + g) + g, erp = r - rf;
  const html = p_(`The S&P 500 is at ${fmtNum(P0, 0)}. The last dividend on the stocks in the index was ${pcs(y, 2)} of the index. If dividends are expected to grow at ${pcs(g, 1)} in perpetuity and the risk-free rate is ${pcs(rf, 1)}, the implied equity risk premium is closest to:`);
  const c = calc();
  c.s(`**Next dividend:** $${tn(P0, 0)} \\times ${tn(y, 4)} \\times (1 + ${tp(g)}) = ${tn(P0 * y * (1 + g))}$.`);
  c.s(`**Expected return:** $\\frac{${tn(P0 * y * (1 + g))}}{${tn(P0, 0)}} + ${tn(g, 4)} = ${tn(r * 100)}\\%$.`);
  c.r(`**Implied premium:** $${tn(r * 100)}\\% - ${tn(rf * 100)}\\% = ${tn(erp * 100)}\\%$.`, 'ans', erp);
  return mc5('E21.q2', '4', html, erp, [r, y + g - rf, y * (1 + g) - rf, erp + 0.01, r - rf + g], fp, c.steps);
}

export function E21_q4(): Question {
  const name = co(), D = rstep(2, 20, 0.5), E = roundTo(D * rstep(1.2, 3, 0.1), 0.5), bu = rstep(0.8, 1.4, 0.005), dec = rstep(0.4, 1, 0.1), t = pick([0.3, 0.35, 0.4]);
  const bl = bu * (1 + (1 - t) * D / E);
  const html = p_(`You have been asked to value ${name}, a medium-size advertising company. It has $${fmtNum(D, 1)} million of risk-free debt and plans to keep the same amount of debt for the foreseeable future. Its market value of equity is $${fmtNum(E, 1)} million. The average unlevered beta of comparable companies is ${fmtNum(bu, 3)} and their average debt-to-equity ratio is ${f2(dec)}. The marginal tax rate is ${pcs(t, 0)}. The beta of equity of ${name} is closest to:`);
  const c = calc();
  c.r(`**Fixed debt, so taxes enter:** $\\beta_L = ${tn(bu, 4)} \\times [1 + (1 - ${tn(t)}) \\times \\frac{${tn(D)}}{${tn(E)}}] = ${tn(bl, 4)}$. The peers’ D/E is irrelevant: their beta is already unlevered.`, 'ans', bl);
  return mc5('E21.q4', '4', html, bl, [bu * (1 + D / E), bu * (1 + (1 - t) * dec), bu / (1 + (1 - t) * D / E), bu], f2, c.steps);
}

const E21_IIC: ConceptMc[] = [
  { q: 'EcoBuild operated in an emerging market instead of the euro area. Which adjustments would you make to its valuation?', correct: ['Use a risk-free rate in the currency of the cash flows net of the government default spread, add a country risk premium to the equity premium, and decide how much of it the firm’s beta (or λ) should carry'], distractors: ['Lower the terminal growth rate and keep all euro inputs', 'Use the local government bond yield as the risk-free rate without adjustment', 'Value the firm only with multiples of European peers'] },
  { q: 'Which risk-free rate do you use for an emerging-market firm whose cash flows are in local currency?', correct: ['The local-currency government bond yield minus the country’s default spread'], distractors: ['The US Treasury yield', 'The local-currency government bond yield as it is', 'The euro rate plus the local inflation rate, without a default adjustment'] },
];
const E21_III: ConceptMc[] = [
  { q: 'Which factors would you take into account for forecasting short-term growth rates?', correct: ['Industry characteristics and life-cycle stage, strategic position (e.g. five forces), macro and technological developments, and the firm’s business model and fundamentals (margins, reinvestment, return on capital)'], distractors: ['Only the arithmetic average of the last five years of growth', 'Only the current share price and dividend yield', 'Only the long-run growth rate of the economy'] },
  { q: 'Which factors anchor the long-term growth rate?', correct: ['The long-term reinvestment ratio and return on invested capital, the industry average, and expected GDP growth (often proxied by the risk-free rate)'], distractors: ['The highest historical growth rate', 'Analysts’ forecasts for next year', 'The firm’s current ROE, however high'] },
  { q: 'Why would you combine historical growth, analyst and management forecasts, and fundamentals when forecasting growth?', correct: ['Each source has weaknesses (volatility and mean reversion, horizon and bias, accounting distortions), so they cross-check each other'], distractors: ['Because markets are efficient, any one source gives the same answer', 'Because fundamentals cannot be measured', 'Because analysts forecast the terminal growth rate directly'] },
];

/** Exam 2021 Part II (a): constant debt for four years, then a target debt-to-equity ratio. */
function e21Data() {
  for (let att = 0; att < 3000; att++) {
    const rev0 = rstep(5, 25, 1) * 1000, ebit0 = roundTo(rev0 * rstep(0.07, 0.13, 0.001), 10), ncap0 = roundTo(ebit0 * rstep(0.12, 0.25, 0.01), 10);
    const inv = rstep(0.05, 0.1, 0.005), ar = rstep(0.12, 0.22, 0.005), ap = rstep(0.1, 0.2, 0.005), owcp = inv + ar - ap;
    if (owcp < 0.02) continue;
    const g1 = rstep(0.04, 0.08, 0.005), g2 = rstep(0.015, 0.03, 0.005), t = pick([0.25, 0.25, 0.3]);
    const rf = rstep(0.015, 0.035, 0.005), mrp = rstep(0.06, 0.1, 0.005), bu = rstep(0.9, 1.3, 0.05), spread = rstep(0.01, 0.025, 0.0025), kd = rf + spread, de = pick([0.25, 0.33, 0.4, 0.5]);
    const debt = roundTo(ebit0 * rstep(1.5, 2.5, 0.1), 50), cash = roundTo(ebit0 * rstep(0.5, 1.2, 0.1), 50), bvH = roundTo(ebit0 * rstep(0.05, 0.12, 0.01), 10), bvMI = roundTo(ebit0 * rstep(0.03, 0.08, 0.01), 10), pb = rstep(1.8, 3, 0.1), pe = rint(8, 12);
    const rho = rf + bu * mrp, bl = bu * (1 + de), ke = rf + bl * mrp, wd = de / (1 + de), wacc = (1 - wd) * ke + wd * kd * (1 - t);
    if (wacc - g2 < 0.05) continue;
    const yrs = [1, 2, 3, 4];
    const ebit = [ebit0, ...yrs.map(k => ebit0 * Math.pow(1 + g1, k))], ncap = [ncap0, ...yrs.map(k => ncap0 * Math.pow(1 + g1, k))];
    const dowc = [0, ...yrs.map(k => g1 * rev0 * owcp * Math.pow(1 + g1, k - 1))];
    const fcff = [0, ...yrs.map(k => ebit[k] * (1 - t) - ncap[k] - dowc[k])], f5 = (ebit[4] * (1 - t) - ncap[4] - dowc[4]) * (1 + g2);
    const pvF = sum(yrs.map(k => pv(fcff[k], rho, k))), ts = debt * kd * t, pvTs = sum(yrs.map(k => pv(ts, kd, k))), pvTv = f5 / (wacc - g2) / Math.pow(1 + wacc, 4);
    const hold = bvH * pb, mi = bvMI * pb, firm = pvF + pvTs + pvTv + cash + hold - mi, eq = firm - debt;
    const ni1 = (ebit[1] - kd * debt) * (1 - t);
    return { rev0, ebit0, ncap0, inv, ar, ap, owcp, g1, g2, t, rf, mrp, bu, spread, kd, de, debt, cash, bvH, bvMI, pb, pe, rho, bl, ke, wd, wacc, ebit, ncap, dowc, fcff, f5, pvF, ts, pvTs, pvTv, hold, mi, firm, eq, ni1 };
  }
  throw new Error('e21');
}

function e21Text(d: ReturnType<typeof e21Data>, name: string) {
  return p_(`${name} is a French construction company. Last year it had revenue of €${fmtNum(d.rev0)} million, EBIT of €${fmtNum(d.ebit0)} million and net CapEx of €${fmtNum(d.ncap0)} million; its inventory, trade receivables and trade payables were ${pcs(d.inv, 1)}, ${pcs(d.ar, 1)} and ${pcs(d.ap, 1)} of revenue. EBIT, net CapEx and the change in operating working capital grow at ${pcs(d.g1, 1)} for the next 4 years and at a constant ${pcs(d.g2, 1)} after that; the first change in working capital is ${pcs(d.g1, 1)} of last year’s OWC.`) +
    p_(`${name} holds €${fmtNum(d.cash)} million in excess cash. It owns 25% of ${co()}, reported as a minority holding with a book value of €${fmtNum(d.bvH)} million, and 90% of ${co()}, which it fully consolidates; the book value of minority interests is €${fmtNum(d.bvMI)} million. The price-to-book multiple of the industry is ${fmtNum(d.pb, 1)}x.`) +
    p_(`${name} has €${fmtNum(d.debt)} million of debt and will keep this amount constant for the next 4 years; from year 5 onwards it moves to a constant debt-to-equity ratio of ${pcs(d.de, 0)}. Its rating corresponds to a spread of ${pcs(d.spread, 1)}, forever. The beta of an all-equity firm with similar operations is ${f2(d.bu)}; use β<sub>L</sub> = β<sub>U</sub>(1 + D/E). The risk-free rate is ${pcs(d.rf, 1)}, the market premium ${pcs(d.mrp, 1)} and the marginal tax rate ${pcs(d.t, 0)}.`) +
    p_('Value years 1–4 with the APV logic (FCFF at the unlevered cost of capital, tax shields at the cost of debt) and the terminal value at the WACC of the target structure, discounted with that WACC.');
}

export function E21_IIa(): Question {
  const d = e21Data(), name = co(['Construction', 'Building', 'Infrastructure']);
  const items: Item[] = [
    { part: N('What is the change in operating working capital in year 1 (€ million)?', d.dowc[1], 'm', { key: 'dowc1' }), w: 0.4 },
    { part: N('What is the FCFF in year 1?', d.fcff[1], 'm', { key: 'f1' }), w: 0.5 },
    { part: N('What is the PV of the FCFF in years 1–4 at the unlevered cost of capital?', d.pvF, 'm', { key: 'pvF' }), w: 0.6 },
    { part: N('What is the PV of the interest tax shields in years 1–4?', d.pvTs, 'm', { key: 'pvTs' }), w: 0.6 },
    { part: N('What is the WACC from year 5 onwards?', d.wacc * 100, 'pct', { key: 'wacc' }), w: 0.6 },
    { part: N('What is the PV of the terminal value?', d.pvTv, 'm', { key: 'pvTv' }), w: 0.5 },
    { part: N('What is the value of the firm (including cash and holdings, net of minority interests)?', d.firm, 'm', { key: 'firm' }), must: true },
    { part: N('What is the value of equity?', d.eq, 'm', { key: 'eq' }), must: true },
  ];
  const c = calc();
  c.r(`**ΔOWC year 1:** OWC last year $${tn(d.rev0)} \\times ${tn(d.owcp, 4)} = ${tn(d.rev0 * d.owcp)}$; $\\Delta OWC_1 = ${tn(d.g1)} \\times ${tn(d.rev0 * d.owcp)} = ${tn(d.dowc[1])}$.`, 'dowc1', d.dowc[1]);
  [1, 2, 3, 4].forEach(k => { const md = `**Year ${k}:** $${tn(d.ebit[k])} \\times ${tn(1 - d.t)} - ${tn(d.ncap[k])} - ${tn(d.dowc[k])} = ${tn(d.fcff[k])}$.`; if (k === 1) c.r(md, 'f1', d.fcff[1]); else c.s(md); });
  c.r(`**Unlevered cost of capital:** $\\rho = ${tn(d.rf * 100)}\\% + ${tn(d.bu)} \\times ${tn(d.mrp * 100)}\\% = ${tn(d.rho * 100)}\\%$; PV of years 1–4 $= ${[1, 2, 3, 4].map(k => tn(pv(d.fcff[k], d.rho, k))).join(' + ')} = ${tn(d.pvF)}$.`, 'pvF', d.pvF);
  c.r(`**Tax shields:** $k_d = ${tn(d.kd * 100)}\\%$, interest $${tn(d.debt)} \\times ${tn(d.kd, 4)} = ${tn(d.debt * d.kd)}$, shield $\\times ${tn(d.t)} = ${tn(d.ts)}$ a year; PV at $k_d$ over 4 years $= ${tn(d.pvTs)}$.`, 'pvTs', d.pvTs);
  c.r(`**WACC from year 5:** $\\beta_L = ${tn(d.bu)} \\times ${tn(1 + d.de)} = ${tn(d.bl, 4)}$, $k_e = ${tn(d.ke * 100)}\\%$, $\\frac{E}{V} = ${tn(1 - d.wd, 4)}$; $WACC = ${tn(1 - d.wd, 4)} \\times ${tn(d.ke * 100)}\\% + ${tn(d.wd, 4)} \\times ${tn(d.kd * 100)}\\% \\times ${tn(1 - d.t)} = ${tn(d.wacc * 100)}\\%$.`, 'wacc', d.wacc * 100);
  c.r(`**Terminal value:** $FCFF_5 = ${tn(d.f5)}$; $\\frac{${tn(d.f5)} / (${tp(d.wacc)} - ${tp(d.g2)})}{(1 + ${tp(d.wacc)})^4} = ${tn(d.pvTv)}$.`, 'pvTv', d.pvTv);
  c.r(`**Firm:** $${tn(d.pvF)} + ${tn(d.pvTs)} + ${tn(d.pvTv)} + ${tn(d.cash)} + ${tn(d.bvH)} \\times ${tn(d.pb)} - ${tn(d.bvMI)} \\times ${tn(d.pb)} = ${tn(d.firm)}$ (€ million).`, 'firm', d.firm);
  c.r(`**Equity:** $${tn(d.firm)} - ${tn(d.debt)} = ${tn(d.eq)}$ (€ million).`, 'eq', d.eq);
  return withSolution(withCalc(Q('E21.IIa', '2', e21Text(d, name), chooseParts(items, 4, 6)), c.steps));
}

export function E21_IIb(): Question {
  const d = e21Data(), name = co(['Construction', 'Building']);
  const pe = d.pe, items = [
    N('What is EBIT next year (€ million)?', d.ebit[1], 'm', { key: 'ebit1' }),
    N('What are next year’s earnings?', d.ni1, 'm', { key: 'ni1' }),
    N(`What is the value of equity at an industry forward P/E of ${pe}x?`, d.ni1 * pe, 'm', { key: 'eq' }),
  ];
  const html = p_(`${name} had EBIT of €${fmtNum(d.ebit0)} million last year; EBIT grows at ${pcs(d.g1, 1)} next year. It has €${fmtNum(d.debt)} million of debt at a cost of ${pcs(d.kd)}, and the tax rate is ${pcs(d.t, 0)}. The price-to-earnings multiple of the industry, based on one-year forward earnings, is ${pe}x. Ignore any holdings in other companies.`);
  const c = calc();
  c.r(`**EBIT:** $${tn(d.ebit0)} \\times (1 + ${tp(d.g1)}) = ${tn(d.ebit[1])}$.`, 'ebit1', d.ebit[1]);
  c.r(`**Earnings:** $(${tn(d.ebit[1])} - ${tn(d.debt)} \\times ${tn(d.kd, 4)}) \\times (1 - ${tn(d.t)}) = ${tn(d.ni1)}$.`, 'ni1', d.ni1);
  c.r(`**Equity:** $${pe} \\times ${tn(d.ni1)} = ${tn(d.ni1 * pe)}$ (€ million).`, 'eq', d.ni1 * pe);
  return withSolution(withCalc(Q('E21.IIb', '7', html, items), c.steps));
}

// =====================================================================
// Exam 2022/23
// =====================================================================

export function privateBetaMc(fam: string): Question {
  const name = co(), D = rstep(1, 8, 0.5), bve = rstep(3, 12, 0.5), bu = rstep(0.6, 1.3, 0.05), mb = rstep(1.5, 3.5, 0.5), rho = rstep(0.4, 0.75, 0.05);
  const de = D / (bve * mb), bl = bu / rho * (1 + de);
  const html = p_(`You have been asked to value ${name}, a medium-size private company, for acquisition by another private investor. The firm has $${fmtNum(D, 1)} million of debt outstanding and a book value of equity of $${fmtNum(bve, 1)} million. The average equity unlevered beta of comparable listed companies is ${f2(bu)}. The market-to-book value of equity for the comparable firms is ${fmtNum(mb, 1)}x. There are no taxes and the correlation of ${poss(name)} industry to market returns is ${f2(rho)}. The beta of equity of ${name} is closest to:`);
  const c = calc();
  c.s(`**Market value of equity:** $${tn(bve)} \\times ${tn(mb)} = ${tn(bve * mb)}$, so $D/E = ${tn(de, 4)}$.`);
  c.r(`**Total beta:** $\\frac{${tn(bu)}}{${tn(rho)}} \\times (1 + ${tn(de, 4)}) = ${tn(bl, 4)}$.`, 'ans', bl);
  return mc5(fam, '4', html, bl, [bu / rho * (1 + D / bve), bu * (1 + de), bu / rho, bu * (1 + D / bve), bu / rho / rho * (1 + de)], f2, c.steps);
}

export function E22_q2(): Question {
  const name = co(), roe = rstep(0.06, 0.12, 0.005), ke = roe + rstep(0.01, 0.04, 0.005), eps = rstep(3, 10, 0.5), p0 = rstep(0.3, 0.6, 0.05), p1 = +(p0 - rstep(0.1, 0.25, 0.05)).toFixed(2);
  const pr = eps * (1 + roe * (1 - p0)) * p1 / (ke - roe * (1 - p1));
  const html = p_(`${name} has a ROE of ${pcs(roe, 0)} and a cost of equity of ${pcs(ke, 0)}. The company has just paid its annual dividend but announced that from next year it will decrease its payout ratio from the expected ${pcs(p0, 0)} to ${pcs(p1, 0)} to fund further expansion. The last reported EPS was €${f2(eps)}. The next dividend is due one year from now. Assuming efficient markets, the share price after the announcement would be:`);
  const c = calc();
  c.s(`**Next year’s EPS** (old retention ${tn(1 - p0)}): $${tn(eps)} \\times (1 + ${tn(roe, 4)} \\times ${tn(1 - p0)}) = ${tn(eps * (1 + roe * (1 - p0)))}$; dividend $\\times ${tn(p1)} = ${tn(eps * (1 + roe * (1 - p0)) * p1)}$.`);
  c.r(`**Price:** growth $${tn(roe, 4)} \\times ${tn(1 - p1)} = ${tn(roe * (1 - p1) * 100)}\\%$; $\\frac{${tn(eps * (1 + roe * (1 - p0)) * p1)}}{${tn(ke, 4)} - ${tn(roe * (1 - p1), 4)}} = ${tn(pr)}$ (€). ROE is below $k_e$, so retaining more lowers the price.`, 'ans', pr);
  const eur = (x: number) => '€' + f2(x);
  return mc5('E22.q2', '2', html, pr, [eps * p0 * (1 + roe * (1 - p0)) / (ke - roe * (1 - p0)), eps * p1 / (ke - roe * (1 - p1)), eps * (1 + roe * (1 - p1)) * p1 / (ke - roe * (1 - p1)), eps / ke], eur, c.steps);
}

export function E22_q4(): Question {
  const ccy = pick([['Indonesian', 'rupiah'], ['Brazilian', 'real'], ['Turkish', 'lira'], ['Indian', 'rupee'], ['Mexican', 'peso']]), local = rstep(0.07, 0.16, 0.005), sp = rstep(0.01, 0.05, 0.005), base = rstep(0.01, 0.04, 0.005), fx = base + sp, rf = local - sp;
  const bench = pick([['euro', 'German'], ['dollar', 'US']]);
  const html = p_(`You have been asked to estimate the risk-free rate in ${ccy[1]}. The ${ccy[0]} government has ${ccy[1]}-denominated bonds outstanding with a yield of ${pcs(local, 1)}. It has also issued a ${bench[0]}-denominated bond with a yield of ${pcs(fx, 1)}. The yield on a ${bench[0]}-denominated bond issued by the ${bench[1]} government is ${pcs(base, 1)}. Based on the above, the ${ccy[1]} risk-free rate is closest to:`);
  const c = calc();
  c.r(`**Default spread:** $${tn(fx * 100)}\\% - ${tn(base * 100)}\\% = ${tn(sp * 100)}\\%$; **risk-free rate** $= ${tn(local * 100)}\\% - ${tn(sp * 100)}\\% = ${tn(rf * 100)}\\%$.`, 'ans', rf);
  return mc5('E22.q4', '5', html, rf, [local, fx, sp, local - fx, base], fp, c.steps);
}

const VALID = ['Price to Equity Book Value', 'Price to Free Cash Flows to Equity', 'Enterprise Value to EBIT', 'Enterprise Value to Free Cash Flows to the Firm', 'Enterprise Value to Sales', 'Price to Earnings', 'Enterprise Value to EBITDA', 'Enterprise Value to Invested Capital'];
const INVALID = ['Price to EBITDA', 'Price to EBIT', 'Enterprise Value to Net Income', 'Enterprise Value to Free Cash Flows to Equity', 'Price to Free Cash Flows to the Firm'];

export function E22_q5(): Question {
  const right = pick(INVALID);
  const q = mcText('E22.q5', '7', p_('Which of the following is not a valid multiple?'), right, shuffle(VALID).slice(0, 4), p_(`${right} mixes an equity value with a measure that belongs to all capital providers (or the other way round). A consistent multiple has equity value over an equity measure, or enterprise value over a firm measure.`), false);
  return q;
}

const E22_III: ConceptMc[] = [
  { q: 'Oil is near the price of a decade ago, but European oil stocks trade at five instead of ten times forward earnings. What is one potential explanation?', correct: ['The shift to sustainable energy makes investors expect shorter lives, lower long-run returns and higher risk for oil cash flows'], distractors: ['Oil companies have become much less risky', 'Interest rates have fallen sharply, which lowers multiples', 'Oil companies are expected to grow faster than before'] },
  { q: 'How would that explanation show up in the inputs of a traditional valuation of an oil company?', correct: ['Low reinvestment and high cash balances, higher payouts, lower debt, higher discount rates, low long-run ROE and possibly negative terminal growth'], distractors: ['Higher terminal growth and lower discount rates', 'Higher reinvestment rates and rising long-run ROE', 'No change in inputs, only in the multiple'] },
];

// =====================================================================
// Exam 2023/24
// =====================================================================

export function E23_q1(): Question {
  const idx = rstep(1000, 5000, 100), y = rstep(0.02, 0.06, 0.005), d = idx * y, g = rstep(0.01, 0.04, 0.005), rf = rstep(0.01, 0.04, 0.001);
  const erp = (d * (1 + g) + idx * g) / idx - rf;
  const html = p_(`The S&P 500 is at ${fmtNum(idx, 0)}. The latest dividend yield on the index was ${pcs(y, 1)}, corresponding to $${fmtNum(d, 2)} of dividends. If dividends are expected to grow at ${pcs(g, 1)} in perpetuity and the risk-free rate is ${pcs(rf, 1)}, the implied equity risk premium is:`);
  const c = calc();
  c.r(`**Implied premium:** $\\frac{${tn(d)} \\times (1 + ${tp(g)})}{${tn(idx, 0)}} + ${tp(g)} - ${tp(rf)} = ${tn(d * (1 + g) / idx * 100)}\\% + ${tn(g * 100)}\\% - ${tn(rf * 100)}\\% = ${tn(erp * 100)}\\%$.`, 'ans', erp);
  return mc5('E23.q1', '4', html, erp, [erp + rf, y + g - rf, y * (1 + g) - rf, y + g], fp, c.steps);
}

export function E23_q2(): Question {
  const k = 4, segs = shuffle(['Retail', 'Software', 'Entertainment', 'Food', 'Chemicals', 'Media', 'Logistics']).slice(0, k), rev = segs.map(() => rint(1, 5)), b = segs.map(() => rstep(0.8, 2, 0.25)), de = pick([0.2, 0.25, 0.3, 0.4, 0.5]);
  const bu = sum(rev.map((r, i) => r * b[i])) / sum(rev), bl = bu * (1 + de);
  const html = p_('You are analysing the beta of a conglomerate and have broken it down into four business groups, with values (revenues) and unlevered betas for each group:') +
    table(['Business group', 'Revenue', 'Unlevered beta'], segs.map((s, i) => [s, `$${rev[i]} billion`, f2(b[i])])) +
    p_(`If the company has a D/E ratio of ${f2(de)}, its levered beta is closest to (use β<sub>L</sub> = β<sub>U</sub>(1 + D/E)):`);
  const c = calc();
  c.s(`**Weighted unlevered beta:** $\\frac{${rev.map((r, i) => `${r} \\times ${tn(b[i])}`).join(' + ')}}{${sum(rev)}} = ${tn(bu, 4)}$.`);
  c.r(`**Levered:** $${tn(bu, 4)} \\times (1 + ${tn(de)}) = ${tn(bl, 4)}$.`, 'ans', bl);
  return mc5('E23.q2', '4', html, bl, [bu, sum(b) / k * (1 + de), sum(b) / k, bu * (1 + de * 0.75)], f2, c.steps);
}

export function E23_q4(): Question {
  const c0 = pick(['Indonesian', 'Brazilian', 'Turkish', 'Indian', 'Mexican', 'South African']), sC = rstep(0.3, 0.5, 0.01), sUS = rstep(0.15, 0.25, 0.01), us = rstep(0.045, 0.06, 0.0025);
  const tot = us * sC / sUS;
  const html = p_(`The standard deviation of the ${c0} equity index is ${pcs(sC, 0)} and the standard deviation of the S&P 500 is ${pcs(sUS, 0)}. The equity risk premium for the US is ${pcs(us, 1)}. The ${c0} total equity risk premium is closest to:`);
  const c = calc();
  c.r(`**Relative volatility:** $${tn(us * 100)}\\% \\times \\frac{${tn(sC * 100, 0)}\\%}{${tn(sUS * 100, 0)}\\%} = ${tn(tot * 100)}\\%$.`, 'ans', tot);
  return mc5('E23.q4', '5', html, tot, [tot - us, us * sUS / sC, us + (sC - sUS), us], fp, c.steps);
}

export function E23_q5(): Question {
  const v1 = rstep(50, 400, 10), g1 = rstep(0.03, 0.2, 0.01), g2 = rstep(0.03, 0.2, 0.01), v2 = roundTo(v1 * (1 + g1), 0.1), v3 = roundTo(v2 * (1 + g2), 0.1), item = pick(['EBIT', 'Revenue', 'EBITDA']);
  const cagr = Math.pow(v3 / v1, 1 / 2) - 1;
  const html = p_(`Based on the information below, the compounded annual growth rate (CAGR, or geometric average growth rate) from year 1 to 3 is closest to:`) +
    table(['', 'Year 1', 'Year 2', 'Year 3'], [[item, fmtNum(v1, 1), fmtNum(v2, 1), fmtNum(v3, 1)]]);
  const c = calc();
  c.r(`**CAGR:** two growth periods, $\\left(\\frac{${tn(v3)}}{${tn(v1)}}\\right)^{1/2} - 1 = ${tn(cagr * 100)}\\%$.`, 'ans', cagr);
  return mc5('E23.q5', '3', html, cagr, [v3 / v1 - 1, Math.pow(v3 / v1, 1 / 3) - 1, (v2 / v1 + v3 / v2) / 2 - 1 + 0.002, (v3 / v1 - 1) / 2], fp, c.steps);
}

const E23_III: ConceptMc[] = [
  { q: 'A young plant-based food company has a forward P/E of 5,000 while an established food group trades at 12.7, in line with its industry. What can justify the difference?', correct: ['The young firm’s expected earnings are barely positive, so its P/E is near meaningless; its price reflects expected growth, not current earnings'], distractors: ['The young firm is 400 times more profitable', 'The established group must be overvalued', 'The young firm pays much higher dividends'] },
  { q: 'How would you adapt your valuation methods and inputs for a young, loss-making firm with negative book equity?', correct: ['Use a DCF built on revenue growth and a path to target margins, high reinvestment, a falling discount rate and a chance of failure; avoid P/E, P/B and dividend models'], distractors: ['Use the industry P/E on current earnings', 'Use a dividend discount model with current dividends', 'Use the book value of equity'] },
];

// =====================================================================
// Exam 2024/25
// =====================================================================

export function E24_q2(): Question {
  const tax = chance(0.7);
  const opts = [
    'Assuming zero distress costs, increasing the D/E ratio will increase the value of the firm by reducing the beta of equity.',
    'Assuming zero distress costs, increasing the D/E ratio will increase the value of the firm by increasing the present value of the tax-shield benefit.',
    'Assuming zero distress costs, increasing the D/E ratio will not affect value.',
    'A and B are correct.',
    'All of the above.',
  ];
  const html = p_(`${tax ? 'There are corporate taxes.' : 'There are no taxes of any kind.'} Which of the following statements is TRUE?`);
  const correct = tax ? 1 : 2;
  return { ...Q('E24.q2', '4', html, [{ type: 'mc', options: opts, correct }]), solution: p_(tax ? 'With taxes and no distress costs, debt adds the PV of the interest tax shields; the equity beta rises with leverage, it does not fall. Answer B.' : 'Without taxes (and distress costs), leverage only splits the same cash flows differently (MM I): value does not change. Answer C.') };
}

export function E24_q4(): Question {
  const name = co(), g = rstep(0.01, 0.05, 0.005), d0 = rstep(1, 10, 0.25), pr = roundTo(d0 * (1 + g) / rstep(0.03, 0.07, 0.001), 1), y0 = rint(2023, 2025);
  const ke = d0 * (1 + g) / pr + g;
  const html = p_(`${name} increases its dividends by ${pcs(g, 0)} every year. It paid dividends per share of $${f2(d0)} in ${y0}. If the share is trading at $${fmtNum(pr)} per share, ${poss(name)} cost of equity is closest to:`);
  const c = calc();
  c.r(`**Gordon, solved for k_e:** $\\frac{${tn(d0)} \\times (1 + ${tp(g)})}{${tn(pr)}} + ${tn(g, 4)} = ${tn(d0 * (1 + g) / pr * 100)}\\% + ${tn(g * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ans', ke);
  return mc5('E24.q4', '2', html, ke, [d0 / pr + g, d0 * (1 + g) / pr, d0 / pr, ke + g], fp, c.steps);
}

export function E24_q5(): Question {
  const name = co(), ebit = rstep(500, 3000, 100), ncap = roundTo(ebit * rstep(0.04, 0.15, 0.01), 10), dowc = roundTo(ebit * rstep(0.01, 0.05, 0.01), 5), ic = roundTo(ebit * rstep(5, 10, 0.5), 100), t = pick([0.2, 0.25, 0.3]);
  const nopat = ebit * (1 - t), rir = (ncap + dowc) / nopat, roc = nopat / ic, g = rir * roc;
  const html = p_(`${name} has EBIT of $${fmtNum(ebit)}, net CapEx of $${fmtNum(ncap)}, a change in OWC of $${fmtNum(dowc)} and invested capital of $${fmtNum(ic)}. The applicable tax rate is ${pcs(t, 0)}. The expected growth rate of its EBIT is closest to:`);
  const c = calc();
  c.s(`**Reinvestment rate:** $\\frac{${tn(ncap)} + ${tn(dowc)}}{${tn(ebit)} \\times ${tn(1 - t)}} = ${tn(rir * 100)}\\%$; **ROC** $= \\frac{${tn(nopat)}}{${tn(ic)}} = ${tn(roc * 100)}\\%$.`);
  c.r(`**Growth:** $${tn(rir, 4)} \\times ${tn(roc, 4)} = ${tn(g * 100)}\\%$ (the tax factor cancels: $\\frac{${tn(ncap + dowc)}}{${tn(ic)}}$).`, 'ans', g);
  return mc5('E24.q5', '3', html, g, [ncap / ic, (ncap + dowc) / ebit * (ebit / ic), (ncap + dowc) / nopat, ebit / ic * rir], fp, c.steps);
}

export function E24_IIb(): Question {
  const name = co(['Electronics', 'Technologies']), beta = rstep(0.7, 1.3, 0.05), de0 = rstep(0.15, 0.4, 0.05), de1 = +(de0 + rstep(0.1, 0.3, 0.05)).toFixed(2), bur = rstep(0.7, 1.4, 0.05), w = pick([0.5, 0.5, 0.6, 0.7]);
  const bu = beta / (1 + de0), buc = w * bu + (1 - w) * bur, blc = buc * (1 + de1);
  const html = p_(`A regression of ${poss(name)} excess returns on the market’s gives a beta of ${f2(beta)}, estimated while it kept a target D/E ratio of ${f2(de0)}. It now considers acquiring a retail group and would finance the deal so that it keeps a target D/E ratio of ${f2(de1)}. In the combined firm the electronics business would weigh ${pcs(w, 0)} and retail ${pcs(1 - w, 0)}. The unlevered beta of the retail sector is ${f2(bur)}. Use β<sub>L</sub> = β<sub>U</sub>(1 + D/E).`);
  const parts = [
    N(`What is the unlevered beta of ${poss(name)} current business?`, bu, 'n', { key: 'bu' }),
    N('What is the unlevered beta of the combined firm?', buc, 'n', { key: 'buc' }),
    N('What is the levered beta of the combined company?', blc, 'n', { key: 'blc' }),
  ];
  const c = calc();
  c.r(`**Unlever at the old ratio:** $\\frac{${tn(beta)}}{1 + ${tn(de0)}} = ${tn(bu, 4)}$.`, 'bu', bu);
  c.r(`**Combine:** $${tn(w)} \\times ${tn(bu, 4)} + ${tn(1 - w)} \\times ${tn(bur)} = ${tn(buc, 4)}$.`, 'buc', buc);
  c.r(`**Relever at the target:** $${tn(buc, 4)} \\times (1 + ${tn(de1)}) = ${tn(blc, 4)}$.`, 'blc', blc);
  return withSolution(withCalc(Q('E24.IIb', '4', html, parts), c.steps));
}

const E24_III: ConceptMc[] = [
  { q: 'A private AI start-up has just raised $6.6 billion at a $157 billion valuation. What are the steps of your valuation?', correct: ['Understand the business and market, forecast revenue growth and a path to target margins, estimate reinvestment and a cost of capital that falls as the firm matures, value with a DCF plus scenarios or failure probabilities, cross-check with multiples and adjust for the different investor claims'], distractors: ['Apply the P/E of mature software firms to current earnings', 'Divide the funding round by the shares sold and stop there', 'Discount current dividends at the risk-free rate'] },
  { q: 'Which challenges make valuing a young private AI company hard?', correct: ['No earnings or history, uncertain market size and competition, huge reinvestment needs, no market beta, illiquidity, and preferred terms in funding rounds that make the headline valuation overstate common equity'], distractors: ['Accounting standards forbid DCF for private firms', 'Its beta is always zero because it is private', 'It has too many comparable listed peers'] },
  { q: 'Which inputs are key in the valuation of a young AI start-up?', correct: ['Revenue growth and target market share, target operating margin, sales-to-capital ratio (reinvestment), cost of capital and its path, probability of failure, and the claims of options and preferred investors'], distractors: ['Dividend yield and payout ratio', 'Book value of equity and P/B of utilities', 'Last year’s EPS and the industry P/E only'] },
];

// =====================================================================
// The sets
// =====================================================================

export type PsDef = { id: string; topic: string; title: string; label: string; source: string; types: { key: string; name: string; topic: string; gen: () => Question; fromPs: boolean }[] };
const T = (key: string, name: string, topic: string, gen: () => Question, fromPs = true) => ({ key, name, topic, gen: retag(key, gen), fromPs });
const short = (key: string, topic: string, items: ConceptMc[]) => () => withSolution(shortAnswer(key, topic, items));

export const PROBLEM_SETS: PsDef[] = [
  { id: 'X2', topic: '2', label: 'Extra questions, lecture 2', source: 'the extra questions', title: 'Retention, H-model, deferred taxes', types: [
    T('X2.q1', 'Higher retention at three levels of ROE (Q1)', '2', X2_q1),
    T('X2.q2', 'H-model with linearly declining growth (Q2)', '2', G.L2_hModel),
    T('X2.q3', 'FCFF valuation with deferred taxes and preferred stock (Q3)', '2', G.L2_deferred),
    T('X2.gordon', 'Gordon growth model', '2', G.L2_gordon, false),
    T('X2.twoStage', 'Two-stage DDM', '2', G.L2_twoStage, false),
    T('X2.fcf', 'FCFF and FCFE from accounts', '2', G.L2_fcf, false),
    T('X2.dcf', 'FCFF valuation and equity bridge', '2', G.L2_dcf, false),
    T('X2.apv', 'Adjusted present value', '2', G6.L2_apv, false),
    T('X2.short', 'Short answers', '2', short('X2.short', '2', BANK['2'].MC), false),
  ] },
  { id: 'X3', topic: '3', label: 'Extra questions, lecture 3', source: 'the extra questions', title: 'Growth from market share, fundamentals and margins', types: [
    T('X3.q1', 'Revenue CAGR from a market-share target (Q1)', '3', G3.L3_market),
    T('X3.q2', 'Growth from reinvestment and a changing return on capital (Q2)', '3', () => G3.L3_fundamental('change')),
    T('X3.q3', 'Revenue and operating income with an improving margin (Q3)', '3', G3.L3_margin),
    T('X3.hist', 'Historical growth: averages and variability', '3', G3.L3_hist, false),
    T('X3.trend', 'Trend regression for negative earnings', '3', G3.L3_trend, false),
    T('X3.fundamental', 'Fundamental growth from the accounts', '3', () => G3.L3_fundamental('accounts'), false),
    T('X3.short', 'Short answers', '3', short('X3.short', '3', BANK['3'].MC), false),
  ] },
  { id: 'X4', topic: '4', label: 'Extra questions, lecture 4', source: 'the extra questions', title: 'Cost of capital, merger betas, debt betas', types: [
    T('X4.q1', 'Market value of debt and cost of capital (Q1)', '4', X4_q1),
    T('X4.q2', 'Beta after an equity- or debt-financed acquisition (Q2)', '4', () => G4.L4_bottomUp('merger')),
    T('X4.q3', 'Debt beta, WACC and share price from FCFE (Q3)', '4', X4_q3),
    T('X4.implied', 'Implied equity risk premium', '4', G4.L4_implied, false),
    T('X4.beta', 'Unlevered, relevered and total betas', '4', G4.L4_beta, false),
    T('X4.segments', 'Bottom-up beta of a conglomerate', '4', () => G4.L4_bottomUp('segments'), false),
    T('X4.debt', 'Synthetic rating and cost of debt', '4', G4.L4_debt, false),
    T('X4.short', 'Short answers', '4', short('X4.short', '4', BANK['4'].MC), false),
  ] },
  { id: 'X6', topic: '6', label: 'Extra questions, lecture 6', source: 'the extra questions', title: 'Holdings, minority interests and options', types: [
    T('X6.q1', 'Valuation with holdings and minority interests at market value (Q1)', '6', () => caseGrowth('X6.q1', '6', { cur: EUR, terminal: 'allGrow', beta: 'given', rule: 'hamada', kdFrom: 'spread', holding: 'mv', minority: 'mv', options: false, nParts: [4, 6], must: ['eq'] })),
    T('X6.q2', 'Equity per share with options: value and treasury stock (Q2)', '6', X6_q2),
    T('X6.holdings', 'Cross holdings and minority interests', '6', G6.L6_holdings, false),
    T('X6.options', 'Diluted, treasury stock and option value', '6', G6.L6_options, false),
    T('X6.cash', 'Cash and the cost of net debt', '6', G6.L6_cash, false),
    T('X6.commit', 'Contractual commitments as debt', '6', G6.L6_commit, false),
    T('X6.short', 'Short answers', '6', short('X6.short', '6', BANK['6'].MC), false),
  ] },
  { id: 'X7', topic: '7', label: 'Extra questions, lecture 7', source: 'the extra questions and slides', title: 'Peer multiples, terminal multiples, regression multiples', types: [
    T('X7.q1', 'Share price from peer P/E and EV/EBITDA (Q1)', '7', G6.L7_multiples),
    T('X7.q2', 'Low P/E, high P/B and other concept checks (Q2, extra slides)', '7', short('X7.q2', '7', X7_SHORT)),
    T('X7.zimco', 'Loss-making firm valued with an exit EV/EBITDA (extra slides)', '7', () => G6.L7_exit('zimco')),
    T('X7.lam', 'Young firm: sale multiple and chance of failure (extra slides)', '7', () => G6.L7_exit('lam')),
    T('X7.astor', 'Implied input from a regression multiple (extra slides)', '7', () => G6.L7_regression('tax')),
    T('X7.compare', 'P/E and EV/EBITDA of two firms', '7', G6.L7_compare, false),
    T('X7.fundPE', 'Multiples from fundamentals', '7', G6.L7_fundPE, false),
    T('X7.regression', 'Predicted multiple from a regression', '7', () => G6.L7_regression('predict'), false),
    T('X7.short', 'Short answers', '7', short('X7.short', '7', BANK['7'].MC), false),
  ] },
  { id: 'X8', topic: '4', label: 'Extra questions, lecture 8', source: 'the extra question', title: 'Valuing a private company', types: [
    T('X8.q1', 'Private firm: salary adjustment, total beta, firm and equity value (a, b)', '4', X8_q1),
    T('X8.q2', 'The same firm valued for an IPO (c)', '4', X8_q2),
  ] },
  { id: 'E21', topic: '2', label: 'Exam 2021/22', source: 'the exam', title: 'Growth, implied premium, beta with fixed debt, valuation with changing leverage', types: [
    T('E21.q1', 'Part I, Q1: EBIT growth from reinvestment and return on capital', '3', E21_q1),
    T('E21.q2', 'Part I, Q2: implied equity risk premium', '4', E21_q2),
    T('E21.q3', 'Part I, Q3: true statement (debt, APV, payout)', '2', () => allNone('E21.q3', '2', S.dcfT, S.dcfF)),
    T('E21.q4', 'Part I, Q4: beta with a fixed amount of debt', '4', E21_q4),
    T('E21.q5', 'Part I, Q5: true statement (betas)', '4', () => allNone('E21.q5', '4', S.betaT, S.betaF)),
    T('E21.IIa', 'Part II (a): firm and equity value, fixed debt then target D/E', '2', E21_IIa),
    T('E21.IIb', 'Part II (b): equity value from a forward P/E', '7', E21_IIb),
    T('E21.IIc', 'Part II (c): adjustments for an emerging market', '5', short('E21.IIc', '5', E21_IIC)),
    T('E21.III', 'Part III: factors for forecasting growth', '3', short('E21.III', '3', E21_III)),
  ] },
  { id: 'E22', topic: '2', label: 'Exam 2022/23', source: 'the exam', title: 'Private-firm beta, payout change, local risk-free rate, APV with options, multiples', types: [
    T('E22.q1', 'Part I, Q1: total beta of a private firm', '4', () => privateBetaMc('E22.q1')),
    T('E22.q2', 'Part I, Q2: share price after a payout cut', '2', E22_q2),
    T('E22.q3', 'Part I, Q3: true statement (risk-free rate, betas, reinvestment)', '4', () => allNone('E22.q3', '4', S.betaT, S.betaF)),
    T('E22.q4', 'Part I, Q4: local-currency risk-free rate', '5', E22_q4),
    T('E22.q5', 'Part I, Q5: invalid multiple', '7', E22_q5),
    T('E22.II1', 'Part II, Q1: APV with constant debt, holdings and options', '2', () => caseApv('E22.II1', '2', { cur: USD, options: 'treasury', nParts: [4, 6] })),
    T('E22.II2', 'Part II, Q2: P/E and EV/EBITDA of two firms, recommendation', '7', G6.L7_compare),
    T('E22.III', 'Part III: low multiples of oil companies', '7', short('E22.III', '7', E22_III)),
  ] },
  { id: 'E23', topic: '2', label: 'Exam 2023/24', source: 'the exam', title: 'Implied premium, conglomerate beta, country premium, CAGR, FCFF case and APV', types: [
    T('E23.q1', 'Part I, Q1: implied equity risk premium', '4', E23_q1),
    T('E23.q2', 'Part I, Q2: levered beta of a conglomerate', '4', E23_q2),
    T('E23.q3', 'Part I, Q3: true statement (DDM vs FCFE, betas)', '4', () => allNone('E23.q3', '4', [...S.betaT, ...S.dcfT], [...S.betaF, ...S.dcfF])),
    T('E23.q4', 'Part I, Q4: total equity risk premium from relative volatility', '5', E23_q4),
    T('E23.q5', 'Part I, Q5: CAGR', '3', E23_q5),
    T('E23.IIa', 'Part II (a): FCFF valuation with working capital and a reinvestment ratio', '6', () => caseGrowth('E23.IIa', '6', { cur: USD, terminal: 'rr', beta: 'comps', rule: 'notax', kdFrom: 'given', holding: 'pe', minority: 'given', options: true, nParts: [4, 6] })),
    T('E23.IIb', 'Part II (b): the same firm with the APV method', '2', () => caseGrowth('E23.IIb', '2', { cur: USD, terminal: 'rr', beta: 'comps', holding: 'pe', minority: 'given', options: true, apv: true })),
    T('E23.III', 'Part III: P/E of a young versus a mature firm', '7', short('E23.III', '7', E23_III)),
  ] },
  { id: 'E24', topic: '2', label: 'Exam 2024/25', source: 'the exam', title: 'Private-firm beta, leverage and value, cost of equity, growth, statement-based case', types: [
    T('E24.q1', 'Part I, Q1: total beta of a private firm', '4', () => privateBetaMc('E24.q1')),
    T('E24.q2', 'Part I, Q2: leverage and firm value', '4', E24_q2),
    T('E24.q3', 'Part I, Q3: true statement (DDM vs DCF, betas)', '4', () => allNone('E24.q3', '4', [...S.betaT, ...S.dcfT], [...S.betaF, ...S.dcfF])),
    T('E24.q4', 'Part I, Q4: cost of equity from the Gordon model', '2', E24_q4),
    T('E24.q5', 'Part I, Q5: EBIT growth from reinvestment', '3', E24_q5),
    T('E24.IIa', 'Part II (a): per-share value from projected statements', '6', () => caseAccounts('E24.IIa', '6', { cur: pick([JPY, JPY, USD]), nParts: [4, 6] })),
    T('E24.IIb', 'Part II (b): levered beta of the combined company', '4', E24_IIb),
    T('E24.III', 'Part III: valuing a young AI company', '6', short('E24.III', '6', E24_III)),
  ] },
];

/** Generators for the mock exam's Part I, grouped by lecture. */
export const MOCK_MC: Record<string, string[]> = {
  '2': ['E22.q2', 'E24.q4', 'E21.q3'],
  '3': ['E21.q1', 'E23.q5', 'E24.q5'],
  '4': ['E21.q2', 'E23.q1', 'E21.q4', 'E22.q1', 'E23.q2', 'E24.q2', 'E21.q5'],
  '5': ['E22.q4', 'E23.q4'],
  '7': ['E22.q5'],
};

