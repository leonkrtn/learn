// Financial Investments, problem set 5: mean-variance portfolios and estimation error. Calculations use two risky
// assets (the Markowitz recap at the start of lecture 1 and lecture 5); the N-asset matrix results are asked as
// concept questions only.
import { C, N, P, Q, calc, chance, chooseParts, fmtNum, p_, pick, rint, roundTo, rstep, table, tn, tp, tq, withCalc, type Item } from '@/lib/engine/gen-helpers';
import { mcNum, mcText, shortAnswer as shortAnswerOf } from '@/lib/engine/mc';
import type { ConceptMc, Question } from '@/lib/engine/types';
import { BANK } from './concepts';

const pp = (x: number, d = 2) => P(x, d);
const f3 = (x: number) => fmtNum(x, 3);
const f4 = (x: number) => fmtNum(x, 4);
const par = (s: string) => s.startsWith('−') ? '(' + s + ')' : s;
/** Terms joined with their signs: a + b - c. */
const sumStr = (xs: number[], d = 4) => xs.map((x, i) => (i === 0 ? tn(x, d) : x < 0 ? ' - ' + tn(-x, d) : ' + ' + tn(x, d))).join('');
const NOTE_PCT = 'Enter returns and standard deviations in percent, e.g. 8.33 for 8.33%. Enter weights as decimals.';
const ASSETS: [string, string][] = [['Stocks', 'Bonds'], ['Equity fund', 'Bond fund'], ['Asset 1', 'Asset 2'], ['Tech ETF', 'Utility ETF'], ['Emerging markets', 'Developed markets']];

type Two = { m1: number; m2: number; s1: number; s2: number; rho: number; c: number };
/** Correlation or covariance, so both data formats appear. */
const covText = (t: Two, asCov: boolean) => asCov ? `a covariance of ${fmtNum(t.c, 4)}` : `a correlation of ${fmtNum(t.rho)}`;
const covStep = (t: Two, asCov: boolean) => asCov ? `σ<sub>12</sub> = ${fmtNum(t.c, 4)}` : `σ<sub>12</sub> = ρσ<sub>1</sub>σ<sub>2</sub> = ${fmtNum(t.rho)} × ${fmtNum(t.s1)} × ${fmtNum(t.s2)} = ${fmtNum(t.c, 5)}`;
/** Calculation steps shared by several types: covariance, tangency weight, portfolio risk. */
const covMd = (t: Two, asCov: boolean) => asCov ? `**Covariance:** given, $\\sigma_{12} = ${tn(t.c, 6)}$.` : `**Covariance:** $\\sigma_{12} = \\rho\\sigma_1\\sigma_2 = ${tn(t.rho, 2)} \\times ${tn(t.s1, 2)} \\times ${tn(t.s2, 2)} = ${tn(t.c, 6)}$.`;
const tanMd = (t: Two) => {
  const n = t.m1 * t.s2 * t.s2 - t.m2 * t.c, d = tanDen(t);
  return `$w_1 = \\frac{\\mu_1\\sigma_2^2 - \\mu_2\\sigma_{12}}{\\mu_1\\sigma_2^2 + \\mu_2\\sigma_1^2 - (\\mu_1 + \\mu_2)\\sigma_{12}} = \\frac{${tn(t.m1, 4)} \\times ${tn(t.s2 * t.s2, 6)} - ${tn(t.m2, 4)} \\times ${tq(t.c, 6)}}{${tn(t.m1, 4)} \\times ${tn(t.s2 * t.s2, 6)} + ${tn(t.m2, 4)} \\times ${tn(t.s1 * t.s1, 6)} - ${tn(t.m1 + t.m2, 4)} \\times ${tq(t.c, 6)}} = \\frac{${tn(n, 6)}}{${tn(d, 6)}} = ${tn(n / d, 6)}$`;
};
const sdMd = (t: Two, w: number) => {
  const v = w * w * t.s1 * t.s1 + (1 - w) ** 2 * t.s2 * t.s2 + 2 * w * (1 - w) * t.c;
  return `$\\sigma^2 = w_1^2\\sigma_1^2 + w_2^2\\sigma_2^2 + 2w_1w_2\\sigma_{12} = ${tq(w, 6)}^2 \\times ${tn(t.s1 * t.s1, 6)} + ${tq(1 - w, 6)}^2 \\times ${tn(t.s2 * t.s2, 6)} + 2 \\times ${tq(w, 6)} \\times ${tq(1 - w, 6)} \\times ${tq(t.c, 6)} = ${tn(w * w * t.s1 * t.s1, 6)} + ${tn((1 - w) ** 2 * t.s2 * t.s2, 6)} + ${tq(2 * w * (1 - w) * t.c, 6)} = ${tn(v, 6)}$, so $\\sigma = \\sqrt{${tn(v, 6)}} = ${tn(Math.sqrt(v), 6)}$`;
};
const sdOf = (t: Two, w: number) => Math.sqrt(w * w * t.s1 * t.s1 + (1 - w) ** 2 * t.s2 * t.s2 + 2 * w * (1 - w) * t.c);
const gmvW = (t: Two) => (t.s2 * t.s2 - t.c) / (t.s1 * t.s1 + t.s2 * t.s2 - 2 * t.c);
const tanDen = (t: Two) => t.m1 * t.s2 * t.s2 + t.m2 * t.s1 * t.s1 - (t.m1 + t.m2) * t.c;
const tanW = (t: Two) => (t.m1 * t.s2 * t.s2 - t.m2 * t.c) / tanDen(t);

function drawTwo(excess: boolean): Two {
  for (;;) {
    const m1 = excess ? rstep(0.03, 0.12, 0.005) : rstep(0.06, 0.16, 0.005), m2 = excess ? rstep(0.01, 0.08, 0.005) : rstep(0.03, 0.1, 0.005);
    const s1 = rstep(0.15, 0.35, 0.01), s2 = rstep(0.06, 0.2, 0.01), rho = rstep(-0.5, 0.6, 0.05);
    if (Math.abs(m1 - m2) < 0.01 || Math.abs(rho) < 0.04) continue;
    return { m1, m2, s1, s2, rho, c: +(rho * s1 * s2).toFixed(6) };
  }
}

// ---------------------------------------------------------------------
// From the slides: Markowitz with two assets, parameters, shrinkage, PPP
// ---------------------------------------------------------------------

/** Optimal risky (tangency) portfolio, its Sharpe ratio and the complete portfolio w_c = (1/A)Σ⁻¹μ. */
export function PS5_tangency(): Question {
  for (let k = 0; k < 2000; k++) {
    const t = drawTwo(true), den = tanDen(t);
    if (den <= 1e-4) continue;
    const w = tanW(t);
    if (w < -0.6 || w > 1.8 || Math.abs(w) < 0.05 || Math.abs(1 - w) < 0.05) continue;
    const eT = w * t.m1 + (1 - w) * t.m2, sT = sdOf(t, w), sr = eT / sT, A = pick([2, 3, 4, 5, 6]);
    const y = eT / (A * sT * sT), det = t.s1 * t.s1 * t.s2 * t.s2 - t.c * t.c;
    const wc1 = (t.m1 * t.s2 * t.s2 - t.m2 * t.c) / (A * det), wc2 = (t.m2 * t.s1 * t.s1 - t.m1 * t.c) / (A * det);
    if (y < 0.2 || y > 4) continue;
    const [n1, n2] = pick(ASSETS), asCov = chance(0.4);
    const html = p_(`A mean-variance investor with risk aversion A = ${A} can invest in T-bills and two risky assets with the following expected excess returns and standard deviations. Their returns have ${covText(t, asCov)}. ${NOTE_PCT}`) +
      table(['', 'E[R]', 'σ'], [[n1, pp(t.m1, 1), pp(t.s1, 0)], [n2, pp(t.m2, 1), pp(t.s2, 0)]]);
    const cc = calc();
    cc.s(covMd(t, asCov));
    cc.r(`**Tangency weight of ${n1}:** ${tanMd(t)}.`, 'w1', w);
    cc.r(`**Tangency weight of ${n2}:** $w_2 = 1 - w_1 = 1 - ${tn(w, 6)} = ${tn(1 - w, 6)}$.`, 'w2', 1 - w);
    cc.r(`**Expected excess return:** $E[R_T] = w_1\\mu_1 + w_2\\mu_2 = ${tn(w, 6)} \\times ${tn(t.m1, 4)} + ${tq(1 - w, 6)} \\times ${tn(t.m2, 4)} = ${tn(w * t.m1, 6)} + ${tq((1 - w) * t.m2, 6)} = ${tn(eT, 6)}$, i.e. $${tp(eT, 4)}$.`, 'eT', eT * 100);
    cc.r(`**Standard deviation:** ${sdMd(t, w)}, i.e. $${tp(sT, 4)}$.`, 'sT', sT * 100);
    cc.r(`**Sharpe ratio:** $SR = \\frac{E[R_T]}{\\sigma_T} = \\frac{${tn(eT, 6)}}{${tn(sT, 6)}} = ${tn(sr, 6)}$.`, 'sr', sr);
    cc.r(`**Fraction in the tangency portfolio:** $y^* = \\frac{E[R_T]}{A\\sigma_T^2} = \\frac{${tn(eT, 6)}}{${A} \\times ${tn(sT * sT, 6)}} = \\frac{${tn(eT, 6)}}{${tn(A * sT * sT, 6)}} = ${tn(y, 6)}$.`, 'y', y);
    cc.s(`**Determinant:** $\\sigma_1^2\\sigma_2^2 - \\sigma_{12}^2 = ${tn(t.s1 * t.s1, 6)} \\times ${tn(t.s2 * t.s2, 6)} - ${tq(t.c, 6)}^2 = ${tn(det, 8)}$.`);
    cc.r(`**Wealth in ${n1}:** $w_{c,1} = \\frac{\\mu_1\\sigma_2^2 - \\mu_2\\sigma_{12}}{A \\times \\det} = \\frac{${tn(t.m1 * t.s2 * t.s2 - t.m2 * t.c, 8)}}{${A} \\times ${tn(det, 8)}} = ${tn(wc1, 6)}$.`, 'wc1', wc1);
    cc.s(`**Wealth in ${n2}:** $w_{c,2} = \\frac{\\mu_2\\sigma_1^2 - \\mu_1\\sigma_{12}}{A \\times \\det} = \\frac{${tn(t.m2 * t.s1 * t.s1 - t.m1 * t.c, 8)}}{${A} \\times ${tn(det, 8)}} = ${tn(wc2, 6)}$.`);
    cc.r(`**Wealth in T-bills:** $1 - w_{c,1} - w_{c,2} = 1 - ${tn(wc1, 6)} - ${tn(wc2, 6)} = ${tn(1 - wc1 - wc2, 6)}$.`, 'bills', 1 - wc1 - wc2);
    const items: Item[] = [
      { part: N(`What is the weight of ${n1} in the optimal risky (tangency) portfolio?`, w, 'n', { key: 'w1' }), must: true },
      { part: N(`What is the weight of ${n2} in the tangency portfolio?`, 1 - w, 'n', { key: 'w2' }), w: 0.3 },
      { part: N('What is the expected excess return of the tangency portfolio?', eT * 100, 'pct', { key: 'eT' }), w: 0.5 },
      { part: N('What is the standard deviation of the tangency portfolio?', sT * 100, 'pct', { key: 'sT' }), w: 0.5 },
      { part: N('What is the Sharpe ratio of the tangency portfolio (slope of the optimal CAL)?', sr, 'n', { key: 'sr' }), w: 0.6 },
      { part: N('What fraction of wealth goes into the tangency portfolio (y*)?', y, 'n', { key: 'y' }), w: 0.6 },
      { part: N(`Using w<sub>c</sub> = (1/A)Σ⁻¹μ, what fraction of total wealth is invested in ${n1}?`, wc1, 'n', { key: 'wc1' }), w: 0.5 },
      { part: N('What fraction of total wealth is invested in T-bills?', 1 - wc1 - wc2, 'n', { key: 'bills' }), w: 0.4 },
    ];
    const sol = p_(`${covStep(t, asCov)}. Tangency weight: w<sub>1</sub> = (μ<sub>1</sub>σ²<sub>2</sub> − μ<sub>2</sub>σ<sub>12</sub>) / (μ<sub>1</sub>σ²<sub>2</sub> + μ<sub>2</sub>σ²<sub>1</sub> − (μ<sub>1</sub> + μ<sub>2</sub>)σ<sub>12</sub>) = ${f4(t.m1 * t.s2 * t.s2 - t.m2 * t.c)} / ${f4(den)} = ${f4(w)}, so w<sub>2</sub> = ${f4(1 - w)}.`) +
      p_(`E[R<sub>T</sub>] = ${f4(w)} × ${pp(t.m1, 1)} + ${f4(1 - w)} × ${pp(t.m2, 1)} = ${pp(eT)}; σ<sub>T</sub> = √(w²<sub>1</sub>σ²<sub>1</sub> + w²<sub>2</sub>σ²<sub>2</sub> + 2w<sub>1</sub>w<sub>2</sub>σ<sub>12</sub>) = ${pp(sT)}; SR = ${f4(sr)}.`) +
      p_(`y* = E[R<sub>T</sub>]/(Aσ²<sub>T</sub>) = ${fmtNum(eT, 4)} / (${A} × ${fmtNum(sT * sT, 5)}) = ${f4(y)}. The direct formula w<sub>c</sub> = (1/A)Σ⁻¹μ gives ${f4(wc1)} in ${n1} and ${f4(wc2)} in ${n2}, which is y* times the tangency weights; T-bills get 1 − ${f4(wc1 + wc2)} = ${f4(1 - wc1 - wc2)}.`);
    return { ...withCalc(Q('PS5.tangency', '5', html, chooseParts(items, 3, 5)), cc.steps), solution: sol };
  }
  throw new Error('PS5_tangency: no valid draw');
}

/** Global minimum-variance portfolio of two assets. */
export function PS5_gmv(): Question {
  for (let k = 0; k < 1000; k++) {
    const t = drawTwo(false), g = gmvW(t);
    if (g < -0.5 || g > 1.5 || Math.abs(g) < 0.03) continue;
    const sG = sdOf(t, g), eG = g * t.m1 + (1 - g) * t.m2, asCov = chance(0.4), [n1, n2] = pick(ASSETS);
    const html = p_(`${n1} has an expected return of ${pp(t.m1, 1)} and a standard deviation of ${pp(t.s1, 0)}; ${n2} has an expected return of ${pp(t.m2, 1)} and a standard deviation of ${pp(t.s2, 0)}. The two have ${covText(t, asCov)}. ${NOTE_PCT}`);
    const cc = calc();
    cc.s(covMd(t, asCov));
    cc.r(`**GMV weight of ${n1}:** $w_1 = \\frac{\\sigma_2^2 - \\sigma_{12}}{\\sigma_1^2 + \\sigma_2^2 - 2\\sigma_{12}} = \\frac{${tn(t.s2 * t.s2, 6)} - ${tq(t.c, 6)}}{${tn(t.s1 * t.s1, 6)} + ${tn(t.s2 * t.s2, 6)} - 2 \\times ${tq(t.c, 6)}} = \\frac{${tn(t.s2 * t.s2 - t.c, 6)}}{${tn(t.s1 * t.s1 + t.s2 * t.s2 - 2 * t.c, 6)}} = ${tn(g, 6)}$.`, 'g', g);
    cc.r(`**Standard deviation:** ${sdMd(t, g)}, i.e. $${tp(sG, 4)}$.`, 'sG', sG * 100);
    cc.r(`**Expected return:** $w_1\\mu_1 + w_2\\mu_2 = ${tn(g, 6)} \\times ${tn(t.m1, 4)} + ${tq(1 - g, 6)} \\times ${tn(t.m2, 4)} = ${tn(eG, 6)}$, i.e. $${tp(eG, 4)}$.`, 'eG', eG * 100);
    cc.r(`**Efficient frontier:** it is the part of the frontier above the GMV point, so every efficient portfolio has an expected return of at least ${tp(eG, 4)}.`, 'front');
    const items: Item[] = [
      { part: N(`What is the weight of ${n1} in the global minimum-variance portfolio?`, g, 'n', { key: 'g' }), must: true },
      { part: N('What is the standard deviation of the global minimum-variance portfolio?', sG * 100, 'pct', { key: 'sG' }), w: 0.7 },
      { part: N('What is its expected return?', eG * 100, 'pct', { key: 'eG' }), w: 0.5 },
      { part: C('Every portfolio on the efficient frontier', ['has an expected return at least as high as the GMV portfolio', 'has a lower standard deviation than the GMV portfolio', 'puts the same weights in the two assets as the GMV portfolio'], 0, 'front'), w: 0.3 },
    ];
    const sol = p_(`${covStep(t, asCov)}. w<sub>1</sub><sup>GMV</sup> = (σ²<sub>2</sub> − σ<sub>12</sub>) / (σ²<sub>1</sub> + σ²<sub>2</sub> − 2σ<sub>12</sub>) = (${fmtNum(t.s2 * t.s2, 4)} − ${par(fmtNum(t.c, 5))}) / (${fmtNum(t.s1 * t.s1, 4)} + ${fmtNum(t.s2 * t.s2, 4)} − 2 × ${par(fmtNum(t.c, 5))}) = ${f4(g)}. Expected returns do not enter.`) +
      p_(`σ<sub>GMV</sub> = ${pp(sG)}, E[r<sub>GMV</sub>] = ${pp(eG)}. The GMV portfolio is the leftmost point of the frontier; the efficient part lies above it.`);
    return { ...withCalc(Q('PS5.gmv', '5', html, chooseParts(items, 2, 3)), cc.steps), solution: sol };
  }
  throw new Error('PS5_gmv: no valid draw');
}
/** Number of inputs: Markowitz versus the single-index list on the slides versus parametric policies. */
export function PS5_params(): Question {
  const n = pick([20, 30, 50, 100, 200, 500, 1000]), K = pick([2, 3, 4]);
  const mk = n + n + n * (n - 1) / 2, cv = n * (n - 1) / 2, sim = 4 * n + 3;
  const v = rint(0, 3);
  const cc = calc();
  if (v === 0) {
    cc.s(`**Covariances:** $\\frac{n(n-1)}{2} = \\frac{${n} \\times ${n - 1}}{2} = ${tn(cv, 0)}$.`);
    cc.r(`**Parameters:** $n + n + \\frac{n(n-1)}{2} = ${n} + ${n} + ${tn(cv, 0)} = ${tn(mk, 0)}$.`, 'ans', mk);
  } else if (v === 1) {
    cc.r(`**Covariances:** each pair counts once, $\\frac{n(n-1)}{2} = \\frac{${n} \\times ${n - 1}}{2} = ${tn(cv, 0)}$.`, 'ans', cv);
  } else if (v === 2) {
    cc.s(`**Markowitz:** $2n + \\frac{n(n-1)}{2} = ${2 * n} + ${tn(cv, 0)} = ${tn(mk, 0)}$.`);
    cc.s(`**Single-index list:** $4n + 3 = 4 \\times ${n} + 3 = ${tn(sim, 0)}$.`);
    cc.r(`**Difference:** $${tn(mk, 0)} - ${tn(sim, 0)} = ${tn(mk - sim, 0)}$ fewer parameters.`, 'ans', mk - sim);
  } else {
    cc.r(`**Parameters:** only the elements of $\\theta$ are estimated, one per characteristic, so $${K}$ parameters whatever the number of stocks.`, 'ans', K);
  }
  if (v === 0) return mcNum('PS5.params', '5', p_(`How many parameters (expected returns, variances and covariances) does a full Markowitz optimisation with ${n} risky assets need?`), mk,
    [n * n, n + cv, 2 * n + n * n, n * (n + 1), n * (n - 1)], x => fmtNum(x, 0), { calc: cc.steps, sol: p_(`${n} means + ${n} variances + ${n} × ${n - 1}/2 = ${fmtNum(cv, 0)} covariances = ${fmtNum(mk, 0)}.`) });
  if (v === 1) return mcNum('PS5.params', '5', p_(`How many distinct covariances must be estimated for ${n} assets?`), cv,
    [n * (n - 1), n * n, n * (n + 1) / 2, n * n / 2], x => fmtNum(x, 0), { calc: cc.steps, sol: p_(`Each pair once: n(n − 1)/2 = ${n} × ${n - 1}/2 = ${fmtNum(cv, 0)}. The covariance matrix is symmetric, so σ<sub>ij</sub> = σ<sub>ji</sub> is counted once.`) });
  if (v === 2) return mcNum('PS5.params', '5', p_(`The input list of the single-index model on the slides consists of ${n} means, ${n} residual variances, ${n} betas, ${n} alphas, plus r<sub>f</sub>, E(r<sub>M</sub>) and σ²<sub>M</sub>. How many fewer parameters is that than a full Markowitz optimisation with ${n} assets?`), mk - sim,
    [mk, sim, cv - sim, mk - 3 * n - 2, n * n - sim], x => fmtNum(x, 0), { calc: cc.steps, sol: p_(`Single-index list: 4 × ${n} + 3 = ${fmtNum(sim, 0)}. Markowitz: 2 × ${n} + ${n} × ${n - 1}/2 = ${fmtNum(mk, 0)}. Difference: ${fmtNum(mk - sim, 0)}. The saving comes from replacing all covariances by β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub>.`) });
  return mcNum('PS5.params', '5', p_(`A parametric portfolio policy models the weights of ${n} stocks as w<sub>i</sub> = θ′x<sub>i</sub>/N with ${K} characteristics (e.g. ${['size, value', 'size, value, momentum', 'size, value, momentum, beta'][K - 2]}). How many parameters must be estimated?`), K,
    [mk, K * n, n + K, 2 * K + 1], x => fmtNum(x, 0), { calc: cc.steps, sol: p_(`Only the ${K} elements of θ, whatever the number of stocks. Markowitz would need ${fmtNum(mk, 0)} moments: this dimension reduction is the main advantage of parametric portfolio policies.`) });
}

/** Shrinkage of weights, means or covariances towards a target. */
export function PS5_shrink(): Question {
  const v = rint(0, 3), lam = pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75]);
  if (v === 0) {
    const N3 = pick([2, 3, 4]), wMV = rstep(-0.8, 2.2, 0.05), [tName, tw] = pick([['the 1/N portfolio', 1 / N3], ['the market portfolio', rstep(0.1, 0.5, 0.05)], ['the GMV portfolio', rstep(0.1, 0.6, 0.05)]] as [string, number][]);
    const ans = (1 - lam) * wMV + lam * tw;
    const tgt = tName === 'the 1/N portfolio' ? `With ${N3} assets the 1/N weight is ${f3(tw)}.` : `Its weight in the asset is ${fmtNum(tw)}.`;
    const html = p_(`Sample mean-variance optimisation puts a weight of ${fmtNum(wMV)} in an asset. You shrink the weights towards ${tName} with intensity λ = ${fmtNum(lam)}: w̃ = (1 − λ)w<sub>MV</sub> + λw<sub>target</sub>. ${tgt} What is the shrunk weight?`);
    const cc = calc();
    cc.r(`**Shrunk weight:** $(1 - \\lambda)w_{MV} + \\lambda w_{target} = ${tn(1 - lam, 2)} \\times ${tn(wMV, 2)} + ${tn(lam, 2)} \\times ${tn(tw, 4)} = ${tn((1 - lam) * wMV, 6)} + ${tn(lam * tw, 6)} = ${tn(ans, 6)}$.`, 'ans', ans);
    return mcNum('PS5.shrink', '5', html, ans, [lam * wMV + (1 - lam) * tw, (1 - lam) * wMV, wMV - lam * tw, (wMV + tw) / 2, lam * wMV], x => fmtNum(x, 3),
      { calc: cc.steps, sol: p_(`w̃ = (1 − ${fmtNum(lam)}) × ${fmtNum(wMV)} + ${fmtNum(lam)} × ${f3(tw)} = ${f4(ans)}.`), step: 0.05 });
  }
  if (v === 1) {
    for (;;) {
      const wMV = rstep(1.2, 3, 0.05), N3 = pick([2, 4, 5, 10]), cap = pick([0.5, 0.6, 0.75, 0.8, 1]), tw = 1 / N3;
      if (cap <= tw + 0.05 || cap >= wMV) continue;
      const l = (wMV - cap) / (wMV - tw);
      const html = p_(`The sample tangency portfolio puts ${fmtNum(wMV)} in one of ${N3} assets. Your risk committee caps every weight at ${fmtNum(cap)}. You shrink the weights towards 1/N. What is the smallest shrinkage intensity λ that brings this asset down to the cap?`);
      const cc = calc();
      cc.r(`**Shrinkage intensity:** solve $(1 - \\lambda)w_{MV} + \\lambda w_{target} = cap$, so $\\lambda = \\frac{w_{MV} - cap}{w_{MV} - w_{target}} = \\frac{${tn(wMV, 2)} - ${tn(cap, 2)}}{${tn(wMV, 2)} - ${tn(tw, 4)}} = \\frac{${tn(wMV - cap, 4)}}{${tn(wMV - tw, 4)}} = ${tn(l, 6)}$.`, 'ans', l);
      return mcNum('PS5.shrink', '5', html, l, [(wMV - cap) / wMV, cap / wMV, 1 - l, (wMV - cap) / (wMV + tw), (wMV - cap) / (1 - tw)], x => fmtNum(x, 3),
        { calc: cc.steps, sol: p_(`Solve (1 − λ)${fmtNum(wMV)} + λ × ${f3(tw)} = ${fmtNum(cap)}: λ = (${fmtNum(wMV)} − ${fmtNum(cap)}) / (${fmtNum(wMV)} − ${f3(tw)}) = ${f4(l)}. Constraining weights and shrinking them are close substitutes.`) });
    }
  }
  if (v === 2) {
    const s1 = rstep(0.15, 0.4, 0.01), s2 = rstep(0.15, 0.4, 0.01), rs = rstep(-0.2, 0.9, 0.05), rbar = rstep(0.2, 0.5, 0.05);
    const cS = rs * s1 * s2, cT = rbar * s1 * s2, cov = (1 - lam) * cS + lam * cT;
    const html = p_(`Two stocks have sample standard deviations of ${pp(s1, 0)} and ${pp(s2, 0)} and a sample correlation of ${fmtNum(rs)}. You shrink the covariance towards a constant-correlation target with ρ̄ = ${fmtNum(rbar)} and intensity λ = ${fmtNum(lam)} (Σ̃ = (1 − λ)Σ<sub>sample</sub> + λΣ<sub>target</sub>; variances are unchanged). What is the shrunk covariance?`);
    const cc = calc();
    cc.s(`**Sample covariance:** $\\rho_s\\sigma_1\\sigma_2 = ${tq(rs, 2)} \\times ${tn(s1, 2)} \\times ${tn(s2, 2)} = ${tn(cS, 6)}$.`);
    cc.s(`**Target covariance:** $\\bar\\rho\\sigma_1\\sigma_2 = ${tn(rbar, 2)} \\times ${tn(s1, 2)} \\times ${tn(s2, 2)} = ${tn(cT, 6)}$.`);
    cc.r(`**Shrunk covariance:** $(1 - \\lambda)\\Sigma_{sample} + \\lambda\\Sigma_{target} = ${tn(1 - lam, 2)} \\times ${tq(cS, 6)} + ${tn(lam, 2)} \\times ${tn(cT, 6)} = ${tq((1 - lam) * cS, 6)} + ${tn(lam * cT, 6)} = ${tn(cov, 6)}$.`, 'ans', cov);
    return mcNum('PS5.shrink', '5', html, cov, [cS, cT, lam * cS + (1 - lam) * cT, (1 - lam) * rs + lam * rbar, (1 - lam) * cS], x => fmtNum(x, 4),
      { calc: cc.steps, sol: p_(`Sample covariance ${fmtNum(rs)} × ${fmtNum(s1)} × ${fmtNum(s2)} = ${fmtNum(cS, 5)}; target ${fmtNum(rbar)} × ${fmtNum(s1)} × ${fmtNum(s2)} = ${fmtNum(cT, 5)}. Shrunk: (1 − ${fmtNum(lam)}) × ${fmtNum(cS, 5)} + ${fmtNum(lam)} × ${fmtNum(cT, 5)} = ${fmtNum(cov, 5)}, an implied correlation of ${f3((1 - lam) * rs + lam * rbar)}.`), step: 0.002 });
  }
  for (let k = 0; k < 2000; k++) {
    const t = drawTwo(true);
    const mbar = (t.m1 + t.m2) / 2, a = { ...t, m1: (1 - lam) * t.m1 + lam * mbar, m2: (1 - lam) * t.m2 + lam * mbar };
    if (tanDen(t) <= 1e-4 || tanDen(a) <= 1e-4) continue;
    const w0 = tanW(t), w1 = tanW(a);
    if (Math.abs(w0 - w1) < 0.05 || w0 < -1 || w0 > 3) continue;
    const html = p_(`Two assets have estimated expected excess returns of ${pp(t.m1, 1)} and ${pp(t.m2, 1)}, standard deviations of ${pp(t.s1, 0)} and ${pp(t.s2, 0)} and a correlation of ${fmtNum(t.rho)}. You shrink both expected returns towards their common average with λ = ${fmtNum(lam)}. What is the weight of asset 1 in the tangency portfolio after shrinkage?`);
    const cc = calc();
    cc.s(`**Average:** $\\bar\\mu = \\frac{${tn(t.m1, 4)} + ${tn(t.m2, 4)}}{2} = ${tn(mbar, 6)}$.`);
    cc.s(`**Shrunk means:** $\\tilde\\mu_1 = (1 - \\lambda)\\mu_1 + \\lambda\\bar\\mu = ${tn(1 - lam, 2)} \\times ${tn(t.m1, 4)} + ${tn(lam, 2)} \\times ${tn(mbar, 6)} = ${tn(a.m1, 6)}$ and $\\tilde\\mu_2 = ${tn(1 - lam, 2)} \\times ${tn(t.m2, 4)} + ${tn(lam, 2)} \\times ${tn(mbar, 6)} = ${tn(a.m2, 6)}$.`);
    cc.s(covMd(a, false));
    cc.r(`**Tangency weight with the shrunk means:** ${tanMd(a)}.`, 'ans', w1);
    return mcNum('PS5.shrink', '5', html, w1, [w0, (1 - lam) * w0 + lam * 0.5, 1 - w1, gmvW(t)], x => fmtNum(x, 3),
      { calc: cc.steps, sol: p_(`The average is ${pp(mbar)}; shrunk means: ${pp(a.m1)} and ${pp(a.m2)}. With these inputs the tangency formula gives w<sub>1</sub> = ${f4(w1)}, against ${f4(w0)} with the raw estimates. Pulling the means together pulls the weights towards the GMV portfolio (w<sub>1</sub> = ${f4(gmvW(t))}), which ignores means altogether.`), closest: true });
  }
  throw new Error('PS5_shrink: no valid draw');
}

/** Parametric portfolio policy w_i = θ′x_i / N on standardised characteristics. */
export function PS5_ppp(): Question {
  for (;;) {
    const n = 4, x1 = [0, 1, 2].map(() => rstep(-1.5, 1.5, 0.1)), x2 = [0, 1, 2].map(() => rstep(-1.5, 1.5, 0.1));
    x1.push(+(-x1.reduce((s, x) => s + x, 0)).toFixed(2)); x2.push(+(-x2.reduce((s, x) => s + x, 0)).toFixed(2));
    if (Math.abs(x1[3]) > 2 || Math.abs(x2[3]) > 2) continue;
    const th = [rstep(-1, 2, 0.1), rstep(-1, 2, 0.1)];
    if (th.some(x => Math.abs(x) < 0.1)) continue;
    const w = x1.map((_, i) => (th[0] * x1[i] + th[1] * x2[i]) / n);
    const r = [0, 1, 2, 3].map(() => rstep(-0.06, 0.08, 0.005)), rf = rstep(0.0, 0.004, 0.0005);
    const rp = rf + w.reduce((s, x, i) => s + x * r[i], 0);
    const [c1, c2] = pick([['carry', 'momentum'], ['value', 'momentum'], ['size', 'book-to-market'], ['carry', 'value']]);
    const html = p_(`A parametric portfolio policy in the spirit of Barroso and Santa-Clara (2015) sets w<sub>i</sub> = θ′x<sub>i</sub>/N on top of a risk-free investment, where x<sub>i</sub> holds the cross-sectionally standardised characteristics ${c1} and ${c2}. The estimated parameters are θ<sub>${c1}</sub> = ${fmtNum(th[0])} and θ<sub>${c2}</sub> = ${fmtNum(th[1])}.`) +
      table(['Asset', c1, c2, 'Next-month return'], x1.map((_, i) => [String(i + 1), fmtNum(x1[i]), fmtNum(x2[i]), pp(r[i], 1)])) + p_(`The risk-free rate is ${pp(rf, 2)} per month.`);
    const k = rint(0, 3);
    if (chance(0.5)) {
      const cc = calc(), raw = th[0] * x1[k] + th[1] * x2[k];
      cc.s(`**Raw score of asset ${k + 1}:** $\\theta'x = ${tn(th[0], 2)} \\times ${tq(x1[k], 2)} + ${tn(th[1], 2)} \\times ${tq(x2[k], 2)} = ${tq(th[0] * x1[k], 4)} + ${tq(th[1] * x2[k], 4)} = ${tq(raw, 4)}$.`);
      cc.r(`**Weight:** $w = \\frac{\\theta'x}{N} = \\frac{${tq(raw, 4)}}{${n}} = ${tq(w[k], 6)}$.`, 'ans', w[k]);
      return mcNum('PS5.ppp', '5', html + p_(`What is the weight of asset ${k + 1}?`), w[k], [th[0] * x1[k] + th[1] * x2[k], w[k] * 2, (th[0] * x1[k] + th[1] * x2[k]) / 3, (th[0] + th[1]) / n, th[0] * x1[k] / n], x => fmtNum(x, 3),
        { calc: cc.steps, sol: p_(`w<sub>${k + 1}</sub> = (${fmtNum(th[0])} × ${par(fmtNum(x1[k]))} + ${fmtNum(th[1])} × ${par(fmtNum(x2[k]))}) / ${n} = ${f4(w[k])}. Because the characteristics are standardised, the weights sum to zero: the policy is a long-short overlay on the risk-free asset.`), step: 0.05 });
    }
    const cc = calc();
    w.forEach((x, i) => cc.s(`**Weight of asset ${i + 1}:** $\\frac{${tn(th[0], 2)} \\times ${tq(x1[i], 2)} + ${tn(th[1], 2)} \\times ${tq(x2[i], 2)}}{${n}} = ${tq(x, 6)}$.`));
    cc.r(`**Return of the policy:** $r_f + \\sum w_i r_i = ${tn(rf, 4)} + ${w.map((x, i) => `${tq(x, 6)} \\times ${tq(r[i], 3)}`).join(' + ')} = ${tn(rf, 4)} + ${tq(rp - rf, 6)} = ${tn(rp, 6)}$, i.e. $${tp(rp, 4)}$.`, 'ans', rp);
    return mcNum('PS5.ppp', '5', html + p_('What is the return of the policy portfolio next month?'), rp,
      [rp - rf, rf + w.reduce((s, x, i) => s + x * r[i], 0) * n, w.reduce((s, x, i) => s + Math.abs(x) * r[i], 0) + rf, r.reduce((s, x) => s + x, 0) / n], x => pp(x, 3),
      { calc: cc.steps, sol: p_(`Weights: ${w.map(f3).join(', ')}. r<sub>p</sub> = r<sub>f</sub> + Σw<sub>i</sub>r<sub>i</sub> = ${pp(rf, 2)} + ${pp(rp - rf, 3)} = ${pp(rp, 3)}.`), step: 0.002 });
  }
}

// ---------------------------------------------------------------------
// Basics from the start of the course and lecture 5 content beyond the slides' exercises
// ---------------------------------------------------------------------

/** Expected return, risk, covariance and correlation from a scenario table. */
export function PS5_scenario(): Question {
  for (;;) {
    const p = pick([[0.25, 0.5, 0.25], [0.3, 0.4, 0.3], [0.2, 0.5, 0.3], [0.2, 0.6, 0.2], [0.3, 0.5, 0.2]]);
    const rS = [rstep(0.15, 0.4, 0.01), rstep(0.04, 0.14, 0.01), rstep(-0.3, -0.05, 0.01)], rB = [rstep(-0.04, 0.06, 0.01), rstep(0.02, 0.08, 0.01), rstep(0.0, 0.15, 0.01)];
    const E = (r: number[]) => r.reduce((s, x, i) => s + p[i] * x, 0);
    const eS = E(rS), eB = E(rB), vS = E(rS.map(x => (x - eS) ** 2)), vB = E(rB.map(x => (x - eB) ** 2));
    const cov = E(rS.map((x, i) => (x - eS) * (rB[i] - eB))), rho = cov / Math.sqrt(vS * vB);
    if (vB < 1e-5 || Math.abs(rho) > 0.98) continue;
    const w = pick([0.3, 0.4, 0.5, 0.6, 0.7]), eP = w * eS + (1 - w) * eB, sP = Math.sqrt(w * w * vS + (1 - w) ** 2 * vB + 2 * w * (1 - w) * cov);
    const html = p_(`An analyst gives the following scenarios for a stock fund and a bond fund. ${NOTE_PCT}`) +
      table(['Scenario', 'Probability', 'Stock fund', 'Bond fund'], ['Boom', 'Normal', 'Recession'].map((s, i) => [s, fmtNum(p[i]), pp(rS[i], 0), pp(rB[i], 0)]));
    const cc = calc(), sc = [0, 1, 2], dS = rS.map(x => x - eS), dB = rB.map(x => x - eB);
    cc.r(`**Expected return of the stock fund:** $\\sum p_s r_s = ${sc.map(i => `${tn(p[i], 2)} \\times ${tq(rS[i], 2)}`).join(' + ')} = ${tn(eS, 6)}$, i.e. $${tp(eS, 4)}$.`, 'eS', eS * 100);
    cc.s(`**Expected return of the bond fund:** $${sc.map(i => `${tn(p[i], 2)} \\times ${tq(rB[i], 2)}`).join(' + ')} = ${tn(eB, 6)}$.`);
    cc.s(`**Deviations from the mean:** stocks ${dS.map(x => '$' + tq(x, 4) + '$').join(', ')}; bonds ${dB.map(x => '$' + tq(x, 4) + '$').join(', ')}.`);
    cc.r(`**Standard deviation of the stock fund:** $\\sigma_S^2 = \\sum p_s(r_s - \\bar r)^2 = ${sc.map(i => `${tn(p[i], 2)} \\times ${tq(dS[i], 4)}^2`).join(' + ')} = ${tn(vS, 6)}$, so $\\sigma_S = \\sqrt{${tn(vS, 6)}} = ${tn(Math.sqrt(vS), 6)}$, i.e. $${tp(Math.sqrt(vS), 4)}$.`, 'sdS', Math.sqrt(vS) * 100);
    cc.r(`**Standard deviation of the bond fund:** $\\sigma_B^2 = ${sc.map(i => `${tn(p[i], 2)} \\times ${tq(dB[i], 4)}^2`).join(' + ')} = ${tn(vB, 6)}$, so $\\sigma_B = \\sqrt{${tn(vB, 6)}} = ${tn(Math.sqrt(vB), 6)}$, i.e. $${tp(Math.sqrt(vB), 4)}$.`, 'sdB', Math.sqrt(vB) * 100);
    cc.r(`**Covariance:** $\\sum p_s(r_{S,s} - \\bar r_S)(r_{B,s} - \\bar r_B) = ${sc.map(i => `${tn(p[i], 2)} \\times ${tq(dS[i], 4)} \\times ${tq(dB[i], 4)}`).join(' + ')} = ${tn(cov, 6)}$.`, 'cov', cov);
    cc.r(`**Correlation:** $\\rho = \\frac{cov}{\\sigma_S\\sigma_B} = \\frac{${tq(cov, 6)}}{${tn(Math.sqrt(vS), 6)} \\times ${tn(Math.sqrt(vB), 6)}} = \\frac{${tq(cov, 6)}}{${tn(Math.sqrt(vS * vB), 6)}} = ${tn(rho, 6)}$.`, 'rho', rho);
    cc.r(`**Expected return of the portfolio:** $w\\bar r_S + (1 - w)\\bar r_B = ${tn(w, 2)} \\times ${tn(eS, 6)} + ${tn(1 - w, 2)} \\times ${tn(eB, 6)} = ${tn(eP, 6)}$, i.e. $${tp(eP, 4)}$.`, 'eP', eP * 100);
    cc.r(`**Standard deviation of the portfolio:** $\\sigma^2 = w^2\\sigma_S^2 + (1 - w)^2\\sigma_B^2 + 2w(1 - w)cov = ${tn(w * w * vS, 6)} + ${tn((1 - w) ** 2 * vB, 6)} + ${tq(2 * w * (1 - w) * cov, 6)} = ${tn(sP * sP, 6)}$, so $\\sigma = ${tn(sP, 6)}$, i.e. $${tp(sP, 4)}$.`, 'sP', sP * 100);
    const items: Item[] = [
      { part: N('What is the expected return of the stock fund?', eS * 100, 'pct', { key: 'eS' }), w: 0.5 },
      { part: N('What is the standard deviation of the stock fund?', Math.sqrt(vS) * 100, 'pct', { key: 'sdS' }), w: 0.6 },
      { part: N('What is the standard deviation of the bond fund?', Math.sqrt(vB) * 100, 'pct', { key: 'sdB' }), w: 0.4 },
      { part: N('What is the covariance between the two funds? (Decimal, e.g. −0.0042.)', cov, 'n', { abs: 0.00015, key: 'cov' }), w: 0.5 },
      { part: N('What is the correlation between the two funds?', rho, 'n', { key: 'rho' }), must: true },
      { part: [N(`A portfolio puts ${P(w, 0)} in the stock fund and the rest in the bond fund. What is its expected return?`, eP * 100, 'pct', { key: 'eP' }), N('… and its standard deviation?', sP * 100, 'pct', { key: 'sP' })], w: 0.5 },
    ];
    const sol = p_(`E[r] = Σp<sub>s</sub>r<sub>s</sub>: stocks ${pp(eS)}, bonds ${pp(eB)}. Variance = Σp<sub>s</sub>(r<sub>s</sub> − E[r])²: stocks ${fmtNum(vS, 5)} (σ = ${pp(Math.sqrt(vS))}), bonds ${fmtNum(vB, 5)} (σ = ${pp(Math.sqrt(vB))}).`) +
      p_(`cov = Σp<sub>s</sub>(r<sub>S,s</sub> − E[r<sub>S</sub>])(r<sub>B,s</sub> − E[r<sub>B</sub>]) = ${fmtNum(cov, 5)}; ρ = cov/(σ<sub>S</sub>σ<sub>B</sub>) = ${f4(rho)}.`) +
      p_(`Portfolio with w = ${fmtNum(w)}: E[r<sub>P</sub>] = ${pp(eP)}, σ<sub>P</sub> = √(w²σ²<sub>S</sub> + (1 − w)²σ²<sub>B</sub> + 2w(1 − w)cov) = ${pp(sP)}.`);
    return { ...withCalc(Q('PS5.scenario', '5', html, chooseParts(items, 2, 4)), cc.steps), solution: sol };
  }
}

/** Mean-variance utility U = E[r] − ½Aσ². */
export function PS5_utility(): Question {
  const A = pick([2, 3, 4, 5]), rf = rstep(0.01, 0.05, 0.005), v = rint(0, 3);
  if (v === 0) {
    for (;;) {
      const inv = [0, 1, 2, 3].map(() => ({ e: rstep(0.06, 0.2, 0.01), s: rstep(0.1, 0.4, 0.05) }));
      const u = inv.map(x => x.e - 0.5 * A * x.s * x.s), best = u.indexOf(Math.max(...u)), byE = inv.map(x => x.e).indexOf(Math.max(...inv.map(x => x.e)));
      const sorted = [...u].sort((a, b) => b - a);
      if (sorted[0] - sorted[1] < 0.004 || byE === best) continue;
      const names = inv.map((_, i) => 'Investment ' + (i + 1));
      const html = p_(`An investor has the utility function U = E[r] − ½Aσ² with A = ${A}. Which investment does she prefer?`) + table(['', 'E[r]', 'σ'], inv.map((x, i) => [names[i], pp(x.e, 0), pp(x.s, 0)]));
      return mcText('PS5.utility', '5', html, names[best], names.filter((_, i) => i !== best),
        p_(`Utilities: ${inv.map((x, i) => `${names[i]}: ${pp(x.e, 0)} − 0.5 × ${A} × ${fmtNum(x.s)}² = ${pp(u[i])}`).join('; ')}. The highest utility wins, not the highest expected return.`), false);
    }
  }
  const e = rf + rstep(0.03, 0.12, 0.005), s = rstep(0.1, 0.35, 0.01);
  const base = `A risky portfolio has an expected return of ${pp(e, 1)} and a standard deviation of ${pp(s, 0)}; T-bills yield ${pp(rf, 1)}.`;
  if (v === 1) {
    const ce = e - 0.5 * A * s * s;
    const cc = calc();
    cc.s(`**Risk penalty:** $\\frac{1}{2}A\\sigma^2 = 0.5 \\times ${A} \\times ${tn(s, 2)}^2 = 0.5 \\times ${A} \\times ${tn(s * s, 4)} = ${tn(0.5 * A * s * s, 6)}$.`);
    cc.r(`**Certainty equivalent:** $E[r] - \\frac{1}{2}A\\sigma^2 = ${tn(e, 4)} - ${tn(0.5 * A * s * s, 6)} = ${tn(ce, 6)}$, i.e. $${tp(ce, 4)}$.`, 'ans', ce);
    return mcNum('PS5.utility', '5', p_(`${base} What is the certainty equivalent rate of the risky portfolio for an investor with A = ${A}?`), ce,
      [e - A * s * s, e - 0.5 * A * s, e - 0.5 * s * s, rf + 0.5 * A * s * s, e - rf - 0.5 * A * s * s], x => pp(x),
      { calc: cc.steps, sol: p_(`The certainty equivalent is the utility value: ${pp(e, 1)} − 0.5 × ${A} × ${fmtNum(s)}² = ${pp(ce)}. ${ce > rf ? 'It beats the T-bill rate, so the investor prefers the risky portfolio to T-bills.' : 'It is below the T-bill rate, so the investor prefers T-bills.'}`), step: 0.005 });
  }
  if (v === 2) {
    const Ai = 2 * (e - rf) / (s * s);
    const cc = calc();
    cc.r(`**Risk aversion:** $E[r] - \\frac{1}{2}A\\sigma^2 = r_f$ gives $A = \\frac{2(E[r] - r_f)}{\\sigma^2} = \\frac{2 \\times (${tn(e, 4)} - ${tn(rf, 3)})}{${tn(s, 2)}^2} = \\frac{${tn(2 * (e - rf), 6)}}{${tn(s * s, 4)}} = ${tn(Ai, 6)}$.`, 'ans', Ai);
    return mcNum('PS5.utility', '5', p_(`${base} For which coefficient of risk aversion is an investor indifferent between the risky portfolio and T-bills?`), Ai,
      [(e - rf) / (s * s), 2 * e / (s * s), 2 * (e - rf) / s, (e - rf) / (2 * s * s)], x => fmtNum(x, 2),
      { calc: cc.steps, sol: p_(`Indifference: E[r] − ½Aσ² = r<sub>f</sub>, so A = 2(E[r] − r<sub>f</sub>)/σ² = 2 × ${fmtNum(e - rf, 3)} / ${fmtNum(s * s, 4)} = ${fmtNum(Ai, 3)}. More risk-averse investors prefer T-bills.`), closest: true });
  }
  const sMax = Math.sqrt(2 * (e - rf) / A);
  const cc = calc();
  cc.s(`**Ratio:** $\\frac{2(E[r] - r_f)}{A} = \\frac{2 \\times (${tn(e, 4)} - ${tn(rf, 3)})}{${A}} = ${tn(2 * (e - rf) / A, 6)}$.`);
  cc.r(`**Highest standard deviation:** $E[r] - \\frac{1}{2}A\\sigma^2 \\ge r_f$ gives $\\sigma \\le \\sqrt{${tn(2 * (e - rf) / A, 6)}} = ${tn(sMax, 6)}$, i.e. $${tp(sMax, 4)}$.`, 'ans', sMax);
  return mcNum('PS5.utility', '5', p_(`A risky portfolio has an expected return of ${pp(e, 1)}; T-bills yield ${pp(rf, 1)}. What is the highest standard deviation at which an investor with A = ${A} still prefers the risky portfolio to T-bills?`), sMax,
    [2 * (e - rf) / A, Math.sqrt((e - rf) / A), Math.sqrt(2 * e / A), (e - rf) / A], x => pp(x),
    { calc: cc.steps, sol: p_(`E[r] − ½Aσ² ≥ r<sub>f</sub> ⇔ σ ≤ √(2(E[r] − r<sub>f</sub>)/A) = √(2 × ${fmtNum(e - rf, 3)} / ${A}) = ${pp(sMax)}.`) });
}

/** Capital allocation line: optimal y*, target return or risk, implied risk aversion, borrowing rate. */
export function PS5_cal(): Question {
  for (;;) {
    const rf = rstep(0.01, 0.05, 0.005), e = rf + rstep(0.04, 0.12, 0.005), s = rstep(0.12, 0.35, 0.01), A = pick([1.5, 2, 2.5, 3, 4, 5]);
    const y = (e - rf) / (A * s * s), sr = (e - rf) / s;
    if (y < 0.2 || y > 3) continue;
    const et = rf + rstep(0.2, 1.4, 0.05) * (e - rf), yt = (et - rf) / (e - rf), st = rstep(0.4, 1.3, 0.05) * s, ys = st / s;
    const yHeld = rstep(0.3, 1.2, 0.05), Ai = (e - rf) / (yHeld * s * s);
    const rb = rf + rstep(0.01, 0.04, 0.005), yb = (e - rb) / (A * s * s), yK = y <= 1 ? y : Math.max(1, yb);
    const html = p_(`T-bills yield ${pp(rf, 1)}. The optimal risky portfolio P has an expected return of ${pp(e, 1)} and a standard deviation of ${pp(s, 0)}. ${NOTE_PCT}`);
    const cc = calc();
    cc.r(`**Sharpe ratio of P:** $\\frac{E[r_P] - r_f}{\\sigma_P} = \\frac{${tn(e, 4)} - ${tn(rf, 3)}}{${tn(s, 2)}} = \\frac{${tn(e - rf, 4)}}{${tn(s, 2)}} = ${tn(sr, 6)}$.`, 'sr', sr);
    cc.r(`**Optimal fraction:** $y^* = \\frac{E[r_P] - r_f}{A\\sigma_P^2} = \\frac{${tn(e - rf, 4)}}{${A} \\times ${tn(s * s, 4)}} = \\frac{${tn(e - rf, 4)}}{${tn(A * s * s, 4)}} = ${tn(y, 6)}$.`, 'y', y);
    cc.r(`**Expected return of the complete portfolio:** $r_f + y(E[r_P] - r_f) = ${tn(rf, 3)} + ${tn(y, 6)} \\times ${tn(e - rf, 4)} = ${tn(rf, 3)} + ${tn(y * (e - rf), 6)} = ${tn(rf + y * (e - rf), 6)}$, i.e. $${tp(rf + y * (e - rf), 4)}$.`, 'eC', (rf + y * (e - rf)) * 100);
    cc.r(`**Standard deviation:** $y\\sigma_P = ${tn(y, 6)} \\times ${tn(s, 2)} = ${tn(y * s, 6)}$, i.e. $${tp(y * s, 4)}$.`, 'sC', y * s * 100);
    cc.r(`**Fraction for the target return:** $y = \\frac{E[r_C] - r_f}{E[r_P] - r_f} = \\frac{${tn(et, 4)} - ${tn(rf, 3)}}{${tn(e - rf, 4)}} = \\frac{${tn(et - rf, 4)}}{${tn(e - rf, 4)}} = ${tn(yt, 6)}$.`, 'yt', yt);
    cc.s(`**Fraction for the target risk:** $y = \\frac{\\sigma_C}{\\sigma_P} = \\frac{${tn(st, 4)}}{${tn(s, 2)}} = ${tn(ys, 6)}$.`);
    cc.r(`**Expected return at the target risk:** $r_f + y(E[r_P] - r_f) = ${tn(rf, 3)} + ${tn(ys, 6)} \\times ${tn(e - rf, 4)} = ${tn(rf + ys * (e - rf), 6)}$, i.e. $${tp(rf + ys * (e - rf), 4)}$.`, 'eRisk', (rf + ys * (e - rf)) * 100);
    cc.r(`**Implied risk aversion:** $A = \\frac{E[r_P] - r_f}{y\\sigma_P^2} = \\frac{${tn(e - rf, 4)}}{${tn(yHeld, 2)} \\times ${tn(s * s, 4)}} = \\frac{${tn(e - rf, 4)}}{${tn(yHeld * s * s, 6)}} = ${tn(Ai, 6)}$.`, 'Aimp', Ai);
    cc.s(`**With the borrowing rate:** $y_b = \\frac{E[r_P] - r_B}{A\\sigma_P^2} = \\frac{${tn(e, 4)} - ${tn(rb, 3)}}{${A} \\times ${tn(s * s, 4)}} = ${tn(yb, 6)}$.`);
    cc.r(`**Optimal fraction with borrowing cost:** ${y <= 1 ? `$y^* = ${tn(y, 6)} \\le 1$, so the investor lends and the borrowing rate does not matter: $y = ${tn(y, 6)}$.` : yb >= 1 ? `$y^* > 1$ requires borrowing, so use the borrowing rate: $y = ${tn(yb, 6)}$.` : `with the borrowing rate $y_b = ${tn(yb, 6)} < 1$, while with $r_f$ it is $${tn(y, 6)} > 1$: the investor sits at the kink and holds exactly $y = 1$.`}`, 'yK', yK);
    const items: Item[] = [
      { part: N('What is the slope of the capital allocation line (the Sharpe ratio of P)?', sr, 'n', { key: 'sr' }), w: 0.4 },
      { part: [N(`What fraction y* should an investor with A = ${A} put in P?`, y, 'n', { key: 'y' }), N('… which gives a complete portfolio with what expected return?', (rf + y * (e - rf)) * 100, 'pct', { key: 'eC' }), N('… and what standard deviation?', y * s * 100, 'pct', { key: 'sC' })], w: 0.6 },
      { part: N(`What fraction must be invested in P for a complete portfolio with an expected return of ${pp(et, 2)}?`, yt, 'n', { key: 'yt' }), w: 0.5 },
      { part: N(`What expected return does the complete portfolio with a standard deviation of ${pp(st, 1)} offer?`, (rf + ys * (e - rf)) * 100, 'pct', { key: 'eRisk' }), w: 0.4 },
      { part: N(`An investor holds ${P(yHeld, 0)} of her wealth in P. What risk aversion does this imply?`, Ai, 'n', { key: 'Aimp' }), w: 0.4 },
      { part: N(`Borrowing costs ${pp(rb, 1)} instead of ${pp(rf, 1)}. What is the optimal fraction in P for A = ${A}?`, yK, 'n', { key: 'yK' }), w: y > 1 ? 0.6 : 0.2 },
    ];
    const kink = y <= 1 ? `y* ≤ 1, so the investor lends and the borrowing rate does not matter: y = ${f4(y)}.` : yb >= 1 ? `y* > 1 requires borrowing; with the borrowing rate y = (E[r<sub>P</sub>] − r<sub>B</sub>)/(Aσ²) = ${f4(yb)}.` : `With the borrowing rate y would be ${f4(yb)} < 1, while with r<sub>f</sub> it is above 1: the investor sits at the kink and holds exactly y = 1.`;
    const sol = p_(`CAL: E[r<sub>C</sub>] = r<sub>f</sub> + y(E[r<sub>P</sub>] − r<sub>f</sub>), σ<sub>C</sub> = yσ<sub>P</sub>, slope (${pp(e, 1)} − ${pp(rf, 1)})/${pp(s, 0)} = ${f4(sr)}.`) +
      p_(`y* = (E[r<sub>P</sub>] − r<sub>f</sub>)/(Aσ²<sub>P</sub>) = ${fmtNum(e - rf, 3)} / (${A} × ${fmtNum(s * s, 4)}) = ${f4(y)}, giving E[r<sub>C</sub>] = ${pp(rf + y * (e - rf))} and σ<sub>C</sub> = ${pp(y * s)}.`) +
      p_(`Target return ${pp(et)}: y = (${pp(et)} − ${pp(rf, 1)})/(${pp(e - rf, 1)}) = ${f4(yt)}. Target risk ${pp(st, 1)}: y = ${f4(ys)}, E[r] = ${pp(rf + ys * (e - rf))}. Holding y = ${fmtNum(yHeld)} implies A = (E[r<sub>P</sub>] − r<sub>f</sub>)/(yσ²<sub>P</sub>) = ${fmtNum(Ai, 3)}. ${kink}`);
    return { ...withCalc(Q('PS5.cal', '5', html, chooseParts(items, 2, 3)), cc.steps), solution: sol };
  }
}

/** Portfolio risk of two assets; inverse questions (implied correlation, weight for a target) and ρ = −1. */
export function PS5_twoAsset(): Question {
  for (;;) {
    const t = drawTwo(false), asCov = chance(0.4), w = pick([0.2, 0.3, 0.4, 0.6, 0.7, 0.8]), sP = sdOf(t, w);
    const [n1, n2] = pick(ASSETS);
    const base = `${n1} has an expected return of ${pp(t.m1, 1)} and a standard deviation of ${pp(t.s1, 0)}; ${n2} has an expected return of ${pp(t.m2, 1)} and a standard deviation of ${pp(t.s2, 0)}.`;
    const v = rint(0, 3);
    if (v === 0) {
      const cc = calc();
      cc.s(covMd(t, asCov));
      cc.r(`**Standard deviation:** ${sdMd(t, w)}, i.e. $${tp(sP, 4)}$.`, 'ans', sP);
      return mcNum('PS5.twoAsset', '5', p_(`${base} Their returns have ${covText(t, asCov)}. What is the standard deviation of a portfolio with ${P(w, 0)} in ${n1} and the rest in ${n2}?`), sP,
        [w * t.s1 + (1 - w) * t.s2, Math.sqrt(w * w * t.s1 ** 2 + (1 - w) ** 2 * t.s2 ** 2), Math.sqrt(w * w * t.s1 ** 2 + (1 - w) ** 2 * t.s2 ** 2 + w * (1 - w) * t.c), Math.sqrt(w * t.s1 ** 2 + (1 - w) * t.s2 ** 2), sP * sP], x => pp(x),
        { calc: cc.steps, sol: p_(`${covStep(t, asCov)}. σ²<sub>P</sub> = ${fmtNum(w)}² × ${fmtNum(t.s1)}² + ${fmtNum(1 - w)}² × ${fmtNum(t.s2)}² + 2 × ${fmtNum(w)} × ${fmtNum(1 - w)} × ${par(fmtNum(t.c, 5))} = ${fmtNum(sP * sP, 5)}, so σ<sub>P</sub> = ${pp(sP)}. ${t.rho < 1 ? 'It is below the weighted average of the standard deviations: that gap is the diversification benefit.' : ''}`) });
    }
    if (v === 1) {
      const sShown = +sP.toFixed(4), r = (sShown ** 2 - w * w * t.s1 ** 2 - (1 - w) ** 2 * t.s2 ** 2) / (2 * w * (1 - w) * t.s1 * t.s2);
      if (Math.abs(r) > 0.99) continue;
      const cc = calc(), num = sShown ** 2 - w * w * t.s1 ** 2 - (1 - w) ** 2 * t.s2 ** 2;
      cc.s(`**Squared terms:** $\\sigma_P^2 = ${tn(sShown, 4)}^2 = ${tn(sShown ** 2, 6)}$, $w^2\\sigma_1^2 = ${tn(w, 2)}^2 \\times ${tn(t.s1 * t.s1, 4)} = ${tn(w * w * t.s1 ** 2, 6)}$, $(1 - w)^2\\sigma_2^2 = ${tn(1 - w, 2)}^2 \\times ${tn(t.s2 * t.s2, 4)} = ${tn((1 - w) ** 2 * t.s2 ** 2, 6)}$.`);
      cc.r(`**Correlation:** $\\rho = \\frac{\\sigma_P^2 - w^2\\sigma_1^2 - (1 - w)^2\\sigma_2^2}{2w(1 - w)\\sigma_1\\sigma_2} = \\frac{${tn(num, 6)}}{2 \\times ${tn(w, 2)} \\times ${tn(1 - w, 2)} \\times ${tn(t.s1, 2)} \\times ${tn(t.s2, 2)}} = \\frac{${tn(num, 6)}}{${tn(2 * w * (1 - w) * t.s1 * t.s2, 6)}} = ${tn(r, 6)}$.`, 'ans', r);
      return mcNum('PS5.twoAsset', '5', p_(`${base} A portfolio with ${P(w, 0)} in ${n1} and the rest in ${n2} has a standard deviation of ${pp(sShown, 2)}. What correlation between the two assets does this imply?`), r,
        [r * t.s1 * t.s2, (sShown ** 2 - w * w * t.s1 ** 2 - (1 - w) ** 2 * t.s2 ** 2) / (w * (1 - w) * t.s1 * t.s2), (sShown - w * t.s1 - (1 - w) * t.s2) / (t.s1 * t.s2), -r], x => fmtNum(x, 3),
        { calc: cc.steps, sol: p_(`Solve σ²<sub>P</sub> = w²σ²<sub>1</sub> + (1 − w)²σ²<sub>2</sub> + 2w(1 − w)ρσ<sub>1</sub>σ<sub>2</sub> for ρ: (${fmtNum(sShown ** 2, 5)} − ${fmtNum(w * w * t.s1 ** 2, 5)} − ${fmtNum((1 - w) ** 2 * t.s2 ** 2, 5)}) / (2 × ${fmtNum(w)} × ${fmtNum(1 - w)} × ${fmtNum(t.s1)} × ${fmtNum(t.s2)}) = ${f4(r)}.`), step: 0.1 });
    }
    if (v === 2) {
      const et = roundTo(t.m2 + rstep(0.2, 1.5, 0.1) * (t.m1 - t.m2), 0.0025), wt = (et - t.m2) / (t.m1 - t.m2), sT = sdOf(t, wt);
      if (Math.abs(wt - 1) < 0.05 || Math.abs(wt) < 0.05) continue;
      const cc = calc(), first = chance(0.5);
      const wtMd = `**Weight in ${n1}:** $w\\mu_1 + (1 - w)\\mu_2 = target$ gives $w = \\frac{target - \\mu_2}{\\mu_1 - \\mu_2} = \\frac{${tn(et, 4)} - ${tn(t.m2, 4)}}{${tn(t.m1, 4)} - ${tn(t.m2, 4)}} = \\frac{${tn(et - t.m2, 4)}}{${tn(t.m1 - t.m2, 4)}} = ${tn(wt, 6)}$.`;
      if (first) cc.r(wtMd, 'ans', wt);
      else {
        cc.s(wtMd);
        cc.s(covMd(t, asCov));
        cc.r(`**Standard deviation:** ${sdMd(t, wt)}, i.e. $${tp(sT, 4)}$.`, 'ans', sT);
      }
      if (first) return mcNum('PS5.twoAsset', '5', p_(`${base} What weight in ${n1} gives a portfolio of the two assets an expected return of ${pp(et, 2)}?`), wt,
        [1 - wt, et / t.m1, (et - t.m1) / (t.m2 - t.m1) + 0.5, et / (t.m1 + t.m2)], x => fmtNum(x, 3),
        { calc: cc.steps, sol: p_(`w${pp(t.m1, 1)} + (1 − w)${pp(t.m2, 1)} = ${pp(et, 2)} ⇒ w = (${pp(et, 2)} − ${pp(t.m2, 1)}) / (${pp(t.m1, 1)} − ${pp(t.m2, 1)}) = ${f4(wt)}.${wt > 1 ? ` A weight above one means shorting ${n2}.` : ''}`), step: 0.1 });
      return mcNum('PS5.twoAsset', '5', p_(`${base} Their returns have ${covText(t, asCov)}. What is the standard deviation of the portfolio of the two assets with an expected return of ${pp(et, 2)}?`), sT,
        [wt * t.s1 + (1 - wt) * t.s2, Math.sqrt(wt * wt * t.s1 ** 2 + (1 - wt) ** 2 * t.s2 ** 2), sdOf(t, 1 - wt), sdOf(t, gmvW(t))], x => pp(x),
        { calc: cc.steps, sol: p_(`Weight in ${n1}: w = (${pp(et, 2)} − ${pp(t.m2, 1)}) / (${pp(t.m1, 1)} − ${pp(t.m2, 1)}) = ${f4(wt)}. ${covStep(t, asCov)}, so σ<sub>P</sub> = ${pp(sT)}.`) });
    }
    const w1 = t.s2 / (t.s1 + t.s2), rfImp = w1 * t.m1 + (1 - w1) * t.m2;
    const html = p_(`${base} Their returns are perfectly negatively correlated (ρ = −1).`);
    const cc = calc(), first = chance(0.5);
    const zr = `**Zero-risk weight in ${n1}:** with $\\rho = -1$, $\\sigma_P = |w\\sigma_1 - (1 - w)\\sigma_2| = 0$ gives $w = \\frac{\\sigma_2}{\\sigma_1 + \\sigma_2} = \\frac{${tn(t.s2, 2)}}{${tn(t.s1, 2)} + ${tn(t.s2, 2)}} = \\frac{${tn(t.s2, 2)}}{${tn(t.s1 + t.s2, 2)}} = ${tn(w1, 6)}$.`;
    if (first) cc.r(zr, 'ans', w1); else cc.s(zr);
    if (!first) cc.r(`**Risk-free rate:** the zero-risk portfolio earns $w\\mu_1 + (1 - w)\\mu_2 = ${tn(w1, 6)} \\times ${tn(t.m1, 4)} + ${tn(1 - w1, 6)} \\times ${tn(t.m2, 4)} = ${tn(w1 * t.m1, 6)} + ${tn(w1 === 1 ? 0 : (1 - w1) * t.m2, 6)} = ${tn(rfImp, 6)}$ for sure, so $r_f = ${tp(rfImp, 4)}$ rules out arbitrage.`, 'ans', rfImp);
    if (first) return mcNum('PS5.twoAsset', '5', html + p_(`What weight in ${n1} gives a portfolio with zero risk?`), w1,
      [t.s1 / (t.s1 + t.s2), 0.5, t.s2 * t.s2 / (t.s1 * t.s1 + t.s2 * t.s2), t.s2 / t.s1], x => fmtNum(x, 3),
      { calc: cc.steps, sol: p_(`With ρ = −1, σ<sub>P</sub> = |wσ<sub>1</sub> − (1 − w)σ<sub>2</sub>|, which is zero for w = σ<sub>2</sub>/(σ<sub>1</sub> + σ<sub>2</sub>) = ${fmtNum(t.s2)} / ${fmtNum(t.s1 + t.s2)} = ${f4(w1)}.`) });
    return mcNum('PS5.twoAsset', '5', html + p_('What must the risk-free rate be to rule out arbitrage?'), rfImp,
      [(t.m1 + t.m2) / 2, (t.s1 / (t.s1 + t.s2)) * t.m1 + (t.s2 / (t.s1 + t.s2)) * t.m2, Math.min(t.m1, t.m2), w1 * t.m1], x => pp(x),
      { calc: cc.steps, sol: p_(`The zero-risk portfolio puts w = σ<sub>2</sub>/(σ<sub>1</sub> + σ<sub>2</sub>) = ${f4(w1)} in ${n1} and earns ${f4(w1)} × ${pp(t.m1, 1)} + ${f4(1 - w1)} × ${pp(t.m2, 1)} = ${pp(rfImp)} for sure. Any other risk-free rate would allow an arbitrage.`) });
  }
}

/** Error maximisation: how much the tangency weight reacts to a small change in one estimated mean. */
export function PS5_errorMax(): Question {
  for (let k = 0; k < 2000; k++) {
    const s = rstep(0.12, 0.3, 0.01), rho = rstep(0.3, 0.9, 0.05), m2 = rstep(0.03, 0.08, 0.005), m1 = m2 + rstep(-0.01, 0.015, 0.0025), d = pick([0.005, 0.01]);
    const t: Two = { m1, m2, s1: s, s2: s, rho, c: rho * s * s }, t2 = { ...t, m1: m1 + d };
    if (tanDen(t) <= 1e-4 || tanDen(t2) <= 1e-4) continue;
    const w0 = tanW(t), w1 = tanW(t2), dw = w1 - w0;
    if (Math.abs(w0) > 3 || Math.abs(w1) > 4 || Math.abs(dw) < 0.05) continue;
    const html = p_(`Two assets both have a standard deviation of ${pp(s, 0)} and a correlation of ${fmtNum(rho)}. Their estimated expected excess returns are ${pp(m1, 2)} and ${pp(m2, 1)}. By how much does the weight of asset 1 in the tangency portfolio change if its estimated expected excess return is ${pp(d, 1)} higher (i.e. ${pp(m1 + d, 2)})?`);
    const cc = calc();
    cc.s(`**Covariance:** $\\sigma_{12} = \\rho\\sigma^2 = ${tn(rho, 2)} \\times ${tn(s, 2)}^2 = ${tn(t.c, 6)}$ (both standard deviations are ${tn(s, 2)}).`);
    cc.s(`**Weight before:** ${tanMd(t)}.`);
    cc.s(`**Weight after:** with $\\mu_1 = ${tn(m1 + d, 4)}$: ${tanMd(t2)}.`);
    cc.r(`**Change in the weight:** $${tn(w1, 6)} - ${tn(w0, 6)} = ${tn(dw, 6)}$.`, 'ans', dw);
    return mcNum('PS5.errorMax', '5', html, dw, [w1, d / m1, (w1 - w0) / w0, w0, d / (m1 + m2)], x => (x > 0 ? '+' : '') + fmtNum(x, 3),
      { calc: cc.steps, sol: p_(`Tangency weight before: ${f4(w0)}; after: ${f4(w1)}; change ${f4(dw)}. A ${pp(d, 1)} change in one estimate — well inside its estimation error — moves the weight by ${fmtNum(Math.abs(dw) * 100, 1)} percentage points. The higher the correlation, the stronger this “error maximisation” (Michaud, 1989).`), closest: true });
  }
  throw new Error('PS5_errorMax: no valid draw');
}

/** Galton correction: forecast = intercept + slope × historical estimate, from a regression of OOS values on past estimates. */
export function PS5_galton(): Question {
  const st = [
    { n: 'Covariance', a: rstep(0.0005, 0.002, 0.0005), b: rstep(0.25, 0.45, 0.01), x: rstep(0.002, 0.012, 0.0005), d: 4 },
    { n: 'Correlation', a: rstep(0.1, 0.16, 0.01), b: rstep(0.2, 0.35, 0.01), x: rstep(0.2, 0.8, 0.05), d: 3 },
    { n: 'Variance', a: rstep(0.004, 0.012, 0.001), b: rstep(0.45, 0.65, 0.01), x: rstep(0.01, 0.06, 0.005), d: 4 },
    { n: 'Mean', a: rstep(0.008, 0.012, 0.001), b: -rstep(0.05, 0.2, 0.01), x: rstep(-0.01, 0.04, 0.0025), d: 4 },
  ];
  const k = rint(0, 3), s = st[k], ans = s.a + s.b * s.x;
  const html = p_('Barroso and Saxena regress out-of-sample realised values of each optimisation input on its past historical estimate across stocks (monthly data). The estimates are:') +
    table(['', ...st.map(x => x.n)], [['Intercept', ...st.map(x => fmtNum(x.a, x.d))], ['Slope', ...st.map(x => fmtNum(x.b, 2))]]) +
    p_(`A stock’s historical ${s.n.toLowerCase()} estimate is ${fmtNum(s.x, s.d)}. What is its Galton-corrected forecast?`);
  const cc = calc();
  cc.r(`**Corrected forecast:** intercept + slope $\\times$ estimate $= ${tn(s.a, s.d)} + ${tq(s.b, 2)} \\times ${tq(s.x, s.d)} = ${tn(s.a, s.d)} + ${tq(s.b * s.x, s.d + 2)} = ${tn(ans, s.d + 2)}$.`, 'ans', ans);
  return mcNum('PS5.galton', '5', html, ans, [s.x, s.b * s.x, s.a + s.x, s.a + (1 - s.b) * s.x, s.a * s.b + s.x], x => fmtNum(x, s.d + 1),
    { calc: cc.steps, sol: p_(`Corrected forecast = intercept + slope × estimate = ${fmtNum(s.a, s.d)} + ${fmtNum(s.b, 2)} × ${par(fmtNum(s.x, s.d))} = ${fmtNum(ans, s.d + 1)}. A slope of 1 would mean history is an unbiased forecast; slopes below 1 mean strong regression to the mean. Variances have the highest slope (most predictable), means the lowest${s.b < 0 ? ', here even negative' : ''}.`), step: 0.001 });
}

const EXTRA5: ConceptMc[] = [
  { q: 'With N risky assets, what are the weights of the tangency (optimal risky) portfolio?', correct: ['w* = Σ⁻¹E(R) / (ι′Σ⁻¹E(R)): the inverse covariance matrix times expected excess returns, scaled to sum to one.'], distractors: ['w* = Σ⁻¹ι / (ι′Σ⁻¹ι), the inverse covariance matrix times a vector of ones.', 'w* = E(R) / (ι′E(R)), weights proportional to expected excess returns.', 'w* = ΣE(R) / (ι′ΣE(R)), the covariance matrix times expected excess returns.'] },
  { q: 'With N risky assets, what are the weights of the global minimum-variance portfolio, and what inputs does it need?', correct: ['w = Σ⁻¹ι / (ι′Σ⁻¹ι); it needs only the covariance matrix, no expected returns.'], distractors: ['w = Σ⁻¹E(R) / (ι′Σ⁻¹E(R)); it needs expected returns and covariances.', 'Equal weights 1/N; it needs no inputs.', 'w = E(R)/σ²; it needs only means and variances.'] },
  { q: 'A mean-variance investor maximises U = w′μ − (A/2)w′Σw. What is the solution, and what does it say about the risky portfolio?', correct: ['w_c = (1/A)Σ⁻¹μ: every investor holds the same risky (tangency) portfolio and scales it by 1/A; the rest, 1 − ι′w_c, is in the risk-free asset.'], distractors: ['w_c = AΣ⁻¹μ: more risk-averse investors hold more of the risky assets.', 'w_c = (1/A)Σμ: weights grow with the covariance of each asset.', 'Each investor holds a different risky portfolio depending on A.'] },
  { q: 'What is the separation property of mean-variance portfolio choice?', correct: ['The choice of the optimal risky portfolio is separate from the allocation between it and the risk-free asset: the first depends only on μ and Σ, the second on risk aversion.'], distractors: ['Stocks and bonds should be optimised separately.', 'Systematic and specific risk must be estimated separately.', 'The risk-free asset should be held separately from the market portfolio.'] },
  { q: 'Why does the efficient frontier become a straight line once a risk-free asset is available?', correct: ['Combining the risk-free asset with the tangency portfolio is linear in mean and standard deviation, and this CAL has the highest attainable Sharpe ratio, so it dominates the risky frontier.'], distractors: ['Because the risk-free asset has a correlation of −1 with all risky assets.', 'Because all risky assets then have the same Sharpe ratio.', 'Because investors are no longer allowed to short risky assets.'] },
  { q: 'Why are short-sale constraints or weight caps related to shrinkage?', correct: ['Capping weights limits the extreme positions the optimiser takes on noisy estimates; it is equivalent to shrinking the covariance matrix and pulls the solution towards more diversified portfolios.'], distractors: ['They raise the expected return of the optimal portfolio.', 'They make the covariance matrix exactly known.', 'They only matter if all expected returns are equal.'] },
  { q: 'How does the correlation between two assets affect the benefit of diversification?', correct: ['The lower the correlation, the further the portfolio standard deviation falls below the weighted average of the two standard deviations; with ρ = −1 a riskless portfolio exists, with ρ = 1 there is no benefit.'], distractors: ['Correlation affects expected returns, not risk.', 'Diversification works best when the correlation is +1.', 'Correlation only matters when both assets have the same variance.'] },
];

export const PS5_short = () => shortAnswerOf('PS5.short', '5', [...BANK['5'].MC, ...EXTRA5]);

const TF5 = {
  T: ['For two assets, the global minimum-variance weights do not depend on expected returns.', 'With a correlation of −1 between two risky assets, a portfolio with zero variance exists.', 'The Sharpe ratio of a complete portfolio does not depend on the fraction invested in the risky portfolio.', 'In mean-variance optimisation, a more risk-averse investor holds the same risky portfolio but less of it.'],
  F: ['The global minimum-variance portfolio has the highest Sharpe ratio of all risky portfolios.', 'With a correlation of +1, combining two risky assets reduces risk below that of the less risky asset.', 'A more risk-averse investor chooses a risky portfolio with a lower beta than a less risk-averse investor.', 'Full Markowitz optimisation with 100 assets needs fewer parameters than the single-index model.'],
};

export function PS5_trueFalse(): Question {
  const T = [...BANK['5'].T, ...TF5.T], F = [...BANK['5'].F, ...TF5.F];
  const isT = chance(0.5), s = pick(isT ? T : F);
  return { ...Q('PS5.trueFalse', '5', p_('True or false?') + '<blockquote>' + s + '</blockquote>', [{ type: 'mc', options: ['True', 'False'], correct: isT ? 0 : 1, tf: true }]), solution: p_(`The statement is ${isT ? 'true' : 'false'}.`) };
}

