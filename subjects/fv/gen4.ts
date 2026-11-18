// Firm Valuation, lectures 4 and 5 — required returns: implied equity premiums, betas (relevered, total and bottom-up),
// cost of debt from a synthetic rating, WACC, and the adjustments for emerging markets.
import { C, N, P, Q, calc, chance, chooseParts, co, fmtNum, p_, pick, poss, rint, roundTo, rstep, table, tn, tp, tq, v, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Question } from '@/lib/engine/types';
import { EUR, GBP, USD, anyCur, inM, pv, sum, type Cur } from './util';

const f2 = (x: number) => fmtNum(x, 2);

// =====================================================================
// Implied equity risk premium
// =====================================================================

/** Discount rate that equates the PV of `cfs` (years 1…n) plus a growing perpetuity after year n with `price`. */
export function impliedReturn(price: number, cfs: number[], gL: number): number {
  const n = cfs.length, val = (r: number) => sum(cfs.map((c, i) => pv(c, r, i + 1))) + cfs[n - 1] * (1 + gL) / (r - gL) / Math.pow(1 + r, n);
  let lo = gL + 1e-6, hi = 1;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (val(m) > price) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

export function L4_implied(force?: 'gordon' | 'twoStage'): Question {
  for (let att = 0; att < 3000; att++) {
    const idx = pick(['S&P 500', 'Euro Stoxx 50', 'FTSE 100', 'MSCI World', 'DAX']);
    const P0 = rstep(1200, 6000, 50), rf = rstep(0.01, 0.05, 0.001);
    if (force ? force === 'gordon' : chance(0.6)) {
      const y = rstep(0.015, 0.05, 0.0005), g = rstep(0.02, 0.065, 0.0025), asAmount = chance(0.5);
      const D0 = P0 * y, D1 = D0 * (1 + g), r = D1 / P0 + g, erp = r - rf;
      if (erp < 0.02 || erp > 0.12) continue;
      const beta = rstep(0.6, 1.6, 0.05);
      const body = p_(`The ${idx} stands at ${fmtNum(P0, 0)}. ` + (asAmount ? `Last year the index paid dividends of ${f2(D0)} index points (a dividend yield of ${P(y, 2)}).` : `Last year’s dividends on the index were ${P(y, 2)} of the index level.`) +
        ` Dividends are expected to grow at ${P(g, 2)} per year in perpetuity, and the risk-free rate is ${P(rf, 2)}.`);
      const items: Item[] = [
        { part: N('What dividend (in index points) do you expect next year?', D1, 'n', { key: 'D1' }), w: 0.4 },
        { part: N('What expected return on the index is implied by its level?', r * 100, 'pct', { key: 'r' }), w: 0.7 },
        { part: N('What is the implied equity risk premium?', erp * 100, 'pct', { key: 'erp' }), must: true },
        { part: N(`What is the cost of equity of a stock with a beta of ${f2(beta)}, using this premium?`, (rf + beta * erp) * 100, 'pct', { key: 'ke' }), w: 0.4 },
      ];
      const c = calc();
      c.r(`**Next year’s dividend:** $D_1 = ${tn(P0, 0)} \\times ${tn(y, 4)} \\times (1 + ${tp(g)}) = ${tn(D1)}$ index points.`, 'D1', D1);
      c.r(`**Expected return:** from $P_0 = \\frac{D_1}{r - g}$, $r = \\frac{D_1}{P_0} + g = \\frac{${tn(D1)}}{${tn(P0, 0)}} + ${tn(g, 4)} = ${tn(r * 100)}\\%$.`, 'r', r * 100);
      c.r(`**Implied premium:** $${tn(r * 100)}\\% - ${tn(rf * 100)}\\% = ${tn(erp * 100)}\\%$.`, 'erp', erp * 100);
      c.r(`**CAPM:** $${tn(rf * 100)}\\% + ${tn(beta)} \\times ${tn(erp * 100)}\\% = ${tn((rf + beta * erp) * 100)}\\%$.`, 'ke', (rf + beta * erp) * 100);
      return withCalc(Q('L4.implied', 4, body, chooseParts(items, 2, 3)), c.steps);
    }
    const y = rstep(0.025, 0.05, 0.0005), gH = rstep(0.03, 0.08, 0.005), gL = rf;
    const cf0 = P0 * y, cfs = [1, 2, 3, 4, 5].map(t => cf0 * Math.pow(1 + gH, t));
    const r = impliedReturn(P0, cfs, gL), erp = r - rf;
    if (erp < 0.02 || erp > 0.1) continue;
    const body = p_(`The ${idx} stands at ${fmtNum(P0, 0)}. Dividends and buybacks last year amounted to ${P(y, 2)} of the index. Analysts expect earnings, and with them the cash returned to investors, to grow at ${P(gH, 1)} per year for the next five years and at the risk-free rate of ${P(rf, 2)} forever after that.`) +
      p_('Find the discount rate that makes the present value of the expected cash flows equal to the index level (by trial and error or with a solver).');
    const items: Item[] = [
      { part: N('What cash flow (in index points) do you expect in year 1?', cfs[0], 'n', { key: 'cf1' }), w: 0.4 },
      { part: N('What is the cash flow in year 5?', cfs[4], 'n', { key: 'cf5' }), w: 0.3 },
      { part: N('What expected return on the index is implied?', r * 100, 'pct', { key: 'r' }), must: true },
      { part: N('What is the implied equity risk premium?', erp * 100, 'pct', { key: 'erp' }), must: true },
    ];
    const c = calc();
    c.s(`**Cash flow last year:** $${tn(P0, 0)} \\times ${tn(y, 4)} = ${tn(cf0)}$.`);
    cfs.forEach((x, i) => { const md = `**Year ${i + 1}:** $${tn(cf0)} \\times (1 + ${tp(gH)})^{${i + 1}} = ${tn(x)}$.`; if (i === 0) c.r(md, 'cf1', x); else if (i === 4) c.r(md, 'cf5', x); else c.s(md); });
    c.s(`**Equation:** $${tn(P0, 0)} = ${cfs.map((x, i) => `\\frac{${tn(x)}}{(1 + r)^{${i + 1}}}`).join(' + ')} + \\frac{${tn(cfs[4])} \\times (1 + ${tp(gL)})}{(r - ${tn(gL, 4)})(1 + r)^5}$.`);
    const pvAt = (rr: number) => sum(cfs.map((x, i) => pv(x, rr, i + 1))) + cfs[4] * (1 + gL) / (rr - gL) / Math.pow(1 + rr, 5);
    c.r(`**Solve for r:** at $r = ${tn(r * 100)}\\%$ the right-hand side is $${tn(pvAt(r))}$, equal to the index (at $${tn((r - 0.005) * 100)}\\%$ it is $${tn(pvAt(r - 0.005))}$, at $${tn((r + 0.005) * 100)}\\%$ it is $${tn(pvAt(r + 0.005))}$).`, 'r', r * 100);
    c.r(`**Implied premium:** $${tn(r * 100)}\\% - ${tn(rf * 100)}\\% = ${tn(erp * 100)}\\%$.`, 'erp', erp * 100);
    return withCalc(Q('L4.implied', 4, body, chooseParts(items, 2, 3)), c.steps);
  }
  throw new Error('L4_implied: no valid draw');
}

// =====================================================================
// Levered and unlevered betas
// =====================================================================

export const NOTAX = 'βL = βU(1 + D/E)';
export const HAMADA = 'βL = βU[1 + (1 − t)D/E]';

export function L4_beta(force?: 'relever' | 'private' | 'debtBeta'): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), rf = rstep(0.01, 0.05, 0.0025), erp = rstep(0.04, 0.08, 0.0025);
    const vr = force ?? pick(['relever', 'relever', 'private', 'debtBeta'] as const);
    if (vr === 'private') {
      const cur = pick([USD, EUR]), M = cur.M;
      const bu = rstep(0.6, 1.3, 0.05), rho = rstep(0.3, 0.8, 0.05), debt = rstep(1, 20, 0.5), bve = rstep(2, 30, 0.5), mb = rstep(1.2, 4, 0.1);
      const E = bve * mb, de = debt / E, tbu = bu / rho, tbl = tbu * (1 + de), ke = rf + tbl * erp;
      const body = p_(`You are valuing ${name}, a private company, for a sale to a private investor who holds almost all of their wealth in this business. ${name} has ${M(debt, 1)} of debt and a book value of equity of ${M(bve, 1)}. Comparable listed firms have an average unlevered beta of ${f2(bu)} and trade at ${fmtNum(mb, 1)} times book value of equity; the correlation of the industry with the market is ${f2(rho)}. There are no taxes, so use ${NOTAX} with the estimated market value of equity.`);
      const items: Item[] = [
        { part: N(`What is the estimated market value of ${poss(name)} equity?`, E, cur.mUnit, { key: 'E' }), w: 0.4 },
        { part: N('What debt-to-equity ratio do you use?', de * 100, 'pct', { key: 'de' }), w: 0.5 },
        { part: N('What is the total unlevered beta?', tbu, 'n', { key: 'tbu' }), w: 0.6 },
        { part: N(`What is the total (levered) beta of ${poss(name)} equity?`, tbl, 'n', { key: 'tbl' }), must: true },
        { part: N(`What cost of equity does this give (risk-free rate ${P(rf, 2)}, market premium ${P(erp, 2)})?`, ke * 100, 'pct', { key: 'ke' }), w: 0.35 },
      ];
      const c = calc();
      c.r(`**Market value of equity:** book value × market-to-book $= ${tn(bve)} \\times ${tn(mb)} = ${tn(E)}$ ${inM(cur)}.`, 'E', E);
      c.r(`**D/E:** $\\frac{${tn(debt)}}{${tn(E)}} = ${tn(de, 4)}$, i.e. $${tn(de * 100)}\\%$.`, 'de', de * 100);
      c.r(`**Total unlevered beta:** the owner is not diversified, so scale the market beta by the correlation: $\\frac{\\beta_U}{\\rho} = \\frac{${tn(bu)}}{${tn(rho)}} = ${tn(tbu, 4)}$.`, 'tbu', tbu);
      c.r(`**Total levered beta:** $${tn(tbu, 4)} \\times (1 + ${tn(de, 4)}) = ${tn(tbl, 4)}$.`, 'tbl', tbl);
      c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(tbl, 4)} \\times ${tn(erp * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
      return withCalc(Q('L4.beta', 4, body, chooseParts(items, 2, 4)), c.steps);
    }
    const t = pick([0.2, 0.25, 0.25, 0.3, 0.35]);
    if (vr === 'debtBeta') {
      const blc = rstep(1, 1.8, 0.05), bd = rstep(0.1, 0.6, 0.02), dec = rstep(0.6, 1.5, 0.05), de = rstep(0.1, 0.6, 0.05);
      const fac = 1 + (1 - t) * dec, bu = (blc + bd * (1 - t) * dec) / fac, bl = bu * (1 + (1 - t) * de), ke = rf + bl * erp;
      const body = p_(`Firms in ${poss(name)} industry have an average debt-to-equity ratio of ${f2(dec)}, an average equity beta of ${f2(blc)} and a debt beta of ${f2(bd)}. ${name} has a debt-to-equity ratio of ${f2(de)} and its debt is risk-free. The tax rate is ${P(t, 0)}.`) +
        p_(`Use β<sub>L</sub> = β<sub>U</sub>[1 + (1 − t)D/E] − β<sub>D</sub>(1 − t)D/E. The risk-free rate is ${P(rf, 2)} and the market premium ${P(erp, 2)}.`);
      const items: Item[] = [
        { part: N('What is the unlevered beta of the industry?', bu, 'n', { key: 'bu' }), must: true },
        { part: N(`What is the equity beta of ${name}?`, bl, 'n', { key: 'bl' }), must: true },
        { part: N(`What is the cost of equity of ${name}?`, ke * 100, 'pct', { key: 'ke' }), w: 0.6 },
      ];
      const c = calc();
      c.s(`**Rearranged:** $\\beta_U = \\frac{\\beta_L + \\beta_D(1 - t)D/E}{1 + (1 - t)D/E}$.`);
      c.r(`**Industry unlevered beta:** $\\frac{${tn(blc)} + ${tn(bd)} \\times ${tn(1 - t)} \\times ${tn(dec)}}{1 + ${tn(1 - t)} \\times ${tn(dec)}} = \\frac{${tn(blc + bd * (1 - t) * dec, 4)}}{${tn(fac, 4)}} = ${tn(bu, 4)}$.`, 'bu', bu);
      c.r(`**Relevered with risk-free debt:** $${tn(bu, 4)} \\times (1 + ${tn(1 - t)} \\times ${tn(de)}) = ${tn(bl, 4)}$.`, 'bl', bl);
      c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times ${tn(erp * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
      return withCalc(Q('L4.beta', 4, body, chooseParts(items, 2, 3)), c.steps);
    }
    const hamada = chance(0.5), blc = rstep(0.8, 1.9, 0.05), dec = rstep(0.1, 1.2, 0.05), de = rstep(0.05, 1, 0.05);
    if (Math.abs(de - dec) < 0.1) continue;
    const fu = (x: number) => hamada ? 1 + (1 - t) * x : 1 + x;
    const bu = blc / fu(dec), bl = bu * fu(de), ke = rf + bl * erp;
    const policy = hamada ? `${name} keeps a fixed amount of debt, so use ${HAMADA} with a tax rate of ${P(t, 0)}.` : `${name} rebalances its debt to keep its debt-to-equity ratio constant, so use ${NOTAX}.`;
    const body = p_(`Comparable firms have an average equity beta of ${f2(blc)} and an average debt-to-equity ratio of ${f2(dec)}. ${name} has a debt-to-equity ratio of ${f2(de)}. ${policy} The risk-free rate is ${P(rf, 2)} and the market premium ${P(erp, 2)}.`);
    const items: Item[] = [
      { part: N('What is the unlevered beta of the comparable firms?', bu, 'n', { key: 'bu' }), must: true },
      { part: N(`What is the levered beta of ${name}?`, bl, 'n', { key: 'bl' }), must: true },
      { part: N(`What is the cost of equity of ${name}?`, ke * 100, 'pct', { key: 'ke' }), w: 0.6 },
    ];
    const c = calc();
    c.r(hamada ? `**Unlever:** $\\beta_U = \\frac{${tn(blc)}}{1 + (1 - ${tn(t)}) \\times ${tn(dec)}} = \\frac{${tn(blc)}}{${tn(fu(dec), 4)}} = ${tn(bu, 4)}$.`
      : `**Unlever:** $\\beta_U = \\frac{${tn(blc)}}{1 + ${tn(dec)}} = ${tn(bu, 4)}$.`, 'bu', bu);
    c.r(hamada ? `**Relever:** $${tn(bu, 4)} \\times [1 + (1 - ${tn(t)}) \\times ${tn(de)}] = ${tn(bu, 4)} \\times ${tn(fu(de), 4)} = ${tn(bl, 4)}$.`
      : `**Relever:** $${tn(bu, 4)} \\times (1 + ${tn(de)}) = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times ${tn(erp * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    return withCalc(Q('L4.beta', 4, body, chooseParts(items, 2, 3)), c.steps);
  }
  throw new Error('L4_beta: no valid draw');
}

// =====================================================================
// Bottom-up betas: business segments and mergers
// =====================================================================

const SEG = ['Retail', 'Software', 'Entertainment', 'Food', 'Chemicals', 'Logistics', 'Healthcare', 'Media', 'Utilities', 'Engineering'];

export function L4_bottomUp(force?: 'merger' | 'segments'): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), cur = pick([USD, EUR]), M = cur.M;
    if (force ? force === 'merger' : chance(0.35)) {
      const a = co(), b = co(), Ea = rstep(1, 20, 0.5) * 1000, Eb = roundTo(Ea * rstep(0.2, 0.9, 0.05), 50), ba = rstep(0.7, 1.8, 0.05), bb = rstep(0.6, 1.8, 0.05);
      if (Math.abs(ba - bb) < 0.1) continue;
      const bu = (Ea * ba + Eb * bb) / (Ea + Eb), de = Eb / Ea, bl = bu * (1 + de);
      const body = p_(`${a}, with a market value of equity of ${M(Ea, 0)} and a beta of ${f2(ba)}, announces that it will acquire ${b}, with a market value of equity of ${M(Eb, 0)} and a beta of ${f2(bb)}. Neither firm has any debt. Ignore taxes and assume debt has a beta of zero.`);
      const items: Item[] = [
        { part: N(`What is the beta of ${a} after the acquisition if it pays entirely with new shares?`, bu, 'n', { key: 'bu' }), must: true },
        { part: N(`What is the debt-to-equity ratio if ${a} instead borrows the full ${M(Eb, 0)} to pay for ${b}?`, de * 100, 'pct', { key: 'de' }), w: 0.4 },
        { part: N(`What is the equity beta of ${a} after a debt-financed acquisition?`, bl, 'n', { key: 'bl' }), must: true },
      ];
      const c = calc();
      c.r(`**All-equity combination:** value-weighted average $\\frac{${tn(Ea, 0)} \\times ${tn(ba)} + ${tn(Eb, 0)} \\times ${tn(bb)}}{${tn(Ea + Eb, 0)}} = ${tn(bu, 4)}$.`, 'bu', bu);
      c.r(`**Debt-financed:** debt $${tn(Eb, 0)}$, equity stays $${tn(Ea, 0)}$, so $D/E = ${tn(de, 4)}$.`, 'de', de * 100);
      c.r(`**Equity beta:** the assets keep beta $${tn(bu, 4)}$; $\\beta_L = ${tn(bu, 4)} \\times (1 + ${tn(de, 4)}) = ${tn(bl, 4)}$.`, 'bl', bl);
      return withCalc(Q('L4.bottomUp', 4, body, chooseParts(items, 2, 3)), c.steps);
    }
    const k = rint(3, 4), segs = [...SEG].sort(() => Math.random() - 0.5).slice(0, k);
    const byRev = chance(0.5), w = segs.map(() => rstep(0.5, 4, 0.5)), betas = segs.map(() => rstep(0.6, 2, 0.05));
    const tot = sum(w), bu = sum(w.map((x, i) => x * betas[i])) / tot;
    const t = pick([0.2, 0.25, 0.3]), hamada = chance(0.4), de = rstep(0.1, 0.8, 0.05);
    const bl = bu * (hamada ? 1 + (1 - t) * de : 1 + de), rf = rstep(0.015, 0.045, 0.0025), erp = rstep(0.045, 0.075, 0.0025), ke = rf + bl * erp;
    const body = p_(`${name} is a conglomerate with ${k} business groups. For each, you have the ${byRev ? 'revenue' : 'estimated market value'} and the average unlevered beta of focused firms in that business${byRev ? ' (use revenues as weights)' : ''}:`) +
      table(['Business group', byRev ? 'Revenue' : 'Market value', 'Unlevered beta'], segs.map((s, i) => [s, `${cur.sym}${fmtNum(w[i], 1)} billion`, f2(betas[i])])) +
      p_(`${name} has a debt-to-equity ratio of ${f2(de)}. ${hamada ? `It holds a fixed amount of debt; use ${HAMADA} with t = ${P(t, 0)}.` : `It keeps its leverage constant; use ${NOTAX}.`} The risk-free rate is ${P(rf, 2)} and the market premium ${P(erp, 2)}.`);
    const items: Item[] = [
      { part: N(`What is the unlevered beta of ${name}?`, bu, 'n', { key: 'bu' }), must: true },
      { part: N(`What is the levered beta of ${name}?`, bl, 'n', { key: 'bl' }), must: true },
      { part: N(`What is the cost of equity of ${name}?`, ke * 100, 'pct', { key: 'ke' }), w: 0.5 },
    ];
    const c = calc();
    c.r(`**Weighted unlevered beta:** $\\frac{${w.map((x, i) => `${tn(x)} \\times ${tn(betas[i])}`).join(' + ')}}{${tn(tot)}} = \\frac{${tn(sum(w.map((x, i) => x * betas[i])), 4)}}{${tn(tot)}} = ${tn(bu, 4)}$.`, 'bu', bu);
    c.r(hamada ? `**Levered beta:** $${tn(bu, 4)} \\times [1 + (1 - ${tn(t)}) \\times ${tn(de)}] = ${tn(bl, 4)}$.` : `**Levered beta:** $${tn(bu, 4)} \\times (1 + ${tn(de)}) = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times ${tn(erp * 100)}\\% = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    return withCalc(Q('L4.bottomUp', 4, body, chooseParts(items, 2, 3)), c.steps);
  }
  throw new Error('L4_bottomUp: no valid draw');
}

// =====================================================================
// Cost of debt from a synthetic rating; market value of debt
// =====================================================================

/** Interest coverage → rating and default spread (illustrative table in the format of the lecture). */
export const RATINGS: [lo: number, rating: string, spread: number][] = [
  [8.5, 'AAA', 0.006], [6.5, 'AA', 0.008], [5.5, 'A+', 0.01], [4.5, 'A', 0.012], [3.5, 'BBB', 0.016], [2.5, 'BB', 0.025], [1.5, 'B', 0.04], [-1e9, 'CCC', 0.08],
];
export const rateOf = (cov: number) => RATINGS.find(r => cov >= r[0])!;
export const ratingTable = () => table(['Interest coverage', 'Rating', 'Default spread'], RATINGS.map((r, i) =>
  [i === 0 ? `≥ ${r[0]}` : i === RATINGS.length - 1 ? `< ${RATINGS[i - 1][0]}` : `${r[0]} – ${RATINGS[i - 1][0]}`, r[1], P(r[2], 2)]));

export function L4_debt(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), cur = pick([USD, EUR]), M = cur.M;
    const F = rstep(0.5, 15, 0.5) * 1000, cpn = rstep(0.03, 0.08, 0.0025), I = F * cpn, n = rint(3, 10);
    const ebit = roundTo(I * rstep(1.2, 10, 0.1), 10), cov = ebit / I, [, rating, spread] = rateOf(cov);
    if (RATINGS.some(r => Math.abs(cov - r[0]) < 0.08)) continue;
    const rf = rstep(0.02, 0.06, 0.0025), kd = rf + spread, t = pick([0.21, 0.25, 0.3, 0.35]);
    const mv = I * (1 - Math.pow(1 + kd, -n)) / kd + F / Math.pow(1 + kd, n);
    const body = p_(`${name} is not rated. It has debt with a book (face) value of ${M(F, 0)}, an annual interest expense of ${M(I, 1)} and an average maturity of ${n} years. Last year its operating income (EBIT) was ${M(ebit, 0)}. The risk-free rate is ${P(rf, 2)} and the tax rate ${P(t, 0)}. Use the following table to estimate a synthetic rating:`) +
      ratingTable() + p_('Value the debt like a bond: the interest is a coupon paid annually and the face value is repaid at maturity.');
    const opts = RATINGS.map(r => r[1]);
    const items: Item[] = [
      { part: N('What is the interest coverage ratio?', cov, 'x', { key: 'cov' }), w: 0.6 },
      { part: C('Which synthetic rating does this give?', opts, opts.indexOf(rating), 'rating'), w: 0.4 },
      { part: N('What is the pre-tax cost of debt?', kd * 100, 'pct', { key: 'kd' }), must: true },
      { part: N('What is the after-tax cost of debt?', kd * (1 - t) * 100, 'pct', { key: 'kdat' }), w: 0.5 },
      { part: N('What is the estimated market value of the debt?', mv, cur.mUnit, { key: 'mv' }), must: true },
    ];
    const c = calc();
    c.r(`**Interest coverage:** $\\frac{EBIT}{\\text{Interest}} = \\frac{${tn(ebit)}}{${tn(I)}} = ${tn(cov)}$.`, 'cov', cov);
    c.r(`**Synthetic rating:** a coverage of $${tn(cov)}$ falls in the ${rating} row, default spread $${tn(spread * 100)}\\%$.`, 'rating');
    c.r(`**Pre-tax cost of debt:** $r_f + \\text{spread} = ${tn(rf * 100)}\\% + ${tn(spread * 100)}\\% = ${tn(kd * 100)}\\%$.`, 'kd', kd * 100);
    c.r(`**After-tax cost of debt:** $${tn(kd * 100)}\\% \\times (1 - ${tn(t)}) = ${tn(kd * (1 - t) * 100)}\\%$.`, 'kdat', kd * (1 - t) * 100);
    c.r(`**Market value of debt:** $${tn(I)} \\times \\frac{1 - (1 + ${tp(kd)})^{-${n}}}{${tn(kd, 4)}} + \\frac{${tn(F, 0)}}{(1 + ${tp(kd)})^{${n}}} = ${tn(I * (1 - Math.pow(1 + kd, -n)) / kd)} + ${tn(F / Math.pow(1 + kd, n))} = ${tn(mv)}$ ${inM(cur)}.`, 'mv', mv);
    return withCalc(Q('L4.debt', 4, body, chooseParts(items, 3, 4)), c.steps);
  }
  throw new Error('L4_debt: no valid draw');
}

// =====================================================================
// WACC with market-value weights
// =====================================================================

export function L4_wacc(): Question {
  for (let att = 0; att < 3000; att++) {
    const name = co(), cur = pick([USD, EUR]), M = cur.M;
    const sh = rstep(20, 500, 5), price = rstep(5, 200, 0.5), E = sh * price, D = roundTo(E * rstep(0.1, 0.9, 0.01), 10);
    const t = pick([0.21, 0.25, 0.3, 0.35]), bu = rstep(0.6, 1.4, 0.05), rf = rstep(0.02, 0.06, 0.0025), rm = rf + rstep(0.04, 0.08, 0.0025), kd = rf + rstep(0.005, 0.04, 0.0025);
    const de = D / E, bl = bu * (1 + (1 - t) * de), ke = rf + bl * (rm - rf), wd = D / (D + E), wacc = (1 - wd) * ke + wd * kd * (1 - t);
    const body = p_(`${name} has ${fmtNum(sh)} million shares trading at ${cur.S(price)} each and debt with a market value of ${M(D, 0)}. Its pre-tax cost of debt is ${P(kd, 2)} and the tax rate is ${P(t, 0)}. The unlevered beta of its peers is ${f2(bu)}; use ${HAMADA}. The government bond rate is ${P(rf, 2)} and the expected return on the market is ${P(rm, 2)}.`);
    const items: Item[] = [
      { part: N('What is the market value of equity?', E, cur.mUnit, { key: 'E' }), w: 0.3 },
      { part: N('What is the debt-to-capital ratio D/(D + E)?', wd * 100, 'pct', { key: 'wd' }), w: 0.6 },
      { part: N('What is the levered beta?', bl, 'n', { key: 'bl' }), w: 0.7 },
      { part: N('What is the cost of equity?', ke * 100, 'pct', { key: 'ke' }), w: 0.7 },
      { part: N('What is the WACC?', wacc * 100, 'pct', { key: 'wacc' }), must: true },
    ];
    const c = calc();
    c.r(`**Equity:** $${tn(sh, 0)} \\times ${tn(price)} = ${tn(E)}$ ${inM(cur)}.`, 'E', E);
    c.r(`**Weights:** $D/E = \\frac{${tn(D)}}{${tn(E)}} = ${tn(de, 4)}$; $\\frac{D}{D + E} = \\frac{${tn(D)}}{${tn(D + E)}} = ${tn(wd * 100)}\\%$.`, 'wd', wd * 100);
    c.r(`**Levered beta:** $${tn(bu)} \\times [1 + (1 - ${tn(t)}) \\times ${tn(de, 4)}] = ${tn(bl, 4)}$.`, 'bl', bl);
    c.r(`**Cost of equity:** $${tn(rf * 100)}\\% + ${tn(bl, 4)} \\times (${tn(rm * 100)}\\% - ${tn(rf * 100)}\\%) = ${tn(ke * 100)}\\%$.`, 'ke', ke * 100);
    c.r(`**WACC:** $${tn(1 - wd, 4)} \\times ${tn(ke * 100)}\\% + ${tn(wd, 4)} \\times ${tn(kd * 100)}\\% \\times (1 - ${tn(t)}) = ${tn(wacc * 100)}\\%$.`, 'wacc', wacc * 100);
    return withCalc(Q('L4.wacc', 4, body, chooseParts(items, 3, 4)), c.steps);
  }
  throw new Error('L4_wacc: no valid draw');
}

// =====================================================================
// LECTURE 5 — Emerging markets
// =====================================================================

const EM: [country: string, currency: string][] = [['Brazil', 'real'], ['Indonesia', 'rupiah'], ['India', 'rupee'], ['Mexico', 'peso'], ['Turkey', 'lira'], ['South Africa', 'rand'], ['Colombia', 'peso'], ['Poland', 'zloty'], ['Philippines', 'peso'], ['Chile', 'peso']];

export function L5_rf(): Question {
  for (let att = 0; att < 3000; att++) {
    const [country, ccy] = pick(EM), vr = pick(['dollar', 'euro', 'cds', 'rating'] as const);
    const spread = rstep(0.008, 0.05, 0.0005), local = rstep(0.05, 0.16, 0.0005);
    const c = calc();
    let body: string, sp = spread;
    if (vr === 'dollar' || vr === 'euro') {
      const base = vr === 'dollar' ? rstep(0.025, 0.05, 0.0005) : rstep(0.01, 0.035, 0.0005), fx = base + spread, bench = vr === 'dollar' ? 'US Treasury' : 'German government';
      body = p_(`The government of ${country} has ${ccy}-denominated 10-year bonds yielding ${P(local, 2)}. It has also issued a 10-year ${vr}-denominated bond yielding ${P(fx, 2)}; a 10-year ${bench} bond yields ${P(base, 2)}.`);
      c.r(`**Default spread:** ${vr} bond yield − ${bench} yield $= ${tn(fx * 100)}\\% - ${tn(base * 100)}\\% = ${tn(spread * 100)}\\%$.`, 'sp', spread * 100);
    } else if (vr === 'cds') {
      const us = rstep(0.002, 0.008, 0.0001), cds = spread + us;
      body = p_(`The government of ${country} has ${ccy}-denominated 10-year bonds yielding ${P(local, 2)}. The 10-year sovereign CDS spread for ${country} is ${fmtNum(cds * 10000, 0)} basis points, and the CDS spread for the United States is ${fmtNum(us * 10000, 0)} basis points. Net the US CDS out of the country’s CDS.`);
      c.r(`**Default spread:** $${tn(cds * 100)}\\% - ${tn(us * 100)}\\% = ${tn(spread * 100)}\\%$.`, 'sp', spread * 100);
    } else {
      const rat = pick(['Ba1', 'Ba2', 'Ba3', 'Baa2', 'Baa3', 'B1']);
      body = p_(`${country} has no dollar or euro bonds and no traded CDS. Its local-currency (${ccy}) government bonds yield ${P(local, 2)}, and its sovereign rating is ${rat}, for which the typical sovereign default spread is ${P(spread, 2)}.`);
      c.r(`**Default spread:** from the rating, $${tn(spread * 100)}\\%$.`, 'sp', spread * 100);
      sp = spread;
    }
    const rf = local - sp;
    c.r(`**Local risk-free rate:** local government yield − default spread $= ${tn(local * 100)}\\% - ${tn(sp * 100)}\\% = ${tn(rf * 100)}\\%$.`, 'rf', rf * 100);
    const items: Item[] = [
      { part: N('What default spread do you use for the government?', sp * 100, 'pct', { key: 'sp' }), w: 0.6 },
      { part: N(`What is the ${ccy} risk-free rate?`, rf * 100, 'pct', { key: 'rf' }), must: true },
    ];
    return withCalc(Q('L5.rf', 5, body, chooseParts(items, 1, 2)), c.steps);
  }
  throw new Error('L5_rf: no valid draw');
}

export function L5_crp(): Question {
  for (let att = 0; att < 3000; att++) {
    const [country] = pick(EM);
    const us = rstep(0.045, 0.06, 0.0005), spread = rstep(0.01, 0.045, 0.0001), sE = rstep(0.22, 0.45, 0.01), sB = rstep(0.1, 0.25, 0.01), sUS = rstep(0.14, 0.22, 0.01);
    if (sE <= sB + 0.03 || sE <= sUS + 0.03) continue;
    const t1 = us + spread, crp2 = spread * sE / sB, t2 = us + crp2, t3 = us * sE / sUS, crp3 = t3 - us;
    const body = p_(`You need the equity risk premium for ${country}. The mature-market (US) premium is ${P(us, 2)}. ${poss(country)} dollar-denominated government bond trades at a default spread of ${P(spread, 2)} over US Treasuries. The annualised standard deviation of ${poss(country)} equity index is ${P(sE, 0)}, that of its government bond ${P(sB, 0)}, and that of the US equity market ${P(sUS, 0)}.`);
    const items: Item[] = [
      { part: N('Approach 1 (default spread added to the US premium): what is the total equity risk premium?', t1 * 100, 'pct', { key: 't1' }), w: 0.5 },
      { part: N('Approach 2 (default spread scaled by relative equity-to-bond volatility): what is the country risk premium?', crp2 * 100, 'pct', { key: 'crp2' }), w: 0.6 },
      { part: N('Approach 2: what is the total equity risk premium?', t2 * 100, 'pct', { key: 't2' }), w: 0.5 },
      { part: N(`Approach 3 (relative equity market volatility): what is the total equity risk premium for ${country}?`, t3 * 100, 'pct', { key: 't3' }), w: 0.6 },
      { part: N('Approach 3: what is the country-specific part of that premium?', crp3 * 100, 'pct', { key: 'crp3' }), w: 0.4 },
    ];
    const c = calc();
    c.r(`**Approach 1:** $${tn(us * 100)}\\% + ${tn(spread * 100)}\\% = ${tn(t1 * 100)}\\%$.`, 't1', t1 * 100);
    c.r(`**Approach 2, CRP:** $\\text{spread} \\times \\frac{\\sigma_{Equity}}{\\sigma_{Bond}} = ${tn(spread * 100)}\\% \\times \\frac{${tn(sE * 100, 0)}\\%}{${tn(sB * 100, 0)}\\%} = ${tn(crp2 * 100)}\\%$.`, 'crp2', crp2 * 100);
    c.r(`**Approach 2, total:** $${tn(us * 100)}\\% + ${tn(crp2 * 100)}\\% = ${tn(t2 * 100)}\\%$.`, 't2', t2 * 100);
    c.r(`**Approach 3, total:** $ERP_{US} \\times \\frac{\\sigma_{${country.replace(/ /g, '\\ ')}}}{\\sigma_{US}} = ${tn(us * 100)}\\% \\times \\frac{${tn(sE * 100, 0)}\\%}{${tn(sUS * 100, 0)}\\%} = ${tn(t3 * 100)}\\%$.`, 't3', t3 * 100);
    c.r(`**Approach 3, country part:** $${tn(t3 * 100)}\\% - ${tn(us * 100)}\\% = ${tn(crp3 * 100)}\\%$.`, 'crp3', crp3 * 100);
    return withCalc(Q('L5.crp', 5, body, chooseParts(items, 2, 4)), c.steps);
  }
  throw new Error('L5_crp: no valid draw');
}

export function L5_ke(): Question {
  const name = co(), [country] = pick(EM);
  const rf = rstep(0.02, 0.05, 0.0025), beta = pick([rstep(0.6, 0.9, 0.05), rstep(1.1, 1.5, 0.05)]), us = rstep(0.045, 0.06, 0.0025), crp = rstep(0.01, 0.06, 0.0025), lam = rstep(0.2, 1.4, 0.05);
  const k1 = rf + crp + beta * us, k2 = rf + beta * (us + crp), k3 = rf + beta * us + lam * crp;
  const share = Math.min(0.95, lam * 0.6);
  const body = p_(`${name} operates mainly in ${country}. Its beta is ${f2(beta)}, the dollar risk-free rate is ${P(rf, 2)}, the mature-market premium is ${P(us, 2)} and the country risk premium for ${country} is ${P(crp, 2)}. Based on its revenue exposure (${P(share, 0)} of sales in ${country}, against ${P(0.6, 0)} for the average local firm), ${poss(name)} exposure to country risk is λ = ${f2(lam)}.`);
  const items: Item[] = [
    { part: N('Cost of equity with the additive approach, r<sub>f</sub> + CRP + β × ERP<sub>US</sub>?', k1 * 100, 'pct', { key: 'k1' }), must: true },
    { part: N('Cost of equity with the integrated approach, r<sub>f</sub> + β × (ERP<sub>US</sub> + CRP)?', k2 * 100, 'pct', { key: 'k2' }), must: true },
    { part: N('Cost of equity with country risk as a separate factor, r<sub>f</sub> + β × ERP<sub>US</sub> + λ × CRP?', k3 * 100, 'pct', { key: 'k3' }), w: 0.7 },
  ];
  const c = calc();
  c.r(`**Additive:** $${tn(rf * 100)}\\% + ${tn(crp * 100)}\\% + ${tn(beta)} \\times ${tn(us * 100)}\\% = ${tn(k1 * 100)}\\%$.`, 'k1', k1 * 100);
  c.r(`**Integrated (beta-scaled):** $${tn(rf * 100)}\\% + ${tn(beta)} \\times (${tn(us * 100)}\\% + ${tn(crp * 100)}\\%) = ${tn(k2 * 100)}\\%$.`, 'k2', k2 * 100);
  c.r(`**Lambda approach:** $\\lambda = ${tn(lam)}$ (here ${tn(share * 100, 0)}% ÷ 60%); $${tn(rf * 100)}\\% + ${tn(beta)} \\times ${tn(us * 100)}\\% + ${tn(lam)} \\times ${tn(crp * 100)}\\% = ${tn(k3 * 100)}\\%$.`, 'k3', k3 * 100);
  return withCalc(Q('L5.ke', 5, body, chooseParts(items, 2, 3)), c.steps);
}

