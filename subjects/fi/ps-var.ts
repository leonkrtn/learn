// Financial Investments: more question types for problem sets 1–4 and 6, built from the lecture slides (activities and
// worked examples) with other data formats and inverse questions. Same conventions as ps.ts: calculations are
// A–E multiple choice with wrong options from typical mistakes, exercises keep several sub-questions.
import { C, N, P, Q, chance, chooseParts, co, fmtNum, p_, pick, rint, roundTo, rstep, table, type Item } from '@/lib/engine/gen-helpers';
import { mcNum, mcText } from '@/lib/engine/mc';
import type { Question } from '@/lib/engine/types';

const pp = (x: number, d = 2) => P(x, d);
const f3 = (x: number) => fmtNum(x, 3);
const f4 = (x: number) => fmtNum(x, 4);
const par = (s: string) => s.startsWith('−') ? '(' + s + ')' : s;
const money = (x: number) => (x < 0 ? '−' : '') + '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const poss = (n: string) => n + (/s$/.test(n) ? '’' : '’s');
const NOTE = 'Enter returns in percent, e.g. 8.33 for 8.33%, and weights as decimals.';
const FUNDS = ['Atlas', 'Borealis', 'Cedar', 'Delta', 'Ember', 'Fjord', 'Granite', 'Helix'];

// =====================================================================
// PS 1 — CAPM
// =====================================================================

/** Lecture 1, activity 1: beta from total variance, market risk and residual risk; and the inverse directions. */
export function PS1_simBeta(): Question {
  for (;;) {
    const name = co(), sM = rstep(0.12, 0.24, 0.01), b = rstep(0.4, 2.2, 0.05), se = rstep(0.05, 0.3, 0.01);
    const v = b * b * sM * sM + se * se, vS = +v.toFixed(4), bS = Math.sqrt((vS - se * se) / (sM * sM));
    if (vS - se * se <= 0) continue;
    const r2 = bS * bS * sM * sM / vS, k = rint(0, 2);
    if (k === 0) {
      const html = p_(`${name} has a variance of returns of ${fmtNum(vS, 4)} and covaries positively with the market. The standard deviation of the market is ${fmtNum(sM, 2)} and the residuals of ${name} with respect to the market have a standard deviation of ${fmtNum(se, 2)}. What is the market beta of ${name}?`);
      return mcNum('PS1.simBeta', '1', html, bS, [Math.sqrt(vS) / sM, (vS - se * se) / (sM * sM), (Math.sqrt(vS) - se) / sM, Math.sqrt(vS - se * se) / (sM * sM), Math.sqrt(vS + se * se) / sM], x => fmtNum(x, 3),
        { sol: p_(`σ²<sub>i</sub> = β²σ²<sub>M</sub> + σ²(e), so β = √((σ²<sub>i</sub> − σ²(e))/σ²<sub>M</sub>) = √((${fmtNum(vS, 4)} − ${fmtNum(se * se, 4)}) / ${fmtNum(sM * sM, 4)}) = ${f4(bS)}. The positive covariance picks the positive root.`), closest: true });
    }
    if (k === 1) {
      const html = p_(`The single-index model holds. ${name} has a beta of ${fmtNum(b)} and a total standard deviation of ${pp(Math.sqrt(v), 2)}; the market’s standard deviation is ${pp(sM, 0)}. What share of ${poss(name)} variance is systematic (the R² of its market regression)?`);
      const r = b * b * sM * sM / v;
      return mcNum('PS1.simBeta', '1', html, r, [b * sM / Math.sqrt(v), 1 - r, b * b * sM / Math.sqrt(v), b * sM * sM / v], x => fmtNum(x, 3),
        { sol: p_(`R² = β²σ²<sub>M</sub>/σ²<sub>i</sub> = ${fmtNum(b)}² × ${fmtNum(sM)}² / ${fmtNum(v, 5)} = ${f4(r)}; the remaining ${f4(1 - r)} is firm-specific and can be diversified away.`) });
    }
    const html = p_(`${name} has a standard deviation of ${pp(Math.sqrt(v), 2)} and an R² of ${fmtNum(r2, 3)} in its market regression. What is the standard deviation of its residuals?`);
    const s = Math.sqrt(v * (1 - +r2.toFixed(3)));
    return mcNum('PS1.simBeta', '1', html, s, [Math.sqrt(v) * (1 - r2), Math.sqrt(v * r2), v * (1 - r2), Math.sqrt(v) * Math.sqrt(r2)], x => pp(x),
      { sol: p_(`σ²(e) = (1 − R²)σ²<sub>i</sub> = (1 − ${fmtNum(r2, 3)}) × ${fmtNum(v, 5)}, so σ(e) = ${pp(s)}.`) });
  }
}
/** Two correctly priced assets pin down the SML; then price a third asset or read off the market. */
export function PS1_smlInfer(): Question {
  for (;;) {
    const rf = rstep(0.01, 0.06, 0.0025), mrp = rstep(0.04, 0.09, 0.0025), b1 = rstep(0.3, 0.9, 0.05), b2 = rstep(1.1, 2, 0.05), b3 = rstep(0.2, 2.2, 0.05);
    const A = co(), B = co(), e1 = rf + b1 * mrp, e2 = rf + b2 * mrp, mrpS = (e2 - e1) / (b2 - b1), rfS = e1 - b1 * mrpS;
    if (Math.abs(b3 - b1) < 0.05 || Math.abs(b3 - b2) < 0.05) continue;
    const html = p_('In a CAPM world, the following two stocks are correctly priced:') + table(['', 'β', 'E[r]'], [[A, fmtNum(b1), pp(e1)], [B, fmtNum(b2), pp(e2)]]);
    const k = rint(0, 2);
    if (k === 0) return mcNum('PS1.smlInfer', '1', html + p_('What is the expected return of the market portfolio?'), rfS + mrpS,
      [mrpS, (e1 + e2) / 2, e2 / b2, rfS + mrpS * (b1 + b2) / 2, e1 + mrpS], x => pp(x),
      { sol: p_(`Slope of the SML: (${pp(e2)} − ${pp(e1)}) / (${fmtNum(b2)} − ${fmtNum(b1)}) = ${pp(mrpS)}; intercept r<sub>f</sub> = ${pp(e1)} − ${fmtNum(b1)} × ${pp(mrpS)} = ${pp(rfS)}. The market has β = 1: ${pp(rfS)} + ${pp(mrpS)} = ${pp(rfS + mrpS)}.`) });
    if (k === 1) return mcNum('PS1.smlInfer', '1', html + p_(`What expected return should a stock with a beta of ${fmtNum(b3)} have?`), rfS + b3 * mrpS,
      [b3 * mrpS, rfS + b3 * (rfS + mrpS), e1 * b3 / b1, e2 * b3 / b2, rfS + b3 * mrpS * 1.25], x => pp(x),
      { sol: p_(`From the two stocks: market risk premium ${pp(mrpS)}, r<sub>f</sub> = ${pp(rfS)}. E[r] = ${pp(rfS)} + ${fmtNum(b3)} × ${pp(mrpS)} = ${pp(rfS + b3 * mrpS)}.`) });
    return mcNum('PS1.smlInfer', '1', html + p_('What is the risk-free rate?'), rfS,
      [mrpS, e1 - b1 * (e2 - e1), (e1 + e2) / 2, e1 - mrpS], x => pp(x),
      { sol: p_(`Both stocks lie on the SML: r<sub>f</sub> + ${fmtNum(b1)}MRP = ${pp(e1)} and r<sub>f</sub> + ${fmtNum(b2)}MRP = ${pp(e2)}. Subtracting gives MRP = ${pp(mrpS)}, so r<sub>f</sub> = ${pp(e1)} − ${fmtNum(b1)} × ${pp(mrpS)} = ${pp(rfS)}.`) });
  }
}

/** Portfolio betas are weighted averages; target beta with T-bills (lecture 1, ii). */
export function PS1_portfolioBeta(): Question {
  const rf = rstep(0.01, 0.05, 0.005), mrp = rstep(0.04, 0.08, 0.005);
  const names = [co(), co(), co()], b = [rstep(0.4, 1, 0.05), rstep(0.9, 1.4, 0.05), rstep(1.3, 2.2, 0.05)];
  const w = pick([[0.5, 0.3, 0.2], [0.2, 0.5, 0.3], [0.4, 0.4, 0.2], [0.3, 0.3, 0.4], [0.25, 0.25, 0.5]]);
  const bP = w.reduce((s, x, i) => s + x * b[i], 0), eP = rf + bP * mrp, bt = rstep(0.4, 1.6, 0.1), y = bt / b[2], X = rstep(100, 900, 50) * 1000;
  const html = p_(`The risk-free rate is ${pp(rf, 1)} and the market risk premium is ${pp(mrp, 1)}. A portfolio holds three stocks: ${NOTE}`) +
    table(['Stock', 'Weight', 'β'], names.map((n, i) => [n, fmtNum(w[i]), fmtNum(b[i])]));
  const items: Item[] = [
    { part: N('What is the beta of the portfolio?', bP, 'n'), must: true },
    { part: N('What expected return does the CAPM give for the portfolio?', eP * 100, 'pct'), w: 0.6 },
    { part: [N(`You want a position with a beta of ${fmtNum(bt)} using only ${names[2]} and T-bills. What weight do you put in ${names[2]}?`, y, 'n'), N(`… and how many dollars of ${money(X)} go into T-bills?`, X * (1 - y), 'usd')], w: 0.6 },
  ];
  const sol = p_(`β<sub>P</sub> = Σw<sub>i</sub>β<sub>i</sub> = ${w.map((x, i) => `${fmtNum(x)} × ${fmtNum(b[i])}`).join(' + ')} = ${f4(bP)}; E[r<sub>P</sub>] = ${pp(rf, 1)} + ${f4(bP)} × ${pp(mrp, 1)} = ${pp(eP)}.`) +
    p_(`T-bills have β = 0, so a weight y in ${names[2]} gives β = y × ${fmtNum(b[2])}; y = ${fmtNum(bt)}/${fmtNum(b[2])} = ${f4(y)}, and ${money(X)} × (1 − y) = ${money(X * (1 - y))} goes into T-bills${y > 1 ? ' (a negative amount: you borrow)' : ''}.`);
  return { ...Q('PS1.portfolioBeta', '1', html, chooseParts(items, 2, 3)), solution: sol };
}

/** Reward-to-risk E[R_i]/cov(R_i, R_M) equals E[R_M]/σ²_M in equilibrium (lecture 1, i). */
export function PS1_rewardRisk(): Question {
  const mrp = rstep(0.04, 0.09, 0.0025), sM = rstep(0.12, 0.22, 0.01), b = rstep(0.3, 2, 0.05), cov = +(b * sM * sM).toFixed(4), name = co();
  const rr = mrp / (sM * sM), k = rint(0, 2);
  const base = `The market has an expected excess return of ${pp(mrp)} and a standard deviation of ${pp(sM, 0)}.`;
  if (k === 0) return mcNum('PS1.rewardRisk', '1', p_(`${base} ${name} has a covariance of ${fmtNum(cov, 4)} with the market. What expected excess return must it offer in a CAPM equilibrium?`), rr * cov,
    [mrp * cov / sM, cov * mrp, rr * cov / 2, mrp * Math.sqrt(cov) / sM, 2 * rr * cov], x => pp(x),
    { sol: p_(`In equilibrium every asset has the market’s reward-to-risk ratio: E[R<sub>i</sub>]/cov(R<sub>i</sub>, R<sub>M</sub>) = E[R<sub>M</sub>]/σ²<sub>M</sub> = ${pp(mrp)} / ${fmtNum(sM * sM, 4)} = ${fmtNum(rr, 3)}. So E[R<sub>i</sub>] = ${fmtNum(rr, 3)} × ${fmtNum(cov, 4)} = ${pp(rr * cov)}, the same as β = cov/σ²<sub>M</sub> = ${fmtNum(cov / (sM * sM), 3)} on the SML.`) });
  if (k === 1) return mcNum('PS1.rewardRisk', '1', p_(`${base} What is the reward-to-risk ratio E[R<sub>i</sub>]/cov(R<sub>i</sub>, R<sub>M</sub>) of any correctly priced asset?`), rr,
    [mrp / sM, rr / 2, mrp / (2 * sM * sM), sM * sM / mrp, mrp * sM * sM], x => fmtNum(x, 3),
    { sol: p_(`It equals the market’s own ratio E[R<sub>M</sub>]/σ²<sub>M</sub> = ${pp(mrp)} / ${fmtNum(sM * sM, 4)} = ${fmtNum(rr, 3)}, since cov(R<sub>M</sub>, R<sub>M</sub>) = σ²<sub>M</sub>. (The marginal version with 2cov in the denominator would be half of that; the course uses this definition.)`) });
  const w = rstep(0.02, 0.15, 0.01);
  return mcNum('PS1.rewardRisk', '1', p_(`${base} ${name} has a weight of ${P(w, 0)} in the market portfolio and a covariance of ${fmtNum(cov, 4)} with it. What share of the market variance does ${name} contribute?`), w * cov / (sM * sM),
    [w * cov, cov / (sM * sM), w * w * cov / (sM * sM), w * b, w * Math.sqrt(cov) / sM], x => pp(x),
    { sol: p_(`The contribution of stock i to σ²<sub>M</sub> is w<sub>i</sub>cov(R<sub>i</sub>, R<sub>M</sub>) = ${fmtNum(w)} × ${fmtNum(cov, 4)} = ${fmtNum(w * cov, 5)}, which is ${pp(w * cov / (sM * sM))} of σ²<sub>M</sub> = ${fmtNum(sM * sM, 4)}; equivalently w<sub>i</sub>β<sub>i</sub>. The contributions add up to the total variance.`) });
}

// =====================================================================
// PS 2 — APT
// =====================================================================

/** Tracking portfolios and riskless arbitrage (lecture 2, examples on tracking and on equal betas). */
export function PS2_tracking(): Question {
  for (;;) {
    const X = rstep(1, 20, 1) * 1e5;
    if (chance(0.5)) {
      const a = pick([-1, 1]) * rstep(0.005, 0.04, 0.005), b = rstep(0.4, 1.8, 0.1);
      if (Math.abs(b - 1) < 0.05) continue;
      const html = p_(`For a well-diversified portfolio i you estimate r<sub>i</sub> − r<sub>f</sub> = ${pp(a, 1)} + ${fmtNum(b)}(r<sub>SPY</sub> − r<sub>f</sub>) + e<sub>i</sub>. You build a tracking portfolio T from the S&P 500 ETF and T-bills.`);
      if (chance(0.5)) return mcNum('PS2.tracking', '2', html + p_('What weight does T put in T-bills?'), 1 - b, [b, -b, 1 / b, 1 - 1 / b], x => fmtNum(x, 2),
        { sol: p_(`T needs the same beta: ${fmtNum(b)} in the S&P 500 and 1 − ${fmtNum(b)} = ${fmtNum(1 - b)} in T-bills${b > 1 ? ' (borrowing)' : ''}. Then r<sub>T</sub> − r<sub>f</sub> = ${fmtNum(b)}(r<sub>SPY</sub> − r<sub>f</sub>) and r<sub>i</sub> − r<sub>T</sub> = α + e<sub>i</sub> ≈ α.`) });
      return mcText('PS2.tracking', '2', html + p_(`How do you earn a riskless profit, and how large is it on a position of ${money(X)}?`),
        `${a > 0 ? 'Buy i and sell T' : 'Sell i and buy T'}; profit ${money(Math.abs(a) * X)}`,
        [`${a > 0 ? 'Sell i and buy T' : 'Buy i and sell T'}; profit ${money(Math.abs(a) * X)}`, `${a > 0 ? 'Buy i and sell T' : 'Sell i and buy T'}; profit ${money(Math.abs(a) * b * X)}`, `${a > 0 ? 'Buy i and sell T' : 'Sell i and buy T'}; profit ${money(Math.abs(a) / b * X)}`, 'There is no riskless profit, because i has residual risk'],
        p_(`Long-short between i and its tracking portfolio cancels the market exposure: r<sub>i</sub> − r<sub>T</sub> = ${pp(a, 1)} + e<sub>i</sub>, and e<sub>i</sub> ≈ 0 for a well-diversified portfolio. ${a > 0 ? 'Positive alpha: buy i, sell T' : 'Negative alpha: sell i, buy T'}, earning |α| × ${money(X)} = ${money(Math.abs(a) * X)}.`));
    }
    const rf = rstep(0.02, 0.06, 0.01), eA = rf + rstep(0.04, 0.12, 0.01), bA = rstep(0.8, 1.6, 0.1), bC = roundTo(bA * pick([0.25, 0.4, 0.5, 0.6, 0.75]), 0.01);
    const wA = bC / bA, eD = wA * eA + (1 - wA) * rf, eC = roundTo(eD + pick([-1, 1]) * rstep(0.005, 0.03, 0.005), 0.0025);
    if (Math.abs(eC - eD) < 0.004) continue;
    const html = p_(`A and C are well-diversified portfolios in a one-factor economy; the risk-free rate is ${pp(rf, 0)}.`) + table(['Portfolio', 'E[r]', 'β'], [['A', pp(eA, 0), fmtNum(bA)], ['C', pp(eC, 2), fmtNum(bC)]]) +
      p_(`You form D from A and T-bills with the same beta as C, and trade D against C with ${money(X)} on each side.`);
    const items: Item[] = [
      { part: N('What weight does D put in A?', wA, 'n'), w: 0.6 },
      { part: N('What is the expected return of D?', eD * 100, 'pct'), w: 0.7 },
      { part: C('What do you do?', ['Buy D, short C', 'Buy C, short D', 'Nothing: no arbitrage'], eD > eC ? 0 : 1), must: true },
      { part: N('What is your riskless profit (in $)?', Math.abs(eD - eC) * X, 'usd'), w: 0.7 },
    ];
    const sol = p_(`β<sub>D</sub> = w × ${fmtNum(bA)} = ${fmtNum(bC)} ⇒ w = ${f4(wA)} in A and ${f4(1 - wA)} in T-bills. E[r<sub>D</sub>] = ${f4(wA)} × ${pp(eA, 0)} + ${f4(1 - wA)} × ${pp(rf, 0)} = ${pp(eD)}. D and C have the same beta and no specific risk, so their returns differ by a constant: ${eD > eC ? 'buy D and short C' : 'buy C and short D'}, earning ${pp(Math.abs(eD - eC))} × ${money(X)} = ${money(Math.abs(eD - eC) * X)} for sure.`);
    return { ...Q('PS2.tracking', '2', html, chooseParts(items, 2, 4)), solution: sol };
  }
}

/** Zero-beta portfolio of a positive-alpha portfolio and the market (lecture 2, different betas). */
export function PS2_zeroBetaArb(): Question {
  for (;;) {
    const a = rstep(0.005, 0.04, 0.0025), b = rstep(0.3, 2.2, 0.1);
    if (Math.abs(1 - b) < 0.15) continue;
    const wp = 1 / (1 - b), wm = -b / (1 - b), rz = a / (1 - b);
    const html = p_(`In a single-index world, a well-diversified portfolio P has R<sub>P</sub> = ${pp(a, 2)} + ${fmtNum(b)}R<sub>M</sub>. You combine P with the market index into a zero-beta portfolio Z (weights summing to one).`);
    const k = rint(0, 2);
    if (k === 0) return mcNum('PS2.zeroBetaArb', '2', html + p_('What weight does Z put in P?'), wp, [wm, -wp, 1 / b, b / (1 - b), 1 - b], x => fmtNum(x, 3),
      { sol: p_(`β<sub>Z</sub> = w<sub>P</sub>${fmtNum(b)} + (1 − w<sub>P</sub>) × 1 = 0 ⇒ w<sub>P</sub> = 1/(1 − β<sub>P</sub>) = ${f4(wp)} and w<sub>M</sub> = −β<sub>P</sub>/(1 − β<sub>P</sub>) = ${f4(wm)}.`) });
    if (k === 1) return mcNum('PS2.zeroBetaArb', '2', html + p_('What weight does Z put in the market index?'), wm, [wp, -wm, b, 1 - b, -b], x => fmtNum(x, 3),
      { sol: p_(`w<sub>P</sub> = 1/(1 − β<sub>P</sub>) = ${f4(wp)}, w<sub>M</sub> = 1 − w<sub>P</sub> = −β<sub>P</sub>/(1 − β<sub>P</sub>) = ${f4(wm)}.`) });
    return mcNum('PS2.zeroBetaArb', '2', html + p_('What riskless excess return does Z earn?'), rz, [a, -rz, a * b, a / b, a * (1 - b)], x => pp(x),
      { sol: p_(`R<sub>Z</sub> = w<sub>P</sub>(α + βR<sub>M</sub>) + w<sub>M</sub>R<sub>M</sub> = α/(1 − β) = ${pp(a, 2)} / ${fmtNum(1 - b)} = ${pp(rz)}, a constant.${b > 1 ? ' With β > 1 the weight in P is negative, so you short P: the riskless return is negative and you would take the opposite position.' : ''}`), step: 0.005 });
  }
}

/** Residual risk with finite n and unequal weights (lecture 2, groups of relative weights). */
export function PS2_residualGroups(): Question {
  const rel = pick([[0.65, 0.2, 0.1, 0.05], [0.4, 0.3, 0.2, 0.1], [0.5, 0.25, 0.15, 0.1], [0.7, 0.1, 0.1, 0.1]]);
  const G = pick([5, 10, 15, 25, 50, 100, 250]), n = 4 * G, se = pick([0.3, 0.4, 0.5, 0.6, 0.8, 1]);
  const sq = rel.reduce((s, x) => s + x * x, 0), ans = Math.sqrt(sq * se * se / G), eq = se / Math.sqrt(n);
  const html = p_(`A portfolio holds ${n} stocks in ${G} groups of four. Within each group the stocks have relative weights of ${rel.map(x => fmtNum(x)).join(', ')}, and every group has the same total weight. All stocks have a residual standard deviation of ${pp(se, 0)} and uncorrelated residuals. What is the residual standard deviation of the portfolio?`);
  return mcNum('PS2.residualGroups', '2', html, ans, [eq, se / Math.sqrt(G), Math.sqrt(sq) * se, sq * se / G, se * Math.sqrt(sq / n)], x => pp(x),
    { sol: p_(`Each stock’s weight is its relative weight divided by ${G}. σ²(e<sub>P</sub>) = Σw²<sub>i</sub>σ²<sub>e</sub> = ${G} × (${rel.map(x => fmtNum(x) + '²').join(' + ')})/${G}² × ${fmtNum(se)}² = ${fmtNum(sq, 4)} × ${fmtNum(se * se, 4)} / ${G}, so σ(e<sub>P</sub>) = ${pp(ans)}. With equal weights it would be ${pp(se, 0)}/√${n} = ${pp(eq)}: unequal weights diversify less.`), closest: true });
}

/** Fama-French three-factor model: expected return or alpha from a regression table. */
export function PS2_ff3(): Question {
  const rf = rstep(0.01, 0.04, 0.0025), mkt = rstep(0.04, 0.08, 0.0025), smb = rstep(0.01, 0.035, 0.0025), hml = rstep(0.01, 0.045, 0.0025);
  const bM = rstep(0.7, 1.4, 0.05), bS = rstep(-0.4, 1, 0.05), bH = rstep(-0.6, 0.9, 0.05), name = pick(FUNDS) + ' Fund';
  const fair = rf + bM * mkt + bS * smb + bH * hml;
  const prem = table(['Factor', 'Average premium'], [['MKT − RF', pp(mkt)], ['SMB', pp(smb)], ['HML', pp(hml)]]);
  const load = table(['', 'β<sub>MKT</sub>', 'β<sub>SMB</sub>', 'β<sub>HML</sub>'], [[name, fmtNum(bM), fmtNum(bS), fmtNum(bH)]]);
  if (chance(0.5)) {
    return mcNum('PS2.ff3', '2', p_(`The Fama-French three-factor model prices all assets. The risk-free rate is ${pp(rf)}.`) + prem + load + p_(`What expected return should ${name} have?`), fair,
      [rf + bM * mkt, bM * mkt + bS * smb + bH * hml, rf + bM * (mkt + smb + hml), rf + mkt + bS * smb + bH * hml, rf + bM * mkt + bS * smb - bH * hml], x => pp(x),
      { sol: p_(`E[r] = r<sub>f</sub> + β<sub>MKT</sub>MKT + β<sub>SMB</sub>SMB + β<sub>HML</sub>HML = ${pp(rf)} + ${fmtNum(bM)} × ${pp(mkt)} + ${par(fmtNum(bS))} × ${pp(smb)} + ${par(fmtNum(bH))} × ${pp(hml)} = ${pp(fair)}.`) });
  }
  let avg = roundTo(fair + rstep(-0.03, 0.03, 0.0025), 0.0025);
  if (Math.abs(avg - fair) < 0.002) avg += 0.0075;
  const capm = avg - rf - bM * mkt, ff = avg - fair;
  return mcNum('PS2.ff3', '2', p_(`${name} earned an average return of ${pp(avg)}; the risk-free rate averaged ${pp(rf)}. Its three-factor regression gives the loadings below.`) + prem + load + p_('What is its three-factor alpha?'), ff,
    [capm, avg - bM * mkt - bS * smb - bH * hml, -ff, avg - fair - rf, capm - bS * smb], x => pp(x),
    { sol: p_(`α<sub>FF3</sub> = r̄ − [r<sub>f</sub> + β<sub>MKT</sub>MKT + β<sub>SMB</sub>SMB + β<sub>HML</sub>HML] = ${pp(avg)} − ${pp(fair)} = ${pp(ff)}. The CAPM alpha would be ${pp(capm)}: part of it is just exposure to size and value premiums. The factors must be excess returns (zero-cost portfolios).`), step: 0.005 });
}

/** Treynor-Black versus a zero-beta APT position (lecture 2, activity 2). */
export function PS2_tbApt(): Question {
  for (;;) {
    const erm = rstep(0.04, 0.09, 0.005), sM = rstep(0.14, 0.24, 0.01), a = rstep(0.005, 0.04, 0.005), se = rstep(0.02, 0.12, 0.01), b = rstep(0.3, 2, 0.1);
    const w0 = (a / (se * se)) / (erm / (sM * sM)), w = w0 / (1 + (1 - b) * w0), srM = erm / sM, ir = a / se, sr = Math.sqrt(srM * srM + ir * ir);
    if (!isFinite(w) || Math.abs(1 + (1 - b) * w0) < 0.1 || Math.abs(w) > 30) continue;
    const html = p_(`E[R<sub>M</sub>] = ${pp(erm, 1)} and σ<sub>M</sub> = ${pp(sM, 0)}. An active portfolio A has an alpha of ${pp(a, 1)}, a residual standard deviation of ${pp(se, 0)} and a beta of ${fmtNum(b)}.`);
    const k = rint(0, 2);
    if (k === 0) return mcNum('PS2.tbApt', '2', html + p_('What is the optimal weight in A according to Treynor-Black?'), w, [w0, -w, w0 / (1 + w0), w0 * b], x => fmtNum(x, 3),
      { sol: p_(`w⁰ = (α/σ²(e))/(E[R<sub>M</sub>]/σ²<sub>M</sub>) = (${fmtNum(a, 3)}/${fmtNum(se * se, 4)}) / (${fmtNum(erm, 3)}/${fmtNum(sM * sM, 4)}) = ${f4(w0)}; w* = w⁰/(1 + (1 − β)w⁰) = ${f4(w)}.`), closest: true });
    if (k === 1) return mcNum('PS2.tbApt', '2', html + p_('What is the maximum Sharpe ratio you can reach by combining A optimally with the market?'), sr, [srM + ir, ir, srM, srM * srM + ir * ir], x => fmtNum(x, 3),
      { sol: p_(`SR²<sub>P</sub> = SR²<sub>M</sub> + IR² = ${f4(srM)}² + ${f4(ir)}², so SR<sub>P</sub> = ${f4(sr)}.`), closest: true });
    return mcNum('PS2.tbApt', '2', html + p_('A zero-beta APT long-short position in A (hedging out its beta with the market) has which Sharpe ratio?'), ir, [sr, srM, sr - srM, a / sM], x => fmtNum(x, 3),
      { sol: p_(`Hedged, only α and the residual remain: SR = α/σ(e) = IR = ${f4(ir)}. Treynor-Black reaches ${f4(sr)} because it also keeps the market’s Sharpe ratio; the gap shrinks when α/σ(e) is large, so the APT is the limiting case of TB.`), closest: true });
  }
}

// =====================================================================
// PS 3 — Performance measurement
// =====================================================================

/** M² step by step: weights of P* in P and T-bills, its return and M² (lecture 3 example). */
export function PS3_m2Steps(): Question {
  const rf = rstep(0.01, 0.07, 0.01), eM = rf + rstep(0.04, 0.2, 0.01), sM = rstep(0.12, 0.3, 0.01), eP = rf + rstep(0.04, 0.3, 0.01), sP = rstep(0.1, 0.45, 0.01), name = pick(FUNDS) + ' Fund';
  const w = sM / sP, eS = w * eP + (1 - w) * rf, m2 = eS - eM;
  const html = p_(`${name}: expected return ${pp(eP, 0)}, standard deviation ${pp(sP, 0)}. Market: expected return ${pp(eM, 0)}, standard deviation ${pp(sM, 0)}. T-bills: ${pp(rf, 0)}. ${NOTE}`);
  const items: Item[] = [
    { part: N('P* mixes the fund with T-bills to match the market’s standard deviation. What weight does it put in the fund?', w, 'n'), w: 0.7 },
    { part: N('What is the expected return of P*?', eS * 100, 'pct'), w: 0.6 },
    { part: N('What is M²?', m2 * 100, 'pct'), must: true },
    { part: C('Did the fund beat the market on a risk-adjusted basis?', ['Yes', 'No'], m2 > 0 ? 0 : 1), w: 0.4 },
  ];
  const sol = p_(`σ<sub>P*</sub> = wσ<sub>P</sub> = σ<sub>M</sub> ⇒ w = ${pp(sM, 0)}/${pp(sP, 0)} = ${f4(w)} in the fund and ${f4(1 - w)} in T-bills${w > 1 ? ' (borrowing)' : ''}. E[r<sub>P*</sub>] = ${f4(w)} × ${pp(eP, 0)} + ${f4(1 - w)} × ${pp(rf, 0)} = ${pp(eS)}. M² = ${pp(eS)} − ${pp(eM, 0)} = ${pp(m2)}: the fund ${m2 > 0 ? 'outperformed' : 'underperformed'} once adjusted for risk.`);
  return { ...Q('PS3.m2Steps', '3', html, chooseParts(items, 2, 3)), solution: sol };
}

/** Inverse questions on Sharpe, Treynor, Jensen and IR. */
export function PS3_inverse(): Question {
  const rf = rstep(0.01, 0.05, 0.005), eM = rf + rstep(0.04, 0.1, 0.005), sP = rstep(0.1, 0.35, 0.01), b = rstep(0.5, 1.6, 0.05), name = pick(FUNDS) + ' Fund';
  const k = rint(0, 3);
  if (k === 0) {
    const sr = rstep(0.2, 0.9, 0.01), r = rf + sr * sP;
    return mcNum('PS3.inverse', '3', p_(`${name} has a Sharpe ratio of ${fmtNum(sr)} and a standard deviation of ${pp(sP, 0)}. The risk-free rate is ${pp(rf, 1)}. What is its average return?`), r,
      [sr * sP, rf + sr / sP, sr * sP - rf, rf + sr * sP * sP], x => pp(x), { sol: p_(`r̄<sub>P</sub> = r<sub>f</sub> + SR × σ<sub>P</sub> = ${pp(rf, 1)} + ${fmtNum(sr)} × ${pp(sP, 0)} = ${pp(r)}.`) });
  }
  if (k === 1) {
    const ex = rstep(0.03, 0.15, 0.005), sr = ex / sP, tr = ex / b;
    return mcNum('PS3.inverse', '3', p_(`${name} has a Sharpe ratio of ${f4(sr)}, a Treynor ratio of ${pp(tr, 3)} and a standard deviation of ${pp(sP, 0)}. What is its beta?`), b,
      [sr / tr, tr / sr, sr * sP, sP / tr, 1 / b], x => fmtNum(x, 3), { sol: p_(`The excess return is SR × σ = ${f4(sr)} × ${pp(sP, 0)} = ${pp(ex)}. β = excess return / Treynor = ${pp(ex)} / ${pp(tr, 3)} = ${f4(b)}.`) });
  }
  if (k === 2) {
    const a = rstep(-0.03, 0.04, 0.0025) || 0.01, r = rf + b * (eM - rf) + a;
    return mcNum('PS3.inverse', '3', p_(`${name} has a beta of ${fmtNum(b)} and a Jensen’s alpha of ${pp(a)}. The market returned ${pp(eM, 1)} and T-bills ${pp(rf, 1)}. What was the fund’s average return?`), r,
      [b * eM + a, rf + b * eM + a, rf + (eM - rf) + a, rf + b * (eM - rf) - a], x => pp(x),
      { sol: p_(`r̄<sub>P</sub> = r<sub>f</sub> + β(r̄<sub>M</sub> − r<sub>f</sub>) + α = ${pp(rf, 1)} + ${fmtNum(b)} × ${pp(eM - rf, 1)} + ${par(pp(a))} = ${pp(r)}.`) });
  }
  const ir = rstep(0.1, 0.8, 0.05), se = rstep(0.02, 0.12, 0.005), a = ir * se;
  return mcNum('PS3.inverse', '3', p_(`${name} has an information ratio of ${fmtNum(ir)} and a residual standard deviation (tracking risk) of ${pp(se, 1)}. What is its alpha?`), a,
    [ir / se, se / ir, ir * se * se, ir * sP], x => pp(x), { sol: p_(`IR = α/σ(e) ⇒ α = ${fmtNum(ir)} × ${pp(se, 1)} = ${pp(a)}.`) });
}

/** Rankings differ by measure: which fund is best by Sharpe, Treynor or alpha? */
export function PS3_rank(): Question {
  for (let t = 0; t < 2000; t++) {
    const rf = rstep(0.01, 0.04, 0.005), eM = rf + rstep(0.05, 0.1, 0.005), sM = rstep(0.15, 0.22, 0.01);
    const fs = ['A', 'B', 'C'].map(n => ({ n: 'Fund ' + n, e: rf + rstep(0.03, 0.16, 0.005), s: rstep(0.12, 0.4, 0.01), b: rstep(0.5, 1.6, 0.05) }));
    const all = [...fs, { n: 'Market', e: eM, s: sM, b: 1 }];
    const sr = all.map(x => (x.e - rf) / x.s), tr = all.map(x => (x.e - rf) / x.b), al = all.map(x => x.e - rf - x.b * (eM - rf));
    const best = (v: number[]) => v.indexOf(Math.max(...v)), gap = (v: number[]) => { const s = [...v].sort((a, b) => b - a); return s[0] - s[1]; };
    const [m, v, lab] = pick([['the Sharpe ratio', sr, 'SR'], ['the Treynor ratio', tr, 'T'], ['Jensen’s alpha', al, 'α']] as [string, number[], string][]);
    if (best(sr) === best(tr) || gap(v) < 0.005) continue;
    const html = p_(`The risk-free rate is ${pp(rf, 1)}. Which portfolio ranks best by <b>${m}</b>?`) +
      table(['', 'Average return', 'σ', 'β'], all.map(x => [x.n, pp(x.e, 1), pp(x.s, 0), fmtNum(x.b)]));
    const fmtV = (x: number) => lab === 'SR' ? f3(x) : pp(x);
    return mcText('PS3.rank', '3', html, all[best(v)].n, all.filter((_, i) => i !== best(v)).map(x => x.n),
      p_(`${m[0].toUpperCase() + m.slice(1)}: ${all.map((x, i) => `${x.n} ${fmtV(v[i])}`).join(', ')}. Sharpe uses total risk, Treynor and alpha use beta, so a fund with much specific risk can rank high on Treynor and low on Sharpe.`), false);
  }
  throw new Error('PS3_rank: no valid draw');
}

/** Weight in a single active fund (lecture 3, activities 1–2): residual risk, w⁰ and w*. */
export function PS3_hfWeight(): Question {
  for (;;) {
    const rf = rstep(0.01, 0.06, 0.01), erm = rstep(0.04, 0.09, 0.01), sM = rstep(0.14, 0.22, 0.01), a = rstep(0.01, 0.05, 0.005), b = rstep(0.3, 2, 0.1), se = rstep(0.06, 0.3, 0.01);
    const sP = +Math.sqrt(b * b * sM * sM + se * se).toFixed(4), seS = Math.sqrt(sP * sP - b * b * sM * sM);
    const w0 = (a / (seS * seS)) / (erm / (sM * sM)), w = w0 / (1 + (1 - b) * w0), srM = erm / sM, ir = a / seS;
    if (!isFinite(w) || w <= 0 || w > 4) continue;
    const html = p_(`The risk-free rate is ${pp(rf, 0)}, E[R<sub>M</sub>] = ${pp(erm, 0)} and σ<sub>M</sub> = ${pp(sM, 0)}. The market regression of an active fund gives an alpha of ${pp(a, 1)} and a beta of ${fmtNum(b)}. The fund’s standard deviation is ${pp(sP, 2)}.`);
    const items: Item[] = [
      { part: N('What is the standard deviation of the fund’s residuals? (Decimal.)', seS, 'n'), w: 0.6 },
      { part: N('What is the initial weight w⁰ in the fund?', w0, 'n'), w: 0.5 },
      { part: N('How much weight should a mean-variance investor put in the fund (w*)?', w, 'n'), must: true },
      { part: N('By how much does the Sharpe ratio improve over the market alone?', Math.sqrt(srM * srM + ir * ir) - srM, 'n'), w: 0.4 },
    ];
    const sol = p_(`σ(e) = √(σ²<sub>P</sub> − β²σ²<sub>M</sub>) = √(${fmtNum(sP * sP, 5)} − ${fmtNum(b * b * sM * sM, 5)}) = ${f4(seS)}. w⁰ = (α/σ²(e))/(E[R<sub>M</sub>]/σ²<sub>M</sub>) = ${f4(w0)}; w* = w⁰/(1 + (1 − β)w⁰) = ${f4(w)}. The risk-free rate is not needed. SR² = SR²<sub>M</sub> + IR² gives a gain of ${f4(Math.sqrt(srM * srM + ir * ir) - srM)}: the information ratio is the right measure for a single active fund.`);
    return { ...Q('PS3.hfWeight', '3', html, chooseParts(items, 2, 3)), solution: sol };
  }
}

/** Market timing: perfect timer as a call, Treynor-Mazuy and Henriksson-Merton regressions. */
export function PS3_timing(): Question {
  const k = rint(0, 2);
  if (k === 0) {
    const rf = rstep(0.01, 0.05, 0.005), rm = [0, 1, 2, 3].map(() => rstep(-0.25, 0.3, 0.01)), pt = rm.map(x => Math.max(x, rf));
    const avg = pt.reduce((s, x) => s + x, 0) / 4, avgM = rm.reduce((s, x) => s + x, 0) / 4;
    const html = p_(`A perfect market timer holds the market when it beats T-bills and T-bills otherwise. T-bills yield ${pp(rf, 1)} every year; the market returns are ${rm.map(x => pp(x, 0)).join(', ')}. What is the timer’s arithmetic average annual return?`);
    return mcNum('PS3.timing', '3', html, avg, [avgM, rm.reduce((s, x) => s + Math.max(x, 0), 0) / 4, (avg + avgM) / 2, Math.max(...rm), avgM + rf], x => pp(x),
      { sol: p_(`Each year the timer earns max(r<sub>M</sub>, r<sub>f</sub>): ${pt.map(x => pp(x, 1)).join(', ')}, an average of ${pp(avg)} against ${pp(avgM)} for the market. The timer holds a free call option on the market.`), step: 0.01 });
  }
  if (k === 1) {
    const b = rstep(0.5, 1.2, 0.05), c = rstep(0.2, 0.8, 0.05), x = rstep(0.02, 0.1, 0.01);
    const html = p_(`A Henriksson-Merton regression r<sub>P</sub> − r<sub>f</sub> = a + b(r<sub>M</sub> − r<sub>f</sub>) + c(r<sub>M</sub> − r<sub>f</sub>)D + e<sub>P</sub>, with D = 1 when the market excess return is positive, gives b = ${fmtNum(b)} and c = ${fmtNum(c)}. What beta does the fund have in up markets?`);
    return mcNum('PS3.timing', '3', html, b + c, [b, c, b - c, b * c, b + c * x], x => fmtNum(x, 2),
      { sol: p_(`In down markets D = 0 and beta is b = ${fmtNum(b)}; in up markets it is b + c = ${fmtNum(b + c)}. A significantly positive c indicates timing ability.`) });
  }
  const c = rstep(-0.6, 0.6, 0.05) || 0.2, pos = c > 0;
  const html = p_(`A Treynor-Mazuy regression r<sub>P</sub> − r<sub>f</sub> = a + b(r<sub>M</sub> − r<sub>f</sub>) + c(r<sub>M</sub> − r<sub>f</sub>)² + e<sub>P</sub> gives a significant c of ${fmtNum(c)}. What does it suggest?`);
  return mcText('PS3.timing', '3', html, pos ? 'Successful market timing: the characteristic line is convex, beta rises when the market does well.' : 'Poor market timing: the characteristic line is concave, beta falls when the market does well.',
    [pos ? 'Poor market timing: the characteristic line is concave, beta falls when the market does well.' : 'Successful market timing: the characteristic line is convex, beta rises when the market does well.', 'Security selection skill, because the intercept is positive.', 'A higher Sharpe ratio, because c measures excess return per unit of risk.', 'Nothing about timing: c only captures specific risk.'],
    p_('The squared term makes the characteristic line curved. A timer who raises beta before good markets and cuts it before bad ones has a convex line (c > 0); the opposite gives c < 0. Writing options also produces a concave line.'));
}

/** Morningstar risk-adjusted return over a few months. */
export function PS3_mrar(): Question {
  const T = 3, g = 2, r = [0, 1, 2].map(() => rstep(-0.06, 0.08, 0.005)), rf = rstep(0.001, 0.004, 0.0005);
  const m = r.reduce((s, x) => s + ((1 + x) / (1 + rf)) ** -g, 0) / T, mrar = m ** (-12 / g) - 1;
  const ex = r.reduce((s, x) => s + (1 + x) / (1 + rf), 0) / T, naive = ex ** 12 - 1;
  const html = p_(`A fund returned ${r.map(x => pp(x, 1)).join(', ')} in three months; the monthly risk-free rate is ${pp(rf, 2)}. What is its annualised Morningstar risk-adjusted return MRAR(γ = 2) = [(1/T)Σ((1 + r<sub>t</sub>)/(1 + r<sub>f,t</sub>))<sup>−γ</sup>]<sup>−12/γ</sup> − 1?`);
  return mcNum('PS3.mrar', '3', html, mrar, [naive, m ** (-12) - 1, m ** (-1 / g) - 1, (r.reduce((s, x) => s + x, 0) / T - rf) * 12], x => pp(x),
    { sol: p_(`Gross excess returns (1 + r)/(1 + r<sub>f</sub>) raised to −2: ${r.map(x => f4(((1 + x) / (1 + rf)) ** -g)).join(', ')}; average ${fmtNum(m, 5)}. MRAR = ${fmtNum(m, 5)}<sup>−6</sup> − 1 = ${pp(mrar)}. The power −γ penalises volatility, so MRAR is below the plain annualised excess return of ${pp(naive)}; it cannot be raised by manipulating risk without skill.`), closest: true, step: 0.01 });
}

// =====================================================================
// PS 4 — Active portfolio management
// =====================================================================

/** Treynor-Black with three stocks, all steps of the slides. */
export function PS4_tbSteps(): Question {
  for (let t = 0; t < 3000; t++) {
    const s = [0, 1, 2].map(() => ({ a: rstep(-0.04, 0.05, 0.005), b: rstep(0.4, 1.8, 0.1), se: rstep(0.06, 0.3, 0.01) }));
    if (s.some(x => Math.abs(x.a) < 0.005)) continue;
    const u = s.map(x => x.a / (x.se * x.se)), sum = u.reduce((p, x) => p + x, 0);
    if (Math.abs(sum) < 0.3) continue;
    const w = u.map(x => x / sum);
    if (w.some(x => Math.abs(x) > 3)) continue;
    const aA = w.reduce((p, x, i) => p + x * s[i].a, 0), bA = w.reduce((p, x, i) => p + x * s[i].b, 0), veA = w.reduce((p, x, i) => p + x * x * s[i].se ** 2, 0);
    const mrp = rstep(0.05, 0.08, 0.005), sM = rstep(0.14, 0.22, 0.01), w0 = (aA / veA) / (mrp / (sM * sM)), wA = w0 / (1 + (1 - bA) * w0);
    if (aA <= 0 || !isFinite(wA) || wA <= 0 || wA > 2) continue;
    const bP = 1 - wA + wA * bA, eP = bP * mrp + wA * aA, sdP = Math.sqrt(bP * bP * sM * sM + wA * wA * veA), srP = eP / sdP, srM = mrp / sM, m2 = (srP - srM) * sM;
    const k = rint(0, 2), names = ['Stock 1', 'Stock 2', 'Stock 3'];
    const html = p_(`Your analysts cover three stocks. E[R<sub>M</sub>] = ${pp(mrp, 1)} and σ<sub>M</sub> = ${pp(sM, 0)}. ${NOTE}`) +
      table(['', 'α', 'β', 'σ(e)'], s.map((x, i) => [names[i], pp(x.a, 1), fmtNum(x.b), pp(x.se, 0)]));
    const items: Item[] = [
      { part: N(`What is the weight of ${names[k]} in the active portfolio?`, w[k], 'n'), w: 0.5 },
      { part: [N('What is the alpha of the active portfolio?', aA * 100, 'pct'), N('… its beta?', bA, 'n'), N('… and its residual variance? (Decimal.)', veA, 'n', { abs: 0.0002 })], w: 0.5 },
      { part: N('What weight w* does the active portfolio get in the optimal risky portfolio?', wA, 'n'), must: true },
      { part: N(`What share of the optimal risky portfolio is invested in ${names[k]}?`, w[k] * wA, 'n'), w: 0.5 },
      { part: [N('What is the risk premium of the optimal risky portfolio?', eP * 100, 'pct'), N('… and its standard deviation?', sdP * 100, 'pct')], w: 0.4 },
      { part: N('What is the M² of the optimal risky portfolio relative to the market?', m2 * 100, 'pct'), w: 0.4 },
    ];
    const sol = p_(`1–2) α/σ²(e): ${u.map(x => fmtNum(x, 3)).join(', ')}, scaled to sum to one: ${w.map(f4).join(', ')}.`) +
      p_(`3–5) α<sub>A</sub> = Σw<sub>i</sub>α<sub>i</sub> = ${pp(aA)}, β<sub>A</sub> = ${f4(bA)}, σ²(e<sub>A</sub>) = Σw²<sub>i</sub>σ²(e<sub>i</sub>) = ${fmtNum(veA, 5)}.`) +
      p_(`6–8) w⁰ = (${fmtNum(aA, 4)}/${fmtNum(veA, 5)}) / (${fmtNum(mrp, 3)}/${fmtNum(sM * sM, 4)}) = ${f4(w0)}; w* = w⁰/(1 + (1 − β<sub>A</sub>)w⁰) = ${f4(wA)}; index ${f4(1 - wA)}. 9) ${names[k]}: ${f4(w[k])} × ${f4(wA)} = ${f4(w[k] * wA)}.`) +
      p_(`10–13) β<sub>P</sub> = ${f4(bP)}, E[R<sub>P</sub>] = β<sub>P</sub>E[R<sub>M</sub>] + w*α<sub>A</sub> = ${pp(eP)}, σ<sub>P</sub> = √(β²<sub>P</sub>σ²<sub>M</sub> + w*²σ²(e<sub>A</sub>)) = ${pp(sdP)}, SR<sub>P</sub> = ${f4(srP)} against ${f4(srM)}; M² = (SR<sub>P</sub> − SR<sub>M</sub>)σ<sub>M</sub> = ${pp(m2)}.`);
    return { ...Q('PS4.tbSteps', '4', html, chooseParts(items, 2, 4)), solution: sol };
  }
  throw new Error('PS4_tbSteps: no valid draw');
}

/** Kane, Kim and White: shrink alpha forecasts by their R² before Treynor-Black. */
export function PS4_kkw(): Question {
  for (;;) {
    const a = rstep(0.02, 0.1, 0.005), r2 = pick([0.05, 0.1, 0.2, 0.3, 0.5]), b = rstep(0.6, 1.5, 0.05), se = rstep(0.1, 0.35, 0.01), mrp = rstep(0.05, 0.08, 0.005), sM = rstep(0.14, 0.22, 0.01);
    const at = r2 * a, w0 = (at / (se * se)) / (mrp / (sM * sM)), w = w0 / (1 + (1 - b) * w0), w0r = (a / (se * se)) / (mrp / (sM * sM)), wr = w0r / (1 + (1 - b) * w0r);
    if (!isFinite(w) || w <= 0 || !isFinite(wr) || wr <= 0) continue;
    const html = p_(`An analyst forecasts an alpha of ${pp(a, 1)} for an active portfolio with a beta of ${fmtNum(b)} and a residual standard deviation of ${pp(se, 0)}. Regressing past realised abnormal returns on her forecasts gives an R² of ${fmtNum(r2)}. E[R<sub>M</sub>] = ${pp(mrp, 1)} and σ<sub>M</sub> = ${pp(sM, 0)}. Using the adjusted alpha, what weight does Treynor-Black give the active portfolio?`);
    return mcNum('PS4.kkw', '4', html, w, [wr, wr * r2, w0, w0r], x => fmtNum(x, 3),
      { sol: p_(`Adjusted alpha α̃ = R²α = ${fmtNum(r2)} × ${pp(a, 1)} = ${pp(at)}. w⁰ = (${fmtNum(at, 4)}/${fmtNum(se * se, 4)}) / (${fmtNum(mrp, 3)}/${fmtNum(sM * sM, 4)}) = ${f4(w0)}; w* = ${f4(w)}, against ${f4(wr)} with the raw forecast. Noisy forecasts get much smaller positions.`), closest: true });
  }
}

/** Black-Litterman posterior from a given covariance matrix of the baseline forecasts. */
export function PS4_blPosterior(): Question {
  const vB = rstep(0.00005, 0.0002, 0.00001), vS = rstep(0.0002, 0.0006, 0.00002), cBS = rstep(0, 0.0001, 0.00001);
  const eB = rstep(0.005, 0.03, 0.001), eS = eB + rstep(0.02, 0.06, 0.001), qE = eB - eS;
  const Qv = +(qE + pick([-1, 1]) * rstep(0.01, 0.05, 0.005)).toFixed(3), given = chance(0.6), sEps = rstep(0.01, 0.03, 0.005);
  const vQE = vB + vS - 2 * cBS, vD = (given ? sEps * sEps : vQE) + vQE, D = Qv - qE;
  const rB = eB + D / vD * (vB - cBS), rS = eS + D / vD * (cBS - vS);
  const html = p_('The baseline (market-implied) expected excess returns and the covariance matrix of these baseline forecasts are:') +
    table(['', 'Baseline E[R]', 'var(E<sub>b</sub>R)', 'cov(E<sub>b</sub>R<sub>B</sub>, E<sub>b</sub>R<sub>S</sub>)'], [['Bonds', pp(eB, 1), fmtNum(vB, 5), fmtNum(cBS, 5)], ['Stocks', pp(eS, 1), fmtNum(vS, 5), fmtNum(cBS, 5)]]) +
    p_(`Your view is E[R<sub>B</sub>] − E[R<sub>S</sub>] = ${pp(Qv, 1)}${given ? `, with a standard deviation of ${pp(sEps, 1)}` : '; its standard deviation is not specified'}.`);
  const which = chance(0.5);
  const sol = p_(`Q<sub>E</sub> = ${pp(eB, 1)} − ${pp(eS, 1)} = ${pp(qE, 1)}; σ²<sub>Q<sub>E</sub></sub> = P′Σ<sub>F</sub>P = var<sub>B</sub> + var<sub>S</sub> − 2cov = ${fmtNum(vQE, 6)}. ${given ? `σ²<sub>D</sub> = ${fmtNum(sEps, 3)}² + ${fmtNum(vQE, 6)}` : `With σ²<sub>ε</sub> unspecified it is replaced by σ²<sub>Q<sub>E</sub></sub>, so σ²<sub>D</sub> = 2 × ${fmtNum(vQE, 6)}`} = ${fmtNum(vD, 6)}. D = Q − Q<sub>E</sub> = ${pp(D, 1)}.`) +
    p_(`R* = R<sub>E</sub> + (D/σ²<sub>D</sub>)Σ<sub>F</sub>P: bonds ${pp(eB, 1)} + ${fmtNum(D / vD, 2)} × (${fmtNum(vB, 5)} − ${fmtNum(cBS, 5)}) = ${pp(rB)}; stocks ${pp(eS, 1)} + ${fmtNum(D / vD, 2)} × (${fmtNum(cBS, 5)} − ${fmtNum(vS, 5)}) = ${pp(rS)}.`);
  const ans = which ? rS : rB, other = which ? rB : rS, base = which ? eS : eB;
  const vSel = which ? cBS - vS : vB - cBS, vAlt = given ? vQE : sEps * sEps + vQE;
  return mcNum('PS4.blPosterior', '4', html + p_(`What is the revised expected excess return of ${which ? 'stocks' : 'bonds'}?`), ans,
    [other, base, base + D, base - D / vD * vSel, base + D / vAlt * vSel], x => pp(x), { sol, step: 0.002 });
}

/** Value of active management, solved for a different unknown. */
export function PS4_feeInverse(): Question {
  const A = pick([2, 3, 4, 5]), k = rint(0, 2);
  if (k === 0) {
    const ir = rstep(0.01, 0.05, 0.005), f = rstep(0.002, 0.02, 0.001), n = 2 * A * f / (ir * ir);
    return mcNum('PS4.feeInverse', '4', p_(`Your analysts achieve an information ratio of ${fmtNum(ir, 3)} per stock. How many stocks must they cover for a mean-variance investor with A = ${A} to be willing to pay a fee of ${pp(f, 1)}?`), n,
      [A * f / (ir * ir), 2 * A * f / ir, f / (ir * ir), 2 * f / (A * ir * ir)], x => fmtNum(x, 0),
      { sol: p_(`f = N × IR²/(2A) ⇒ N = 2Af/IR² = 2 × ${A} × ${fmtNum(f, 3)} / ${fmtNum(ir, 3)}² = ${fmtNum(n, 1)} stocks. Fees scale with N: economies of scale in security analysis.`), closest: true });
  }
  if (k === 1) {
    const n = pick([50, 100, 200, 500]), f = rstep(0.002, 0.02, 0.001), ir = Math.sqrt(2 * A * f / n);
    return mcNum('PS4.feeInverse', '4', p_(`A fund covering ${n} stocks charges an active fee of ${pp(f, 1)}, and a mean-variance investor with A = ${A} is exactly indifferent. What information ratio per stock does this imply?`), ir,
      [2 * A * f / n, Math.sqrt(A * f / n), Math.sqrt(2 * f / (A * n)), Math.sqrt(2 * A * f)], x => fmtNum(x, 4),
      { sol: p_(`IR = √(2Af/N) = √(2 × ${A} × ${fmtNum(f, 3)} / ${n}) = ${fmtNum(ir, 4)}.`) });
  }
  const srP = rstep(0.4, 0.9, 0.05), srM = rstep(0.25, srP - 0.05, 0.05), f = (srP * srP - srM * srM) / (2 * A);
  return mcNum('PS4.feeInverse', '4', p_(`Combining an active portfolio optimally with the index raises the Sharpe ratio from ${fmtNum(srM)} to ${fmtNum(srP)}. What fee would a mean-variance investor with A = ${A} pay for it?`), f,
    [(srP - srM) / (2 * A), (srP - srM) ** 2 / (2 * A), (srP * srP - srM * srM) / A, srP * srP / (2 * A)], x => pp(x),
    { sol: p_(`The gain in SR² is the squared information ratio: ${fmtNum(srP)}² − ${fmtNum(srM)}² = ${f4(srP * srP - srM * srM)}. f = ΣIR²/(2A) = ${f4(srP * srP - srM * srM)} / ${2 * A} = ${pp(f)}.`) });
}

// =====================================================================
// PS 6 — Hedge funds
// =====================================================================

/** Gross return a fund needs to deliver a given net return after 2-and-20 style fees. */
export function PS6_grossNeeded(): Question {
  for (;;) {
    const mg = pick([0.01, 0.015, 0.02]), inc = pick([0.15, 0.2, 0.25]), h = pick([0, 0.02, 0.03, 0.05]), net = rstep(0.03, 0.15, 0.005);
    const r = (net + mg - inc * h) / (1 - inc);
    if (r <= h) continue;
    const html = p_(`A hedge fund charges ${P(mg, 1)} of assets and an incentive fee of ${P(inc, 0)} of the gross return above a hurdle of ${P(h, 0)}. What gross return must it earn for investors to get ${pp(net, 1)} after fees?`);
    return mcNum('PS6.grossNeeded', '6', html, r, [net + mg + inc * net, (net + mg) / (1 - inc), net / (1 - inc) + mg, net + mg + inc * (net - h)], x => pp(x),
      { sol: p_(`Net = r − ${fmtNum(mg, 3)} − ${fmtNum(inc)}(r − ${fmtNum(h)}) ⇒ r = (net + ${fmtNum(mg, 3)} − ${fmtNum(inc)} × ${fmtNum(h)}) / (1 − ${fmtNum(inc)}) = ${pp(r)}. Check: fees ${pp(mg, 1)} + ${fmtNum(inc)} × ${pp(r - h)} = ${pp(r - net)}.`), step: 0.005 });
  }
}

/** Index futures parity F₀ = S₀(1 + r_f) and the arbitrage when it fails. */
export function PS6_parity(): Question {
  const S0 = rstep(2000, 5500, 50), rf = rstep(0.01, 0.06, 0.005), fair = S0 * (1 + rf), dev = pick([-1, 1]) * rstep(10, 60, 5), F0 = Math.round(fair + dev), n = rint(1, 10);
  const prof = Math.abs(F0 - fair) * 250 * n;
  const html = p_(`The S&P 500 stands at ${fmtNum(S0)}, pays no dividends, and the one-year risk-free rate is ${pp(rf, 1)}. A one-year futures contract (multiplier 250) trades at ${fmtNum(F0)}.`);
  const items: Item[] = [
    { part: N('What should the futures price be?', fair, 'n'), w: 0.6 },
    { part: C('How do you exploit the gap?', ['Borrow, buy the index and sell futures', 'Short the index, lend the proceeds and buy futures', 'There is no arbitrage'], F0 > fair ? 0 : 1), must: true },
    { part: N(`What riskless profit (in $) do you lock in with ${n} contract${n > 1 ? 's' : ''}?`, prof, 'usd'), w: 0.7 },
  ];
  const sol = p_(`Parity: F<sub>0</sub> = S<sub>0</sub>(1 + r<sub>f</sub>) = ${fmtNum(S0)} × ${fmtNum(1 + rf, 3)} = ${fmtNum(fair, 2)}. The quote is ${F0 > fair ? 'too high: borrow S<sub>0</sub>, buy the index and agree to sell it at F<sub>0</sub>' : 'too low: short the index, lend the proceeds and agree to buy it back at F<sub>0</sub>'}. Profit ${fmtNum(Math.abs(F0 - fair), 2)} index points × 250 × ${n} = ${money(prof)}.`);
  return { ...Q('PS6.parity', '6', html, chooseParts(items, 2, 3)), solution: sol };
}

/** High-water mark: how far a fund must climb before it earns incentive fees again. */
export function PS6_hwmRecover(): Question {
  const inc = pick([0.2, 0.2, 0.15]), r1 = rstep(0.1, 0.4, 0.01), r2 = -rstep(0.1, 0.4, 0.01);
  const g1 = 100 * (1 + r1), f1 = inc * (g1 - 100), v1 = g1 - f1, v2 = v1 * (1 + r2), need = v1 / v2 - 1;
  const r3 = need + rstep(0.03, 0.2, 0.01), g3 = v2 * (1 + r3), f3v = inc * (g3 - v1);
  const html = p_(`You invest $100 in a hedge fund with a ${P(inc, 0)} incentive fee and a high-water mark; ignore management fees. It earns ${pp(r1, 0)} gross in year 1 and ${pp(r2, 0)} in year 2.`);
  if (chance(0.5)) return mcNum('PS6.hwmRecover', '6', html + p_('What gross return does the fund need in year 3 before it can charge an incentive fee again?'), need,
    [-r2, -r2 / (1 + r2), 100 / v2 - 1, g1 / v2 - 1], x => pp(x),
    { sol: p_(`Year 1: ${money(g1)} − fee ${money(f1)} = ${money(v1)}, the high-water mark. Year 2: ${money(v2)}. To get back to ${money(v1)} the fund needs ${money(v1)}/${money(v2)} − 1 = ${pp(need)}, more than the ${pp(-r2, 0)} it lost. Funds deep below their high-water mark have an incentive to close.`) });
  return mcNum('PS6.hwmRecover', '6', html + p_(`In year 3 it earns ${pp(r3, 0)} gross. What incentive fee is paid in year 3?`), f3v,
    [inc * (g3 - v2), inc * (g3 - 100), inc * r3 * 100, inc * (g3 - g1)], money,
    { sol: p_(`High-water mark after year 1: ${money(v1)}. Year 3: ${money(v2)} × ${fmtNum(1 + r3, 2)} = ${money(g3)}; only the gain above the mark is charged: ${fmtNum(inc)} × (${money(g3)} − ${money(v1)}) = ${money(f3v)}.`), step: 1 });
}

/** Portable alpha read backwards: the beta implied by a hedge, or the hedged return. */
export function PS6_hedgeInverse(): Question {
  for (;;) {
    const S0 = rstep(1500, 5000, 100), n = rint(3, 20), V = rstep(1, 20, 0.5) * 1e6, b = n * 250 * S0 / V;
    if (b < 0.3 || b > 2.5) continue;
    if (chance(0.5)) return mcNum('PS6.hedgeInverse', '6', p_(`You run a ${money(V)} portfolio and fully hedged its market exposure by selling ${n} S&P 500 futures (multiplier 250) at an index level of ${fmtNum(S0)}. What beta did you assume for the portfolio?`), b,
      [V / (n * 250 * S0), n * S0 / V, n * 250 * S0 / V * 2, 1], x => fmtNum(x, 3),
      { sol: p_(`N = Vβ/(S<sub>0</sub> × 250) ⇒ β = N × S<sub>0</sub> × 250 / V = ${n} × ${fmtNum(S0)} × 250 / ${money(V)} = ${f4(b)}.`) });
    const a = rstep(0.01, 0.06, 0.005), rf = rstep(0.01, 0.05, 0.005);
    return mcNum('PS6.hedgeInverse', '6', p_(`A ${money(V)} portfolio with an alpha of ${pp(a, 1)} and a beta of ${fmtNum(b, 2)} is fully hedged with S&P 500 futures. The risk-free rate is ${pp(rf, 1)}. What is the expected return of the hedged position?`), rf + a,
      [a, rf + a + b * rf, rf + a - b * rf, rf + b * a, a - rf], x => pp(x),
      { sol: p_(`Unhedged: r<sub>f</sub> + α + β(r<sub>M</sub> − r<sub>f</sub>) + e. The short futures pay β(r<sub>f</sub> − r<sub>M</sub>), so the hedged return is r<sub>f</sub> + α + e with expectation ${pp(rf, 1)} + ${pp(a, 1)} = ${pp(rf + a)}: a pure play on alpha.`) });
  }
}
