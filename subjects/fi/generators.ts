// Financial Investments: procedural generators for lectures 1–6 (CAPM, APT/EMH, performance, active management,
// estimation error, hedge funds). Inputs are drawn fresh each time; every solution is computed from the same inputs.
import { C, N, P, Q, chance, chooseParts, co, fmtNum, p_, pick, poss, rint, roundTo, rstep, shuffle, table, v, type Item } from '@/lib/engine/gen-helpers';
import type { Part, Question } from '@/lib/engine/types';

const pp = (x: number, d = 2) => P(x, d);
const usd = (x: number, d = 0) => (x < 0 ? '−' : '') + '$' + fmtNum(Math.abs(x), d);
const NOTE_PCT = 'Enter returns in percent, e.g. 8.33 for 8.33%.';
const FUNDS = ['Atlas', 'Borealis', 'Cedar', 'Delta', 'Ember', 'Fjord', 'Granite', 'Helix', 'Ionic', 'Juniper', 'Kite', 'Lumen', 'Meridian', 'Nimbus', 'Onyx', 'Polaris'];
const fund = (s: string) => pick(FUNDS) + ' ' + s;
const POSSIBLE = ['Possible', 'Not possible'];

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
      { part: N(v('What is the fair (required) return according to the CAPM?', 'What is the equilibrium expected return of the stock in a CAPM world?'), fair * 100, 'pct'), must: true },
      { part: N('What is the alpha of the stock given the analyst’s forecast?', (fc - fair) * 100, 'pct'), w: 0.8 },
      { part: C('Relative to the SML, the stock is', ['Underpriced', 'Overpriced'], fc > fair ? 0 : 1), w: 0.7 },
    ];
    return Q('L1.capm', 1, body, chooseParts(items, 2, 3));
  }
  if (vr === 1) {
    const er = rstep(rf - 0.03, rf + 0.12, 0.0025), beta = (er - rf) / mrp;
    const body = p_(`In a CAPM world the risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}. ${name} has an expected return of ${pp(er)}.`);
    const parts: Part[] = [N('What is the beta of the stock? (A negative beta is possible.)', beta, 'n')];
    if (chance(0.5)) parts.push(N('What is the expected return of a portfolio with 60% in this stock and 40% in the market?', (0.6 * er + 0.4 * (rf + mrp)) * 100, 'pct'));
    return Q('L1.capm', 1, body, parts);
  }
  if (vr === 2) {
    for (let t = 0; t < 200; t++) {
      const P0 = rstep(20, 150, 0.5), er = rstep(rf + 0.03, rf + 0.1, 0.0025), k = pick([1.5, 2, 0.5]);
      const b0 = (er - rf) / mrp, er1 = rf + k * b0 * mrp;
      if (er1 < 0.02) continue;
      const D = er * P0, P1 = D / er1;
      const word = { 1.5: 'rises by 50%', 2: 'doubles', 0.5: 'halves' }[k];
      const body = p_(`The market price of ${poss(name)} shares is $${fmtNum(P0)}. The stock pays a constant dividend in perpetuity and its expected return is ${pp(er)}. The risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}. Suppose the correlation of the stock with the market ${word}, all else unchanged.`);
      const items: Item[] = [
        { part: N('What is the dividend per share?', D, 'usd'), w: 0.4 },
        { part: N('What is the beta of the stock today?', b0, 'n'), w: 0.6 },
        { part: N('What is the new expected return?', er1 * 100, 'pct'), w: 0.6 },
        { part: N('What is the new share price?', P1, 'usd'), must: true },
      ];
      return Q('L1.capm', 1, body, chooseParts(items, 2, 4));
    }
  }
  const bCo = rstep(1.2, 2.4, 0.05), bProj = rstep(0.3, 0.9, 0.05), proj = co();
  const body = p_(`${name} has an equity beta of ${fmtNum(bCo)}. It plans a project in a new line of business whose risk matches that of ${proj}, a pure-play firm with a beta of ${fmtNum(bProj)}. The risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}.`);
  const items: Item[] = [
    { part: N('What cost of capital should be used for the project?', (rf + bProj * mrp) * 100, 'pct'), must: true },
    { part: N(`What is the cost of equity of ${name} as a whole?`, (rf + bCo * mrp) * 100, 'pct'), w: 0.5 },
  ];
  return Q('L1.capm', 1, body, chooseParts(items, 1, 2));
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
      { part: N(`What is the beta of ${A}?`, betaA, 'n'), must: true },
      { part: N(`What is the beta of ${B}?`, betaB, 'n'), w: 0.6 },
      { part: N(`What is the expected return of ${A}?`, eA * 100, 'pct'), w: 0.5 },
      { part: N('What is the slope of the SML (the expected market risk premium)?', (eM - rf) * 100, 'pct'), w: 0.5 },
      { part: N(`What is the alpha of ${A}?`, alA * 100, 'pct'), must: true },
      { part: N(`What is the alpha of ${B}?`, alB * 100, 'pct'), w: 0.5 },
      { part: C(`${A} is`, ['Underpriced', 'Overpriced'], alA > 0 ? 0 : 1), w: 0.4 },
    ];
    return Q('L1.scenario', 1, body, chooseParts(items, 3, 5));
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
      { part: N(`What is the market beta of ${name}?`, beta, 'n'), must: true },
      { part: N('What share of the total variance is systematic (the R² of the market regression)?', beta * beta * sM * sM / vi * 100, 'pct'), w: 0.6 },
      { part: N(`${other} has a beta of ${fmtNum(b2)}. What is the covariance between the two stocks?`, cov, 'n', { abs: 0.0002 }), w: 0.5 },
    ];
    return Q('L1.sim', 1, body, chooseParts(items, 2, 3));
  }
  const r2 = beta * beta * sM * sM / vi;
  const body = p_(`A market regression for ${name} gives a beta of ${fmtNum(beta)} and an R² of ${P(r2, 2)}. The total standard deviation of ${name} is ${P(si, 2)} and that of the market is ${P(sM, 0)}. ${other} has a beta of ${fmtNum(b2)} and a standard deviation of ${P(si2, 2)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N(`What is the standard deviation of the residuals of ${name}?`, se * 100, 'pct'), must: true },
    { part: N('What is the correlation between the two stocks implied by the single-index model?', cov / (si * si2), 'n'), w: 0.6 },
    { part: N(`What is the systematic standard deviation (β × σ_M) of ${name}?`, beta * sM * 100, 'pct'), w: 0.4 },
  ];
  return Q('L1.sim', 1, body, chooseParts(items, 2, 3));
}

/** CAL of an individual asset, CML, volatility of a well-diversified portfolio, risk aversion. */
export function L1_cml(): Question {
  const rf = rstep(0.01, 0.06, 0.005), mrp = rstep(0.04, 0.09, 0.005), sM = rstep(0.14, 0.25, 0.01);
  const srM = mrp / sM, rho = rstep(0.1, 0.9, 0.05), er = rf + rstep(0.02, 0.12, 0.005);
  const beta = (er - rf) / mrp;
  const name = co();
  const body = p_(`In a CAPM world the risk-free rate is ${pp(rf, 1)}, the market risk premium is ${pp(mrp, 1)} and the market’s standard deviation is ${pp(sM, 0)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the Sharpe ratio of the market (the slope of the CML)?', srM, 'n'), w: 0.5 },
    { part: N(`${name} has a correlation of ${fmtNum(rho)} with the market. What is the slope of the CAL spanned by ${name}?`, rho * srM, 'n'), w: 0.7 },
    { part: N(`A well-diversified portfolio with no specific risk has an expected return of ${pp(er, 1)}. What is its standard deviation?`, beta * sM * 100, 'pct'), must: true },
    { part: N('What average coefficient of risk aversion is consistent with these market values (A = E[R_M]/σ²_M)?', mrp / (sM * sM), 'n'), w: 0.4 },
    { part: N(`What expected return does the CML give for an efficient portfolio with a standard deviation of ${pp(sM * 0.6, 1)}?`, (rf + srM * sM * 0.6) * 100, 'pct'), w: 0.4 },
  ];
  return Q('L1.cml', 1, body, chooseParts(items, 2, 4));
}

/** Zero-beta CAPM and mimicking portfolios. */
export function L1_zeroBeta(): Question {
  if (chance(0.5)) {
    const ez = rstep(0.03, 0.08, 0.005), em = ez + rstep(0.04, 0.1, 0.005), b = rstep(0.2, 1.8, 0.05);
    const body = p_(`Borrowing is not allowed in this market, so the zero-beta version of the CAPM holds (Black, 1972). The expected return of the stock market is ${pp(em, 1)} and that of its zero-beta companion portfolio is ${pp(ez, 1)}.`);
    const items: Item[] = [
      { part: N(`What is the expected return of a stock with a beta of ${fmtNum(b)}?`, (ez + b * (em - ez)) * 100, 'pct'), must: true },
      { part: C('Relative to the standard CAPM with a lower risk-free rate, the zero-beta SML is', ['Flatter', 'Steeper', 'Identical'], 0), w: 0.4 },
    ];
    return Q('L1.zeroBeta', 1, body, chooseParts(items, 1, 2));
  }
  const etf = fund('ETF'), rf = rstep(0.01, 0.06, 0.005), mrp = rstep(0.03, 0.08, 0.005), b = rstep(0.4, 1.6, 0.02);
  const er = rf + b * mrp + rstep(-0.03, 0.04, 0.0025);
  const mim = b * (rf + mrp) + (1 - b) * rf;
  const body = p_(`The ${etf} has an expected return of ${pp(er)} and a beta of ${fmtNum(b)}. The risk-free rate is ${pp(rf, 1)} and the market risk premium is ${pp(mrp, 1)}. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the alpha of the ETF?', (er - rf - b * mrp) * 100, 'pct'), must: true },
    { part: N('A mimicking portfolio holds only the market and T-bills with the same systematic risk. What weight does it put in the market? (Enter as a decimal, e.g. 0.72.)', b, 'n'), w: 0.6 },
    { part: N('What is the expected return of the mimicking portfolio?', mim * 100, 'pct'), w: 0.6 },
  ];
  return Q('L1.zeroBeta', 1, body, chooseParts(items, 2, 3));
}

/** Which situations can occur in a CAPM equilibrium? */
export function L1_equilibrium(): Question {
  const rf = rstep(0.02, 0.06, 0.01), em = rf + rstep(0.04, 0.1, 0.01), sM = rstep(0.15, 0.3, 0.01);
  const kind = rint(0, 3);
  let html: string, ok: boolean, extra: Part | null = null;
  if (kind === 0) {
    const bA = rstep(0.8, 1.8, 0.1), bB = +(bA + pick([-1, 1]) * rstep(0.1, 0.5, 0.1)).toFixed(2);
    const eA = rstep(0.08, 0.25, 0.01), eB = +(eA + pick([-1, 1]) * rstep(0.01, 0.06, 0.01)).toFixed(4);
    ok = (bA - bB) * (eA - eB) > 0;
    html = table(['Portfolio', 'E[r]', 'β'], [['A', pp(eA, 0), fmtNum(bA)], ['B', pp(eB, 0), fmtNum(bB)]]);
  } else if (kind === 1) {
    const sA = rstep(0.15, 0.4, 0.01), sB = rstep(0.15, 0.4, 0.01), eA = rstep(0.1, 0.35, 0.01), eB = rstep(0.1, 0.35, 0.01);
    ok = true;
    html = table(['Portfolio', 'E[r]', 'σ'], [['A', pp(eA, 0), pp(sA, 0)], ['B', pp(eB, 0), pp(sB, 0)]]);
  } else if (kind === 2) {
    const sA = rstep(0.08, 0.35, 0.01), above = chance(0.5);
    const eA = roundTo(rf + (em - rf) / sM * sA * (above ? rstep(1.05, 1.5, 0.05) : rstep(0.4, 0.95, 0.05)), 0.0025);
    ok = (eA - rf) / sA <= (em - rf) / sM + 1e-9;
    html = table(['Portfolio', 'E[r]', 'σ'], [['Risk-free', pp(rf, 0), '0%'], ['Market', pp(em, 0), pp(sM, 0)], ['A', pp(eA, 2), pp(sA, 0)]]);
    extra = N('What is the Sharpe ratio of A?', (eA - rf) / sA, 'n');
  } else {
    const bA = rstep(0.3, 1.8, 0.1), onLine = chance(0.4);
    const eA = onLine ? rf + bA * (em - rf) : roundTo(rf + bA * (em - rf) + pick([-1, 1]) * rstep(0.005, 0.04, 0.0025), 0.0025);
    ok = Math.abs(eA - rf - bA * (em - rf)) < 1e-9;
    html = table(['Portfolio', 'E[r]', 'β'], [['Risk-free', pp(rf, 0), '0'], ['Market', pp(em, 0), '1'], ['A', pp(eA, 2), fmtNum(bA)]]);
    extra = N('What is the alpha of A?', (eA - rf - bA * (em - rf)) * 100, 'pct');
  }
  const parts: Part[] = [C('Could this situation occur if the CAPM equilibrium holds?', POSSIBLE, ok ? 0 : 1)];
  if (extra && chance(0.6)) parts.unshift(extra);
  return Q('L1.equilibrium', 1, p_('Consider the following portfolios.') + html, parts);
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
    { part: N(`What is the surprise in ${facs[0][1]}?`, surp[0] * 100, 'pct'), w: 0.4 },
    { part: N(`What is the surprise in ${facs[1][1]}?`, surp[1] * 100, 'pct'), w: 0.4 },
    { part: N('What is the expected return of the stock conditional on these factor realisations?', cond * 100, 'pct'), must: true },
  ];
  return Q('L2.surprise', 2, body, chooseParts(items, 1, 3));
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
      { part: N('What is the risk premium of factor F1?', s1 * 100, 'pct'), must: true },
      { part: N('What is the risk premium of factor F2?', s2 * 100, 'pct'), must: true },
      { part: N(`What expected return should a well-diversified portfolio with betas of ${fmtNum(nb[0])} on F1 and ${fmtNum(nb[1])} on F2 have?`, (rf + nb[0] * s1 + nb[1] * s2) * 100, 'pct'), w: 0.5 },
    ];
    return Q('L2.twoFactor', 2, body, chooseParts(items, 2, 3));
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
      { part: N('What is the risk-free rate implied by A and B?', rfS * 100, 'pct'), must: true },
      { part: N('What is the factor risk premium?', rpS * 100, 'pct'), w: 0.7 },
      { part: N('What is the alpha of J?', alpha * 100, 'pct'), must: true },
      { part: C('How do you exploit the arbitrage?', ['Buy J, sell its mimicking portfolio', 'Sell J, buy its mimicking portfolio', 'There is no arbitrage'], alpha > 0 ? 0 : 1), w: 0.6 },
      { part: N('A mimicking portfolio for J is built from A and the risk-free asset. What weight does it put in A?', bJ / bA, 'n'), w: 0.4 },
    ];
    return Q('L2.arbitrage', 2, body, chooseParts(items, 3, 5));
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
    { part: N('What is the expected profit?', 2 * a * X, 'usd'), must: true },
    { part: N('What is the standard deviation of the profit?', sd(n) * X, 'usd'), must: true },
    { part: N(`What would the standard deviation of the profit be with ${n2} stocks in each leg, same amount invested?`, sd(n2) * X, 'usd'), w: 0.6 },
    { part: N('What is the standard deviation of the long-short return (in percent)?', sd(n) * 100, 'pct'), w: 0.3 },
  ];
  return Q('L2.longShort', 2, body, chooseParts(items, 2, 3));
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
    { part: N('What is the Sharpe ratio of the portfolio?', sr, 'n'), w: 0.6 },
    { part: N('What is the Treynor ratio of the portfolio?', tr * 100, 'pct'), w: 0.7 },
    { part: N('What is Jensen’s alpha of the portfolio?', ja * 100, 'pct'), w: 0.7 },
    { part: N('What is the M² measure of the portfolio?', m2 * 100, 'pct'), must: true },
    { part: C('Based on the Sharpe ratio, as an investor’s entire risky portfolio the fund is', ['Better than the market', 'Worse than the market'], sr > (eM - rf) / sM ? 0 : 1), w: 0.4 },
  ];
  return Q('L3.ratios', 3, body, chooseParts(items, 3, 4));
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
    { part: N('What is the standard deviation of the fund’s residuals?', se * 100, 'pct'), must: true },
    { part: N('What is the information ratio of the fund?', a / se, 'n'), must: true },
    { part: N('If the fund is your only active portfolio, what weight should a mean-variance investor give it next to the index (Treynor-Black)?', wH, 'n'), w: 0.5 },
    { part: N('What is the Sharpe ratio of the optimal combination?', srP, 'n'), w: 0.4 },
  ];
  return Q('L3.ir', 3, body, chooseParts(items, 2, 4));
}

/** How long a track record must be before alpha is statistically significant. */
export function L3_tstat(): Question {
  const name = 'The manager of ' + fund('Advisors');
  const a = rstep(0.1, 1, 0.05) / 100, se = rstep(1, 6, 0.25) / 100, neg = chance(0.3);
  const lvl = pick([[1.96, '5%'], [1.645, '10%'], [2.576, '1%']] as [number, string][]);
  const n = (lvl[0] * se / a) ** 2;
  const body = p_(`${name} is a portfolio manager with a true ${neg ? 'negative ' : ''}alpha of ${neg ? '−' : ''}${pp(a)} per month and a residual standard deviation of ${pp(se)} per month. Assume a regression always recovers these true values.`);
  const items: Item[] = [
    { part: N(`How many months of returns are needed before the alpha is significant in a two-tailed test at the ${lvl[1]} level (|t| > ${lvl[0]})?`, n, 'n'), must: true },
    { part: N('How many years is that?', n / 12, 'n'), w: 0.5 },
    { part: N('What is the t-statistic after 5 years of monthly data?', (neg ? -1 : 1) * a / se * Math.sqrt(60), 'n'), w: 0.5 },
  ];
  return Q('L3.tstat', 3, body, chooseParts(items, 1, 3));
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
    { part: N('What is the return of the bogey?', wB.reduce((s, w, i) => s + w * rB[i], 0) * 100, 'pct'), w: 0.4 },
    { part: N('What is the total excess return of P over the bogey?', tot * 100, 'pct'), w: 0.5 },
    { part: N('What is the contribution of asset allocation?', aa * 100, 'pct'), must: true },
    { part: N('What is the contribution of security selection?', ss * 100, 'pct'), must: true },
  ];
  return Q('L3.attribution', 3, body, chooseParts(items, 2, 4));
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
      { part: N('What is the holding-period return in year 1?', r1 * 100, 'pct'), w: 0.4 },
      { part: N('What is the arithmetic average (time-weighted) return?', (r1 + r2) / 2 * 100, 'pct'), w: 0.5 },
      { part: N('What is the geometric average (time-weighted) return?', (Math.sqrt((1 + r1) * (1 + r2)) - 1) * 100, 'pct'), w: 0.6 },
      { part: N('What is the dollar-weighted return (IRR)?', irr * 100, 'pct'), must: true },
    ];
    return Q('L3.dwr', 3, body, chooseParts(items, 2, 4));
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
      { part: [N('What is the weight of stock A in the active portfolio?', w[0], 'n'), N('… and of stock B?', w[1], 'n')], must: true },
      { part: N('What is the alpha of the active portfolio?', aA * 100, 'pct'), w: 0.4 },
      { part: N('What is the optimal weight of the active portfolio in the risky portfolio?', wA, 'n'), must: true },
      { part: N('What is the beta of the optimal risky portfolio?', bP, 'n'), w: 0.35 },
      { part: N('What is the standard deviation of the optimal risky portfolio?', sdP * 100, 'pct'), w: 0.3 },
      { part: N('By how much does the Sharpe ratio improve on the passive benchmark?', srP - srM, 'n'), w: 0.6 },
      { part: N('What is the benchmark risk (standard deviation of the tracking error)?', te * 100, 'pct'), w: 0.5 },
    ];
    return Q('L4.treynorBlack', 4, body, chooseParts(items, 3, 5));
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
  const vQE = tau * (sB * sB + sS * sS - 2 * cov), vD = sEps * sEps + vQE, k = (Q0 - qE) / vD;
  const rB = eB + k * tau * (sB * sB - cov), rS = eS + k * tau * (cov - sS * sS);
  const body = p_(`An economy has two asset classes. Bonds have a standard deviation of ${pp(sB, 0)} and make up ${P(wB, 0)} of total wealth; stocks have a standard deviation of ${pp(sS, 0)} and make up ${P(wS, 0)}. Their correlation is ${fmtNum(rho)} and the average risk aversion is ${fmtNum(A)}. The covariance matrix of expected-return forecasts is 0.01 times the covariance matrix of returns. Your view is E[R<sub>B</sub>] − E[R<sub>S</sub>] = ${pp(Q0, 1)}, with a standard deviation of ${pp(sEps, 1)}. Use the CAPM as the equilibrium model. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the variance of the market portfolio?', vM, 'n', { abs: 0.0002 }), w: 0.4 },
    { part: N('What is the market-implied expected excess return of the market?', eM * 100, 'pct'), w: 0.5 },
    { part: [N('What is the baseline expected excess return of bonds?', eB * 100, 'pct'), N('… and of stocks?', eS * 100, 'pct')], w: 0.6 },
    { part: N('What is the standard deviation of the difference between the view and the baseline forecast?', Math.sqrt(vD) * 100, 'pct'), w: 0.5 },
    { part: [N('What is the revised (posterior) expected excess return of bonds?', rB * 100, 'pct'), N('… and of stocks?', rS * 100, 'pct')], must: true },
  ];
  return Q('L4.blackLitterman', 4, body, chooseParts(items, 2, 4));
}

/** Fee a mean-variance investor would pay for active management (Kane, Marcus and Trippi). */
export function L4_fee(): Question {
  const n = pick([50, 100, 200, 500]), a = rstep(0.5, 3, 0.25) / 100, r2 = pick([0.01, 0.02, 0.05, 0.1, 1]), se = rstep(0.04, 0.12, 0.01), A = pick([2, 3, 4]);
  const aum = rstep(10, 500, 10) * 1e6;
  const ir = r2 * a / se, f = n * ir * ir / (2 * A);
  const body = p_(`A fund’s analysts produce annual alpha forecasts of ${pp(a)} on average across a universe of ${n} stocks${r2 < 1 ? `, with an accuracy (R²) of ${P(r2, 0)}` : ' and their forecasts are perfectly accurate'}. The residual standard deviation is ${P(se, 0)}. The fund manages ${usd(aum)}. Investors are mean-variance with a risk aversion of ${A}.`);
  const items: Item[] = [
    { part: N('What is the information ratio per stock after adjusting alpha for forecast precision?', ir, 'n', { abs: 0.0005 }), w: 0.5 },
    { part: N('What fee rate (in excess of a passive index fund) would the investor pay? Enter in percent of assets.', f * 100, 'pct', { abs: 0.0005 }), w: 0.5 },
    { part: N('What is the fee in dollars?', f * aum, 'usd'), must: true },
  ];
  return Q('L4.fee', 4, body, chooseParts(items, 1, 3));
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
      { part: N('What is the weight of asset 1 in the optimal risky (tangency) portfolio? (Decimal.)', w1, 'n'), must: true },
      { part: N('What is the weight of asset 1 in the global minimum-variance portfolio? (Decimal.)', g1, 'n'), w: 0.6 },
      { part: N('What is the Sharpe ratio of the tangency portfolio?', eP / sP, 'n'), w: 0.5 },
      { part: N(`An investor with risk aversion ${A} combines the tangency portfolio with T-bills. What fraction of wealth goes into the risky portfolio? (Decimal.)`, eP / (A * sP * sP), 'n'), w: 0.4 },
      { part: N(`How many parameters (means, variances, covariances) does full Markowitz optimisation need for ${n} assets?`, n + n + n * (n - 1) / 2, 'n'), w: 0.25 },
    ];
    return Q('L5.markowitz', 5, body, chooseParts(items, 2, 4));
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
    { part: N('What is the shrunk weight of asset 1? (Decimal.)', ws[0], 'n'), must: true },
    { part: N('What is the shrunk weight of asset 3? (Decimal.)', ws[2], 'n'), w: 0.5 },
    { part: N('What is the expected excess return of the shrunk portfolio?', ws.reduce((s, x, i) => s + x * mu[i], 0) * 100, 'pct'), w: 0.5 },
    { part: N(`A sample covariance of ${fmtNum(cS, 3)} is shrunk with the same λ towards a target of ${fmtNum(cT, 3)}. What is the shrunk covariance?`, (1 - lam) * cS + lam * cT, 'n', { abs: 0.0002 }), w: 0.3 },
  ];
  return Q('L5.shrinkage', 5, body, chooseParts(items, 2, 3));
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
      { part: N('Unhedged portfolio value at t+1: what is the constant a?', c0, 'musd'), must: true },
      { part: N('… and the coefficient b on the market return?', M * beta, 'musd'), w: 0.7 },
      { part: N('How many S&P 500 futures contracts must you sell to hedge the market exposure?', n, 'n'), must: true },
      { part: N('What is the constant of the futures position’s value at t+1?', h0, 'musd'), w: 0.5 },
      { part: N('What is the constant of the hedged portable-alpha portfolio at t+1?', c0 + h0, 'musd'), w: 0.7 },
      { part: N('What is the expected return of the hedged portfolio?', (a + rf) * 100, 'pct'), w: 0.4 },
    ];
    return Q('L6.portable', 6, body, chooseParts(items, 3, 5));
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
      { part: N('What are the total incentive fees paid?', i1 + i2, 'musd'), w: 0.6 },
      { part: N('What is the trust’s gross return before fees?', gross / (A1 + A2) * 100, 'pct'), w: 0.4 },
      { part: N('What is the trust’s return after all fees?', net / (A1 + A2) * 100, 'pct'), must: true },
    ];
    return Q('L6.fees', 6, body, chooseParts(items, 1, 3));
  }
  const k = 3, amt = rstep(1, 3, 0.5), rs = [rstep(0.05, 0.3, 0.01), rstep(-0.25, 0.1, 0.01), rstep(-0.25, 0.15, 0.01)];
  const agg = rs.reduce((s, r) => s + r, 0) / k, fees = rs.reduce((s, r) => s + amt * inc * Math.max(r - h, 0), 0);
  const body = p_(`A fund of funds has $${fmtNum(amt)} million in each of three hedge funds. Each charges an incentive fee of ${P(inc, 0)} on returns above a hurdle of ${P(h, 0)} (ignore management fees). Gross returns are ${rs.map(r => pp(r, 0)).join(', ')}.`);
  const items: Item[] = [
    { part: N('What is the aggregate gross return of the fund of funds?', agg * 100, 'pct'), w: 0.5 },
    { part: N('What incentive fees are paid in total?', fees, 'musd'), must: true },
    { part: N('What is the return after incentive fees?', (agg * k * amt - fees) / (k * amt) * 100, 'pct'), w: 0.6 },
  ];
  return Q('L6.fees', 6, body, chooseParts(items, 2, 3));
}

/** High-water mark: when is the incentive fee charged? */
export function L6_hwm(): Question {
  const inc = pick([0.2, 0.2, 0.15]), r = [rstep(0.05, 0.3, 0.01), rstep(-0.3, -0.05, 0.01), rstep(0.05, 0.35, 0.01)];
  // Incentive fees are paid on gains above the high-water mark, measured on the value after fees.
  let V = 100, hwm = 100; const fees: number[] = [], vals: number[] = [];
  for (const x of r) { const g = V * (1 + x); const fee = Math.max(0, g - hwm) * inc; V = g - fee; hwm = Math.max(hwm, V); fees.push(fee); vals.push(V); }
  const body = p_(`You invest $100 in a hedge fund with a ${P(inc, 0)} incentive fee subject to a high-water mark; ignore management fees. Gross returns in years 1–3 are ${r.map(x => pp(x, 0)).join(', ')}. Fees are deducted at the end of each year.`);
  const items: Item[] = [
    { part: N('What incentive fee is paid in year 1?', fees[0], 'usd', { abs: 0.011 }), w: 0.6 },
    { part: N('What is the value of the investment after fees at the end of year 2?', vals[1], 'usd', { abs: 0.011 }), w: 0.4 },
    { part: N('What incentive fee is paid in year 3?', fees[2], 'usd', { abs: 0.011 }), must: true },
    { part: C('Is an incentive fee paid in year 3?', ['Yes', 'No'], fees[2] > 0 ? 0 : 1), w: 0.4 },
  ];
  return Q('L6.hwm', 6, body, chooseParts(items, 2, 3));
}

/** Scholes-Williams correction for stale prices (Asness, Krail and Liew). */
export function L6_lagBeta(): Question {
  const name = fund('Capital');
  const b0 = rstep(0.1, 0.6, 0.05), b1 = rstep(0.1, 0.5, 0.05), b2 = rstep(0, 0.3, 0.05);
  const rm = rstep(0.004, 0.008, 0.0005), simpleA = rstep(0.002, 0.006, 0.0005);
  const meanR = simpleA + b0 * rm, adjA = meanR - (b0 + b1 + b2) * rm;
  const body = p_(`${name} holds illiquid securities. A regression of its monthly excess returns on the contemporaneous market excess return gives a beta of ${fmtNum(b0)} and an alpha of ${pp(simpleA)} per month. Adding the market returns of the previous two months gives coefficients of ${fmtNum(b0)}, ${fmtNum(b1)} and ${fmtNum(b2)}. The average market excess return is ${pp(rm)} per month. ${NOTE_PCT}`);
  const items: Item[] = [
    { part: N('What is the Scholes-Williams corrected beta?', b0 + b1 + b2, 'n'), must: true },
    { part: N('By what factor is the market exposure understated by the simple regression?', (b0 + b1 + b2) / b0, 'n'), w: 0.5 },
    { part: N('What is the monthly alpha after the correction?', adjA * 100, 'pct', { abs: 0.0005 }), w: 0.7 },
  ];
  return Q('L6.lagBeta', 6, body, chooseParts(items, 2, 3));
}
