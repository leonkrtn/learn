// Financial Investments: procedural generators for lectures 1–6 (CAPM, APT/EMH, performance, active management,
// estimation error, hedge funds). Inputs are drawn fresh each time; every solution is computed from the same inputs.
import { C, N, P, Q, calc, chance, chooseParts, co, fmtNum, p_, pick, poss, rint, roundTo, rstep, shuffle, table, tn, tp, tq, v, withCalc, type Item } from '@/lib/engine/gen-helpers';
import type { Part, Question } from '@/lib/engine/types';

const pp = (x: number, d = 2) => P(x, d);
const usd = (x: number, d = 0) => (x < 0 ? '−' : '') + '$' + fmtNum(Math.abs(x), d);
const NOTE_PCT = 'Enter returns in percent, e.g. 8.33 for 8.33%.';
const FUNDS = ['Atlas', 'Borealis', 'Cedar', 'Delta', 'Ember', 'Fjord', 'Granite', 'Helix', 'Ionic', 'Juniper', 'Kite', 'Lumen', 'Meridian', 'Nimbus', 'Onyx', 'Polaris'];
const fund = (s: string) => pick(FUNDS) + ' ' + s;
const POSSIBLE = ['Possible', 'Not possible'];
/** A fraction as a percentage, parenthesised when negative (for use after an operator). */
const tpq = (x: number, d = 2) => (x < 0 ? '(' + tp(x, d) + ')' : tp(x, d));

// =====================================================================
// LECTURE 1 — CAPM
// =====================================================================

/** SML: fair return, alpha, implied beta, price effect of a higher beta, project cost of capital. */
export function L1_capm(): Question {
  const name = co(), rf = rstep(0.01, 0.06, 0.0025), mrp = rstep(0.04, 0.08, 0.0025);
  const vr = rint(0, 3);
  if (vr === 0) {
    const beta = rstep(0.3, 2, 0.05), fair = rf + beta * mrp, fc = roundTo(fair + rstep(-0.04, 0.04, 0.0025), 0.0025);
    if (Math.abs(fc - fair) < 0.002) return L1_capm();
    const body = p_(`${name} has a beta of ${fmtNum(beta)}. The risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}. An analyst forecasts a return of ${pp(fc)} for the stock. ${NOTE_PCT}`);
    const items: Item[] = [
      { part: N(v('What is the fair (required) return according to the CAPM?', 'What is the equilibrium expected return of the stock in a CAPM world?'), fair * 100, 'pct', { key: 'fair' }), must: true },
      { part: N('What is the alpha of the stock given the analyst’s forecast?', (fc - fair) * 100, 'pct', { key: 'alpha' }), w: 0.8 },
      { part: C('Relative to the SML, the stock is', ['Underpriced', 'Overpriced'], fc > fair ? 0 : 1, 'pos'), w: 0.7 },
    ];
    const k = calc();
    k.r(`**Fair return (SML):** $E[r] = r_f + \\beta \\times MRP = ${tp(rf)} + ${tn(beta)} \\times ${tp(mrp)} = ${tp(rf)} + ${tp(beta * mrp, 4)} = ${tp(fair, 4)}$.`, 'fair', fair * 100);
    k.r(`**Alpha:** $\\alpha = E[r]_{forecast} - E[r]_{fair} = ${tp(fc)} - ${tp(fair, 4)} = ${tp(fc - fair, 4)}$.`, 'alpha', (fc - fair) * 100);
    k.r(`**Position relative to the SML:** the forecast of $${tp(fc)}$ is ${fc > fair ? 'above' : 'below'} the fair return of $${tp(fair, 4)}$, so alpha is ${fc > fair ? 'positive' : 'negative'} and the stock is ${fc > fair ? 'underpriced' : 'overpriced'}.`, 'pos');
    return withCalc(Q('L1.capm', 1, body, chooseParts(items, 2, 3)), k.steps);
  }
  if (vr === 1) {
    const er = rstep(rf - 0.03, rf + 0.12, 0.0025), beta = (er - rf) / mrp;
    const body = p_(`In a CAPM world the risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}. ${name} has an expected return of ${pp(er)}.`);
    const parts: Part[] = [N('What is the beta of the stock? (A negative beta is possible.)', beta, 'n', { key: 'beta' })];
    if (chance(0.5)) parts.push(N('What is the expected return of a portfolio with 60% in this stock and 40% in the market?', (0.6 * er + 0.4 * (rf + mrp)) * 100, 'pct', { key: 'port' }));
    const k = calc(), pf = 0.6 * er + 0.4 * (rf + mrp);
    k.r(`**Beta:** from the SML $E[r] = r_f + \\beta \\times MRP$ we get $\\beta = \\frac{E[r] - r_f}{MRP} = \\frac{${tp(er)} - ${tp(rf)}}{${tp(mrp)}} = \\frac{${tp(er - rf, 4)}}{${tp(mrp)}} = ${tn(beta, 4)}$.`, 'beta', beta);
    k.r(`**Portfolio return:** the market returns $r_f + MRP = ${tp(rf)} + ${tp(mrp)} = ${tp(rf + mrp, 4)}$, so $E[r_P] = 0.60 \\times ${tp(er)} + 0.40 \\times ${tp(rf + mrp, 4)} = ${tpq(0.6 * er, 4)} + ${tp(0.4 * (rf + mrp), 4)} = ${tp(pf, 4)}$.`, 'port', pf * 100);
    return withCalc(Q('L1.capm', 1, body, parts), k.steps);
  }
  if (vr === 2) {
    for (let t = 0; t < 200; t++) {
      const P0 = rstep(20, 150, 0.5), er = rstep(rf + 0.03, rf + 0.1, 0.0025), kf = pick([1.5, 2, 0.5]);
      const b0 = (er - rf) / mrp, er1 = rf + kf * b0 * mrp;
      if (er1 < 0.02) continue;
      const D = er * P0, P1 = D / er1;
      const word = { 1.5: 'rises by 50%', 2: 'doubles', 0.5: 'halves' }[kf];
      const body = p_(`The market price of ${poss(name)} shares is $${fmtNum(P0)}. The stock pays a constant dividend in perpetuity and its expected return is ${pp(er)}. The risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}. Suppose the correlation of the stock with the market ${word}, all else unchanged.`);
      const items: Item[] = [
        { part: N('What is the dividend per share?', D, 'usd', { key: 'D' }), w: 0.4 },
        { part: N('What is the beta of the stock today?', b0, 'n', { key: 'b0' }), w: 0.6 },
        { part: N('What is the new expected return?', er1 * 100, 'pct', { key: 'er1' }), w: 0.6 },
        { part: N('What is the new share price?', P1, 'usd', { key: 'P1' }), must: true },
      ];
      const k = calc(), bN = kf * b0;
      k.r(`**Dividend:** a perpetuity with price $P_0$ and return $E[r]$ pays $D = E[r] \\times P_0 = ${tp(er)} \\times ${tn(P0)} = ${tn(D, 4)}$ (USD).`, 'D', D);
      k.r(`**Beta today:** $\\beta = \\frac{E[r] - r_f}{MRP} = \\frac{${tp(er)} - ${tp(rf)}}{${tp(mrp)}} = \\frac{${tp(er - rf, 4)}}{${tp(mrp)}} = ${tn(b0, 4)}$.`, 'b0', b0);
      k.s(`**New beta:** the correlation ${word}, so beta is multiplied by ${tn(kf, 2)}: $${tn(kf, 2)} \\times ${tn(b0, 4)} = ${tn(bN, 4)}$.`);
      k.r(`**New expected return:** $r_f + \\beta_{new} \\times MRP = ${tp(rf)} + ${tn(bN, 4)} \\times ${tp(mrp)} = ${tp(rf)} + ${tp(bN * mrp, 4)} = ${tp(er1, 4)}$.`, 'er1', er1 * 100);
      k.r(`**New price:** the dividend stays constant, so $P_1 = \\frac{D}{E[r]_{new}} = \\frac{${tn(D, 4)}}{${tn(er1, 6)}} = ${tn(P1, 4)}$ (USD).`, 'P1', P1);
      return withCalc(Q('L1.capm', 1, body, chooseParts(items, 2, 4)), k.steps);
    }
  }
  const bCo = rstep(1.2, 2.4, 0.05), bProj = rstep(0.3, 0.9, 0.05), proj = co();
  const body = p_(`${name} has an equity beta of ${fmtNum(bCo)}. It plans a project in a new line of business whose risk matches that of ${proj}, a pure-play firm with a beta of ${fmtNum(bProj)}. The risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}.`);
  const items: Item[] = [
    { part: N('What cost of capital should be used for the project?', (rf + bProj * mrp) * 100, 'pct', { key: 'proj' }), must: true },
    { part: N(`What is the cost of equity of ${name} as a whole?`, (rf + bCo * mrp) * 100, 'pct', { key: 'co' }), w: 0.5 },
  ];
  const k = calc();
  k.r(`**Project cost of capital:** use the beta of the pure-play firm, $r = r_f + \\beta_{proj} \\times MRP = ${tp(rf)} + ${tn(bProj)} \\times ${tp(mrp)} = ${tp(rf)} + ${tp(bProj * mrp, 4)} = ${tp(rf + bProj * mrp, 4)}$.`, 'proj', (rf + bProj * mrp) * 100);
  k.r(`**Cost of equity of the whole firm:** $r = r_f + \\beta \\times MRP = ${tp(rf)} + ${tn(bCo)} \\times ${tp(mrp)} = ${tp(rf)} + ${tp(bCo * mrp, 4)} = ${tp(rf + bCo * mrp, 4)}$.`, 'co', (rf + bCo * mrp) * 100);
  return withCalc(Q('L1.capm', 1, body, chooseParts(items, 1, 2)), k.steps);
}

/** Two market scenarios: betas, expected returns, SML and alphas. */
export function L1_scenario(): Question {
  for (let t = 0; t < 500; t++) {
    const A = co(), B = co(), p = chance(0.6) ? 0.5 : pick([0.4, 0.6, 0.3, 0.7]);
    const m1 = rstep(-0.06, 0.04, 0.01), m2 = m1 + rstep(0.1, 0.3, 0.01);
    const bA = rstep(1.2, 2.5, 0.05), bB = rstep(0.2, 0.9, 0.05);
    const a1 = roundTo(rstep(-0.08, 0.04, 0.01), 0.01), b1 = roundTo(rstep(0, 0.08, 0.01), 0.01);
    const a2 = roundTo(a1 + bA * (m2 - m1), 0.01), b2 = roundTo(b1 + bB * (m2 - m1), 0.01);
    const betaA = (a2 - a1) / (m2 - m1), betaB = (b2 - b1) / (m2 - m1);
    const eM = p * m1 + (1 - p) * m2, eA = p * a1 + (1 - p) * a2, eB = p * b1 + (1 - p) * b2;
    const rf = rstep(0.01, 0.07, 0.005);
    if (eM - rf < 0.02) continue;
    const alA = eA - (rf + betaA * (eM - rf)), alB = eB - (rf + betaB * (eM - rf));
    if (Math.abs(alA) < 0.002 || Math.abs(alB) < 0.002) continue;
    const pr = p === 0.5 ? 'equally likely' : `with probabilities ${P(p, 0)} and ${P(1 - p, 0)}`;
    const body = p_(`An analyst forecasts returns for two stocks in two market scenarios, ${pr}. The risk-free rate is ${pp(rf, 1)}. ${NOTE_PCT}`) +
      table(['Scenario', 'Market return', A, B], [['1', pp(m1, 0), pp(a1, 0), pp(b1, 0)], ['2', pp(m2, 0), pp(a2, 0), pp(b2, 0)]]);
    const items: Item[] = [
      { part: N(`What is the beta of ${A}?`, betaA, 'n', { key: 'betaA' }), must: true },
      { part: N(`What is the beta of ${B}?`, betaB, 'n', { key: 'betaB' }), w: 0.6 },
      { part: N(`What is the expected return of ${A}?`, eA * 100, 'pct', { key: 'eA' }), w: 0.5 },
      { part: N('What is the slope of the SML (the expected market risk premium)?', (eM - rf) * 100, 'pct', { key: 'slope' }), w: 0.5 },
      { part: N(`What is the alpha of ${A}?`, alA * 100, 'pct', { key: 'alA' }), must: true },
      { part: N(`What is the alpha of ${B}?`, alB * 100, 'pct', { key: 'alB' }), w: 0.5 },
      { part: C(`${A} is`, ['Underpriced', 'Overpriced'], alA > 0 ? 0 : 1, 'verdict'), w: 0.4 },
    ];
    const k = calc(), p2 = 1 - p;
    k.r(`**Beta of ${A}:** the slope between the two scenarios, $\\beta_A = \\frac{r_{A,2} - r_{A,1}}{r_{M,2} - r_{M,1}} = \\frac{${tp(a2, 1)} - ${tpq(a1, 1)}}{${tp(m2, 1)} - ${tpq(m1, 1)}} = \\frac{${tp(a2 - a1, 1)}}{${tp(m2 - m1, 1)}} = ${tn(betaA, 4)}$.`, 'betaA', betaA);
    k.r(`**Beta of ${B}:** $\\beta_B = \\frac{${tp(b2, 1)} - ${tpq(b1, 1)}}{${tp(m2, 1)} - ${tpq(m1, 1)}} = \\frac{${tp(b2 - b1, 1)}}{${tp(m2 - m1, 1)}} = ${tn(betaB, 4)}$.`, 'betaB', betaB);
    k.r(`**Expected return of ${A}:** $E[r_A] = p \\, r_{A,1} + (1 - p) \\, r_{A,2} = ${tn(p, 2)} \\times ${tpq(a1, 1)} + ${tn(p2, 2)} \\times ${tpq(a2, 1)} = ${tpq(p * a1, 3)} + ${tpq(p2 * a2, 3)} = ${tp(eA, 3)}$.`, 'eA', eA * 100);
    k.s(`**Expected return of ${B}:** $E[r_B] = ${tn(p, 2)} \\times ${tpq(b1, 1)} + ${tn(p2, 2)} \\times ${tpq(b2, 1)} = ${tpq(p * b1, 3)} + ${tpq(p2 * b2, 3)} = ${tp(eB, 3)}$.`);
    k.s(`**Expected market return:** $E[r_M] = ${tn(p, 2)} \\times ${tpq(m1, 1)} + ${tn(p2, 2)} \\times ${tpq(m2, 1)} = ${tpq(p * m1, 3)} + ${tpq(p2 * m2, 3)} = ${tp(eM, 3)}$.`);
    k.r(`**SML slope:** $E[r_M] - r_f = ${tp(eM, 3)} - ${tp(rf, 1)} = ${tp(eM - rf, 3)}$.`, 'slope', (eM - rf) * 100);
    k.r(`**Alpha of ${A}:** $\\alpha_A = E[r_A] - \\left(r_f + \\beta_A (E[r_M] - r_f)\\right) = ${tp(eA, 3)} - (${tp(rf, 1)} + ${tn(betaA, 4)} \\times ${tp(eM - rf, 3)}) = ${tp(eA, 3)} - ${tp(rf + betaA * (eM - rf), 4)} = ${tp(alA, 4)}$.`, 'alA', alA * 100);
    k.r(`**Alpha of ${B}:** $\\alpha_B = ${tp(eB, 3)} - (${tp(rf, 1)} + ${tn(betaB, 4)} \\times ${tp(eM - rf, 3)}) = ${tp(eB, 3)} - ${tp(rf + betaB * (eM - rf), 4)} = ${tp(alB, 4)}$.`, 'alB', alB * 100);
    k.r(`**Verdict:** the alpha of ${A} is ${alA > 0 ? 'positive' : 'negative'} ($${tp(alA, 4)}$), so it plots ${alA > 0 ? 'above' : 'below'} the SML and is ${alA > 0 ? 'underpriced' : 'overpriced'}.`, 'verdict');
    return withCalc(Q('L1.scenario', 1, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L1_scenario: no valid draw');
}

/** Single-index model: beta from variances, residual risk, covariances, R². */
export function L1_sim(): Question {
  const name = co(), other = co();
  const sM = rstep(0.12, 0.25, 0.01), beta = rstep(0.4, 2.2, 0.05), se = rstep(0.05, 0.3, 0.01);
  const vi = beta * beta * sM * sM + se * se, si = Math.sqrt(vi);
  const b2 = rstep(0.4, 1.8, 0.05), se2 = rstep(0.05, 0.3, 0.01), si2 = Math.sqrt(b2 * b2 * sM * sM + se2 * se2);
  const cov = beta * b2 * sM * sM;
  const vr = rint(0, 1);
  if (vr === 0) {
    const body = p_(`Returns of ${name} have a variance of ${fmtNum(vi, 4)} and covary positively with the market. The market has a standard deviation of ${fmtNum(sM)}, and the residuals of ${name} with respect to the market have a standard deviation of ${fmtNum(se)}. Assume the single-index model holds.`);
    const items: Item[] = [
      { part: N(`What is the market beta of ${name}?`, beta, 'n', { key: 'beta' }), must: true },
      { part: N('What share of the total variance is systematic (the R² of the market regression)?', beta * beta * sM * sM / vi * 100, 'pct', { key: 'r2' }), w: 0.6 },
      { part: N(`${other} has a beta of ${fmtNum(b2)}. What is the covariance between the two stocks?`, cov, 'n', { abs: 0.0002, key: 'cov' }), w: 0.5 },
    ];
    const k = calc(), sys = beta * beta * sM * sM;
    k.r(`**Beta:** total variance = systematic + residual, $\\sigma_i^2 = \\beta^2 \\sigma_M^2 + \\sigma_\\varepsilon^2$, so $\\beta = \\sqrt{\\frac{\\sigma_i^2 - \\sigma_\\varepsilon^2}{\\sigma_M^2}} = \\sqrt{\\frac{${tn(vi, 6)} - ${tn(se * se, 6)}}{${tn(sM * sM, 6)}}} = \\sqrt{\\frac{${tn(vi - se * se, 6)}}{${tn(sM * sM, 6)}}} = \\sqrt{${tn(beta * beta, 6)}} = ${tn(beta, 4)}$ (positive covariance with the market, so the positive root).`, 'beta', beta);
    k.r(`**Systematic share (R²):** $\\beta^2 \\sigma_M^2 = ${tn(beta, 4)}^2 \\times ${tn(sM, 4)}^2 = ${tn(beta * beta, 6)} \\times ${tn(sM * sM, 6)} = ${tn(sys, 6)}$, so $R^2 = \\frac{${tn(sys, 6)}}{${tn(vi, 6)}} = ${tn(sys / vi, 6)}$, i.e. $${tp(sys / vi, 4)}$.`, 'r2', sys / vi * 100);
    k.r(`**Covariance:** $\\sigma_{ij} = \\beta_i \\beta_j \\sigma_M^2 = ${tn(beta, 4)} \\times ${tn(b2, 2)} \\times ${tn(sM * sM, 6)} = ${tn(cov, 6)}$.`, 'cov', cov);
    return withCalc(Q('L1.sim', 1, body, chooseParts(items, 2, 3)), k.steps);
  }
  const r2 = beta * beta * sM * sM / vi;
  const body = p_(`A market regression for ${name} gives a beta of ${fmtNum(beta)} and an R² of ${P(r2, 2)}. The total standard deviation of ${name} is ${P(si, 2)} and that of the market is ${P(sM, 0)}. ${other} has a beta of ${fmtNum(b2)} and a standard deviation of ${P(si2, 2)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N(`What is the standard deviation of the residuals of ${name}?`, se * 100, 'pct', { key: 'se' }), must: true },
    { part: N('What is the correlation between the two stocks implied by the single-index model?', cov / (si * si2), 'n', { key: 'corr' }), w: 0.6 },
    { part: N(`What is the systematic standard deviation (β × σ_M) of ${name}?`, beta * sM * 100, 'pct', { key: 'sys' }), w: 0.4 },
  ];
  const k = calc();
  k.r(`**Residual standard deviation:** the unexplained share of variance is $1 - R^2$, so $\\sigma_\\varepsilon = \\sigma_i \\sqrt{1 - R^2} = ${tn(si, 6)} \\times \\sqrt{1 - ${tn(r2, 6)}} = ${tn(si, 6)} \\times ${tn(Math.sqrt(1 - r2), 6)} = ${tn(se, 6)}$, i.e. $${tp(se, 4)}$.`, 'se', se * 100);
  k.s(`**Covariance:** $\\sigma_{ij} = \\beta_i \\beta_j \\sigma_M^2 = ${tn(beta, 2)} \\times ${tn(b2, 2)} \\times ${tn(sM, 4)}^2 = ${tn(beta * b2, 4)} \\times ${tn(sM * sM, 6)} = ${tn(cov, 6)}$.`);
  k.r(`**Correlation:** $\\rho = \\frac{\\sigma_{ij}}{\\sigma_i \\sigma_j} = \\frac{${tn(cov, 6)}}{${tn(si, 6)} \\times ${tn(si2, 6)}} = \\frac{${tn(cov, 6)}}{${tn(si * si2, 6)}} = ${tn(cov / (si * si2), 4)}$.`, 'corr', cov / (si * si2));
  k.r(`**Systematic standard deviation:** $\\beta \\sigma_M = ${tn(beta, 2)} \\times ${tn(sM, 4)} = ${tn(beta * sM, 6)}$, i.e. $${tp(beta * sM, 4)}$.`, 'sys', beta * sM * 100);
  return withCalc(Q('L1.sim', 1, body, chooseParts(items, 2, 3)), k.steps);
}

/** CAL of an individual asset, CML, volatility of a well-diversified portfolio, risk aversion. */
export function L1_cml(): Question {
  const rf = rstep(0.01, 0.06, 0.005), mrp = rstep(0.04, 0.09, 0.005), sM = rstep(0.14, 0.25, 0.01);
  const srM = mrp / sM, rho = rstep(0.1, 0.9, 0.05), er = rf + rstep(0.02, 0.12, 0.005);
  const beta = (er - rf) / mrp;
  const name = co();
  const body = p_(`In a CAPM world the risk-free rate is ${pp(rf, 1)}, the market risk premium is ${pp(mrp, 1)} and the market’s standard deviation is ${pp(sM, 0)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the Sharpe ratio of the market (the slope of the CML)?', srM, 'n', { key: 'srM' }), w: 0.5 },
    { part: N(`${name} has a correlation of ${fmtNum(rho)} with the market. What is the slope of the CAL spanned by ${name}?`, rho * srM, 'n', { key: 'cal' }), w: 0.7 },
    { part: N(`A well-diversified portfolio with no specific risk has an expected return of ${pp(er, 1)}. What is its standard deviation?`, beta * sM * 100, 'pct', { key: 'sd' }), must: true },
    { part: N('What average coefficient of risk aversion is consistent with these market values (A = E[R_M]/σ²_M)?', mrp / (sM * sM), 'n', { key: 'A' }), w: 0.4 },
    { part: N(`What expected return does the CML give for an efficient portfolio with a standard deviation of ${pp(sM * 0.6, 1)}?`, (rf + srM * sM * 0.6) * 100, 'pct', { key: 'cml' }), w: 0.4 },
  ];
  const k = calc();
  k.r(`**Market Sharpe ratio:** $SR_M = \\frac{E[R_M]}{\\sigma_M} = \\frac{${tp(mrp, 1)}}{${tp(sM, 1)}} = ${tn(srM, 4)}$ (the slope of the CML).`, 'srM', srM);
  k.r(`**CAL slope of ${name}:** $\\rho \\times SR_M = ${tn(rho, 2)} \\times ${tn(srM, 4)} = ${tn(rho * srM, 4)}$.`, 'cal', rho * srM);
  k.s(`**Beta of the portfolio:** it lies on the SML, $\\beta = \\frac{E[r] - r_f}{MRP} = \\frac{${tp(er, 1)} - ${tp(rf, 1)}}{${tp(mrp, 1)}} = \\frac{${tp(er - rf, 2)}}{${tp(mrp, 1)}} = ${tn(beta, 4)}$.`);
  k.r(`**Standard deviation:** with no specific risk the portfolio has only systematic risk, $\\sigma = \\beta \\sigma_M = ${tn(beta, 4)} \\times ${tp(sM, 1)} = ${tp(beta * sM, 4)}$.`, 'sd', beta * sM * 100);
  k.r(`**Risk aversion:** $A = \\frac{E[R_M]}{\\sigma_M^2} = \\frac{${tn(mrp, 4)}}{${tn(sM, 4)}^2} = \\frac{${tn(mrp, 4)}}{${tn(sM * sM, 6)}} = ${tn(mrp / (sM * sM), 4)}$.`, 'A', mrp / (sM * sM));
  k.r(`**CML return:** $E[r] = r_f + SR_M \\times \\sigma = ${tp(rf, 1)} + ${tn(srM, 4)} \\times ${tp(sM * 0.6, 2)} = ${tp(rf, 1)} + ${tp(srM * sM * 0.6, 4)} = ${tp(rf + srM * sM * 0.6, 4)}$.`, 'cml', (rf + srM * sM * 0.6) * 100);
  return withCalc(Q('L1.cml', 1, body, chooseParts(items, 2, 4)), k.steps);
}

/** Zero-beta CAPM and mimicking portfolios. */
export function L1_zeroBeta(): Question {
  if (chance(0.5)) {
    const ez = rstep(0.03, 0.08, 0.005), em = ez + rstep(0.04, 0.1, 0.005), b = rstep(0.2, 1.8, 0.05);
    const body = p_(`Borrowing is not allowed in this market, so the zero-beta version of the CAPM holds (Black, 1972). The expected return of the stock market is ${pp(em, 1)} and that of its zero-beta companion portfolio is ${pp(ez, 1)}.`);
    const items: Item[] = [
      { part: N(`What is the expected return of a stock with a beta of ${fmtNum(b)}?`, (ez + b * (em - ez)) * 100, 'pct', { key: 'er' }), must: true },
      { part: C('Relative to the standard CAPM with a lower risk-free rate, the zero-beta SML is', ['Flatter', 'Steeper', 'Identical'], 0, 'slope'), w: 0.4 },
    ];
    const k = calc();
    k.r(`**Expected return:** $E[r] = E[r_z] + \\beta \\, (E[r_M] - E[r_z]) = ${tp(ez, 1)} + ${tn(b)} \\times (${tp(em, 1)} - ${tp(ez, 1)}) = ${tp(ez, 1)} + ${tn(b)} \\times ${tp(em - ez, 2)} = ${tp(ez, 1)} + ${tp(b * (em - ez), 4)} = ${tp(ez + b * (em - ez), 4)}$.`, 'er', (ez + b * (em - ez)) * 100);
    k.r(`**Slope:** the zero-beta SML has slope $E[r_M] - E[r_z] = ${tp(em - ez, 2)}$. The zero-beta portfolio earns more than the risk-free rate, so this is smaller than the standard slope $E[r_M] - r_f$, and the line is flatter.`, 'slope');
    return withCalc(Q('L1.zeroBeta', 1, body, chooseParts(items, 1, 2)), k.steps);
  }
  const etf = fund('ETF'), rf = rstep(0.01, 0.06, 0.005), mrp = rstep(0.03, 0.08, 0.005), b = rstep(0.4, 1.6, 0.02);
  const er = rf + b * mrp + rstep(-0.03, 0.04, 0.0025);
  const mim = b * (rf + mrp) + (1 - b) * rf;
  const body = p_(`The ${etf} has an expected return of ${pp(er)} and a beta of ${fmtNum(b)}. The risk-free rate is ${pp(rf, 1)} and the market risk premium is ${pp(mrp, 1)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the alpha of the ETF?', (er - rf - b * mrp) * 100, 'pct', { key: 'alpha' }), must: true },
    { part: N('A mimicking portfolio holds only the market and T-bills with the same systematic risk. What weight does it put in the market? (Enter as a decimal, e.g. 0.72.)', b, 'n', { key: 'w' }), w: 0.6 },
    { part: N('What is the expected return of the mimicking portfolio?', mim * 100, 'pct', { key: 'mim' }), w: 0.6 },
  ];
  const k = calc();
  k.r(`**Alpha:** $\\alpha = E[r] - \\left(r_f + \\beta \\times MRP\\right) = ${tp(er)} - (${tp(rf, 1)} + ${tn(b)} \\times ${tp(mrp, 1)}) = ${tp(er)} - ${tp(rf + b * mrp, 4)} = ${tp(er - rf - b * mrp, 4)}$.`, 'alpha', (er - rf - b * mrp) * 100);
  k.r(`**Market weight:** the market has a beta of 1 and T-bills a beta of 0, so matching a beta of ${tn(b)} needs a market weight of $w = \\beta = ${tn(b)}$ (and ${tn(1 - b, 2)} in T-bills).`, 'w', b);
  k.r(`**Expected return:** $E[r_{mim}] = w \\, (r_f + MRP) + (1 - w) \\, r_f = ${tn(b)} \\times ${tp(rf + mrp, 2)} + ${tn(1 - b, 2)} \\times ${tp(rf, 1)} = ${tp(b * (rf + mrp), 4)} + ${tp((1 - b) * rf, 4)} = ${tp(mim, 4)}$.`, 'mim', mim * 100);
  return withCalc(Q('L1.zeroBeta', 1, body, chooseParts(items, 2, 3)), k.steps);
}

/** Which situations can occur in a CAPM equilibrium? */
export function L1_equilibrium(): Question {
  const rf = rstep(0.02, 0.06, 0.01), em = rf + rstep(0.04, 0.1, 0.01), sM = rstep(0.15, 0.3, 0.01);
  const kind = rint(0, 3);
  let html: string, ok: boolean, extra: Part | null = null;
  const k = calc();
  if (kind === 0) {
    const bA = rstep(0.8, 1.8, 0.1), bB = +(bA + pick([-1, 1]) * rstep(0.1, 0.5, 0.1)).toFixed(2);
    const eA = rstep(0.08, 0.25, 0.01), eB = +(eA + pick([-1, 1]) * rstep(0.01, 0.06, 0.01)).toFixed(4);
    ok = (bA - bB) * (eA - eB) > 0;
    html = table(['Portfolio', 'E[r]', 'β'], [['A', pp(eA, 0), fmtNum(bA)], ['B', pp(eB, 0), fmtNum(bB)]]);
    k.r(`**Check the ordering:** on the SML a higher beta must come with a higher expected return. $\\beta_A - \\beta_B = ${tn(bA)} - ${tq(bB)} = ${tn(bA - bB)}$ and $E[r_A] - E[r_B] = ${tp(eA, 0)} - ${tpq(eB, 0)} = ${tp(eA - eB, 0)}$. The two differences have ${ok ? 'the same sign' : 'opposite signs'}, so this situation is ${ok ? 'possible' : 'not possible'}.`, 'ok');
  } else if (kind === 1) {
    const sA = rstep(0.15, 0.4, 0.01), sB = rstep(0.15, 0.4, 0.01), eA = rstep(0.1, 0.35, 0.01), eB = rstep(0.1, 0.35, 0.01);
    ok = true;
    html = table(['Portfolio', 'E[r]', 'σ'], [['A', pp(eA, 0), pp(sA, 0)], ['B', pp(eB, 0), pp(sB, 0)]]);
    k.r(`**Check:** the CAPM only prices systematic risk. Portfolio A has $\\sigma_A = ${tp(sA, 0)}$ and $E[r_A] = ${tp(eA, 0)}$, portfolio B has $\\sigma_B = ${tp(sB, 0)}$ and $E[r_B] = ${tp(eB, 0)}$. A portfolio with specific risk can have any total standard deviation for a given beta, so any combination is possible.`, 'ok');
  } else if (kind === 2) {
    const sA = rstep(0.08, 0.35, 0.01), above = chance(0.5);
    const eA = roundTo(rf + (em - rf) / sM * sA * (above ? rstep(1.05, 1.5, 0.05) : rstep(0.4, 0.95, 0.05)), 0.0025);
    ok = (eA - rf) / sA <= (em - rf) / sM + 1e-9;
    html = table(['Portfolio', 'E[r]', 'σ'], [['Risk-free', pp(rf, 0), '0%'], ['Market', pp(em, 0), pp(sM, 0)], ['A', pp(eA, 2), pp(sA, 0)]]);
    extra = N('What is the Sharpe ratio of A?', (eA - rf) / sA, 'n', { key: 'sharpe' });
    k.r(`**Sharpe ratio of A:** $SR_A = \\frac{E[r_A] - r_f}{\\sigma_A} = \\frac{${tp(eA, 2)} - ${tp(rf, 0)}}{${tp(sA, 0)}} = \\frac{${tp(eA - rf, 2)}}{${tp(sA, 0)}} = ${tn((eA - rf) / sA, 4)}$.`, 'sharpe', (eA - rf) / sA);
    k.r(`**Check against the CML:** $SR_M = \\frac{${tp(em, 0)} - ${tp(rf, 0)}}{${tp(sM, 0)}} = ${tn((em - rf) / sM, 4)}$. No portfolio can have a Sharpe ratio above the market's, and $${tn((eA - rf) / sA, 4)} ${(eA - rf) / sA <= (em - rf) / sM + 1e-9 ? '\\le' : '>'} ${tn((em - rf) / sM, 4)}$, so this situation is ${ok ? 'possible' : 'not possible'}.`, 'ok');
  } else {
    const bA = rstep(0.3, 1.8, 0.1), onLine = chance(0.4);
    const eA = onLine ? rf + bA * (em - rf) : roundTo(rf + bA * (em - rf) + pick([-1, 1]) * rstep(0.005, 0.04, 0.0025), 0.0025);
    ok = Math.abs(eA - rf - bA * (em - rf)) < 1e-9;
    html = table(['Portfolio', 'E[r]', 'β'], [['Risk-free', pp(rf, 0), '0'], ['Market', pp(em, 0), '1'], ['A', pp(eA, 2), fmtNum(bA)]]);
    extra = N('What is the alpha of A?', (eA - rf - bA * (em - rf)) * 100, 'pct', { key: 'alpha' });
    k.r(`**Alpha of A:** $\\alpha_A = E[r_A] - \\left(r_f + \\beta_A (E[r_M] - r_f)\\right) = ${tp(eA, 2)} - (${tp(rf, 0)} + ${tn(bA)} \\times (${tp(em, 0)} - ${tp(rf, 0)})) = ${tp(eA, 2)} - ${tp(rf + bA * (em - rf), 4)} = ${tp(eA - rf - bA * (em - rf), 4)}$.`, 'alpha', (eA - rf - bA * (em - rf)) * 100);
    k.r(`**Check:** in equilibrium every portfolio has zero alpha. Here $\\alpha_A = ${tp(eA - rf - bA * (em - rf), 4)}$, so this situation is ${ok ? 'possible' : 'not possible'}.`, 'ok');
  }
  const parts: Part[] = [C('Could this situation occur if the CAPM equilibrium holds?', POSSIBLE, ok ? 0 : 1, 'ok')];
  if (extra && chance(0.6)) parts.unshift(extra);
  return withCalc(Q('L1.equilibrium', 1, p_('Consider the following portfolios.') + html, parts), k.steps);
}

// =====================================================================
// LECTURE 2 — APT and EMH
// =====================================================================

/** Conditional expected return given factor surprises. */
export function L2_surprise(): Question {
  const name = co();
  const facs = shuffle([['GDP growth', 'GDP', 0.01, 0.04], ['long-term bond yields', 'LTY', 0.02, 0.05], ['inflation', 'INF', 0.01, 0.04], ['interest rates', 'IR', 0.01, 0.06]] as [string, string, number, number][]).slice(0, 2);
  const exp = facs.map(f => rstep(f[2], f[3], 0.0025)), real = exp.map(e => +(e + rstep(-0.02, 0.02, 0.0025)).toFixed(4));
  const betas = [rstep(-1, 2, 0.05), rstep(-3.5, 1.5, 0.25)];
  const er = rstep(0.04, 0.14, 0.0025), surp = real.map((r, i) => r - exp[i]);
  const cond = er + betas[0] * surp[0] + betas[1] * surp[1];
  const body = p_(`Two factors drive equity returns: ${facs[0][0]} and ${facs[1][0]}. Expected ${facs[0][0]} is ${pp(exp[0])} and expected ${facs[1][0]} is ${pp(exp[1])}. ${name} has an expected return of ${pp(er)}, a beta of ${fmtNum(betas[0])} on ${facs[0][1]} and a beta of ${fmtNum(betas[1])} on ${facs[1][1]}. This year, ${facs[0][0]} turns out at ${pp(real[0])} and ${facs[1][0]} at ${pp(real[1])}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N(`What is the surprise in ${facs[0][1]}?`, surp[0] * 100, 'pct', { key: 's0' }), w: 0.4 },
    { part: N(`What is the surprise in ${facs[1][1]}?`, surp[1] * 100, 'pct', { key: 's1' }), w: 0.4 },
    { part: N('What is the expected return of the stock conditional on these factor realisations?', cond * 100, 'pct', { key: 'cond' }), must: true },
  ];
  const k = calc();
  [0, 1].forEach(i => k.r(`**Surprise in ${facs[i][1]}:** realised minus expected, $${tp(real[i])} - ${tp(exp[i])} = ${tp(surp[i], 4)}$.`, 's' + i, surp[i] * 100));
  k.r(`**Conditional expected return:** $E[r \\mid F] = E[r] + \\beta_1 s_1 + \\beta_2 s_2 = ${tp(er)} + ${tn(betas[0], 2)} \\times ${tpq(surp[0], 4)} + ${tq(betas[1], 2)} \\times ${tpq(surp[1], 4)} = ${tp(er)} + ${tpq(betas[0] * surp[0], 4)} + ${tpq(betas[1] * surp[1], 4)} = ${tp(cond, 4)}$.`, 'cond', cond * 100);
  return withCalc(Q('L2.surprise', 2, body, chooseParts(items, 1, 3)), k.steps);
}

/** Multifactor SML: factor risk premiums from two well-diversified portfolios. */
export function L2_twoFactor(): Question {
  for (let t = 0; t < 500; t++) {
    const rf = rstep(0.01, 0.05, 0.005), rp1 = rstep(0.01, 0.07, 0.0025), rp2 = rstep(-0.02, 0.05, 0.0025);
    const b = [[rstep(0.3, 2.2, 0.05), rstep(-1, 1.5, 0.05)], [rstep(0.3, 2.2, 0.05), rstep(-1, 1.5, 0.05)]];
    const det = b[0][0] * b[1][1] - b[0][1] * b[1][0];
    if (Math.abs(det) < 0.4) continue;
    const e = b.map(x => roundTo(rf + x[0] * rp1 + x[1] * rp2, 0.0001));
    // Solve from the rounded expected returns so the displayed numbers are exact.
    const y = e.map(x => x - rf);
    const s1 = (y[0] * b[1][1] - y[1] * b[0][1]) / det, s2 = (b[0][0] * y[1] - b[1][0] * y[0]) / det;
    const nb = [rstep(0, 1.5, 0.05), rstep(-0.5, 1.5, 0.05)];
    const [nA, nB] = pick([['SMB', 'HML'], ['X', 'Y'], ['Value', 'Growth'], ['P1', 'P2']]);
    const body = p_(`Asset returns are driven by two factors, F1 and F2. The risk-free rate is ${pp(rf, 1)}. Consider two well-diversified, correctly priced portfolios: ${NOTE_PCT}`) +
      table(['Portfolio', 'β on F1', 'β on F2', 'Expected return'], [[nA, fmtNum(b[0][0]), fmtNum(b[0][1]), pp(e[0])], [nB, fmtNum(b[1][0]), fmtNum(b[1][1]), pp(e[1])]]);
    const items: Item[] = [
      { part: N('What is the risk premium of factor F1?', s1 * 100, 'pct', { key: 'rp1' }), must: true },
      { part: N('What is the risk premium of factor F2?', s2 * 100, 'pct', { key: 'rp2' }), must: true },
      { part: N(`What expected return should a well-diversified portfolio with betas of ${fmtNum(nb[0])} on F1 and ${fmtNum(nb[1])} on F2 have?`, (rf + nb[0] * s1 + nb[1] * s2) * 100, 'pct', { key: 'er' }), w: 0.5 },
    ];
    const k = calc(), er = rf + nb[0] * s1 + nb[1] * s2;
    k.s(`**Excess returns:** $E[r_{${nA}}] - r_f = ${tp(e[0], 2)} - ${tp(rf, 1)} = ${tn(y[0], 6)}$ and $E[r_{${nB}}] - r_f = ${tp(e[1], 2)} - ${tp(rf, 1)} = ${tn(y[1], 6)}$.`);
    k.s(`**Equations:** the excess return is $\\beta_1 \\lambda_1 + \\beta_2 \\lambda_2$ for each portfolio: $${tn(b[0][0])} \\lambda_1 + ${tq(b[0][1])} \\lambda_2 = ${tn(y[0], 6)}$ and $${tn(b[1][0])} \\lambda_1 + ${tq(b[1][1])} \\lambda_2 = ${tn(y[1], 6)}$.`);
    k.s(`**Determinant:** $D = \\beta_{11} \\beta_{22} - \\beta_{12} \\beta_{21} = ${tn(b[0][0])} \\times ${tq(b[1][1])} - ${tq(b[0][1])} \\times ${tn(b[1][0])} = ${tn(b[0][0] * b[1][1], 4)} - ${tq(b[0][1] * b[1][0], 4)} = ${tn(det, 4)}$.`);
    k.r(`**Premium of F1 (Cramer's rule):** $\\lambda_1 = \\frac{y_1 \\beta_{22} - y_2 \\beta_{12}}{D} = \\frac{${tn(y[0], 6)} \\times ${tq(b[1][1])} - ${tn(y[1], 6)} \\times ${tq(b[0][1])}}{${tn(det, 4)}} = \\frac{${tn(y[0] * b[1][1] - y[1] * b[0][1], 6)}}{${tn(det, 4)}} = ${tn(s1, 6)}$, i.e. $${tp(s1, 4)}$.`, 'rp1', s1 * 100);
    k.r(`**Premium of F2:** $\\lambda_2 = \\frac{\\beta_{11} y_2 - \\beta_{21} y_1}{D} = \\frac{${tn(b[0][0])} \\times ${tn(y[1], 6)} - ${tn(b[1][0])} \\times ${tn(y[0], 6)}}{${tn(det, 4)}} = \\frac{${tn(b[0][0] * y[1] - b[1][0] * y[0], 6)}}{${tn(det, 4)}} = ${tn(s2, 6)}$, i.e. $${tp(s2, 4)}$.`, 'rp2', s2 * 100);
    k.r(`**Expected return of the new portfolio:** $r_f + \\beta_1 \\lambda_1 + \\beta_2 \\lambda_2 = ${tp(rf, 1)} + ${tn(nb[0])} \\times ${tp(s1, 4)} + ${tq(nb[1])} \\times ${tpq(s2, 4)} = ${tp(rf, 1)} + ${tpq(nb[0] * s1, 4)} + ${tpq(nb[1] * s2, 4)} = ${tp(er, 4)}$.`, 'er', er * 100);
    return withCalc(Q('L2.twoFactor', 2, body, chooseParts(items, 2, 3)), k.steps);
  }
  throw new Error('L2_twoFactor: no valid draw');
}

/** One-factor APT: SML from two portfolios, arbitrage with a mispriced portfolio. */
export function L2_arbitrage(): Question {
  for (let t = 0; t < 500; t++) {
    const rf = rstep(0.01, 0.06, 0.0025), rp = rstep(0.03, 0.09, 0.0025);
    const bA = rstep(0.9, 2, 0.1), bB = rstep(0.2, 0.8, 0.1);
    const eA = roundTo(rf + bA * rp, 0.0001), eB = roundTo(rf + bB * rp, 0.0001);
    const rpS = (eA - eB) / (bA - bB), rfS = eA - bA * rpS;
    const bJ = rstep(0.2, 1.6, 0.1), mis = pick([-1, 1]) * rstep(0.001, 0.01, 0.0005);
    const eJ = roundTo(rfS + bJ * rpS + mis, 0.0001), alpha = eJ - (rfS + bJ * rpS);
    if (Math.abs(bJ - bA) < 0.05 || Math.abs(alpha) < 0.0005) continue;
    const body = p_(`One risk factor drives this market. A and B are well-diversified, correctly priced portfolios: A has a beta of ${fmtNum(bA)} and an expected return of ${pp(eA)}; B has a beta of ${fmtNum(bB)} and an expected return of ${pp(eB)}. A well-diversified portfolio J has a beta of ${fmtNum(bJ)} and an expected return of ${pp(eJ)}. ${NOTE_PCT}`);
    const items: Item[] = [
      { part: N('What is the risk-free rate implied by A and B?', rfS * 100, 'pct', { key: 'rf' }), must: true },
      { part: N('What is the factor risk premium?', rpS * 100, 'pct', { key: 'rp' }), w: 0.7 },
      { part: N('What is the alpha of J?', alpha * 100, 'pct', { key: 'alpha' }), must: true },
      { part: C('How do you exploit the arbitrage?', ['Buy J, sell its mimicking portfolio', 'Sell J, buy its mimicking portfolio', 'There is no arbitrage'], alpha > 0 ? 0 : 1, 'trade'), w: 0.6 },
      { part: N('A mimicking portfolio for J is built from A and the risk-free asset. What weight does it put in A?', bJ / bA, 'n', { key: 'wA' }), w: 0.4 },
    ];
    const k = calc(), fairJ = rfS + bJ * rpS;
    k.r(`**Factor risk premium:** both portfolios lie on the line $E[r] = r_f + \\beta \\lambda$, so the slope is $\\lambda = \\frac{E[r_A] - E[r_B]}{\\beta_A - \\beta_B} = \\frac{${tp(eA, 2)} - ${tp(eB, 2)}}{${tn(bA)} - ${tn(bB)}} = \\frac{${tp(eA - eB, 4)}}{${tn(bA - bB)}} = ${tp(rpS, 4)}$.`, 'rp', rpS * 100);
    k.r(`**Risk-free rate:** the intercept is $r_f = E[r_A] - \\beta_A \\lambda = ${tp(eA, 2)} - ${tn(bA)} \\times ${tp(rpS, 4)} = ${tp(eA, 2)} - ${tp(bA * rpS, 4)} = ${tp(rfS, 4)}$.`, 'rf', rfS * 100);
    k.r(`**Alpha of J:** $\\alpha_J = E[r_J] - (r_f + \\beta_J \\lambda) = ${tp(eJ, 2)} - (${tp(rfS, 4)} + ${tn(bJ)} \\times ${tp(rpS, 4)}) = ${tp(eJ, 2)} - ${tp(fairJ, 4)} = ${tp(alpha, 4)}$.`, 'alpha', alpha * 100);
    k.r(`**Arbitrage:** J's alpha is ${alpha > 0 ? 'positive, so J is underpriced: buy J and sell its mimicking portfolio' : 'negative, so J is overpriced: sell J and buy its mimicking portfolio'} (same beta, ${alpha > 0 ? 'higher' : 'lower'} expected return, no net risk).`, 'trade');
    k.r(`**Weight in A:** the mimicking portfolio needs a beta of ${tn(bJ)}, and only A carries beta (${tn(bA)}), so $w_A = \\frac{\\beta_J}{\\beta_A} = \\frac{${tn(bJ)}}{${tn(bA)}} = ${tn(bJ / bA, 4)}$, with $1 - w_A = ${tn(1 - bJ / bA, 4)}$ in the risk-free asset.`, 'wA', bJ / bA);
    return withCalc(Q('L2.arbitrage', 2, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L2_arbitrage: no valid draw');
}

/** Long-short alpha portfolio: expected profit and specific risk with few or many stocks. */
export function L2_longShort(): Question {
  const n = pick([5, 5, 10, 25]), se = rstep(0.2, 0.6, 0.05), a = rstep(0.01, 0.05, 0.005), X = rstep(1, 20, 0.5) * 1e6;
  const sd = (k: number) => se * Math.sqrt(2 / k);
  const n2 = pick([20, 50, 100, 200].filter(x => x > n));
  const body = p_(`All stocks in this market have a beta of one on the only factor, and residuals with a standard deviation of ${P(se, 0)}; the single-index model holds. You find ${2 * n} stocks: ${n} with an alpha of +${P(a, 1)} and ${n} with an alpha of −${P(a, 1)}. You buy ${usd(X)} of an equal-weighted portfolio of the underpriced stocks and short the same amount of an equal-weighted portfolio of the overpriced ones.`);
  const items: Item[] = [
    { part: N('What is the expected profit?', 2 * a * X, 'usd', { key: 'profit' }), must: true },
    { part: N('What is the standard deviation of the profit?', sd(n) * X, 'usd', { key: 'sd' }), must: true },
    { part: N(`What would the standard deviation of the profit be with ${n2} stocks in each leg, same amount invested?`, sd(n2) * X, 'usd', { key: 'sd2' }), w: 0.6 },
    { part: N('What is the standard deviation of the long-short return (in percent)?', sd(n) * 100, 'pct', { key: 'sdPct' }), w: 0.3 },
  ];
  const k = calc();
  k.r(`**Expected profit:** the long leg earns $\\alpha X$ and the short leg earns $\\alpha X$ as well (the overpriced stocks fall by their alpha), so profit $= 2 \\alpha X = 2 \\times ${tp(a, 1)} \\times ${tn(X, 0)} = ${tn(2 * a * X, 2)}$ (USD).`, 'profit', 2 * a * X);
  k.s(`**Risk per leg:** with beta one on both sides the market risk cancels. Each leg of ${n} stocks has residual risk $\\sigma_\\varepsilon / \\sqrt{n}$, and the two legs are independent, so the long-short return has $\\sigma = \\sigma_\\varepsilon \\sqrt{\\frac{2}{n}} = ${tp(se, 0)} \\times \\sqrt{\\frac{2}{${n}}} = ${tp(se, 0)} \\times ${tn(Math.sqrt(2 / n), 6)} = ${tp(sd(n), 4)}$.`);
  k.r(`**Standard deviation of the profit:** $\\sigma \\times X = ${tn(sd(n), 6)} \\times ${tn(X, 0)} = ${tn(sd(n) * X, 2)}$ (USD).`, 'sd', sd(n) * X);
  k.r(`**With ${n2} stocks per leg:** $\\sigma = ${tp(se, 0)} \\times \\sqrt{\\frac{2}{${n2}}} = ${tp(se, 0)} \\times ${tn(Math.sqrt(2 / n2), 6)} = ${tn(sd(n2), 6)}$, so the profit has a standard deviation of $${tn(sd(n2), 6)} \\times ${tn(X, 0)} = ${tn(sd(n2) * X, 2)}$ (USD).`, 'sd2', sd(n2) * X);
  k.r(`**Long-short return risk:** from above, $\\sigma = ${tn(sd(n), 6)}$, i.e. $${tp(sd(n), 4)}$.`, 'sdPct', sd(n) * 100);
  return withCalc(Q('L2.longShort', 2, body, chooseParts(items, 2, 3)), k.steps);
}

// =====================================================================
// LECTURE 3 — Portfolio performance measurement
// =====================================================================

/** Sharpe, Treynor, Jensen’s alpha and M². */
export function L3_ratios(): Question {
  const rf = rstep(0.01, 0.05, 0.005), eM = rf + rstep(0.04, 0.12, 0.005), sM = rstep(0.12, 0.3, 0.01);
  const b = rstep(0.6, 1.6, 0.05), eP = rf + rstep(0.03, 0.16, 0.005), sP = rstep(0.1, 0.4, 0.01);
  const name = fund('Fund');
  const sr = (eP - rf) / sP, tr = (eP - rf) / b, ja = eP - (rf + b * (eM - rf)), m2 = rf + sr * sM - eM;
  const body = p_(`Consider the following information about a managed portfolio, the ${name}, and the market. The risk-free rate is ${pp(rf, 1)}. ${NOTE_PCT}`) +
    table(['', 'Average return', 'Standard deviation', 'Beta'], [[name, pp(eP, 1), pp(sP, 0), fmtNum(b)], ['Market', pp(eM, 1), pp(sM, 0), '1']]);
  const items: Item[] = [
    { part: N('What is the Sharpe ratio of the portfolio?', sr, 'n', { key: 'sr' }), w: 0.6 },
    { part: N('What is the Treynor ratio of the portfolio?', tr * 100, 'pct', { key: 'tr' }), w: 0.7 },
    { part: N('What is Jensen’s alpha of the portfolio?', ja * 100, 'pct', { key: 'ja' }), w: 0.7 },
    { part: N('What is the M² measure of the portfolio?', m2 * 100, 'pct', { key: 'm2' }), must: true },
    { part: C('Based on the Sharpe ratio, as an investor’s entire risky portfolio the fund is', ['Better than the market', 'Worse than the market'], sr > (eM - rf) / sM ? 0 : 1, 'cmp'), w: 0.4 },
  ];
  const k = calc(), srM = (eM - rf) / sM;
  k.r(`**Sharpe ratio:** $SR_P = \\frac{\\bar r_P - r_f}{\\sigma_P} = \\frac{${tp(eP, 1)} - ${tp(rf, 1)}}{${tp(sP, 1)}} = \\frac{${tp(eP - rf, 2)}}{${tp(sP, 1)}} = ${tn(sr, 4)}$.`, 'sr', sr);
  k.r(`**Treynor ratio:** $T_P = \\frac{\\bar r_P - r_f}{\\beta_P} = \\frac{${tp(eP - rf, 2)}}{${tn(b)}} = ${tp(tr, 4)}$.`, 'tr', tr * 100);
  k.r(`**Jensen's alpha:** $\\alpha = \\bar r_P - \\left(r_f + \\beta_P (\\bar r_M - r_f)\\right) = ${tp(eP, 1)} - (${tp(rf, 1)} + ${tn(b)} \\times (${tp(eM, 1)} - ${tp(rf, 1)})) = ${tp(eP, 1)} - (${tp(rf, 1)} + ${tn(b)} \\times ${tp(eM - rf, 2)}) = ${tp(eP, 1)} - ${tp(rf + b * (eM - rf), 4)} = ${tp(ja, 4)}$.`, 'ja', ja * 100);
  k.r(`**M² measure:** lever the fund to the market's risk, $r_f + SR_P \\, \\sigma_M = ${tp(rf, 1)} + ${tn(sr, 4)} \\times ${tp(sM, 1)} = ${tp(rf + sr * sM, 4)}$, and subtract the market return: $M^2 = ${tp(rf + sr * sM, 4)} - ${tp(eM, 1)} = ${tp(m2, 4)}$.`, 'm2', m2 * 100);
  k.r(`**Comparison:** the market's Sharpe ratio is $\\frac{${tp(eM, 1)} - ${tp(rf, 1)}}{${tp(sM, 1)}} = ${tn(srM, 4)}$. The fund's $${tn(sr, 4)}$ is ${sr > srM ? 'higher' : 'lower'}, so it is ${sr > srM ? 'better' : 'worse'} than the market.`, 'cmp');
  return withCalc(Q('L3.ratios', 3, body, chooseParts(items, 3, 4)), k.steps);
}

/** Information ratio and the weight of an active fund next to the index. */
export function L3_ir(): Question {
  const sM = rstep(0.12, 0.22, 0.01), b = rstep(0.5, 2, 0.05), se = rstep(0.02, 0.2, 0.005), a = rstep(0.005, 0.04, 0.0025);
  const sP = Math.sqrt(b * b * sM * sM + se * se), r2 = b * b * sM * sM / (sP * sP);
  const mrp = rstep(0.04, 0.08, 0.005);
  const w0 = (a / (se * se)) / (mrp / (sM * sM)), wH = w0 / (1 + (1 - b) * w0);
  const srM = mrp / sM, srP = Math.sqrt(srM * srM + (a / se) ** 2);
  const name = fund('Partners');
  const useR2 = chance(0.5);
  const body = p_(`A regression of the excess returns of ${name} on the market excess return gives an alpha of ${pp(a)} and a beta of ${fmtNum(b)}${useR2 ? `, with an R² of ${P(r2, 2)}` : ''}. The standard deviation of the fund is ${P(sP, 3)} and that of the market is ${P(sM, 0)}. The market risk premium is ${pp(mrp, 1)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the standard deviation of the fund’s residuals?', se * 100, 'pct', { key: 'se' }), must: true },
    { part: N('What is the information ratio of the fund?', a / se, 'n', { key: 'ir' }), must: true },
    { part: N('If the fund is your only active portfolio, what weight should a mean-variance investor give it next to the index (Treynor-Black)?', wH, 'n', { key: 'wH' }), w: 0.5 },
    { part: N('What is the Sharpe ratio of the optimal combination?', srP, 'n', { key: 'srP' }), w: 0.4 },
  ];
  const k = calc();
  k.r(useR2
    ? `**Residual standard deviation:** the unexplained share of variance is $1 - R^2$, so $\\sigma_\\varepsilon = \\sigma_P \\sqrt{1 - R^2} = ${tn(sP, 6)} \\times \\sqrt{1 - ${tn(r2, 6)}} = ${tn(sP, 6)} \\times ${tn(Math.sqrt(1 - r2), 6)} = ${tn(se, 6)}$, i.e. $${tp(se, 4)}$.`
    : `**Residual standard deviation:** $\\sigma_P^2 = \\beta^2 \\sigma_M^2 + \\sigma_\\varepsilon^2$, so $\\sigma_\\varepsilon = \\sqrt{\\sigma_P^2 - \\beta^2 \\sigma_M^2} = \\sqrt{${tn(sP * sP, 6)} - ${tn(b, 2)}^2 \\times ${tn(sM, 4)}^2} = \\sqrt{${tn(sP * sP, 6)} - ${tn(b * b * sM * sM, 6)}} = \\sqrt{${tn(se * se, 6)}} = ${tn(se, 6)}$, i.e. $${tp(se, 4)}$.`, 'se', se * 100);
  k.r(`**Information ratio:** $IR = \\frac{\\alpha}{\\sigma_\\varepsilon} = \\frac{${tn(a, 4)}}{${tn(se, 6)}} = ${tn(a / se, 4)}$.`, 'ir', a / se);
  k.s(`**Market Sharpe ratio:** $SR_M = \\frac{MRP}{\\sigma_M} = \\frac{${tn(mrp, 4)}}{${tn(sM, 4)}} = ${tn(srM, 4)}$.`);
  k.s(`**Initial weight:** $w_0 = \\frac{\\alpha / \\sigma_\\varepsilon^2}{MRP / \\sigma_M^2} = \\frac{${tn(a, 4)} / ${tn(se * se, 6)}}{${tn(mrp, 4)} / ${tn(sM * sM, 6)}} = \\frac{${tn(a / (se * se), 4)}}{${tn(mrp / (sM * sM), 4)}} = ${tn(w0, 4)}$.`);
  k.r(`**Treynor-Black weight:** $w^* = \\frac{w_0}{1 + (1 - \\beta) w_0} = \\frac{${tn(w0, 4)}}{1 + (1 - ${tn(b, 2)}) \\times ${tn(w0, 4)}} = \\frac{${tn(w0, 4)}}{${tn(1 + (1 - b) * w0, 4)}} = ${tn(wH, 4)}$.`, 'wH', wH);
  k.r(`**Sharpe ratio of the optimal combination:** $SR_P = \\sqrt{SR_M^2 + IR^2} = \\sqrt{${tn(srM, 4)}^2 + ${tn(a / se, 4)}^2} = \\sqrt{${tn(srM * srM, 6)} + ${tn((a / se) ** 2, 6)}} = \\sqrt{${tn(srM * srM + (a / se) ** 2, 6)}} = ${tn(srP, 4)}$.`, 'srP', srP);
  return withCalc(Q('L3.ir', 3, body, chooseParts(items, 2, 4)), k.steps);
}

/** How long a track record must be before alpha is statistically significant. */
export function L3_tstat(): Question {
  const name = 'The manager of ' + fund('Advisors');
  const a = rstep(0.1, 1, 0.05) / 100, se = rstep(1, 6, 0.25) / 100, neg = chance(0.3);
  const lvl = pick([[1.96, '5%'], [1.645, '10%'], [2.576, '1%']] as [number, string][]);
  const n = (lvl[0] * se / a) ** 2;
  const body = p_(`${name} is a portfolio manager with a true ${neg ? 'negative ' : ''}alpha of ${neg ? '−' : ''}${pp(a)} per month and a residual standard deviation of ${pp(se)} per month. Assume a regression always recovers these true values.`);
  const items: Item[] = [
    { part: N(`How many months of returns are needed before the alpha is significant in a two-tailed test at the ${lvl[1]} level (|t| > ${lvl[0]})?`, n, 'n', { key: 'n' }), must: true },
    { part: N('How many years is that?', n / 12, 'n', { key: 'years' }), w: 0.5 },
    { part: N('What is the t-statistic after 5 years of monthly data?', (neg ? -1 : 1) * a / se * Math.sqrt(60), 'n', { key: 't' }), w: 0.5 },
  ];
  const k = calc(), sa = neg ? -a : a, t5 = sa / se * Math.sqrt(60);
  k.r(`**Months needed:** the t-statistic is $t = \\frac{\\alpha}{\\sigma_\\varepsilon} \\sqrt{n}$ and we need $|t| = ${tn(lvl[0], 3)}$, so $n = \\left(\\frac{${tn(lvl[0], 3)} \\, \\sigma_\\varepsilon}{|\\alpha|}\\right)^2 = \\left(\\frac{${tn(lvl[0], 3)} \\times ${tp(se, 2)}}{${tp(a, 2)}}\\right)^2 = ${tn(lvl[0] * se / a, 4)}^2 = ${tn(n, 4)}$.`, 'n', n);
  k.r(`**Years:** $\\frac{${tn(n, 4)}}{12} = ${tn(n / 12, 4)}$.`, 'years', n / 12);
  k.r(`**t-statistic after 5 years:** 5 years are 60 months, so $t = \\frac{\\alpha}{\\sigma_\\varepsilon} \\sqrt{60} = \\frac{${tpq(sa, 2)}}{${tp(se, 2)}} \\times ${tn(Math.sqrt(60), 6)} = ${tn(sa / se, 6)} \\times ${tn(Math.sqrt(60), 6)} = ${tn(t5, 4)}$.`, 't', t5);
  return withCalc(Q('L3.tstat', 3, body, chooseParts(items, 1, 3)), k.steps);
}

/** Performance attribution: asset allocation versus security selection. */
export function L3_attribution(): Question {
  const wB = pick([[0.5, 0.3, 0.2], [0.6, 0.3, 0.1], [0.2, 0.7, 0.1], [0.7, 0.2, 0.1], [0.4, 0.4, 0.2]]);
  let wP: number[];
  do { wP = pick([[0.2, 0.5, 0.3], [0.7, 0.2, 0.1], [0.5, 0.4, 0.1], [0.3, 0.5, 0.2], [0.8, 0.15, 0.05], [0.6, 0.3, 0.1]]); } while (wP.every((x, i) => x === wB[i]));
  const rB = [rstep(-0.2, 0.25, 0.01), rstep(-0.02, 0.06, 0.005), rstep(0, 0.04, 0.005)];
  const rP = [rB[0] + rstep(-0.05, 0.05, 0.01), rB[1] + rstep(-0.02, 0.02, 0.005), rB[2]];
  const aa = wP.reduce((s, w, i) => s + (w - wB[i]) * rB[i], 0), ss = wP.reduce((s, w, i) => s + w * (rP[i] - rB[i]), 0);
  const tot = wP.reduce((s, w, i) => s + w * rP[i], 0) - wB.reduce((s, w, i) => s + w * rB[i], 0);
  const names = ['Equity', 'Bonds', 'Cash'];
  const body = p_(`Consider an actively managed portfolio P and its bogey (benchmark) portfolio. ${NOTE_PCT}`) +
    table(['', 'Bogey weight', 'Index return', 'Weight in P', 'Return of P'], names.map((nm, i) => [nm, fmtNum(wB[i]), pp(rB[i], 1), fmtNum(wP[i]), pp(rP[i], 1)]));
  const items: Item[] = [
    { part: N('What is the return of the bogey?', wB.reduce((s, w, i) => s + w * rB[i], 0) * 100, 'pct', { key: 'bogey' }), w: 0.4 },
    { part: N('What is the total excess return of P over the bogey?', tot * 100, 'pct', { key: 'tot' }), w: 0.5 },
    { part: N('What is the contribution of asset allocation?', aa * 100, 'pct', { key: 'aa' }), must: true },
    { part: N('What is the contribution of security selection?', ss * 100, 'pct', { key: 'ss' }), must: true },
  ];
  const k = calc(), bog = wB.reduce((s, w, i) => s + w * rB[i], 0), pRet = wP.reduce((s, w, i) => s + w * rP[i], 0);
  const idx = [0, 1, 2];
  k.r(`**Bogey return:** $\\sum_i w_{B,i} \\, r_{B,i} = ${idx.map(i => `${tn(wB[i])} \\times ${tpq(rB[i], 1)}`).join(' + ')} = ${idx.map(i => tpq(wB[i] * rB[i], 4)).join(' + ')} = ${tp(bog, 4)}$.`, 'bogey', bog * 100);
  k.r(`**Asset allocation:** the effect of over- and underweighting each class at the index return, $\\sum_i (w_{P,i} - w_{B,i}) \\, r_{B,i} = ${idx.map(i => `${tq(wP[i] - wB[i])} \\times ${tpq(rB[i], 1)}`).join(' + ')} = ${idx.map(i => tpq((wP[i] - wB[i]) * rB[i], 4)).join(' + ')} = ${tp(aa, 4)}$.`, 'aa', aa * 100);
  k.r(`**Security selection:** the effect of beating the index inside each class, $\\sum_i w_{P,i} \\, (r_{P,i} - r_{B,i}) = ${idx.map(i => `${tn(wP[i])} \\times (${tpq(rP[i], 1)} - ${tpq(rB[i], 1)})`).join(' + ')} = ${idx.map(i => `${tn(wP[i])} \\times ${tpq(rP[i] - rB[i], 2)}`).join(' + ')} = ${idx.map(i => tpq(wP[i] * (rP[i] - rB[i]), 4)).join(' + ')} = ${tp(ss, 4)}$.`, 'ss', ss * 100);
  k.s(`**Return of P:** $\\sum_i w_{P,i} \\, r_{P,i} = ${idx.map(i => `${tn(wP[i])} \\times ${tpq(rP[i], 1)}`).join(' + ')} = ${idx.map(i => tpq(wP[i] * rP[i], 4)).join(' + ')} = ${tp(pRet, 4)}$.`);
  k.r(`**Total excess return:** $r_P - r_B = ${tp(pRet, 4)} - ${tpq(bog, 4)} = ${tp(tot, 4)}$, which equals asset allocation plus security selection, $${tp(aa, 4)} + ${tpq(ss, 4)}$.`, 'tot', tot * 100);
  return withCalc(Q('L3.attribution', 3, body, chooseParts(items, 2, 4)), k.steps);
}

/** Time-weighted versus dollar-weighted returns. */
export function L3_dwr(): Question {
  for (let t = 0; t < 500; t++) {
    const P0 = rstep(20, 120, 1), d = roundTo(P0 * rstep(0.01, 0.05, 0.005), 0.5);
    const P1 = roundTo(P0 * rstep(0.85, 1.25, 0.01), 1), P2 = roundTo(P1 * rstep(0.85, 1.25, 0.01), 1);
    const r1 = (P1 - P0 + d) / P0, r2 = (P2 - P1 + d) / P1;
    const a = 2 * d + 2 * P2, b = d - P1, c = -P0;
    const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a), irr = 1 / x - 1;
    if (!isFinite(irr) || Math.abs(r1 - r2) < 0.02) continue;
    const body = p_(`At the start of year 1 you buy one share for $${fmtNum(P0)}. At the end of year 1 the share pays a dividend of $${fmtNum(d)} and you buy a second share for $${fmtNum(P1)}. At the end of year 2 each share pays a dividend of $${fmtNum(d)} and you sell both shares for $${fmtNum(P2)} each. ${NOTE_PCT}`);
    const items: Item[] = [
      { part: N('What is the holding-period return in year 1?', r1 * 100, 'pct', { key: 'r1' }), w: 0.4 },
      { part: N('What is the arithmetic average (time-weighted) return?', (r1 + r2) / 2 * 100, 'pct', { key: 'arith' }), w: 0.5 },
      { part: N('What is the geometric average (time-weighted) return?', (Math.sqrt((1 + r1) * (1 + r2)) - 1) * 100, 'pct', { key: 'geo' }), w: 0.6 },
      { part: N('What is the dollar-weighted return (IRR)?', irr * 100, 'pct', { key: 'irr' }), must: true },
    ];
    const k = calc(), disc = b * b - 4 * a * c, geo = Math.sqrt((1 + r1) * (1 + r2)) - 1;
    k.r(`**Year 1 return:** $r_1 = \\frac{P_1 - P_0 + D}{P_0} = \\frac{${tn(P1)} - ${tn(P0)} + ${tn(d)}}{${tn(P0)}} = \\frac{${tn(P1 - P0 + d)}}{${tn(P0)}} = ${tn(r1, 6)}$, i.e. $${tp(r1, 4)}$.`, 'r1', r1 * 100);
    k.s(`**Year 2 return:** the position is valued per share at the start of year 2, so $r_2 = \\frac{P_2 - P_1 + D}{P_1} = \\frac{${tn(P2)} - ${tn(P1)} + ${tn(d)}}{${tn(P1)}} = \\frac{${tn(P2 - P1 + d)}}{${tn(P1)}} = ${tn(r2, 6)}$, i.e. $${tp(r2, 4)}$.`);
    k.r(`**Arithmetic average:** $\\frac{r_1 + r_2}{2} = \\frac{${tn(r1, 6)} + ${tq(r2, 6)}}{2} = ${tn((r1 + r2) / 2, 6)}$, i.e. $${tp((r1 + r2) / 2, 4)}$.`, 'arith', (r1 + r2) / 2 * 100);
    k.r(`**Geometric average:** $\\sqrt{(1 + r_1)(1 + r_2)} - 1 = \\sqrt{${tn(1 + r1, 6)} \\times ${tn(1 + r2, 6)}} - 1 = \\sqrt{${tn((1 + r1) * (1 + r2), 6)}} - 1 = ${tn(Math.sqrt((1 + r1) * (1 + r2)), 6)} - 1 = ${tn(geo, 6)}$, i.e. $${tp(geo, 4)}$.`, 'geo', geo * 100);
    k.s(`**Cash flows (USD):** time 0: $-${tn(P0)}$; time 1: dividend $${tn(d)}$ minus the purchase of the second share $${tn(P1)}$, i.e. $${tn(d - P1)}$; time 2: two dividends and the sale of two shares, $2 \\times ${tn(d)} + 2 \\times ${tn(P2)} = ${tn(2 * d + 2 * P2)}$.`);
    k.s(`**IRR equation:** with $x = \\frac{1}{1 + IRR}$ the net present value is zero when $${tn(a)} x^2 + ${tq(b)} x + ${tq(c)} = 0$.`);
    k.s(`**Discriminant:** $b^2 - 4ac = ${tq(b)}^2 - 4 \\times ${tn(a)} \\times ${tq(c)} = ${tn(b * b, 4)} + ${tn(-4 * a * c, 4)} = ${tn(disc, 4)}$, with square root $${tn(Math.sqrt(disc), 6)}$.`);
    k.r(`**Dollar-weighted return:** $x = \\frac{-b + \\sqrt{b^2 - 4ac}}{2a} = \\frac{${tn(-b, 4)} + ${tn(Math.sqrt(disc), 6)}}{${tn(2 * a, 4)}} = ${tn(x, 6)}$, so $IRR = \\frac{1}{x} - 1 = \\frac{1}{${tn(x, 6)}} - 1 = ${tn(1 / x, 6)} - 1 = ${tn(irr, 6)}$, i.e. $${tp(irr, 4)}$.`, 'irr', irr * 100);
    return withCalc(Q('L3.dwr', 3, body, chooseParts(items, 2, 4)), k.steps);
  }
  throw new Error('L3_dwr: no valid draw');
}

// =====================================================================
// LECTURE 4 — Active portfolio management
// =====================================================================

/** Treynor-Black with two analysed stocks. */
export function L4_treynorBlack(): Question {
  for (let t = 0; t < 2000; t++) {
    const s = [0, 1].map(() => ({ a: rstep(-0.04, 0.05, 0.005), b: rstep(0.3, 1.8, 0.1), se: rstep(0.04, 0.25, 0.01) }));
    if (s.some(x => Math.abs(x.a) < 0.005)) continue;
    const w0 = s.map(x => x.a / (x.se * x.se)), sum = w0[0] + w0[1];
    if (Math.abs(sum) < 0.3) continue;
    const w = w0.map(x => x / sum);
    if (w.some(x => Math.abs(x) > 4)) continue;
    const aA = w[0] * s[0].a + w[1] * s[1].a, bA = w[0] * s[0].b + w[1] * s[1].b, veA = w[0] ** 2 * s[0].se ** 2 + w[1] ** 2 * s[1].se ** 2;
    const mrp = rstep(0.04, 0.08, 0.005), sM = rstep(0.12, 0.22, 0.01);
    const wA0 = (aA / veA) / (mrp / (sM * sM)), wA = wA0 / (1 + (1 - bA) * wA0);
    if (!isFinite(wA) || Math.abs(wA) > 3 || aA <= 0) continue;
    const bP = 1 - wA + wA * bA, sdP = Math.sqrt(bP * bP * sM * sM + wA * wA * veA);
    const srM = mrp / sM, srP = Math.sqrt(srM * srM + aA * aA / veA);
    const te = Math.abs(wA) * Math.sqrt((1 - bA) ** 2 * sM * sM + veA);
    const body = p_(`You performed security analysis on two stocks. The market risk premium is ${pp(mrp, 1)} and the market’s standard deviation is ${pp(sM, 0)}. Use the Treynor-Black model. Enter weights as decimals (−1 for −100%) and returns in percent.`) +
      table(['', 'Stock A', 'Stock B'], [['Alpha', pp(s[0].a, 1), pp(s[1].a, 1)], ['Beta', fmtNum(s[0].b), fmtNum(s[1].b)], ['Residual standard deviation', pp(s[0].se, 0), pp(s[1].se, 0)]]);
    const items: Item[] = [
      { part: [N('What is the weight of stock A in the active portfolio?', w[0], 'n', { key: 'w0' }), N('… and of stock B?', w[1], 'n', { key: 'w1' })], must: true },
      { part: N('What is the alpha of the active portfolio?', aA * 100, 'pct', { key: 'aA' }), w: 0.4 },
      { part: N('What is the optimal weight of the active portfolio in the risky portfolio?', wA, 'n', { key: 'wA' }), must: true },
      { part: N('What is the beta of the optimal risky portfolio?', bP, 'n', { key: 'bP' }), w: 0.35 },
      { part: N('What is the standard deviation of the optimal risky portfolio?', sdP * 100, 'pct', { key: 'sdP' }), w: 0.3 },
      { part: N('By how much does the Sharpe ratio improve on the passive benchmark?', srP - srM, 'n', { key: 'dSR' }), w: 0.6 },
      { part: N('What is the benchmark risk (standard deviation of the tracking error)?', te * 100, 'pct', { key: 'te' }), w: 0.5 },
    ];
    const k = calc(), wAbs = Math.abs(wA);
    k.s(`**Raw weights:** $\\alpha_i / \\sigma_{\\varepsilon,i}^2$ for each stock: A: $\\frac{${tq(s[0].a, 4)}}{${tn(s[0].se, 4)}^2} = \\frac{${tq(s[0].a, 4)}}{${tn(s[0].se * s[0].se, 6)}} = ${tn(w0[0], 4)}$; B: $\\frac{${tq(s[1].a, 4)}}{${tn(s[1].se, 4)}^2} = \\frac{${tq(s[1].a, 4)}}{${tn(s[1].se * s[1].se, 6)}} = ${tn(w0[1], 4)}$. Their sum is $${tn(sum, 4)}$.`);
    k.r(`**Weight of A in the active portfolio:** $w_A = \\frac{${tn(w0[0], 4)}}{${tn(sum, 4)}} = ${tn(w[0], 4)}$.`, 'w0', w[0]);
    k.r(`**Weight of B:** $w_B = \\frac{${tn(w0[1], 4)}}{${tn(sum, 4)}} = ${tn(w[1], 4)}$.`, 'w1', w[1]);
    k.r(`**Alpha of the active portfolio:** $\\alpha_{act} = w_A \\alpha_A + w_B \\alpha_B = ${tq(w[0], 4)} \\times ${tq(s[0].a, 4)} + ${tq(w[1], 4)} \\times ${tq(s[1].a, 4)} = ${tq(w[0] * s[0].a, 6)} + ${tq(w[1] * s[1].a, 6)} = ${tn(aA, 6)}$.`, 'aA', aA * 100);
    k.s(`**Beta and residual variance of the active portfolio:** $\\beta_A = ${tq(w[0], 4)} \\times ${tn(s[0].b, 2)} + ${tq(w[1], 4)} \\times ${tn(s[1].b, 2)} = ${tn(bA, 4)}$ and $\\sigma_{\\varepsilon A}^2 = w_A^2 \\sigma_{\\varepsilon,A}^2 + w_B^2 \\sigma_{\\varepsilon,B}^2 = ${tn(w[0] ** 2, 6)} \\times ${tn(s[0].se ** 2, 6)} + ${tn(w[1] ** 2, 6)} \\times ${tn(s[1].se ** 2, 6)} = ${tn(veA, 6)}$.`);
    k.s(`**Initial position:** $w_0 = \\frac{\\alpha_A / \\sigma_{\\varepsilon A}^2}{MRP / \\sigma_M^2} = \\frac{${tn(aA, 6)} / ${tn(veA, 6)}}{${tn(mrp, 4)} / ${tn(sM * sM, 6)}} = \\frac{${tn(aA / veA, 4)}}{${tn(mrp / (sM * sM), 4)}} = ${tn(wA0, 4)}$.`);
    k.r(`**Weight of the active portfolio:** $w^* = \\frac{w_0}{1 + (1 - \\beta_A) w_0} = \\frac{${tn(wA0, 4)}}{1 + (1 - ${tn(bA, 4)}) \\times ${tn(wA0, 4)}} = \\frac{${tn(wA0, 4)}}{${tn(1 + (1 - bA) * wA0, 4)}} = ${tn(wA, 4)}$.`, 'wA', wA);
    k.r(`**Beta of the optimal portfolio:** $\\beta_P = 1 - w^* + w^* \\beta_A = 1 - ${tq(wA, 4)} + ${tq(wA, 4)} \\times ${tn(bA, 4)} = ${tn(bP, 4)}$.`, 'bP', bP);
    k.r(`**Standard deviation:** $\\sigma_P = \\sqrt{\\beta_P^2 \\sigma_M^2 + w^{*2} \\sigma_{\\varepsilon A}^2} = \\sqrt{${tn(bP, 4)}^2 \\times ${tn(sM * sM, 6)} + ${tn(wA * wA, 6)} \\times ${tn(veA, 6)}} = \\sqrt{${tn(bP * bP * sM * sM, 6)} + ${tn(wA * wA * veA, 6)}} = \\sqrt{${tn(sdP * sdP, 6)}} = ${tn(sdP, 6)}$, i.e. $${tp(sdP, 4)}$.`, 'sdP', sdP * 100);
    k.r(`**Sharpe ratio improvement:** $SR_M = \\frac{${tn(mrp, 4)}}{${tn(sM, 4)}} = ${tn(srM, 4)}$ and $SR_P = \\sqrt{SR_M^2 + \\frac{\\alpha_A^2}{\\sigma_{\\varepsilon A}^2}} = \\sqrt{${tn(srM * srM, 6)} + \\frac{${tn(aA * aA, 6)}}{${tn(veA, 6)}}} = \\sqrt{${tn(srM * srM, 6)} + ${tn(aA * aA / veA, 6)}} = ${tn(srP, 4)}$, so the improvement is $${tn(srP, 4)} - ${tn(srM, 4)} = ${tn(srP - srM, 4)}$.`, 'dSR', srP - srM);
    k.r(`**Tracking error:** $\\sigma_{TE} = |w^*| \\sqrt{(1 - \\beta_A)^2 \\sigma_M^2 + \\sigma_{\\varepsilon A}^2} = ${tn(wAbs, 4)} \\times \\sqrt{${tn((1 - bA) ** 2, 6)} \\times ${tn(sM * sM, 6)} + ${tn(veA, 6)}} = ${tn(wAbs, 4)} \\times \\sqrt{${tn((1 - bA) ** 2 * sM * sM + veA, 6)}} = ${tn(wAbs, 4)} \\times ${tn(Math.sqrt((1 - bA) ** 2 * sM * sM + veA), 6)} = ${tn(te, 6)}$, i.e. $${tp(te, 4)}$.`, 'te', te * 100);
    return withCalc(Q('L4.treynorBlack', 4, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L4_treynorBlack: no valid draw');
}

/** Black-Litterman with stocks and bonds and one relative view. */
export function L4_blackLitterman(): Question {
  const sB = rstep(0.05, 0.12, 0.01), sS = rstep(0.15, 0.25, 0.01), rho = rstep(0, 0.4, 0.05), wB = pick([0.3, 0.4, 0.5]), wS = 1 - wB, A = pick([2, 2.5, 3, 3.5, 4]);
  const tau = 0.01, cov = rho * sB * sS;
  const vM = wB * wB * sB * sB + wS * wS * sS * sS + 2 * wB * wS * cov, eM = A * vM;
  const betaB = (wB * sB * sB + wS * cov) / vM, betaS = (wB * cov + wS * sS * sS) / vM;
  const eB = betaB * eM, eS = betaS * eM, qE = eB - eS;
  const Q0 = +(qE + pick([-1, 1]) * rstep(0.01, 0.06, 0.005)).toFixed(3), sEps = rstep(0.01, 0.05, 0.005);
  const vQE = tau * (sB * sB + sS * sS - 2 * cov), vD = sEps * sEps + vQE, k_ = (Q0 - qE) / vD;
  const rB = eB + k_ * tau * (sB * sB - cov), rS = eS + k_ * tau * (cov - sS * sS);
  const body = p_(`An economy has two asset classes. Bonds have a standard deviation of ${pp(sB, 0)} and make up ${P(wB, 0)} of total wealth; stocks have a standard deviation of ${pp(sS, 0)} and make up ${P(wS, 0)}. Their correlation is ${fmtNum(rho)} and the average risk aversion is ${fmtNum(A)}. The covariance matrix of expected-return forecasts is 0.01 times the covariance matrix of returns. Your view is E[R<sub>B</sub>] − E[R<sub>S</sub>] = ${pp(Q0, 1)}, with a standard deviation of ${pp(sEps, 1)}. Use the CAPM as the equilibrium model. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the variance of the market portfolio?', vM, 'n', { abs: 0.0002, key: 'vM' }), w: 0.4 },
    { part: N('What is the market-implied expected excess return of the market?', eM * 100, 'pct', { key: 'eM' }), w: 0.5 },
    { part: [N('What is the baseline expected excess return of bonds?', eB * 100, 'pct', { key: 'eB' }), N('… and of stocks?', eS * 100, 'pct', { key: 'eS' })], w: 0.6 },
    { part: N('What is the standard deviation of the difference between the view and the baseline forecast?', Math.sqrt(vD) * 100, 'pct', { key: 'sdD' }), w: 0.5 },
    { part: [N('What is the revised (posterior) expected excess return of bonds?', rB * 100, 'pct', { key: 'rB' }), N('… and of stocks?', rS * 100, 'pct', { key: 'rS' })], must: true },
  ];
  const k = calc();
  k.s(`**Covariance:** $\\sigma_{BS} = \\rho \\sigma_B \\sigma_S = ${tn(rho, 2)} \\times ${tn(sB, 2)} \\times ${tn(sS, 2)} = ${tn(cov, 6)}$.`);
  k.r(`**Market variance:** $\\sigma_M^2 = w_B^2 \\sigma_B^2 + w_S^2 \\sigma_S^2 + 2 w_B w_S \\sigma_{BS} = ${tn(wB, 2)}^2 \\times ${tn(sB * sB, 4)} + ${tn(wS, 2)}^2 \\times ${tn(sS * sS, 4)} + 2 \\times ${tn(wB, 2)} \\times ${tn(wS, 2)} \\times ${tn(cov, 6)} = ${tn(wB * wB * sB * sB, 6)} + ${tn(wS * wS * sS * sS, 6)} + ${tn(2 * wB * wS * cov, 6)} = ${tn(vM, 6)}$.`, 'vM', vM);
  k.r(`**Market excess return:** the CAPM equilibrium gives $E[R_M] = A \\sigma_M^2 = ${tn(A, 1)} \\times ${tn(vM, 6)} = ${tn(eM, 6)}$, i.e. $${tp(eM, 4)}$.`, 'eM', eM * 100);
  k.s(`**Betas:** $\\beta_B = \\frac{w_B \\sigma_B^2 + w_S \\sigma_{BS}}{\\sigma_M^2} = \\frac{${tn(wB, 2)} \\times ${tn(sB * sB, 4)} + ${tn(wS, 2)} \\times ${tn(cov, 6)}}{${tn(vM, 6)}} = \\frac{${tn(wB * sB * sB + wS * cov, 6)}}{${tn(vM, 6)}} = ${tn(betaB, 4)}$ and $\\beta_S = \\frac{w_B \\sigma_{BS} + w_S \\sigma_S^2}{\\sigma_M^2} = \\frac{${tn(wB, 2)} \\times ${tn(cov, 6)} + ${tn(wS, 2)} \\times ${tn(sS * sS, 4)}}{${tn(vM, 6)}} = \\frac{${tn(wB * cov + wS * sS * sS, 6)}}{${tn(vM, 6)}} = ${tn(betaS, 4)}$.`);
  k.r(`**Baseline return of bonds:** $\\beta_B E[R_M] = ${tn(betaB, 4)} \\times ${tn(eM, 6)} = ${tn(eB, 6)}$, i.e. $${tp(eB, 4)}$.`, 'eB', eB * 100);
  k.r(`**Baseline return of stocks:** $\\beta_S E[R_M] = ${tn(betaS, 4)} \\times ${tn(eM, 6)} = ${tn(eS, 6)}$, i.e. $${tp(eS, 4)}$.`, 'eS', eS * 100);
  k.s(`**Baseline view:** $E[R_B] - E[R_S] = ${tn(eB, 6)} - ${tn(eS, 6)} = ${tn(qE, 6)}$, against the stated view of $${tn(Q0, 4)}$.`);
  k.s(`**Variance of the forecast difference:** $\\tau (\\sigma_B^2 + \\sigma_S^2 - 2 \\sigma_{BS}) = 0.01 \\times (${tn(sB * sB, 4)} + ${tn(sS * sS, 4)} - 2 \\times ${tn(cov, 6)}) = ${tn(vQE, 8)}$.`);
  k.r(`**Standard deviation of view minus baseline:** the view error adds ${tn(sEps * sEps, 6)}, so $\\sigma_D^2 = ${tn(sEps * sEps, 6)} + ${tn(vQE, 8)} = ${tn(vD, 8)}$ and $\\sigma_D = \\sqrt{${tn(vD, 8)}} = ${tn(Math.sqrt(vD), 6)}$, i.e. $${tp(Math.sqrt(vD), 4)}$.`, 'sdD', Math.sqrt(vD) * 100);
  k.s(`**Weight on the view:** $\\kappa = \\frac{Q - (E[R_B] - E[R_S])}{\\sigma_D^2} = \\frac{${tn(Q0, 4)} - ${tq(qE, 6)}}{${tn(vD, 8)}} = \\frac{${tn(Q0 - qE, 6)}}{${tn(vD, 8)}} = ${tn(k_, 4)}$.`);
  k.r(`**Posterior return of bonds:** $E[R_B] + \\kappa \\tau (\\sigma_B^2 - \\sigma_{BS}) = ${tn(eB, 6)} + ${tq(k_, 4)} \\times 0.01 \\times (${tn(sB * sB, 4)} - ${tn(cov, 6)}) = ${tn(eB, 6)} + ${tq(k_ * tau * (sB * sB - cov), 6)} = ${tn(rB, 6)}$, i.e. $${tp(rB, 4)}$.`, 'rB', rB * 100);
  k.r(`**Posterior return of stocks:** $E[R_S] + \\kappa \\tau (\\sigma_{BS} - \\sigma_S^2) = ${tn(eS, 6)} + ${tq(k_, 4)} \\times 0.01 \\times (${tn(cov, 6)} - ${tn(sS * sS, 4)}) = ${tn(eS, 6)} + ${tq(k_ * tau * (cov - sS * sS), 6)} = ${tn(rS, 6)}$, i.e. $${tp(rS, 4)}$.`, 'rS', rS * 100);
  return withCalc(Q('L4.blackLitterman', 4, body, chooseParts(items, 2, 4)), k.steps);
}

/** Fee a mean-variance investor would pay for active management (Kane, Marcus and Trippi). */
export function L4_fee(): Question {
  const n = pick([50, 100, 200, 500]), a = rstep(0.5, 3, 0.25) / 100, r2 = pick([0.01, 0.02, 0.05, 0.1, 1]), se = rstep(0.04, 0.12, 0.01), A = pick([2, 3, 4]);
  const aum = rstep(10, 500, 10) * 1e6;
  const ir = r2 * a / se, f = n * ir * ir / (2 * A);
  const body = p_(`A fund’s analysts produce annual alpha forecasts of ${pp(a)} on average across a universe of ${n} stocks${r2 < 1 ? `, with an accuracy (R²) of ${P(r2, 0)}` : ' and their forecasts are perfectly accurate'}. The residual standard deviation is ${P(se, 0)}. The fund manages ${usd(aum)}. Investors are mean-variance with a risk aversion of ${A}.`);
  const items: Item[] = [
    { part: N('What is the information ratio per stock after adjusting alpha for forecast precision?', ir, 'n', { abs: 0.0005, key: 'ir' }), w: 0.5 },
    { part: N('What fee rate (in excess of a passive index fund) would the investor pay? Enter in percent of assets.', f * 100, 'pct', { abs: 0.0005, key: 'f' }), w: 0.5 },
    { part: N('What is the fee in dollars?', f * aum, 'usd', { key: 'fee' }), must: true },
  ];
  const k = calc();
  k.r(`**Information ratio per stock:** the forecasts are scaled by their precision, $IR = \\frac{R^2 \\, \\alpha}{\\sigma_\\varepsilon} = \\frac{${tn(r2, 2)} \\times ${tp(a, 2)}}{${tp(se, 0)}} = \\frac{${tp(r2 * a, 4)}}{${tp(se, 0)}} = ${tn(ir, 6)}$.`, 'ir', ir);
  k.r(`**Fee rate:** $f = \\frac{n \\, IR^2}{2A} = \\frac{${n} \\times ${tn(ir, 6)}^2}{2 \\times ${A}} = \\frac{${n} \\times ${tn(ir * ir, 8)}}{${2 * A}} = ${tn(f, 6)}$, i.e. $${tp(f, 4)}$ of assets.`, 'f', f * 100);
  k.r(`**Fee in dollars:** $f \\times AUM = ${tn(f, 6)} \\times ${tn(aum, 0)} = ${tn(f * aum, 2)}$ (USD).`, 'fee', f * aum);
  return withCalc(Q('L4.fee', 4, body, chooseParts(items, 1, 3)), k.steps);
}

// =====================================================================
// LECTURE 5 — Estimation error and portfolio construction
// =====================================================================

/** Two-asset tangency and minimum-variance portfolios (Markowitz recap). */
export function L5_markowitz(): Question {
  for (let t = 0; t < 1000; t++) {
    const m1 = rstep(0.02, 0.1, 0.005), m2 = rstep(0.02, 0.12, 0.005), s1 = rstep(0.08, 0.3, 0.01), s2 = rstep(0.08, 0.3, 0.01), rho = rstep(-0.3, 0.7, 0.05);
    const c = rho * s1 * s2, den = m1 * s2 * s2 + m2 * s1 * s1 - (m1 + m2) * c;
    if (Math.abs(den) < 1e-4) continue;
    const w1 = (m1 * s2 * s2 - m2 * c) / den, w2 = 1 - w1;
    if (w1 < -1 || w1 > 2) continue;
    const g1 = (s2 * s2 - c) / (s1 * s1 + s2 * s2 - 2 * c);
    const eP = w1 * m1 + w2 * m2, sP = Math.sqrt(w1 * w1 * s1 * s1 + w2 * w2 * s2 * s2 + 2 * w1 * w2 * c);
    if (eP <= 0) continue;
    const A = pick([2, 3, 4, 5]);
    const n = pick([50, 100, 500]);
    const body = p_(`Two risky assets have expected excess returns of ${pp(m1, 1)} and ${pp(m2, 1)}, standard deviations of ${pp(s1, 0)} and ${pp(s2, 0)}, and a correlation of ${fmtNum(rho)}. ${NOTE_PCT}`);
    const items: Item[] = [
      { part: N('What is the weight of asset 1 in the optimal risky (tangency) portfolio? (Decimal.)', w1, 'n', { key: 'w1' }), must: true },
      { part: N('What is the weight of asset 1 in the global minimum-variance portfolio? (Decimal.)', g1, 'n', { key: 'g1' }), w: 0.6 },
      { part: N('What is the Sharpe ratio of the tangency portfolio?', eP / sP, 'n', { key: 'sr' }), w: 0.5 },
      { part: N(`An investor with risk aversion ${A} combines the tangency portfolio with T-bills. What fraction of wealth goes into the risky portfolio? (Decimal.)`, eP / (A * sP * sP), 'n', { key: 'y' }), w: 0.4 },
      { part: N(`How many parameters (means, variances, covariances) does full Markowitz optimisation need for ${n} assets?`, n + n + n * (n - 1) / 2, 'n', { key: 'np' }), w: 0.25 },
    ];
    const k = calc(), vP = w1 * w1 * s1 * s1 + w2 * w2 * s2 * s2 + 2 * w1 * w2 * c;
    k.s(`**Covariance:** $\\sigma_{12} = \\rho \\sigma_1 \\sigma_2 = ${tn(rho, 2)} \\times ${tn(s1, 2)} \\times ${tn(s2, 2)} = ${tn(c, 6)}$.`);
    k.r(`**Tangency weight of asset 1:** $w_1 = \\frac{\\mu_1 \\sigma_2^2 - \\mu_2 \\sigma_{12}}{\\mu_1 \\sigma_2^2 + \\mu_2 \\sigma_1^2 - (\\mu_1 + \\mu_2) \\sigma_{12}} = \\frac{${tn(m1, 3)} \\times ${tn(s2 * s2, 4)} - ${tn(m2, 3)} \\times ${tq(c, 6)}}{${tn(m1, 3)} \\times ${tn(s2 * s2, 4)} + ${tn(m2, 3)} \\times ${tn(s1 * s1, 4)} - ${tn(m1 + m2, 3)} \\times ${tq(c, 6)}} = \\frac{${tn(m1 * s2 * s2 - m2 * c, 6)}}{${tn(den, 6)}} = ${tn(w1, 4)}$.`, 'w1', w1);
    k.r(`**Minimum-variance weight of asset 1:** $\\frac{\\sigma_2^2 - \\sigma_{12}}{\\sigma_1^2 + \\sigma_2^2 - 2 \\sigma_{12}} = \\frac{${tn(s2 * s2, 4)} - ${tq(c, 6)}}{${tn(s1 * s1, 4)} + ${tn(s2 * s2, 4)} - 2 \\times ${tq(c, 6)}} = \\frac{${tn(s2 * s2 - c, 6)}}{${tn(s1 * s1 + s2 * s2 - 2 * c, 6)}} = ${tn(g1, 4)}$.`, 'g1', g1);
    k.s(`**Tangency portfolio:** $w_2 = 1 - w_1 = ${tn(w2, 4)}$. Its expected excess return is $w_1 \\mu_1 + w_2 \\mu_2 = ${tq(w1, 4)} \\times ${tn(m1, 3)} + ${tq(w2, 4)} \\times ${tn(m2, 3)} = ${tn(eP, 6)}$ and its variance is $w_1^2 \\sigma_1^2 + w_2^2 \\sigma_2^2 + 2 w_1 w_2 \\sigma_{12} = ${tn(w1 * w1 * s1 * s1, 6)} + ${tn(w2 * w2 * s2 * s2, 6)} + ${tq(2 * w1 * w2 * c, 6)} = ${tn(vP, 6)}$, so $\\sigma_P = ${tn(sP, 6)}$.`);
    k.r(`**Sharpe ratio:** $\\frac{\\mu_P}{\\sigma_P} = \\frac{${tn(eP, 6)}}{${tn(sP, 6)}} = ${tn(eP / sP, 4)}$.`, 'sr', eP / sP);
    k.r(`**Share in the risky portfolio:** $y = \\frac{\\mu_P}{A \\sigma_P^2} = \\frac{${tn(eP, 6)}}{${A} \\times ${tn(vP, 6)}} = \\frac{${tn(eP, 6)}}{${tn(A * vP, 6)}} = ${tn(eP / (A * sP * sP), 4)}$.`, 'y', eP / (A * sP * sP));
    k.r(`**Number of parameters:** $n$ means, $n$ variances and $\\frac{n(n-1)}{2}$ covariances: $${n} + ${n} + \\frac{${n} \\times ${n - 1}}{2} = ${n} + ${n} + ${tn(n * (n - 1) / 2, 0)} = ${tn(n + n + n * (n - 1) / 2, 0)}$.`, 'np', n + n + n * (n - 1) / 2);
    return withCalc(Q('L5.markowitz', 5, body, chooseParts(items, 2, 4)), k.steps);
  }
  throw new Error('L5_markowitz: no valid draw');
}

/** Shrinkage of weights and of covariance estimates. */
export function L5_shrinkage(): Question {
  const lam = pick([0.25, 0.4, 0.5, 0.6, 0.75]);
  let w: number[];
  do { const x = rstep(-0.8, 1.6, 0.05), y = rstep(-0.8, 1.6, 0.05); w = [x, y, +(1 - x - y).toFixed(2)]; } while (Math.max(...w.map(Math.abs)) < 0.8);
  const mu = [rstep(0.02, 0.1, 0.005), rstep(0.02, 0.1, 0.005), rstep(0.02, 0.1, 0.005)];
  const ws = w.map(x => (1 - lam) * x + lam / 3);
  const cS = rstep(-0.01, 0.03, 0.001), cT = rstep(0, 0.02, 0.001);
  const body = p_(`A mean-variance optimisation on sample estimates gives weights of ${w.map(x => fmtNum(x)).join(', ')} for three assets with expected excess returns of ${mu.map(x => pp(x, 1)).join(', ')}. To limit estimation error you shrink the weights towards the 1/N portfolio with intensity λ = ${fmtNum(lam)}: w̃ = (1 − λ) w<sub>MV</sub> + λ w<sub>1/N</sub>.`);
  const items: Item[] = [
    { part: N('What is the shrunk weight of asset 1? (Decimal.)', ws[0], 'n', { key: 'ws1' }), must: true },
    { part: N('What is the shrunk weight of asset 3? (Decimal.)', ws[2], 'n', { key: 'ws3' }), w: 0.5 },
    { part: N('What is the expected excess return of the shrunk portfolio?', ws.reduce((s, x, i) => s + x * mu[i], 0) * 100, 'pct', { key: 'er' }), w: 0.5 },
    { part: N(`A sample covariance of ${fmtNum(cS, 3)} is shrunk with the same λ towards a target of ${fmtNum(cT, 3)}. What is the shrunk covariance?`, (1 - lam) * cS + lam * cT, 'n', { abs: 0.0002, key: 'cov' }), w: 0.3 },
  ];
  const k = calc(), erS = ws.reduce((s, x, i) => s + x * mu[i], 0);
  const shr = (i: number) => `$\\tilde w_${i + 1} = (1 - \\lambda) w_${i + 1} + \\frac{\\lambda}{3} = ${tn(1 - lam, 2)} \\times ${tq(w[i], 2)} + \\frac{${tn(lam, 2)}}{3} = ${tq((1 - lam) * w[i], 4)} + ${tn(lam / 3, 6)} = ${tn(ws[i], 4)}$`;
  k.r(`**Shrunk weight of asset 1:** ${shr(0)}.`, 'ws1', ws[0]);
  k.s(`**Shrunk weight of asset 2:** ${shr(1)}.`);
  k.r(`**Shrunk weight of asset 3:** ${shr(2)}.`, 'ws3', ws[2]);
  k.r(`**Expected excess return:** $\\sum_i \\tilde w_i \\mu_i = ${ws.map((x, i) => `${tq(x, 4)} \\times ${tn(mu[i], 3)}`).join(' + ')} = ${ws.map((x, i) => tq(x * mu[i], 6)).join(' + ')} = ${tn(erS, 6)}$, i.e. $${tp(erS, 4)}$.`, 'er', erS * 100);
  k.r(`**Shrunk covariance:** $(1 - \\lambda) \\sigma_{sample} + \\lambda \\sigma_{target} = ${tn(1 - lam, 2)} \\times ${tq(cS, 3)} + ${tn(lam, 2)} \\times ${tn(cT, 3)} = ${tq((1 - lam) * cS, 6)} + ${tn(lam * cT, 6)} = ${tn((1 - lam) * cS + lam * cT, 6)}$.`, 'cov', (1 - lam) * cS + lam * cT);
  return withCalc(Q('L5.shrinkage', 5, body, chooseParts(items, 2, 3)), k.steps);
}

// =====================================================================
// LECTURE 6 — Hedge funds
// =====================================================================

/** Portable alpha with index futures. */
export function L6_portable(): Question {
  for (let t = 0; t < 500; t++) {
    const n = rint(3, 20), S0 = rstep(1500, 5000, 100), beta = pick([0.5, 0.75, 1.2, 1.25, 1.5, 2, 2.5]);
    const M = n * 250 * S0 / beta / 1e6;
    if (Math.abs(M * 1000 - Math.round(M * 1000)) > 1e-6 || M > 30) continue;
    const a = rstep(0.01, 0.12, 0.005), rf = rstep(0.01, 0.05, 0.005);
    const c0 = M * (1 + a + rf * (1 - beta)), h0 = M * beta * rf;
    const body = p_(`You manage a $${fmtNum(M, 3)} million portfolio with an alpha of ${pp(a, 1)} and a beta of ${fmtNum(beta)} with respect to the S&P 500. The risk-free rate is ${pp(rf, 1)}. The S&P 500 trades at ${fmtNum(S0)} and each futures contract has a multiplier of 250. Write values in $ million as a + b·r<sub>M</sub> + c·e.`);
    const items: Item[] = [
      { part: N('Unhedged portfolio value at t+1: what is the constant a?', c0, 'musd', { key: 'a0' }), must: true },
      { part: N('… and the coefficient b on the market return?', M * beta, 'musd', { key: 'b' }), w: 0.7 },
      { part: N('How many S&P 500 futures contracts must you sell to hedge the market exposure?', n, 'n', { key: 'n' }), must: true },
      { part: N('What is the constant of the futures position’s value at t+1?', h0, 'musd', { key: 'h' }), w: 0.5 },
      { part: N('What is the constant of the hedged portable-alpha portfolio at t+1?', c0 + h0, 'musd', { key: 'ch' }), w: 0.7 },
      { part: N('What is the expected return of the hedged portfolio?', (a + rf) * 100, 'pct', { key: 'er' }), w: 0.4 },
    ];
    const k = calc(), fac = 1 + a + rf * (1 - beta);
    k.s(`**Value at t+1:** with excess return $r_M - r_f$ on the market, the portfolio is worth $M \\left(1 + r_f + \\beta (r_M - r_f) + \\alpha + e\\right)$. Collecting terms gives a constant $M \\left(1 + \\alpha + r_f (1 - \\beta)\\right)$ and a market coefficient $M \\beta$ (values in USD million).`);
    k.r(`**Constant a:** $1 + \\alpha + r_f (1 - \\beta) = 1 + ${tn(a, 4)} + ${tn(rf, 4)} \\times (1 - ${tn(beta, 2)}) = 1 + ${tn(a, 4)} + ${tq(rf * (1 - beta), 6)} = ${tn(fac, 6)}$, so $a = ${tn(M, 3)} \\times ${tn(fac, 6)} = ${tn(c0, 4)}$.`, 'a0', c0);
    k.r(`**Coefficient b:** $M \\beta = ${tn(M, 3)} \\times ${tn(beta, 2)} = ${tn(M * beta, 4)}$.`, 'b', M * beta);
    k.r(`**Futures contracts:** the market exposure is $M \\beta = ${tn(M * beta * 1e6, 0)}$ USD, one contract covers $250 \\times S_0 = 250 \\times ${tn(S0, 0)} = ${tn(250 * S0, 0)}$ USD, so $n = \\frac{${tn(M * beta * 1e6, 0)}}{${tn(250 * S0, 0)}} = ${tn(n, 0)}$ contracts.`, 'n', n);
    k.r(`**Futures position at t+1:** the short position pays $-M\\beta \\, (r_M - r_f)$ in excess of the risk-free rate, so its constant is $M \\beta \\, r_f = ${tn(M * beta, 4)} \\times ${tn(rf, 4)} = ${tn(h0, 4)}$ (USD million).`, 'h', h0);
    k.r(`**Hedged portfolio:** the market terms cancel and the constants add up, $${tn(c0, 4)} + ${tn(h0, 4)} = ${tn(c0 + h0, 4)}$ (USD million).`, 'ch', c0 + h0);
    k.r(`**Expected return:** the hedged portfolio is worth $M(1 + r_f + \\alpha + e)$, so $E[r] = \\alpha + r_f = ${tp(a, 1)} + ${tp(rf, 1)} = ${tp(a + rf, 2)}$.`, 'er', (a + rf) * 100);
    return withCalc(Q('L6.portable', 6, body, chooseParts(items, 3, 5)), k.steps);
  }
  throw new Error('L6_portable: no valid draw');
}

/** 2-and-20 fees with a hurdle across two funds, and incentive fees in a fund of funds. */
export function L6_fees(): Question {
  const mg = pick([0.01, 0.015, 0.02]), inc = pick([0.15, 0.2, 0.2, 0.25]), h = pick([0, 0.01, 0.02, 0.03]);
  if (chance(0.6)) {
    const A1 = rstep(0.5, 5, 0.25), A2 = rstep(0.5, 5, 0.25), r1 = rstep(-0.3, 0.35, 0.01), r2 = rstep(-0.3, 0.35, 0.01);
    if ((r1 > h) === (r2 > h) && chance(0.7)) return L6_fees();
    const gross = A1 * r1 + A2 * r2, mgmt = mg * (A1 + A2), i1 = A1 * inc * Math.max(r1 - h, 0), i2 = A2 * inc * Math.max(r2 - h, 0);
    const net = gross - mgmt - i1 - i2;
    const body = p_(`A university trust invests $${fmtNum(A1)} million in hedge fund A and $${fmtNum(A2)} million in hedge fund B. Both charge a management fee of ${P(mg, 1)} of assets and an incentive fee of ${P(inc, 0)} of returns above a hurdle rate of ${P(h, 0)}. Over the year fund A earns a gross return of ${pp(r1, 0)} and fund B ${pp(r2, 0)}.`);
    const items: Item[] = [
      { part: N('What are the total incentive fees paid?', i1 + i2, 'musd', { key: 'inc' }), w: 0.6 },
      { part: N('What is the trust’s gross return before fees?', gross / (A1 + A2) * 100, 'pct', { key: 'gross' }), w: 0.4 },
      { part: N('What is the trust’s return after all fees?', net / (A1 + A2) * 100, 'pct', { key: 'net' }), must: true },
    ];
    const k = calc(), T = A1 + A2;
    k.s(`**Fund A incentive fee:** only the return above the hurdle counts, $\\max(r_A - h, 0) = \\max(${tp(r1, 0)} - ${tp(h, 0)}, 0) = ${tp(Math.max(r1 - h, 0), 2)}$, so the fee is $${tn(inc, 2)} \\times ${tn(A1)} \\times ${tn(Math.max(r1 - h, 0), 4)} = ${tn(i1, 4)}$ (USD million).`);
    k.s(`**Fund B incentive fee:** $\\max(${tp(r2, 0)} - ${tp(h, 0)}, 0) = ${tp(Math.max(r2 - h, 0), 2)}$, so the fee is $${tn(inc, 2)} \\times ${tn(A2)} \\times ${tn(Math.max(r2 - h, 0), 4)} = ${tn(i2, 4)}$ (USD million).`);
    k.r(`**Total incentive fees:** $${tn(i1, 4)} + ${tn(i2, 4)} = ${tn(i1 + i2, 4)}$ (USD million).`, 'inc', i1 + i2);
    k.s(`**Gross profit:** $${tn(A1)} \\times ${tq(r1, 2)} + ${tn(A2)} \\times ${tq(r2, 2)} = ${tq(A1 * r1, 4)} + ${tq(A2 * r2, 4)} = ${tn(gross, 4)}$ (USD million) on a total investment of ${tn(T)} million.`);
    k.r(`**Gross return:** $\\frac{${tn(gross, 4)}}{${tn(T)}} = ${tn(gross / T, 6)}$, i.e. $${tp(gross / T, 4)}$.`, 'gross', gross / T * 100);
    k.s(`**Management fees:** $${tn(mg, 3)} \\times (${tn(A1)} + ${tn(A2)}) = ${tn(mg, 3)} \\times ${tn(T)} = ${tn(mgmt, 4)}$ (USD million).`);
    k.r(`**Return after fees:** profit after fees $= ${tn(gross, 4)} - ${tn(mgmt, 4)} - ${tn(i1, 4)} - ${tn(i2, 4)} = ${tn(net, 4)}$ (USD million), so the return is $\\frac{${tn(net, 4)}}{${tn(T)}} = ${tn(net / T, 6)}$, i.e. $${tp(net / T, 4)}$.`, 'net', net / T * 100);
    return withCalc(Q('L6.fees', 6, body, chooseParts(items, 1, 3)), k.steps);
  }
  const nf = 3, amt = rstep(1, 3, 0.5), rs = [rstep(0.05, 0.3, 0.01), rstep(-0.25, 0.1, 0.01), rstep(-0.25, 0.15, 0.01)];
  const agg = rs.reduce((s, r) => s + r, 0) / nf, fees = rs.reduce((s, r) => s + amt * inc * Math.max(r - h, 0), 0);
  const body = p_(`A fund of funds has $${fmtNum(amt)} million in each of three hedge funds. Each charges an incentive fee of ${P(inc, 0)} on returns above a hurdle of ${P(h, 0)} (ignore management fees). Gross returns are ${rs.map(r => pp(r, 0)).join(', ')}.`);
  const items: Item[] = [
    { part: N('What is the aggregate gross return of the fund of funds?', agg * 100, 'pct', { key: 'agg' }), w: 0.5 },
    { part: N('What incentive fees are paid in total?', fees, 'musd', { key: 'fees' }), must: true },
    { part: N('What is the return after incentive fees?', (agg * nf * amt - fees) / (nf * amt) * 100, 'pct', { key: 'net' }), w: 0.6 },
  ];
  const k = calc(), tot = nf * amt, netR = (agg * tot - fees) / tot;
  k.r(`**Aggregate gross return:** equal amounts in each fund, so it is the simple average $\\frac{${rs.map(r => tp(r, 0)).join(' + ')}}{3} = \\frac{${tp(rs.reduce((x, r) => x + r, 0), 0)}}{3} = ${tp(agg, 4)}$.`, 'agg', agg * 100);
  rs.forEach((r, i) => k.s(`**Fund ${i + 1} incentive fee:** $${tn(inc, 2)} \\times ${tn(amt)} \\times \\max(${tp(r, 0)} - ${tp(h, 0)}, 0) = ${tn(inc, 2)} \\times ${tn(amt)} \\times ${tn(Math.max(r - h, 0), 4)} = ${tn(amt * inc * Math.max(r - h, 0), 4)}$ (USD million).`));
  k.r(`**Total incentive fees:** $${rs.map(r => tn(amt * inc * Math.max(r - h, 0), 4)).join(' + ')} = ${tn(fees, 4)}$ (USD million).`, 'fees', fees);
  k.r(`**Return after incentive fees:** gross profit $= ${tp(agg, 4)} \\times ${tn(tot)} = ${tn(agg * tot, 4)}$ (USD million), minus fees $${tn(fees, 4)}$ gives $${tn(agg * tot - fees, 4)}$, so the return is $\\frac{${tn(agg * tot - fees, 4)}}{${tn(tot)}} = ${tn(netR, 6)}$, i.e. $${tp(netR, 4)}$.`, 'net', netR * 100);
  return withCalc(Q('L6.fees', 6, body, chooseParts(items, 2, 3)), k.steps);
}

/** High-water mark: when is the incentive fee charged? */
export function L6_hwm(): Question {
  const inc = pick([0.2, 0.2, 0.15]), r = [rstep(0.05, 0.3, 0.01), rstep(-0.3, -0.05, 0.01), rstep(0.05, 0.35, 0.01)];
  // Incentive fees are paid on gains above the high-water mark, measured on the value after fees.
  let V = 100, hwm = 100; const fees: number[] = [], vals: number[] = [];
  const k = calc();
  r.forEach((x, i) => {
    const g = V * (1 + x), gain = Math.max(0, g - hwm), fee = gain * inc, hwm0 = hwm, V0 = V;
    V = g - fee; hwm = Math.max(hwm, V); fees.push(fee); vals.push(V);
    const key = ['fee1', 'v2', 'fee3'][i];
    k.r(`**Year ${i + 1}.** Value before the fee: $${tn(V0, 4)} \\times ${tn(1 + x, 4)} = ${tn(g, 4)}$ (USD). The high-water mark is ${tn(hwm0, 4)} USD, so the gain above it is $\\max(${tn(g, 4)} - ${tn(hwm0, 4)}, 0) = ${tn(gain, 4)}$ and the incentive fee is $${tn(inc, 2)} \\times ${tn(gain, 4)} = ${tn(fee, 4)}$. Value after the fee: $${tn(g, 4)} - ${tn(fee, 4)} = ${tn(V, 4)}$; new high-water mark ${tn(hwm, 4)} USD.`, key, key === 'v2' ? V : fee);
  });
  k.r(`**Fee in year 3?** The fee of ${tn(fees[2], 4)} USD is ${fees[2] > 0 ? 'positive' : 'zero'}, so ${fees[2] > 0 ? 'an incentive fee is paid' : 'no incentive fee is paid (the fund has not regained its high-water mark)'}.`, 'paid');
  const body = p_(`You invest $100 in a hedge fund with a ${P(inc, 0)} incentive fee subject to a high-water mark; ignore management fees. Gross returns in years 1–3 are ${r.map(x => pp(x, 0)).join(', ')}. Fees are deducted at the end of each year.`);
  const items: Item[] = [
    { part: N('What incentive fee is paid in year 1?', fees[0], 'usd', { abs: 0.011, key: 'fee1' }), w: 0.6 },
    { part: N('What is the value of the investment after fees at the end of year 2?', vals[1], 'usd', { abs: 0.011, key: 'v2' }), w: 0.4 },
    { part: N('What incentive fee is paid in year 3?', fees[2], 'usd', { abs: 0.011, key: 'fee3' }), must: true },
    { part: C('Is an incentive fee paid in year 3?', ['Yes', 'No'], fees[2] > 0 ? 0 : 1, 'paid'), w: 0.4 },
  ];
  return withCalc(Q('L6.hwm', 6, body, chooseParts(items, 2, 3)), k.steps);
}

/** Scholes-Williams correction for stale prices (Asness, Krail and Liew). */
export function L6_lagBeta(): Question {
  const name = fund('Capital');
  const b0 = rstep(0.1, 0.6, 0.05), b1 = rstep(0.1, 0.5, 0.05), b2 = rstep(0, 0.3, 0.05);
  const rm = rstep(0.004, 0.008, 0.0005), simpleA = rstep(0.002, 0.006, 0.0005);
  const meanR = simpleA + b0 * rm, adjA = meanR - (b0 + b1 + b2) * rm;
  const body = p_(`${name} holds illiquid securities. A regression of its monthly excess returns on the contemporaneous market excess return gives a beta of ${fmtNum(b0)} and an alpha of ${pp(simpleA)} per month. Adding the market returns of the previous two months gives coefficients of ${fmtNum(b0)}, ${fmtNum(b1)} and ${fmtNum(b2)}. The average market excess return is ${pp(rm)} per month. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the Scholes-Williams corrected beta?', b0 + b1 + b2, 'n', { key: 'beta' }), must: true },
    { part: N('By what factor is the market exposure understated by the simple regression?', (b0 + b1 + b2) / b0, 'n', { key: 'factor' }), w: 0.5 },
    { part: N('What is the monthly alpha after the correction?', adjA * 100, 'pct', { abs: 0.0005, key: 'alpha' }), w: 0.7 },
  ];
  const k = calc(), bS = b0 + b1 + b2;
  k.r(`**Corrected beta:** with stale prices the market impact is spread over several months, so the true beta is the sum of the coefficients, $\\beta = \\beta_0 + \\beta_1 + \\beta_2 = ${tn(b0, 2)} + ${tn(b1, 2)} + ${tn(b2, 2)} = ${tn(bS, 4)}$.`, 'beta', bS);
  k.r(`**Understatement factor:** $\\frac{\\beta}{\\beta_0} = \\frac{${tn(bS, 4)}}{${tn(b0, 2)}} = ${tn(bS / b0, 4)}$.`, 'factor', bS / b0);
  k.s(`**Average excess return of the fund:** $\\alpha_{simple} + \\beta_0 \\bar r_M = ${tp(simpleA, 2)} + ${tn(b0, 2)} \\times ${tp(rm, 2)} = ${tp(simpleA, 2)} + ${tp(b0 * rm, 4)} = ${tp(meanR, 4)}$ per month.`);
  k.r(`**Corrected alpha:** the average return minus the compensation for the full exposure, $\\alpha = \\bar r - \\beta \\bar r_M = ${tp(meanR, 4)} - ${tn(bS, 4)} \\times ${tp(rm, 2)} = ${tp(meanR, 4)} - ${tp(bS * rm, 4)} = ${tpq(adjA, 4)}$ per month.`, 'alpha', adjA * 100);
  return withCalc(Q('L6.lagBeta', 6, body, chooseParts(items, 2, 3)), k.steps);
}
