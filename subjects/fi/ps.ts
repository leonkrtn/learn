// Financial Investments: questions in the format of the problem sets (PS 1–4 and 6). Calculations are multiple
// choice with five options A–E as in the problem sets, wrong options come from typical mistakes computed from the same
// inputs; exercises keep several sub-questions; short-answer questions are asked as "which answer fits best".
// Each set also has types on lecture content the problem set leaves out, in the same format.
import { C, N, P, Q, chance, co, eur, fmtNum, p_, pick, poss, rint, roundTo, rstep, shuffle, table } from '@/lib/engine/gen-helpers';
import type { ConceptMc, Part, Question } from '@/lib/engine/types';
import { BANK } from './concepts';

const pp = (x: number, d = 2) => P(x, d);
const usd = (x: number, d = 0) => (x < 0 ? '−' : '') + '$' + fmtNum(Math.abs(x), d);
const f3 = (x: number) => fmtNum(x, 3);
const money = (x: number) => (x < 0 ? '−' : '') + '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** A number for use inside a formula, in parentheses when negative. */
const par = (s: string) => s.startsWith('−') ? '(' + s + ')' : s;
const NOTE_PCT = 'Enter returns in percent, e.g. 8.33 for 8.33%.';
const NONE = 'None of the others';
const NONE_ABOVE = 'None of the above';
const CANNOT = 'It cannot be determined';
const FUNDS = ['Atlas', 'Borealis', 'Cedar', 'Delta', 'Ember', 'Fjord', 'Granite', 'Helix', 'Ionic', 'Juniper', 'Kite', 'Lumen', 'Meridian', 'Nimbus', 'Onyx', 'Polaris'];
const fund = (s: string) => pick(FUNDS) + ' ' + s;

// ---------------------------------------------------------------------
// Multiple-choice builders
// ---------------------------------------------------------------------

type Vec = number[];
type McOpt = {
  /** Worked solution shown after checking. */
  sol: string;
  /** Allow the "Choose the closest number" variant of PS 3, in which the exact value may be missing. */
  closest?: boolean;
  /** Text of option E; "None of the others" can itself be the right answer. */
  last?: string;
  /** Additive step for filler options when the answer is zero. */
  step?: number;
};

const gap = (a: Vec, b: Vec) => Math.max(...a.map((x, i) => Math.abs(x - b[i]) / Math.max(Math.abs(x), Math.abs(b[i]), 1e-12)));
const finite = (v: Vec) => v.every(Number.isFinite);

function mcVec(fam: string, topic: string, html: string, ans: Vec, wrongs: Vec[], fmt: (v: Vec) => string, o: McOpt): Question {
  const far = (a: Vec, b: Vec) => gap(a, b) > 0.05 && fmt(a) !== fmt(b);
  const pool: Vec[] = [];
  const add = (w: Vec) => { if (finite(w) && far(w, ans) && pool.every(p => far(p, w))) pool.push(w); };
  shuffle(wrongs).forEach(add);
  for (const f of shuffle([0.5, 0.75, 1.25, 1.5, 2, -1, 0.6, 1.8, 3, 0.4])) {
    if (pool.length >= 6) break;
    add(ans.map(x => Math.abs(x) < 1e-9 ? Math.abs(f) * (o.step ?? 0.01) : x * f));
  }
  for (let k = 1; pool.length < 4 && k < 60; k++) add(ans.map(x => x + k * (o.step ?? (Math.abs(x) * 0.3 || 0.01))));

  const scalar = ans.length === 1;
  if (o.closest && scalar && chance(0.35)) {
    const a = ans[0];
    const listed = chance(0.5);
    const shown = listed ? a : a * (1 + pick([-1, 1]) * rstep(0.08, 0.16, 0.01));
    const d0 = Math.abs(shown - a);
    const opts = pool.filter(p => Math.abs(p[0] - a) > Math.max(2.5 * d0, 0.08 * Math.abs(a)) && far(p, [shown])).slice(0, 4);
    if (opts.length === 4) {
      const all = shuffle([[shown], ...opts]);
      const note = listed ? '' : ` The exact value, ${fmt(ans)}, is not listed; the closest option is ${fmt([shown])}.`;
      return {
        ...Q(fam, topic, html + p_('(Choose the closest number.)'), [{ type: 'mc', options: all.map(fmt), correct: all.findIndex(x => x[0] === shown) }]),
        solution: o.sol + p_(`<b>Answer:</b> ${fmt(ans)}.${note}`),
      };
    }
  }
  const last = o.last ?? NONE;
  const noneRight = last === NONE && chance(0.15);
  const nums = shuffle(noneRight ? pool.slice(0, 4) : [ans, ...pool.slice(0, 3)]);
  const options = [...nums.map(fmt), last];
  const correct = noneRight ? 4 : nums.indexOf(ans);
  const tail = noneRight ? ` It is not among A–D, so the answer is “${NONE}”.` : '';
  return { ...Q(fam, topic, html, [{ type: 'mc', options, correct }]), solution: o.sol + p_(`<b>Answer:</b> ${fmt(ans)}.${tail}`) };
}

const mcNum = (fam: string, topic: string, html: string, ans: number, wrongs: number[], fmt: (x: number) => string, o: McOpt) =>
  mcVec(fam, topic, html, [ans], wrongs.map(w => [w]), v => fmt(v[0]), o);

/** A–E with text options: the right one, three or four wrong ones and, if asked, "None of the above" as option E. */
function mcText(fam: string, topic: string, html: string, right: string, wrong: string[], sol: string, none = true): Question {
  const w = shuffle([...new Set(wrong.filter(x => x !== right))]);
  const noneRight = none && w.length >= 4 && chance(0.12);
  const listed = shuffle(noneRight ? w.slice(0, 4) : [right, ...w.slice(0, none ? 3 : 4)]);
  const options = none ? [...listed, NONE_ABOVE] : listed;
  const correct = noneRight ? options.length - 1 : listed.indexOf(right);
  const tail = noneRight ? p_(`None of A–D is right, so the answer is “${NONE_ABOVE}”. A correct statement would be: ${right}`) : '';
  return { ...Q(fam, topic, html, [{ type: 'mc', options, correct }]), solution: sol + tail };
}

/** Short-answer question as multiple choice, from the lecture's concept bank plus problem-set questions. */
function shortAnswer(fam: string, topic: string): Question {
  const items: ConceptMc[] = [...BANK[topic].MC, ...(EXTRA[topic] || [])];
  const it = pick(items);
  const right = pick(it.correct);
  const borrowed = pick(items.filter(x => x !== it).flatMap(x => x.correct));
  return mcText(fam, topic, p_(it.q) + p_('Which answer fits best?'), right, [...it.distractors, borrowed], p_(right));
}

const sx = (x: number) => (x < 0 ? '− ' : '+ ') + f3(Math.abs(x));
/** Value at t+1 in $ million as a + b·rₘ + c·e. */
function expr(a: number, b: number, c: number): string {
  let s = a ? f3(a) : '';
  if (b) s += s ? ' ' + sx(b) + '·rₘ' : (b < 0 ? '−' : '') + f3(Math.abs(b)) + '·rₘ';
  if (c) s += ' ' + sx(c) + '·e';
  return s || '0';
}

// =====================================================================
// PS 1 — CAPM
// =====================================================================

export function PS1_corrPrice(): Question {
  const name = co(), P0 = rstep(20, 150, 0.5), rf = rstep(0.02, 0.06, 0.0025), mrp = rstep(0.04, 0.08, 0.0025);
  const er = rstep(rf + 0.03, rf + 0.1, 0.0025), k = pick([2, 2, 0.5, 1.5]);
  const b0 = (er - rf) / mrp, er1 = rf + k * b0 * mrp, D = er * P0, P1 = D / er1;
  const word = k === 2 ? 'doubles' : k === 0.5 ? 'halves' : 'rises by 50%';
  const html = p_(`The market price of ${poss(name)} shares is ${money(P0)}. Its expected rate of return is ${pp(er)}. The risk-free rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}. What will be the market price of the share if its correlation coefficient with the market portfolio ${word} (all other variables unchanged)? Assume the stock pays a constant dividend in perpetuity.`);
  const sol = p_(`As a perpetuity, E[r] = D/P<sub>0</sub>, so D = ${pp(er)} × ${money(P0)} = ${money(D)}. From the SML, β = (${pp(er)} − ${pp(rf)}) / ${pp(mrp)} = ${fmtNum(b0, 4)}. Beta is linear in the correlation (β = ρσ<sub>i</sub>/σ<sub>M</sub>), so it becomes ${fmtNum(k * b0, 4)} and E[r] = ${pp(rf)} + ${fmtNum(k * b0, 4)} × ${pp(mrp)} = ${pp(er1)}. The new price is ${money(D)} / ${pp(er1)} = ${money(P1)}.`);
  return mcNum('PS1.corrPrice', '1', html, P1, [P0, D / (k * er), P0 / k, D / (er + (k - 1) * mrp), D / (rf + k * b0 * (rf + mrp)), P0 * k], money, { sol });
}

export function PS1_fair(): Question {
  const name = co(), rf = rstep(0.02, 0.07, 0.0025), mrp = rstep(0.04, 0.09, 0.0025), beta = rstep(0.4, 2, 0.05), sd = rstep(0.12, 0.4, 0.01);
  const fair = rf + beta * mrp;
  let fc = roundTo(fair + rstep(-0.05, 0.05, 0.0025), 0.0025);
  if (Math.abs(fc - fair) < 0.003) fc = roundTo(fair + 0.0125, 0.0025);
  const html = p_(`${name} has a forecasted return of ${pp(fc)}, a standard deviation of ${pp(sd, 0)} and a beta of ${fmtNum(beta)}. The T-bill rate is ${pp(rf)} and the market risk premium is ${pp(mrp)}.`);
  const sol0 = p_(`The CAPM gives the fair (required) return from beta alone: ${pp(rf)} + ${fmtNum(beta)} × ${pp(mrp)} = ${pp(fair)}. The standard deviation does not matter, because only systematic risk is priced.`);
  if (chance(0.55)) {
    return mcNum('PS1.fair', '1', html + p_(`What is the fair equity return for ${name} according to the CAPM?`), fair,
      [fc, rf + beta * (mrp - rf), beta * mrp, rf + mrp, rf + beta * (rf + mrp), rf + sd / 0.2 * mrp], x => pp(x), { sol: sol0 });
  }
  const sol = sol0 + p_(`Alpha is the forecast minus the fair return: ${pp(fc)} − ${pp(fair)} = ${pp(fc - fair)}. ${fc > fair ? 'A positive alpha means the stock lies above the SML: it is underpriced.' : 'A negative alpha means the stock lies below the SML: it is overpriced.'}`);
  return mcNum('PS1.fair', '1', html + p_('What is the alpha of the stock?'), fc - fair,
    [fair - fc, fc - rf - mrp, fc - beta * mrp, fc - rf, fc - rf - beta * (mrp - rf)], x => pp(x), { sol, step: 0.005 });
}

export function PS1_impliedBeta(): Question {
  let rf: number, mrp: number, er: number;
  do { rf = rstep(0.02, 0.08, 0.0025); mrp = rstep(0.04, 0.08, 0.0025); er = rstep(rf - 0.03, rf + 0.12, 0.0025); } while (Math.abs(er - rf) < 0.004);
  const b = (er - rf) / mrp;
  const html = p_(`In a CAPM world, the risk-free rate is ${pp(rf)}, the market risk premium is ${pp(mrp)} and a stock has an expected return of ${pp(er)}. Find its beta.`);
  const sol = p_(`Solve the SML for beta: ${pp(er)} = ${pp(rf)} + β × ${pp(mrp)}, so β = (${pp(er)} − ${pp(rf)}) / ${pp(mrp)} = ${fmtNum(b, 4)}.`) +
    (b < 0 ? p_('A negative beta is possible: the stock covaries negatively with the market, insures the rest of the portfolio and so earns less than the risk-free rate.') : '');
  return mcNum('PS1.impliedBeta', '1', html, b, [-b, er / mrp, (er - rf) / (rf + mrp), mrp / (er - rf), er / (rf + mrp)], x => fmtNum(x, 3), { sol, step: 0.1 });
}

export function PS1_zeroBeta(): Question {
  const ez = rstep(0.02, 0.08, 0.005), em = ez + rstep(0.04, 0.1, 0.005);
  let b = rstep(0.2, 1.8, 0.05); if (Math.abs(b - 1) < 0.01) b = 1.15;
  const country = pick(['Trazastan', 'Borovia', 'Kaldonia', 'Ostrava Minor', 'Veltria']);
  const ans = ez + b * (em - ez);
  const html = p_(`Borrowing is not allowed for investors in the financial markets of ${country}, so the zero-beta version of the CAPM holds. The expected return of the stock market is ${pp(em, 1)} and that of its zero-beta companion portfolio is ${pp(ez, 1)}. What should be the expected return of a stock with a beta of ${fmtNum(b)}?`);
  const sol = p_(`The zero-beta portfolio takes the place of the risk-free rate: E[r] = E[r<sub>Z</sub>] + β(E[r<sub>M</sub>] − E[r<sub>Z</sub>]) = ${pp(ez, 1)} + ${fmtNum(b)} × (${pp(em, 1)} − ${pp(ez, 1)}) = ${pp(ans)}.`);
  return mcNum('PS1.zeroBeta', '1', html, ans, [b * em, ez + b * em, b * (em - ez), ez * (1 + b), em + b * (em - ez)], x => pp(x), { sol });
}

export function PS1_project(): Question {
  const A = co(), B = co(), rf = rstep(0.02, 0.06, 0.005), mrp = rstep(0.04, 0.08, 0.005);
  const bCo = rstep(1.3, 2.4, 0.05), bProj = rstep(0.3, 0.9, 0.05), ans = rf + bProj * mrp;
  const html = p_(`An economy has a risk-free rate of ${pp(rf, 1)} and a market risk premium of ${pp(mrp, 1)}. ${B} has a beta of ${fmtNum(bProj)} and ${A} one of ${fmtNum(bCo)}. ${A} decides to invest in a project in ${poss(B)} line of business, and its management estimates that the project has the same beta as ${B}. What cost of equity should be used for the project?`);
  const sol = p_(`The discount rate belongs to the project, not to the company that undertakes it: ${pp(rf, 1)} + ${fmtNum(bProj)} × ${pp(mrp, 1)} = ${pp(ans)}. Using ${poss(A)} own beta (${pp(rf + bCo * mrp)}) would reject good low-risk projects.`);
  return mcNum('PS1.project', '1', html, ans, [rf + bCo * mrp, rf + (bCo + bProj) / 2 * mrp, bProj * mrp, rf + bProj * (rf + mrp), rf + bCo * bProj * mrp], x => pp(x), { sol });
}

export function PS1_scenario(): Question {
  for (let t = 0; t < 500; t++) {
    const A = co(), B = co(), p = chance(0.7) ? 0.5 : pick([0.4, 0.6]);
    const m1 = rstep(-0.04, 0.04, 0.01), m2 = m1 + rstep(0.12, 0.3, 0.01);
    const rf = rstep(0.01, 0.08, 0.005), kA = rstep(1.3, 2.4, 0.05), kB = rstep(0.2, 0.8, 0.05);
    // Scenario returns close to the SML, so alphas stay in a realistic range.
    const a1 = roundTo(rf + kA * (m1 - rf) + rstep(-0.04, 0.04, 0.01), 0.01), a2 = roundTo(a1 + kA * (m2 - m1), 0.01);
    const b1 = roundTo(rf + kB * (m1 - rf) + rstep(-0.04, 0.04, 0.01), 0.01), b2 = roundTo(b1 + kB * (m2 - m1), 0.01);
    const bA = (a2 - a1) / (m2 - m1), bB = (b2 - b1) / (m2 - m1);
    const eM = p * m1 + (1 - p) * m2, eA = p * a1 + (1 - p) * a2, eB = p * b1 + (1 - p) * b2;
    if (eM - rf < 0.02) continue;
    const alA = eA - rf - bA * (eM - rf), alB = eB - rf - bB * (eM - rf);
    if (Math.abs(alA) < 0.002 || Math.abs(alB) < 0.002) continue;
    const pr = p === 0.5 ? 'a 50-50 probability of occurring' : `probabilities of ${P(p, 0)} and ${P(1 - p, 0)}`;
    const html = p_(`A security analyst produces the following return forecasts for two market scenarios with ${pr}. The risk-free rate is ${pp(rf, 1)}. ${NOTE_PCT}`) +
      table(['Scenario', 'r<sub>M</sub>', A, B], [['1', pp(m1, 0), pp(a1, 0), pp(b1, 0)], ['2', pp(m2, 0), pp(a2, 0), pp(b2, 0)]]);
    const parts: Part[] = [
      N(`What is the beta of ${A}?`, bA, 'n'), N(`… and of ${B}?`, bB, 'n'),
      N(`What is the expected return of ${A}?`, eA * 100, 'pct'), N(`… and of ${B}?`, eB * 100, 'pct'),
      N('The SML is E[r] = r<sub>f</sub> + slope × β. What is the slope?', (eM - rf) * 100, 'pct'),
      N(`What is the alpha of ${A}?`, alA * 100, 'pct'), N(`… and of ${B}?`, alB * 100, 'pct'),
      C(`${A} is`, ['Underpriced', 'Overpriced'], alA > 0 ? 0 : 1),
    ];
    const sol = p_(`With two scenarios, beta is the slope of the characteristic line: β = Δr<sub>i</sub>/Δr<sub>M</sub>. ${A}: (${pp(a2, 0)} − ${par(pp(a1, 0))}) / (${pp(m2, 0)} − ${par(pp(m1, 0))}) = ${fmtNum(bA, 4)}; ${B}: ${fmtNum(bB, 4)}.`) +
      p_(`Expected returns weight the scenarios by probability: E[r<sub>M</sub>] = ${pp(eM)}, E[r<sub>${A.split(' ')[0]}</sub>] = ${pp(eA)}, E[r<sub>${B.split(' ')[0]}</sub>] = ${pp(eB)}. The SML is E[r] = ${pp(rf, 1)} + ${pp(eM - rf)} × β.`) +
      p_(`Alphas are the distance to the SML: ${A}: ${pp(eA)} − (${pp(rf, 1)} + ${fmtNum(bA, 3)} × ${pp(eM - rf)}) = ${pp(alA)}; ${B}: ${pp(alB)}. A positive alpha means underpriced.`);
    return { ...Q('PS1.scenario', '1', html, parts), solution: sol };
  }
  throw new Error('PS1_scenario: no valid draw');
}

const EQ_REASONS = {
  orderOk: 'Possible: the portfolio with the higher beta also has the higher expected return.',
  orderBad: 'Not possible: the portfolio with the higher beta should have the higher expected return.',
  sigma: 'Possible: a higher standard deviation does not imply a higher beta.',
  aboveCml: 'Not possible: A has a higher Sharpe ratio than the market, so it would lie above the CML.',
  belowCml: 'Possible: A has a lower Sharpe ratio than the market, so it lies below the CML.',
  alpha: 'Not possible: A has a non-zero alpha, while in a CAPM equilibrium every alpha is zero.',
  onSml: 'Possible: A lies exactly on the SML.',
  sigmaBad: 'Not possible: the portfolio with the higher standard deviation must have the higher expected return.',
};

export function PS1_equilibrium(): Question {
  const rf = rstep(0.02, 0.1, 0.01), em = rf + rstep(0.04, 0.1, 0.01), sM = rstep(0.15, 0.3, 0.01);
  const kind = rint(0, 3);
  type R = keyof typeof EQ_REASONS;
  let html: string, right: R, why: string, others: R[];
  if (kind === 0) {
    const bA = rstep(0.8, 1.8, 0.1), bB = +(bA + pick([-1, 1]) * rstep(0.1, 0.5, 0.1)).toFixed(2);
    const eA = rstep(0.08, 0.25, 0.01), eB = +(eA + pick([-1, 1]) * rstep(0.01, 0.06, 0.01)).toFixed(4);
    const ok = (bA - bB) * (eA - eB) > 0;
    html = table(['Portfolio', 'E[r]', 'β'], [['A', pp(eA, 0), fmtNum(bA)], ['B', pp(eB, 0), fmtNum(bB)]]);
    right = ok ? 'orderOk' : 'orderBad';
    others = [ok ? 'orderBad' : 'orderOk', 'alpha', 'aboveCml', 'sigmaBad'];
    why = ok ? 'Expected returns rise with beta, as the SML requires.' : 'On the SML, expected return rises with beta, so the higher-beta portfolio cannot offer less.';
  } else if (kind === 1) {
    const sA = rstep(0.15, 0.3, 0.01), sB = sA + rstep(0.05, 0.15, 0.01), eA = rstep(0.15, 0.35, 0.01), eB = eA - rstep(0.02, 0.1, 0.01);
    html = table(['Portfolio', 'E[r]', 'σ'], [['A', pp(eA, 0), pp(sA, 0)], ['B', pp(eB, 0), pp(sB, 0)]]);
    right = 'sigma';
    others = ['sigmaBad', 'orderBad', 'aboveCml', 'alpha'];
    why = 'Only beta is priced. B can have more specific risk and still a lower beta than A.';
  } else if (kind === 2) {
    const sA = rstep(0.08, 0.35, 0.01), above = chance(0.5);
    const eA = roundTo(rf + (em - rf) / sM * sA * (above ? rstep(1.1, 1.5, 0.05) : rstep(0.4, 0.9, 0.05)), 0.0025);
    const srA = (eA - rf) / sA, srM = (em - rf) / sM;
    html = table(['Portfolio', 'E[r]', 'σ'], [['Risk-free', pp(rf, 0), '0%'], ['Market', pp(em, 0), pp(sM, 0)], ['A', pp(eA, 2), pp(sA, 0)]]);
    right = srA > srM ? 'aboveCml' : 'belowCml';
    others = [srA > srM ? 'belowCml' : 'aboveCml', 'alpha', 'orderBad', 'onSml'];
    why = `Sharpe ratio of A: (${pp(eA)} − ${pp(rf, 0)}) / ${pp(sA, 0)} = ${fmtNum(srA, 3)}; of the market: ${fmtNum(srM, 3)}. No portfolio can beat the market’s Sharpe ratio in a CAPM world.`;
  } else {
    const bA = rstep(0.3, 1.8, 0.1), onLine = chance(0.4);
    const eA = onLine ? rf + bA * (em - rf) : roundTo(rf + bA * (em - rf) + pick([-1, 1]) * rstep(0.005, 0.04, 0.0025), 0.0025);
    const al = eA - rf - bA * (em - rf);
    html = table(['Portfolio', 'E[r]', 'β'], [['Risk-free', pp(rf, 0), '0'], ['Market', pp(em, 0), '1'], ['A', pp(eA, 2), fmtNum(bA)]]);
    right = Math.abs(al) < 1e-9 ? 'onSml' : 'alpha';
    others = [right === 'alpha' ? 'onSml' : 'alpha', 'aboveCml', 'belowCml', 'sigma'];
    why = `α<sub>A</sub> = ${pp(eA)} − (${pp(rf, 0)} + ${fmtNum(bA)} × (${pp(em, 0)} − ${pp(rf, 0)})) = ${pp(al)}.`;
  }
  return mcText('PS1.equilibrium', '1', p_('If the CAPM equilibrium holds, could the following situation occur?') + html, EQ_REASONS[right], others.map(k => EQ_REASONS[k]), p_(why), false);
}

export function PS1_mimic(): Question {
  const etf = fund('ETF'), rf = rstep(0.01, 0.07, 0.005), mrp = rstep(0.03, 0.08, 0.005), b = rstep(0.4, 1.6, 0.02);
  let al = rstep(-0.03, 0.04, 0.0025); if (Math.abs(al) < 0.003) al = 0.0125;
  const er = rf + b * mrp + al, mim = b * (rf + mrp) + (1 - b) * rf;
  const html = p_(`The ${etf} has an expected return of ${pp(er)} and a beta of ${fmtNum(b)}. The stock market has a risk premium of ${pp(mrp, 1)} and the risk-free rate is ${pp(rf, 1)}. ${NOTE_PCT} Enter weights as decimals.`);
  const parts: Part[] = [
    N('What is the alpha of the ETF?', al * 100, 'pct'),
    N('A mimicking portfolio holds only the market and T-bills, with the same systematic risk as the ETF. What weight does it put in the market?', b, 'n'),
    N('… and in T-bills?', 1 - b, 'n'),
    N('What is the expected return of the mimicking portfolio?', mim * 100, 'pct'),
    C('The ETF’s expected return minus that of the mimicking portfolio', ['equals the ETF’s alpha', 'equals the market risk premium', 'is zero by construction'], 0),
  ];
  const sol = p_(`α = ${pp(er)} − (${pp(rf, 1)} + ${fmtNum(b)} × ${pp(mrp, 1)}) = ${pp(al)}. The mimicking portfolio needs the same beta, so it holds ${fmtNum(b)} in the market and ${fmtNum(1 - b)} in T-bills; its expected return is ${fmtNum(b)} × ${pp(rf + mrp, 1)} + ${fmtNum(1 - b)} × ${pp(rf, 1)} = ${pp(mim)}. The difference, ${pp(er - mim)}, is exactly the alpha: alpha is the expected return of going long the fund and short its passive twin.`);
  return { ...Q('PS1.mimic', '1', html, parts), solution: sol };
}

export function PS1_cml(): Question {
  const rf = rstep(0.01, 0.06, 0.005), mrp = rstep(0.04, 0.09, 0.005), sM = rstep(0.14, 0.25, 0.01), srM = mrp / sM;
  const base = `In a CAPM world the risk-free rate is ${pp(rf, 1)}, the market risk premium is ${pp(mrp, 1)} and the market’s standard deviation is ${pp(sM, 0)}.`;
  const v = rint(0, 3);
  if (v === 0) {
    const er = rf + rstep(0.02, 0.12, 0.005), b = (er - rf) / mrp;
    const sol = p_(`A well-diversified portfolio has no specific risk, so σ = βσ<sub>M</sub>. Its beta follows from the SML: β = (${pp(er, 1)} − ${pp(rf, 1)}) / ${pp(mrp, 1)} = ${fmtNum(b, 4)}, so σ = ${fmtNum(b, 4)} × ${pp(sM, 0)} = ${pp(b * sM)}.`);
    return mcNum('PS1.cml', '1', p_(`${base} A well-diversified portfolio has an expected return of ${pp(er, 1)}. What is its standard deviation?`), b * sM,
      [sM, sM * er / (rf + mrp), sM * er / mrp, sM * (er - rf) / (rf + mrp)], x => pp(x), { sol });
  }
  if (v === 1) {
    const rho = rstep(0.1, 0.9, 0.05), name = co();
    const sol = p_(`The best CAL built from one asset and T-bills has slope ρ × SR<sub>M</sub>: the asset’s Sharpe ratio in equilibrium is ρ<sub>iM</sub>(E[r<sub>M</sub>] − r<sub>f</sub>)/σ<sub>M</sub> = ${fmtNum(rho)} × ${fmtNum(srM, 4)} = ${fmtNum(rho * srM, 4)}.`);
    return mcNum('PS1.cml', '1', p_(`${base} ${name} has a correlation of ${fmtNum(rho)} with the market. What is the slope of the CAL spanned by ${name} and T-bills?`), rho * srM,
      [srM, srM / rho, rho * mrp, rho * (rf + mrp) / sM, rho * rho * srM], x => fmtNum(x, 3), { sol, closest: true });
  }
  if (v === 2) {
    const A = mrp / (sM * sM);
    const sol = p_(`The representative investor holds the market, so E[r<sub>M</sub>] − r<sub>f</sub> = Āσ²<sub>M</sub> and Ā = ${pp(mrp, 1)} / ${pp(sM, 0)}² = ${fmtNum(A, 3)}.`);
    return mcNum('PS1.cml', '1', p_(`${base} What average coefficient of risk aversion is consistent with these values?`), A,
      [mrp / sM, (rf + mrp) / (sM * sM), 2 * A, A / 2, mrp / (sM * sM * sM)], x => fmtNum(x, 2), { sol, closest: true });
  }
  const s = roundTo(sM * rstep(0.4, 1.5, 0.05), 0.005), ans = rf + srM * s;
  const sol = p_(`Efficient portfolios lie on the CML: E[r] = r<sub>f</sub> + (E[r<sub>M</sub>] − r<sub>f</sub>)/σ<sub>M</sub> × σ = ${pp(rf, 1)} + ${fmtNum(srM, 4)} × ${pp(s, 1)} = ${pp(ans)}.`);
  return mcNum('PS1.cml', '1', p_(`${base} What expected return does an efficient portfolio with a standard deviation of ${pp(s, 1)} offer?`), ans,
    [(rf + mrp) * s / sM, rf + mrp, mrp * s / sM, rf + mrp * (s / sM) ** 2], x => pp(x), { sol });
}

export function PS1_sim(): Question {
  const A = co(), B = co(), sM = rstep(0.12, 0.25, 0.01), bA = rstep(0.4, 2, 0.05), bB = rstep(0.4, 1.8, 0.05);
  const eA = rstep(0.05, 0.3, 0.01), eB = rstep(0.05, 0.3, 0.01);
  const sA = Math.sqrt(bA * bA * sM * sM + eA * eA), sB = Math.sqrt(bB * bB * sM * sM + eB * eB), cov = bA * bB * sM * sM;
  const html = p_(`The single-index model holds. The market has a standard deviation of ${pp(sM, 0)}. ${A} has a beta of ${fmtNum(bA)} and a total standard deviation of ${pp(sA, 2)}; ${B} has a beta of ${fmtNum(bB)} and a total standard deviation of ${pp(sB, 2)}.`);
  const v = rint(0, 2);
  if (v === 0) {
    const sol = p_(`In the single-index model residuals are uncorrelated, so only the common market factor creates covariance: cov = β<sub>A</sub>β<sub>B</sub>σ²<sub>M</sub> = ${fmtNum(bA)} × ${fmtNum(bB)} × ${fmtNum(sM)}² = ${fmtNum(cov, 5)}.`);
    return mcNum('PS1.sim', '1', html + p_('What is the covariance between the returns of the two stocks?'), cov,
      [bA * bB * sM, (bA + bB) / 2 * sM * sM, cov + eA * eB, bA * sM * sM, sA * sB], x => fmtNum(x, 4), { sol });
  }
  if (v === 1) {
    const sol = p_(`σ²<sub>i</sub> = β²<sub>i</sub>σ²<sub>M</sub> + σ²(e<sub>i</sub>), so σ(e<sub>A</sub>) = √(${fmtNum(sA, 4)}² − ${fmtNum(bA)}² × ${fmtNum(sM)}²) = ${pp(eA)}.`);
    return mcNum('PS1.sim', '1', html + p_(`What is the standard deviation of the residuals of ${A}?`), eA,
      [sA - bA * sM, Math.sqrt(sA * sA + bA * bA * sM * sM), Math.sqrt(Math.max(0, sA * sA - bA * sM * sM)), sA * Math.sqrt(1 - bA * bA * sM * sM / (sA * sA)) * 1.5, sA], x => pp(x), { sol });
  }
  const rho = cov / (sA * sB);
  const sol = p_(`ρ = cov/(σ<sub>A</sub>σ<sub>B</sub>) = β<sub>A</sub>β<sub>B</sub>σ²<sub>M</sub> / (σ<sub>A</sub>σ<sub>B</sub>) = ${fmtNum(cov, 5)} / (${fmtNum(sA, 4)} × ${fmtNum(sB, 4)}) = ${fmtNum(rho, 4)}.`);
  return mcNum('PS1.sim', '1', html + p_('What correlation between the two stocks does the single-index model imply?'), rho,
    [bA * bB, cov, bA * bB * sM / (sA * sB), Math.min(0.99, rho * 1.6), (bA * sM / sA) * (bB * sM / sB) ** 2], x => fmtNum(x, 3), { sol, closest: true });
}

export function PS1_liquidity(): Question {
  const name = co(), rf = rstep(0.01, 0.05, 0.005), mrp = rstep(0.04, 0.08, 0.005), b = rstep(0.5, 1.6, 0.05), il = rstep(0.005, 0.03, 0.0025);
  const ans = rf + b * mrp + il;
  const html = p_(`${name} is a thinly traded stock with a beta of ${fmtNum(b)}. Investors require an illiquidity premium of ${pp(il)} to hold it. The risk-free rate is ${pp(rf, 1)} and the market risk premium is ${pp(mrp, 1)}. What expected return does the liquidity-adjusted CAPM give for the stock?`);
  const sol = p_(`The liquidity-adjusted CAPM adds the asset’s illiquidity premium to the SML: E[r] = r<sub>f</sub> + βE[R<sub>M</sub>] + IL = ${pp(rf, 1)} + ${fmtNum(b)} × ${pp(mrp, 1)} + ${pp(il)} = ${pp(ans)}.`);
  return mcNum('PS1.liquidity', '1', html, ans, [rf + b * mrp, rf + b * mrp - il, rf + b * (mrp + il), rf + b * mrp + b * il, b * mrp + il], x => pp(x), { sol });
}

export const PS1_concept = () => shortAnswer('PS1.short', '1');

// =====================================================================
// PS 2 — APT
// =====================================================================

const FACTORS: [string, string][] = [['GDP growth', 'GDP'], ['long-term bond yields', 'LTY'], ['inflation', 'INF'], ['industrial production', 'IP'], ['oil prices', 'OIL']];

export function PS2_surprise(): Question {
  const name = co(), f = shuffle(FACTORS).slice(0, 2);
  const exp = [rstep(0.01, 0.04, 0.0025), rstep(0.02, 0.05, 0.0025)], real = exp.map(e => +(e + rstep(-0.02, 0.02, 0.0025)).toFixed(4));
  if (real.some((r, i) => Math.abs(r - exp[i]) < 0.002)) return PS2_surprise();
  const be = [rstep(-1, 2, 0.05), rstep(-3.5, 1.5, 0.25)], er = rstep(0.04, 0.12, 0.0025), s = real.map((r, i) => r - exp[i]);
  const ans = er + be[0] * s[0] + be[1] * s[1];
  const html = p_(`An economy has two factors driving equity returns: ${f[0][0]} (${f[0][1]}) and ${f[1][0]} (${f[1][1]}). Expected ${f[0][1]} is ${pp(exp[0])} and expected ${f[1][1]} is ${pp(exp[1])}. A stock in ${name} has an expected return of ${pp(er)}, a beta on ${f[0][1]} of ${fmtNum(be[0])} and a beta on ${f[1][1]} of ${fmtNum(be[1])}. What is your expected return for the stock in a year in which ${f[0][1]} turns out at ${pp(real[0])} and ${f[1][1]} at ${pp(real[1])}?`);
  const sol = p_(`Only surprises move returns away from their expectation. Surprises: ${f[0][1]} ${pp(real[0])} − ${pp(exp[0])} = ${pp(s[0])}, ${f[1][1]} ${pp(real[1])} − ${pp(exp[1])} = ${pp(s[1])}. E[r | F] = ${pp(er)} + ${fmtNum(be[0])} × ${pp(s[0])} + (${fmtNum(be[1])}) × ${pp(s[1])} = ${pp(ans)}.`);
  return mcNum('PS2.surprise', '2', html, ans,
    [er + be[0] * real[0] + be[1] * real[1], er - be[0] * s[0] - be[1] * s[1], be[0] * s[0] + be[1] * s[1], er + be[0] * s[0], er + be[0] * s[0] - be[1] * s[1]], x => pp(x), { sol });
}

export function PS2_twoFactor(): Question {
  for (let t = 0; t < 500; t++) {
    const rf = rstep(0.01, 0.05, 0.005), rp1 = rstep(0.01, 0.07, 0.0025), rp2 = rstep(-0.02, 0.05, 0.0025);
    const b = [[rstep(0.3, 2.2, 0.05), rstep(-1, 1.5, 0.05)], [rstep(0.3, 2.2, 0.05), rstep(-1, 1.5, 0.05)]];
    const det = b[0][0] * b[1][1] - b[0][1] * b[1][0];
    if (Math.abs(det) < 0.5) continue;
    const e = b.map(x => roundTo(rf + x[0] * rp1 + x[1] * rp2, 0.0001)), y = e.map(x => x - rf);
    const s1 = (y[0] * b[1][1] - y[1] * b[0][1]) / det, s2 = (b[0][0] * y[1] - b[1][0] * y[0]) / det;
    if (Math.abs(s1 - s2) < 0.004 || Math.abs(s2) < 0.002) continue;
    const nb = [rstep(0, 1.5, 0.05), rstep(-0.5, 1.5, 0.05)];
    const [nA, nB] = pick([['SMB', 'HML'], ['X', 'Y'], ['Value', 'Growth'], ['P1', 'P2']]);
    const html = p_(`In an economy, asset returns are driven by two unknown factors, F<sub>1</sub> and F<sub>2</sub>. The risk-free rate is ${pp(rf, 1)}. Consider two well-diversified portfolios, ${nA} and ${nB}. ${NOTE_PCT}`) +
      table(['Portfolio', 'β<sub>F1</sub>', 'β<sub>F2</sub>', 'Expected return'], [[nA, fmtNum(b[0][0]), fmtNum(b[0][1]), pp(e[0])], [nB, fmtNum(b[1][0]), fmtNum(b[1][1]), pp(e[1])]]);
    const sml = (a: number, x: number, z: number) => `E[r] = ${pp(a, 2)} ${x < 0 ? '−' : '+'} ${pp(Math.abs(x), 2)}·β₁ ${z < 0 ? '−' : '+'} ${pp(Math.abs(z), 2)}·β₂`;
    const opts = shuffle([sml(rf, s1, s2), sml(rf, s2, s1), sml(0, s1, s2), sml(rf, s1 + rf, s2 + rf)]);
    const parts: Part[] = [
      N('What is the risk premium of factor F<sub>1</sub>?', s1 * 100, 'pct'),
      N('… and of factor F<sub>2</sub>?', s2 * 100, 'pct'),
      C('Which expression is the expected return-beta relationship (the SML)?', opts, opts.indexOf(sml(rf, s1, s2))),
      N(`What expected return should a well-diversified portfolio with β<sub>F1</sub> = ${fmtNum(nb[0])} and β<sub>F2</sub> = ${fmtNum(nb[1])} have?`, (rf + nb[0] * s1 + nb[1] * s2) * 100, 'pct'),
    ];
    const sol = p_(`No arbitrage puts both portfolios on the SML: ${pp(e[0])} = ${pp(rf, 1)} + ${fmtNum(b[0][0])}RP<sub>1</sub> ${b[0][1] < 0 ? '−' : '+'} ${fmtNum(Math.abs(b[0][1]))}RP<sub>2</sub> and ${pp(e[1])} = ${pp(rf, 1)} + ${fmtNum(b[1][0])}RP<sub>1</sub> ${b[1][1] < 0 ? '−' : '+'} ${fmtNum(Math.abs(b[1][1]))}RP<sub>2</sub>. Solving the two equations gives RP<sub>1</sub> = ${pp(s1)} and RP<sub>2</sub> = ${pp(s2)}, so ${sml(rf, s1, s2)}.`);
    return { ...Q('PS2.twoFactor', '2', html, parts), solution: sol };
  }
  throw new Error('PS2_twoFactor: no valid draw');
}

export function PS2_arbitrage(): Question {
  for (let t = 0; t < 500; t++) {
    const rf = rstep(0.01, 0.06, 0.0025), rp = rstep(0.03, 0.09, 0.0025), bA = rstep(0.9, 2, 0.1), bB = rstep(0.2, 0.8, 0.1);
    const eA = roundTo(rf + bA * rp, 0.0001), eB = roundTo(rf + bB * rp, 0.0001);
    const rpS = (eA - eB) / (bA - bB), rfS = eA - bA * rpS;
    const bJ = rstep(0.2, 1.6, 0.1), mis = pick([-1, 1]) * rstep(0.001, 0.01, 0.0005);
    const fair = rfS + bJ * rpS, eJ = roundTo(fair + mis, 0.0001), al = eJ - fair;
    if (Math.abs(bJ - bA) < 0.05 || Math.abs(al) < 0.0005) continue;
    const html = p_(`A financial market is driven by only one risk factor. Consider two correctly priced, well-diversified portfolios: A with a beta of ${fmtNum(bA)} and an expected return of ${pp(eA)}, and B with a beta of ${fmtNum(bB)} and an expected return of ${pp(eB)}. ${NOTE_PCT} Enter weights as decimals.`);
    const parts: Part[] = [
      N('The SML is E[r] = r<sub>f</sub> + β × RP. What is r<sub>f</sub>?', rfS * 100, 'pct'),
      N('… and the factor risk premium RP?', rpS * 100, 'pct'),
      N(`A well-diversified portfolio J has a beta of ${fmtNum(bJ)} and an expected return of ${pp(eJ)}. What expected return should J have?`, fair * 100, 'pct'),
      N('What is the alpha of J?', al * 100, 'pct'),
      C('How do you exploit the arbitrage?', ['Buy J and sell its mimicking portfolio', 'Sell J and buy its mimicking portfolio', 'There is no arbitrage opportunity'], al > 0 ? 0 : 1),
      N('The mimicking portfolio combines A with the risk-free asset. What weight does it put in A?', bJ / bA, 'n'),
      N('… and in the risk-free asset?', 1 - bJ / bA, 'n'),
    ];
    const sol = p_(`From A and B: RP = (${pp(eA)} − ${pp(eB)}) / (${fmtNum(bA)} − ${fmtNum(bB)}) = ${pp(rpS)} and r<sub>f</sub> = ${pp(eA)} − ${fmtNum(bA)} × ${pp(rpS)} = ${pp(rfS)}. J should earn ${pp(rfS)} + ${fmtNum(bJ)} × ${pp(rpS)} = ${pp(fair)}; it offers ${pp(eJ)}, an alpha of ${pp(al)}.`) +
      p_(`The mimicking portfolio holds β<sub>J</sub>/β<sub>A</sub> = ${fmtNum(bJ / bA, 4)} in A and ${fmtNum(1 - bJ / bA, 4)} in the risk-free asset, so it has J’s beta. ${al > 0 ? 'Buy J and short the mimicking portfolio' : 'Short J and buy the mimicking portfolio'}: the factor risk cancels and the position earns |α| = ${pp(Math.abs(al))} without risk.`);
    return { ...Q('PS2.arbitrage', '2', html, parts), solution: sol };
  }
  throw new Error('PS2_arbitrage: no valid draw');
}

export function PS2_impliedRf(): Question {
  for (let t = 0; t < 200; t++) {
    const rf = chance(0.25) ? rstep(0.15, 0.4, 0.01) : rstep(0.01, 0.08, 0.0025), rp = rstep(0.03, 0.12, 0.005);
    const bA = rstep(0.8, 2.2, 0.1), bB = rstep(0.1, 0.7, 0.1);
    if (bA - bB < 0.4) continue;
    const eA = roundTo(rf + bA * rp, 0.0001), eB = roundTo(rf + bB * rp, 0.0001);
    const rpS = (eA - eB) / (bA - bB), rfS = eA - bA * rpS;
    const country = pick(['Argentila', 'Pescadia', 'Norvania', 'Lusitara', 'Merovia']);
    const html = p_(`The APT with only one factor holds in the financial market of ${country}. A and B are two well-diversified portfolios with E[r<sub>A</sub>] = ${pp(eA)}, E[r<sub>B</sub>] = ${pp(eB)}, β<sub>A</sub> = ${fmtNum(bA)} and β<sub>B</sub> = ${fmtNum(bB)}. What is the risk-free rate of ${country}?`);
    const sol = p_(`Both portfolios lie on the SML: r<sub>f</sub> + ${fmtNum(bA)}RP = ${pp(eA)} and r<sub>f</sub> + ${fmtNum(bB)}RP = ${pp(eB)}. Subtracting gives RP = ${pp(rpS)}, and r<sub>f</sub> = ${pp(eA)} − ${fmtNum(bA)} × ${pp(rpS)} = ${pp(rfS)}.`);
    return mcNum('PS2.impliedRf', '2', html, rfS, [rpS, (eA + eB) / 2, eA - bA * (eA - eB), eA - rpS, eB - bB * (eA - eB)], x => pp(x), { sol });
  }
  throw new Error('PS2_impliedRf: no valid draw');
}

export function PS2_longShort(): Question {
  const n = pick([5, 5, 10]), se = rstep(0.2, 0.6, 0.05), a = rstep(0.01, 0.05, 0.005), X = rstep(1, 10, 0.5) * 1e6;
  const country = pick(['Swazilia', 'Kordavia', 'Elbaria', 'Tessaly']);
  const sd = (k: number) => se * Math.sqrt(2 / k);
  const [n2, n3] = pick([[20, 100], [20, 50], [50, 200]]);
  const html = p_(`All stocks in ${country} have a beta of one with respect to the market, the only factor driving returns, and a standard deviation of the residuals of ${P(se, 0)}. The single-index model holds. You study ${2 * n} stocks and find ${n} with a positive alpha of ${P(a, 1)} and ${n} with a negative alpha of −${P(a, 1)}. You buy ${eur(X, 0)} of an equal-weighted portfolio of the underpriced stocks and short the same amount of an equal-weighted portfolio of the overpriced stocks.`);
  const parts: Part[] = [
    N('What is your expected profit?', 2 * a * X, 'eur'),
    N('What is the standard deviation of that profit?', sd(n) * X, 'eur'),
    N(`What would the standard deviation be with ${2 * n2} stocks (${n2} in each leg), same amount invested?`, sd(n2) * X, 'eur'),
    N(`… and with ${2 * n3} stocks?`, sd(n3) * X, 'eur'),
  ];
  const sol = p_(`Betas cancel between the legs, so the expected excess return is α<sub>u</sub> − α<sub>o</sub> = ${P(2 * a, 1)} and the expected profit ${P(2 * a, 1)} × ${eur(X, 0)} = ${eur(2 * a * X, 0)}. All remaining risk is specific: σ² = 2n(1/n)²σ²<sub>e</sub> = 2σ²<sub>e</sub>/n, so with n = ${n} per leg σ = ${P(se, 0)} × √(2/${n}) = ${pp(sd(n))}, or ${eur(sd(n) * X, 0)}. With ${n2} per leg it falls to ${eur(sd(n2) * X, 0)}, with ${n3} to ${eur(sd(n3) * X, 0)}: the expected profit stays the same, so spreading the bet over many stocks is far better.`);
  return { ...Q('PS2.longShort', '2', html, parts), solution: sol };
}

export function PS2_diversify(): Question {
  const n = pick([10, 20, 25, 50, 100, 200]), se = rstep(0.2, 0.5, 0.05), b = rstep(0.6, 1.4, 0.05), sM = rstep(0.14, 0.24, 0.01);
  if (chance(0.5)) {
    const ans = se / Math.sqrt(n);
    const html = p_(`Each of ${n} stocks has a residual standard deviation of ${P(se, 0)}; residuals are uncorrelated. What is the residual standard deviation of an equally weighted portfolio of the ${n} stocks?`);
    const sol = p_(`σ²(e<sub>P</sub>) = Σ(1/n)²σ²<sub>e</sub> = σ²<sub>e</sub>/n, so σ(e<sub>P</sub>) = ${P(se, 0)} / √${n} = ${pp(ans)}. This is why well-diversified portfolios carry only factor risk.`);
    return mcNum('PS2.diversify', '2', html, ans, [se / n, se, se * Math.sqrt(2 / n), se * se / n, se / Math.sqrt(n / 2) / 2], x => pp(x), { sol, closest: true });
  }
  const ans = Math.sqrt(b * b * sM * sM + se * se / n);
  const html = p_(`An equally weighted portfolio holds ${n} stocks, each with a beta of ${fmtNum(b)} and a residual standard deviation of ${P(se, 0)}; residuals are uncorrelated. The market’s standard deviation is ${P(sM, 0)}. What is the standard deviation of the portfolio?`);
  const sol = p_(`σ²<sub>P</sub> = β²σ²<sub>M</sub> + σ²<sub>e</sub>/n = ${fmtNum(b)}² × ${fmtNum(sM)}² + ${fmtNum(se)}²/${n} = ${fmtNum(ans * ans, 5)}, so σ<sub>P</sub> = ${pp(ans)}.`);
  return mcNum('PS2.diversify', '2', html, ans, [Math.sqrt(b * b * sM * sM + se * se), b * sM, b * sM + se / Math.sqrt(n), Math.sqrt(b * b * sM * sM + se * se / (n * n)), sM], x => pp(x), { sol });
}

const EMH_FORMS = {
  all: 'It contradicts all three forms: weak, semi-strong and strong.',
  semi: 'It contradicts the semi-strong and the strong form, but not the weak form.',
  strong: 'It contradicts only the strong form.',
  none: 'It is consistent with all three forms of market efficiency.',
};
const EMH_EVIDENCE: [string, keyof typeof EMH_FORMS, string][] = [
  ['Stocks with the highest returns over the past 3–12 months keep outperforming over the next months (momentum).', 'all', 'Past prices are in the weak-form information set.'],
  ['Long-term losers over the past 3–5 years outperform long-term winners over the next years.', 'all', 'Long-term reversal uses only past prices, the weak-form information set.'],
  ['A trading rule based on moving averages of past prices earns abnormal returns after costs.', 'all', 'Technical analysis uses only past prices and volume.'],
  ['Prices keep drifting in the direction of an earnings surprise for weeks after the announcement.', 'semi', 'Earnings announcements are public, but not part of past prices.'],
  ['Stocks with low P/E ratios earn higher risk-adjusted returns than stocks with high P/E ratios.', 'semi', 'P/E ratios are public information beyond past prices (subject to the joint hypothesis problem).'],
  ['Small firms earn higher risk-adjusted returns than large firms.', 'semi', 'Size is public information beyond past prices (subject to the joint hypothesis problem).'],
  ['Corporate insiders earn abnormal returns when trading their own company’s shares.', 'strong', 'Insiders trade on private information, which only the strong form covers.'],
  ['On average, actively managed mutual funds do not beat the market after fees.', 'none', 'This is what the EMH predicts.'],
  ['Share prices jump on the day of an unexpected earnings announcement and do not drift afterwards.', 'none', 'Quick, complete reaction to news is what efficiency means.'],
];

export function PS2_emh(): Question {
  const [ev, form, why] = pick(EMH_EVIDENCE);
  const sol = p_(`${why} The forms are nested: the weak-form information set is part of the semi-strong set, which is part of the strong set, so a violation of a weaker form also violates the stronger ones.`);
  return mcText('PS2.emh', '2', p_('Suppose the following evidence is robust. Which forms of the efficient market hypothesis does it contradict?') + '<blockquote>' + ev + '</blockquote>',
    EMH_FORMS[form], Object.values(EMH_FORMS), sol);
}

export const PS2_concept = () => shortAnswer('PS2.short', '2');

// =====================================================================
// PS 3 — Portfolio performance measurement
// =====================================================================

export function PS3_ir(): Question {
  const a = rstep(0.005, 0.03, 0.0025), b = rstep(0.5, 1.8, 0.05), sM = rstep(0.1, 0.2, 0.01), se = rstep(0.02, 0.12, 0.005);
  const sP = Math.sqrt(b * b * sM * sM + se * se), R2 = b * b * sM * sM / (sP * sP), ans = a / se;
  const html = p_('The regression of the monthly excess returns of portfolio P on the excess returns of the market gives the following estimates:') +
    table(['', 'Alpha', 'Beta', 'R-square'], [['P', pp(a, 2), fmtNum(b), pp(R2, 2)]]) +
    p_(`The standard deviation of the portfolio is ${pp(sP, 3)} and that of the market is ${pp(sM, 0)}. What is the information ratio of the portfolio?`);
  const sol = p_(`The information ratio divides alpha by residual risk. σ²(e) = (1 − R²)σ²<sub>P</sub> = (1 − ${fmtNum(R2, 4)}) × ${fmtNum(sP, 5)}², so σ(e) = ${pp(se)} (equivalently σ²<sub>P</sub> − β²σ²<sub>M</sub>). IR = ${pp(a)} / ${pp(se)} = ${fmtNum(ans, 3)}.`);
  return mcNum('PS3.ir', '3', html, ans, [a / sP, a / (b * sM), a / ((1 - R2) * sP), a / (Math.sqrt(R2) * sP), a / b], x => fmtNum(x, 3), { sol, closest: true });
}

export function PS3_tstat(): Question {
  const name = pick(['John', 'Maria', 'Sven', 'Aiko', 'Priya', 'Tomás']);
  const a = rstep(0.1, 1, 0.05) / 100, se = rstep(1, 6, 0.25) / 100;
  const [z, lvl] = pick([[1.96, '5%'], [1.96, '5%'], [1.645, '10%'], [2.576, '1%']] as [number, string][]);
  const n = (z * se / a) ** 2;
  if (n < 12 || n > 20000) return PS3_tstat();
  const html = p_(`${name} is a skilled investor able to produce a true alpha of ${pp(a)} a month with a standard deviation of monthly residuals of ${pp(se)}. Assuming that a regression always picks the true alpha, how many months will it take for the t-statistic to be significant at the ${lvl} level (t > ${z})?`);
  const sol = p_(`t = α/(σ/√N) > ${z} ⇔ N > (${z} × ${pp(se)} / ${pp(a)})² = ${fmtNum(n, 2)} months, about ${fmtNum(n / 12, 1)} years.`);
  const zs = [1.645, 1.96, 2.576].filter(x => x !== z);
  return mcNum('PS3.tstat', '3', html, n, [z * se / a, (se / a) ** 2, n / 12, (zs[0] * se / a) ** 2, (zs[1] * se / a) ** 2, 2 * n], x => fmtNum(x, 0), { sol, closest: true });
}

export function PS3_attribution(): Question {
  const wB = pick([[0.5, 0.3, 0.2], [0.6, 0.3, 0.1], [0.2, 0.7, 0.1], [0.7, 0.2, 0.1], [0.4, 0.4, 0.2]]);
  let wP: number[];
  do { wP = pick([[0.2, 0.5, 0.3], [0.7, 0.2, 0.1], [0.5, 0.4, 0.1], [0.3, 0.5, 0.2], [0.8, 0.15, 0.05], [0.6, 0.3, 0.1]]); } while (wP.every((x, i) => x === wB[i]));
  const rB = [rstep(-0.2, 0.25, 0.01), rstep(-0.02, 0.06, 0.01), rstep(0, 0.04, 0.01)];
  const rP = [rB[0] + rstep(-0.06, 0.06, 0.01), rB[1] + rstep(-0.02, 0.02, 0.01), rB[2]];
  const sum = (f: (i: number) => number) => f(0) + f(1) + f(2);
  const aa = sum(i => (wP[i] - wB[i]) * rB[i]), ss = sum(i => wP[i] * (rP[i] - rB[i]));
  const retP = sum(i => wP[i] * rP[i]), retB = sum(i => wB[i] * rB[i]);
  if (Math.abs(aa) < 0.001 || Math.abs(ss) < 0.001) return PS3_attribution();
  const html = p_('Consider the following information for an actively managed portfolio P and its benchmark:') +
    table(['', 'Benchmark weights', 'Benchmark returns', 'Portfolio weights', 'Portfolio returns'], ['Equity', 'Bonds', 'Cash'].map((nm, i) => [nm, fmtNum(wB[i]), pp(rB[i], 0), fmtNum(wP[i]), pp(rP[i], 0)]));
  const wrongs = [aa, ss, retP - retB, sum(i => (wP[i] - wB[i]) * rP[i]), sum(i => wB[i] * (rP[i] - rB[i])), retP, retB];
  const sol = p_(`The bogey returns ${pp(retB)} and P returns ${pp(retP)}, a difference of ${pp(retP - retB)}. Asset allocation: Σ(w<sub>P</sub> − w<sub>B</sub>)r<sub>B</sub> = ${pp(aa)}. Security selection: Σw<sub>P</sub>(r<sub>P</sub> − r<sub>B</sub>) = ${pp(ss)}. The two add up to the total difference.`);
  if (chance(0.5)) return mcNum('PS3.attribution', '3', html + p_('What is the contribution of asset allocation to the performance of the portfolio?'), aa, wrongs, x => pp(x, 1), { sol, closest: true, step: 0.004 });
  return mcNum('PS3.attribution', '3', html + p_('What is the contribution of security selection to the performance of the portfolio?'), ss, wrongs, x => pp(x, 1), { sol, closest: true, step: 0.004 });
}

export function PS3_ratios(): Question {
  const rf = rstep(0.01, 0.05, 0.005), eM = rf + rstep(0.04, 0.12, 0.005), sM = rstep(0.12, 0.3, 0.01);
  const b = rstep(0.6, 1.6, 0.05), eP = rf + rstep(0.03, 0.16, 0.005), sP = rstep(0.1, 0.4, 0.01), name = fund('Fund');
  const sr = (eP - rf) / sP, tr = (eP - rf) / b, ja = eP - rf - b * (eM - rf), m2 = rf + sr * sM - eM;
  const html = p_(`Consider the following data for the ${name} and the market. The risk-free rate is ${pp(rf, 1)}.`) +
    table(['', 'Average return', 'Standard deviation', 'Beta'], [[name, pp(eP, 1), pp(sP, 0), fmtNum(b)], ['Market', pp(eM, 1), pp(sM, 0), '1']]);
  const v = rint(0, 3);
  if (v === 0) return mcNum('PS3.ratios', '3', html + p_('What is the Sharpe ratio of the fund?'), sr, [eP / sP, (eP - rf) / b, (eP - rf) / sM, (eP - eM) / sP, sr * b], x => fmtNum(x, 3),
    { sol: p_(`SR = (r̄<sub>P</sub> − r̄<sub>f</sub>)/σ<sub>P</sub> = (${pp(eP, 1)} − ${pp(rf, 1)}) / ${pp(sP, 0)} = ${fmtNum(sr, 4)}.`), closest: true });
  if (v === 1) return mcNum('PS3.ratios', '3', html + p_('What is the Treynor ratio of the fund?'), tr, [(eP - rf) / sP, eP / b, (eP - eM) / b, (eP - rf) * b, ja], x => pp(x),
    { sol: p_(`T = (r̄<sub>P</sub> − r̄<sub>f</sub>)/β<sub>P</sub> = (${pp(eP, 1)} − ${pp(rf, 1)}) / ${fmtNum(b)} = ${pp(tr)}.`) });
  if (v === 2) return mcNum('PS3.ratios', '3', html + p_('What is Jensen’s alpha of the fund?'), ja, [eP - b * eM, eP - eM, eP - rf - (eM - rf), eP - rf - b * eM, tr - (eM - rf)], x => pp(x),
    { sol: p_(`α = r̄<sub>P</sub> − [r̄<sub>f</sub> + β(r̄<sub>M</sub> − r̄<sub>f</sub>)] = ${pp(eP, 1)} − [${pp(rf, 1)} + ${fmtNum(b)} × ${pp(eM - rf, 1)}] = ${pp(ja)}.`), step: 0.005 });
  return mcNum('PS3.ratios', '3', html + p_('What is the M² measure of the fund?'), m2, [rf + sr * sM, eP - eM, sr - (eM - rf) / sM, ja, sr * sP - eM], x => pp(x),
    { sol: p_(`M² levers the fund to the market’s volatility: r<sub>f</sub> + SR<sub>P</sub>σ<sub>M</sub> − r̄<sub>M</sub> = ${pp(rf, 1)} + ${fmtNum(sr, 4)} × ${pp(sM, 0)} − ${pp(eM, 1)} = ${pp(m2)}.`), step: 0.005 });
}

export function PS3_dwr(): Question {
  for (let t = 0; t < 500; t++) {
    const P0 = rstep(20, 120, 1), d = roundTo(P0 * rstep(0.01, 0.05, 0.005), 0.5);
    const P1 = roundTo(P0 * rstep(0.85, 1.25, 0.01), 1), P2 = roundTo(P1 * rstep(0.85, 1.25, 0.01), 1);
    const r1 = (P1 - P0 + d) / P0, r2 = (P2 - P1 + d) / P1;
    const a = 2 * d + 2 * P2, bq = d - P1, c = -P0, x = (-bq + Math.sqrt(bq * bq - 4 * a * c)) / (2 * a), irr = 1 / x - 1;
    if (!isFinite(irr) || Math.abs(r1 - r2) < 0.03) continue;
    const ar = (r1 + r2) / 2, ge = Math.sqrt((1 + r1) * (1 + r2)) - 1;
    const html = p_(`At the start of year 1 you buy one share for $${fmtNum(P0)}. At the end of year 1 it pays a dividend of $${fmtNum(d)} and you buy a second share for $${fmtNum(P1)}. At the end of year 2 each share pays a dividend of $${fmtNum(d)} and you sell both for $${fmtNum(P2)} each.`);
    const sol = p_(`Holding-period returns: year 1 (${fmtNum(P1)} − ${fmtNum(P0)} + ${fmtNum(d)}) / ${fmtNum(P0)} = ${pp(r1)}, year 2 ${pp(r2)}. Arithmetic average ${pp(ar)}, geometric √((1 + r<sub>1</sub>)(1 + r<sub>2</sub>)) − 1 = ${pp(ge)}. The dollar-weighted return solves ${fmtNum(P0)} + ${fmtNum(P1 - d)}/(1 + r) = ${fmtNum(2 * d + 2 * P2)}/(1 + r)², giving ${pp(irr)}. ${irr < ge ? 'It is below the time-weighted return because more money was invested in the worse year.' : 'It is above the time-weighted return because more money was invested in the better year.'}`);
    const pool = [irr, ar, ge, r1, r2, (r1 + 2 * r2) / 3];
    const v = rint(0, 2);
    const [ans, q] = v === 0 ? [irr, 'What is the dollar-weighted return?'] : v === 1 ? [ge, 'What is the geometric average (time-weighted) return?'] : [ar, 'What is the arithmetic average (time-weighted) return?'];
    return mcNum('PS3.dwr', '3', html + p_(q), ans, pool.filter(p => p !== ans), y => pp(y), { sol, closest: true, step: 0.004 });
  }
  throw new Error('PS3_dwr: no valid draw');
}

const MEASURES: [string, string, string[]][] = [
  ['The fund will be the investor’s entire risky portfolio and you compare it with the market index.', 'Sharpe ratio', ['M²']],
  ['The fund will be the investor’s entire risky portfolio, and you want the answer as a return difference to the market at equal volatility.', 'M²', ['Sharpe ratio']],
  ['The fund is one of many sub-portfolios that together form a large, well-diversified portfolio.', 'Treynor ratio', []],
  ['The fund will be the only actively managed portfolio, combined with a passive index fund.', 'Information ratio', []],
  ['You want to know whether the fund’s average return exceeds what the CAPM requires for its beta.', 'Jensen’s alpha', []],
  ['You need a measure that cannot be gamed by changing the portfolio’s risk over time without any skill.', 'MRAR (Morningstar risk-adjusted return)', ['Sharpe ratio']],
];

export function PS3_whichMeasure(): Question {
  const [sit, right, excl] = pick(MEASURES);
  const all = ['Sharpe ratio', 'Treynor ratio', 'Information ratio', 'Jensen’s alpha', 'M²', 'MRAR (Morningstar risk-adjusted return)'];
  const sol = p_('Entire risky portfolio: Sharpe ratio or M², because total risk is what the investor bears. One of many sub-portfolios: Treynor ratio, because specific risk diversifies away. Single active fund next to an index: information ratio, because SR²<sub>P</sub> = SR²<sub>M</sub> + IR². Jensen’s alpha measures the distance to the SML. Only the MRAR is manipulation-proof.');
  return mcText('PS3.whichMeasure', '3', p_('Which performance measure is the most appropriate in the following situation?') + '<blockquote>' + sit + '</blockquote>', right, all.filter(x => x !== right && !excl.includes(x)), sol, false);
}

export const PS3_concept = () => shortAnswer('PS3.short', '3');

// =====================================================================
// PS 4 — Active portfolio management
// =====================================================================

const pair = (v: Vec) => `${fmtNum(v[0], 2)} and ${fmtNum(v[1], 2)}`;

export function PS4_tbWeights(): Question {
  for (let t = 0; t < 1000; t++) {
    const aA = rstep(0.01, 0.05, 0.005), aB = (chance(0.75) ? -1 : 1) * rstep(0.01, 0.05, 0.005);
    const sA = rstep(0.05, 0.25, 0.01), sB = rstep(0.05, 0.25, 0.01), bA = rstep(0.5, 1.5, 0.1), bB = rstep(0.5, 1.5, 0.1);
    const u = [aA / (sA * sA), aB / (sB * sB)], s = u[0] + u[1];
    if (Math.abs(s) < 0.3) continue;
    const w = [u[0] / s, u[1] / s];
    if (w.some(x => Math.abs(x) > 4)) continue;
    const r = [aA / sA, aB / sB], rs = r[0] + r[1];
    const mrp = rstep(0.05, 0.08, 0.01), sM = rstep(0.14, 0.2, 0.01);
    const html = p_(`You performed security analysis on two stocks. Stock A has an alpha of ${pp(aA, 1)}, a beta of ${fmtNum(bA)} and a standard deviation of residuals of ${pp(sA, 0)}. Stock B has an alpha of ${pp(aB, 1)}, a beta of ${fmtNum(bB)} and a standard deviation of residuals of ${pp(sB, 0)}. The risk premium of the market portfolio is ${pp(mrp, 0)} and its standard deviation is ${pp(sM, 0)}. According to the Treynor-Black model, what weights should the active portfolio put in stocks A and B?`);
    const sol = p_(`Unscaled weights are α/σ²(e): A ${fmtNum(aA, 3)} / ${fmtNum(sA * sA, 4)} = ${fmtNum(u[0], 3)}, B ${fmtNum(u[1], 3)}. Scaling them to sum to one gives w<sub>A</sub> = ${fmtNum(w[0], 3)} and w<sub>B</sub> = ${fmtNum(w[1], 3)}. Betas and the market data do not enter this step.`);
    return mcVec('PS4.tbWeights', '4', html, w, [[r[0] / rs, r[1] / rs], u, [w[1], w[0]], [-w[0], -w[1]], [aA / (aA + aB), aB / (aA + aB)], [0.5, 0.5]], pair, { sol });
  }
  throw new Error('PS4_tbWeights: no valid draw');
}

const TF_EXTRA = {
  T: ['In the Treynor-Black model, the weight of each stock in the active portfolio is proportional to its alpha divided by its residual variance.', 'Multiplying all alpha forecasts by the same R² leaves the relative weights of stocks in the Treynor-Black active portfolio unchanged.'],
  F: ['In the Treynor-Black model, a stock with a negative alpha gets a weight of zero in the active portfolio.', 'In Black-Litterman, a higher standard deviation of the view moves the revised expected returns further towards the view.'],
};

export function PS4_trueFalse(): Question {
  const T = [...BANK['4'].T, ...TF_EXTRA.T], F = [...BANK['4'].F, ...TF_EXTRA.F];
  const isT = chance(0.5), s = pick(isT ? T : F);
  return { ...Q('PS4.trueFalse', '4', p_('True or false?') + '<blockquote>' + s + '</blockquote>', [{ type: 'mc', options: ['True', 'False'], correct: isT ? 0 : 1, tf: true }]), solution: p_(`The statement is ${isT ? 'true' : 'false'}.`) };
}

export function PS4_simCov(): Question {
  if (chance(0.5)) {
    return mcText('PS4.simCov', '4', p_('Under the assumptions of the single-index model, R<sub>i</sub> = α<sub>i</sub> + β<sub>i</sub>R<sub>M</sub> + e<sub>i</sub>, what is the covariance of the returns of two different assets i and j?'),
      'β_i β_j σ²_M', ['α_i α_j + β_i β_j σ²_M', 'β_i β_j σ_M', '(β_i + β_j) σ²_M', 'β_i β_j σ²_M + σ(e_i) σ(e_j)', 'σ²_M'],
      p_('cov(R<sub>i</sub>, R<sub>j</sub>) = cov(α<sub>i</sub> + β<sub>i</sub>R<sub>M</sub> + e<sub>i</sub>, α<sub>j</sub> + β<sub>j</sub>R<sub>M</sub> + e<sub>j</sub>). Alphas are constants and drop out; residuals are uncorrelated with the market and with each other, so only β<sub>i</sub>β<sub>j</sub>cov(R<sub>M</sub>, R<sub>M</sub>) = β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub> remains.'));
  }
  return mcText('PS4.simCov', '4', p_('Which assumption of the single-index model makes the covariance between two stocks depend only on their betas and the market variance?'),
    'Residuals are uncorrelated with the market return and with each other.',
    ['All alphas are zero.', 'All betas are equal to one.', 'Returns are normally distributed.', 'Investors have homogeneous expectations.', 'The market portfolio is mean-variance efficient.'],
    p_('With cov(e<sub>i</sub>, e<sub>j</sub>) = 0 and cov(e<sub>i</sub>, R<sub>M</sub>) = 0, the only common component is the market factor, so cov(R<sub>i</sub>, R<sub>j</sub>) = β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub>. Zero alphas are a CAPM result, not a single-index assumption.'));
}

export function PS4_bl(): Question {
  const sB = rstep(0.05, 0.12, 0.01), sS = rstep(0.15, 0.25, 0.01), rho = rstep(0, 0.4, 0.05), wB = pick([0.3, 0.4, 0.5]), wS = 1 - wB, A = pick([2, 2.5, 3, 3.5, 4]);
  const tau = 0.01, cov = rho * sB * sS;
  const vM = wB * wB * sB * sB + wS * wS * sS * sS + 2 * wB * wS * cov, eM = A * vM;
  const betaB = (wB * sB * sB + wS * cov) / vM, betaS = (wB * cov + wS * sS * sS) / vM;
  const eB = betaB * eM, eS = betaS * eM, qE = eB - eS;
  const Qv = +(qE + pick([-1, 1]) * rstep(0.01, 0.06, 0.005)).toFixed(3), sEps = rstep(0.01, 0.05, 0.005);
  const vQE = tau * (sB * sB + sS * sS - 2 * cov), vD = sEps * sEps + vQE, k = (Qv - qE) / vD;
  const rB = eB + k * tau * (sB * sB - cov), rS = eS + k * tau * (cov - sS * sS);
  const land = pick(['Viel Glück', 'Bona Fortuna', 'Buena Suerte', 'Hyvä Onni']);
  const html = p_(`Consider ‘${land}’, an economy with thriving financial markets. ${NOTE_PCT}`) +
    table(['', 'Value'], [['Standard deviation of bonds', pp(sB, 0)], ['Standard deviation of stocks', pp(sS, 0)], ['Correlation between bonds and stocks', fmtNum(rho)], ['Share of bonds in total wealth', P(wB, 0)], ['Share of stocks in total wealth', P(wS, 0)], ['Risk aversion', fmtNum(A)]]) +
    p_(`The covariance matrix of expected-return forecasts is 0.01 times the covariance matrix of returns. Your view is E[R<sub>B</sub>] − E[R<sub>S</sub>] = ${pp(Qv, 1)}, with a standard deviation of ${pp(sEps, 1)}.`);
  const parts: Part[] = [
    N('What is the variance of the market portfolio?', vM, 'n', { abs: 0.0002 }),
    N('Using the CAPM as equilibrium model, what is the market-implied expected excess return of the market portfolio?', eM * 100, 'pct'),
    N('… of stocks?', eS * 100, 'pct'),
    N('… of bonds?', eB * 100, 'pct'),
    N('What is the standard deviation of the difference between the view and the baseline expectation?', Math.sqrt(vD) * 100, 'pct'),
    N('What is the revised expected excess return of stocks (Black-Litterman)?', rS * 100, 'pct'),
    N('… and of bonds?', rB * 100, 'pct'),
  ];
  const sol = p_(`cov(B, S) = ${fmtNum(rho)} × ${fmtNum(sB)} × ${fmtNum(sS)} = ${fmtNum(cov, 4)}; σ²<sub>M</sub> = w′Σw = ${fmtNum(vM, 5)}. E[R<sub>M</sub>] = Āσ²<sub>M</sub> = ${pp(eM)}. β<sub>B</sub> = (w<sub>B</sub>σ²<sub>B</sub> + w<sub>S</sub>σ<sub>BS</sub>)/σ²<sub>M</sub> = ${fmtNum(betaB, 4)} and β<sub>S</sub> = ${fmtNum(betaS, 4)}, so the baseline returns are ${pp(eB)} for bonds and ${pp(eS)} for stocks.`) +
    p_(`The baseline view is Q<sub>E</sub> = ${pp(qE)} with variance P′Σ<sub>F</sub>P = ${fmtNum(vQE, 6)}; σ²<sub>D</sub> = ${fmtNum(sEps, 4)}² + ${fmtNum(vQE, 6)} = ${fmtNum(vD, 6)}, σ<sub>D</sub> = ${pp(Math.sqrt(vD))}.`) +
    p_(`R* = R<sub>E</sub> + (Q − Q<sub>E</sub>)/σ²<sub>D</sub> × Σ<sub>F</sub>P with D = ${pp(Qv - qE)}: bonds ${pp(rB)}, stocks ${pp(rS)}.`);
  return { ...Q('PS4.bl', '4', html, parts), solution: sol };
}

export function PS4_tb(): Question {
  for (let t = 0; t < 2000; t++) {
    const s = [0, 1].map(() => ({ a: rstep(-0.04, 0.05, 0.005), b: rstep(0.3, 1.8, 0.1), se: rstep(0.04, 0.25, 0.01) }));
    if (s.some(x => Math.abs(x.a) < 0.005)) continue;
    const u = s.map(x => x.a / (x.se * x.se)), sum = u[0] + u[1];
    if (Math.abs(sum) < 0.3) continue;
    const w = u.map(x => x / sum);
    if (w.some(x => Math.abs(x) > 4)) continue;
    const aA = w[0] * s[0].a + w[1] * s[1].a, bA = w[0] * s[0].b + w[1] * s[1].b, veA = w[0] ** 2 * s[0].se ** 2 + w[1] ** 2 * s[1].se ** 2;
    const mrp = rstep(0.04, 0.08, 0.005), sM = rstep(0.12, 0.22, 0.01);
    const wA0 = (aA / veA) / (mrp / (sM * sM)), wA = wA0 / (1 + (1 - bA) * wA0);
    if (!isFinite(wA) || wA <= 0 || wA > 3 || aA <= 0) continue;
    const bP = 1 - wA + wA * bA, sdP = Math.sqrt(bP * bP * sM * sM + wA * wA * veA);
    const srM = mrp / sM, srP = Math.sqrt(srM * srM + aA * aA / veA), te = Math.abs(wA) * Math.sqrt((1 - bA) ** 2 * sM * sM + veA);
    const r2 = pick([0.05, 0.1, 0.02]);
    const html = p_(`You performed security analysis on two stocks and arrived at the following estimates. The risk premium of the market portfolio is ${pp(mrp, 1)} and its standard deviation is ${pp(sM, 0)}. Use the Treynor-Black model. Enter weights as decimals and returns in percent.`) +
      table(['', 'Alpha', 'Beta', 'Residual standard deviation'], [['Stock A', pp(s[0].a, 1), fmtNum(s[0].b), pp(s[0].se, 0)], ['Stock B', pp(s[1].a, 1), fmtNum(s[1].b), pp(s[1].se, 0)]]);
    const parts: Part[] = [
      N('What weight should the active portfolio put in stock A?', w[0], 'n'), N('… and in stock B?', w[1], 'n'),
      N('What is the optimal weight of the active portfolio in the risky portfolio?', wA, 'n'),
      N('What is the beta of the optimal risky portfolio?', bP, 'n'), N('… and its standard deviation?', sdP * 100, 'pct'),
      N('By how much does the Sharpe ratio improve on the passive benchmark?', srP - srM, 'n'),
      N('What is the benchmark risk (standard deviation of the tracking error) of the optimal risky portfolio?', te * 100, 'pct'),
      C(`If the accuracy of your alpha forecasts, measured as R², were only ${P(r2, 0)}, the weights of A and B in the active portfolio would`, ['stay the same', `be multiplied by ${fmtNum(r2)}`, 'move to 50% each'], 0),
    ];
    const sol = p_(`α/σ²(e) gives ${fmtNum(u[0], 3)} and ${fmtNum(u[1], 3)}; scaled to sum to one: ${fmtNum(w[0], 4)} and ${fmtNum(w[1], 4)}.`) +
      p_(`Active portfolio: α<sub>A</sub> = ${pp(aA)}, β<sub>A</sub> = ${fmtNum(bA, 4)}, σ²(e<sub>A</sub>) = ${fmtNum(veA, 5)}. w⁰ = (α<sub>A</sub>/σ²(e<sub>A</sub>)) / (E[R<sub>M</sub>]/σ²<sub>M</sub>) = ${fmtNum(wA0, 4)}; w* = w⁰ / (1 + (1 − β<sub>A</sub>)w⁰) = ${fmtNum(wA, 4)}.`) +
      p_(`β<sub>P</sub> = 1 − w* + w*β<sub>A</sub> = ${fmtNum(bP, 4)}; σ<sub>P</sub> = √(β²<sub>P</sub>σ²<sub>M</sub> + w*²σ²(e<sub>A</sub>)) = ${pp(sdP)}. SR²<sub>P</sub> = SR²<sub>M</sub> + IR² gives ${fmtNum(srP, 4)} against ${fmtNum(srM, 4)}, a gain of ${fmtNum(srP - srM, 4)}. σ(TE) = w*√((1 − β<sub>A</sub>)²σ²<sub>M</sub> + σ²(e<sub>A</sub>)) = ${pp(te)}.`) +
      p_('Scaling every alpha by the same R² scales all unscaled weights by the same factor, which cancels when they are rescaled to sum to one. The active portfolio’s alpha, and so its weight in the risky portfolio, would shrink.');
    return { ...Q('PS4.tb', '4', html, parts), solution: sol };
  }
  throw new Error('PS4_tb: no valid draw');
}

export function PS4_fee(): Question {
  const n = pick([50, 100, 200, 500]), a = rstep(0.5, 3, 0.25) / 100, r2 = pick([0.01, 0.02, 0.05, 0.1]), se = rstep(0.04, 0.12, 0.01), A = pick([2, 3, 4]);
  const aum = rstep(10, 500, 10) * 1e6, f = n * (r2 * a / se) ** 2 / (2 * A);
  const html = p_(`A mutual fund has a team of analysts that performs security analysis. They produce forecasts of annual alphas of ${pp(a)}, on average, in a universe of ${n} stocks with an accuracy of ${P(r2, 0)} (measured as R²). The standard deviation of the residuals is ${P(se, 0)}. The fund manages ${usd(aum)}. What fees can the fund charge a mean-variance investor with a risk aversion of ${A}, in excess of a passive index fund?`);
  const sol = p_(`Each forecast alpha is scaled by its precision: R²α = ${fmtNum(r2 * a, 5)}, so the information ratio per stock is ${fmtNum(r2 * a / se, 5)}. The fee rate is f = (1/2A) Σ IR² = ${n} × ${fmtNum(r2 * a / se, 5)}² / ${2 * A} = ${pp(f, 4)}, or ${money(f * aum)} on ${usd(aum)}.`);
  return mcNum('PS4.fee', '4', html, f * aum, [n * (a / se) ** 2 / (2 * A) * aum, n * r2 * (a / se) ** 2 / (2 * A) * aum, n * (r2 * a / se) ** 2 / A * aum, (r2 * a / se) ** 2 / (2 * A) * aum, n * (r2 * a / se) / (2 * A) * aum], money, { sol });
}

export function PS4_activeWeight(): Question {
  for (let t = 0; t < 500; t++) {
    const aA = rstep(0.01, 0.06, 0.005), bA = rstep(0.3, 1.6, 0.05), se = rstep(0.08, 0.3, 0.01), mrp = rstep(0.04, 0.08, 0.005), sM = rstep(0.12, 0.22, 0.01);
    const w0 = (aA / (se * se)) / (mrp / (sM * sM)), w = w0 / (1 + (1 - bA) * w0);
    if (w > 3 || w < 0.05 || Math.abs(bA - 1) < 0.1) continue;
    const html = p_(`An active portfolio has an alpha of ${pp(aA, 1)}, a beta of ${fmtNum(bA)} and a residual standard deviation of ${pp(se, 0)}. The market risk premium is ${pp(mrp, 1)} and the market’s standard deviation is ${pp(sM, 0)}. According to the Treynor-Black model, what weight should the active portfolio get in the optimal risky portfolio?`);
    const sol = p_(`Initial weight: w⁰ = (α/σ²(e)) / (E[R<sub>M</sub>]/σ²<sub>M</sub>) = (${fmtNum(aA, 3)}/${fmtNum(se * se, 4)}) / (${fmtNum(mrp, 3)}/${fmtNum(sM * sM, 4)}) = ${fmtNum(w0, 4)}. Beta adjustment: w* = w⁰ / (1 + (1 − β)w⁰) = ${fmtNum(w, 4)}; the remaining ${fmtNum(1 - w, 4)} goes to the index.`);
    return mcNum('PS4.activeWeight', '4', html, w, [w0, w0 / (1 + w0), w0 / (1 - (1 - bA) * w0), w0 * bA, (aA / se) / (mrp / sM)], x => fmtNum(x, 3), { sol, closest: true });
  }
  throw new Error('PS4_activeWeight: no valid draw');
}

export function PS4_sharpe(): Question {
  const aA = rstep(0.01, 0.06, 0.005), se = rstep(0.05, 0.3, 0.01), mrp = rstep(0.04, 0.08, 0.005), sM = rstep(0.12, 0.22, 0.01);
  const srM = mrp / sM, ir = aA / se, srP = Math.sqrt(srM * srM + ir * ir);
  const html = p_(`The market risk premium is ${pp(mrp, 1)} and the market’s standard deviation is ${pp(sM, 0)}. Your active portfolio has an alpha of ${pp(aA, 1)} and a residual standard deviation of ${pp(se, 0)}. You combine it optimally with the index following Treynor-Black.`);
  if (chance(0.5)) {
    const sol = p_(`SR²<sub>P</sub> = SR²<sub>M</sub> + IR² = ${fmtNum(srM, 4)}² + ${fmtNum(ir, 4)}², so SR<sub>P</sub> = ${fmtNum(srP, 4)}.`);
    return mcNum('PS4.sharpe', '4', html + p_('What is the Sharpe ratio of the optimal risky portfolio?'), srP, [srM + ir, srM, ir, srM * srM + ir * ir, Math.sqrt(srM + ir)], x => fmtNum(x, 3), { sol, closest: true });
  }
  const sol = p_(`SR<sub>P</sub> = √(SR²<sub>M</sub> + IR²) = √(${fmtNum(srM, 4)}² + ${fmtNum(ir, 4)}²) = ${fmtNum(srP, 4)}, so the gain over the index is ${fmtNum(srP - srM, 4)}.`);
  return mcNum('PS4.sharpe', '4', html + p_('By how much does the Sharpe ratio improve on the passive benchmark?'), srP - srM, [ir, srP, ir * ir, srM * srM + ir * ir - srM, (srM + ir) - srM * 0.9], x => fmtNum(x, 3), { sol, closest: true });
}

export function PS4_te(): Question {
  const w = rstep(0.2, 1.4, 0.05), bA = rstep(0.2, 1.6, 0.05), se = rstep(0.05, 0.3, 0.01), sM = rstep(0.12, 0.22, 0.01);
  if (Math.abs(bA - 1) < 0.05) return PS4_te();
  const te = w * Math.sqrt((1 - bA) ** 2 * sM * sM + se * se);
  const html = p_(`The optimal risky portfolio puts a weight of ${fmtNum(w)} in an active portfolio with a beta of ${fmtNum(bA)} and a residual standard deviation of ${pp(se, 0)}; the rest is in the index, whose standard deviation is ${pp(sM, 0)}. What is the benchmark risk (standard deviation of the tracking error) of the optimal risky portfolio?`);
  const sol = p_(`The portfolio differs from the index by w*(R<sub>A</sub> − R<sub>M</sub>) = w*[(β<sub>A</sub> − 1)R<sub>M</sub> + e<sub>A</sub>] plus alpha, so σ(TE) = w*√((1 − β<sub>A</sub>)²σ²<sub>M</sub> + σ²(e<sub>A</sub>)) = ${fmtNum(w)} × √(${fmtNum((1 - bA) ** 2, 4)} × ${fmtNum(sM * sM, 4)} + ${fmtNum(se * se, 4)}) = ${pp(te)}.`);
  return mcNum('PS4.te', '4', html, te, [w * se, w * Math.sqrt(se * se + sM * sM), Math.sqrt((1 - bA) ** 2 * sM * sM + se * se), w * (Math.abs(1 - bA) * sM + se), w * w * Math.sqrt((1 - bA) ** 2 * sM * sM + se * se)], x => pp(x), { sol });
}

export const PS4_concept = () => shortAnswer('PS4.short', '4');

// =====================================================================
// PS 6 — Hedge funds
// =====================================================================

const HF_TRUE = [
  'Hedge funds follow very flexible investment strategies, while mutual funds follow regulations that require public disclosure of strategy and portfolio composition.',
  'Hedge funds often use shorting, leverage and options, while mutual funds make only limited use of them.',
  'Hedge funds often have lock-up periods and require advance redemption notices, while mutual fund shares can be redeemed easily.',
  'Hedge funds typically charge a management fee plus an incentive fee, while mutual funds charge only a fee on assets under management.',
  'Hedge funds usually have no more than about 100 sophisticated and wealthy investors, while mutual funds accept any number of investors.',
];
const HF_FALSE = [
  'Hedge funds follow predictable, stable strategies stated in their prospectus, while mutual funds often use shorting, leverage and options.',
  'Hedge funds often use shorting, leverage and options, while mutual funds have lock-up periods and require advance redemption notices.',
  'Hedge funds usually have no more than 100 sophisticated and wealthy investors, while mutual funds often use shorting, leverage and options.',
  'Mutual funds typically charge 2% of assets plus 20% of profits, while hedge funds charge only a fee on assets under management.',
  'Hedge funds must disclose their holdings regularly, while mutual funds can keep their portfolios confidential.',
  'Mutual funds are restricted to about 100 sophisticated investors, while hedge funds are open to the general public.',
  'Hedge funds offer daily redemptions, while mutual funds impose lock-up periods.',
];

export function PS6_compare(): Question {
  return mcText('PS6.compare', '6', p_('Which of the statements below comparing mutual funds with hedge funds is most likely to be true?'), pick(HF_TRUE), HF_FALSE,
    p_('Mutual funds are heavily regulated: they disclose holdings regularly and state their strategy in the prospectus, accept any number of investors, allow easy redemptions and charge a fee on assets. Hedge funds are private partnerships with few sophisticated investors, minimal disclosure, opportunistic strategies with shorting, leverage and options, lock-ups and redemption notices, and a management plus an incentive fee.'));
}

function portableDraw() {
  for (;;) {
    const n = rint(3, 20), S0 = rstep(1500, 5000, 100), beta = pick([0.5, 0.75, 1.2, 1.25, 1.5, 2, 2.5]);
    const V = n * 250 * S0 / beta / 1e6;
    if (Math.abs(V * 1000 - Math.round(V * 1000)) > 1e-6 || V > 30) continue;
    const a = rstep(0.01, 0.12, 0.005), rf = rstep(0.01, 0.05, 0.005);
    return { n, S0, beta, V, a, rf, c0: V * (1 + rf + a - beta * rf), h0: V * beta * rf };
  }
}

export function PS6_unhedged(): Question {
  const { n, S0, beta, V, a, rf, c0, h0 } = portableDraw();
  const html = p_(`You manage a $${f3(V)} million portfolio with an alpha of ${pp(a, 1)} and a beta of ${fmtNum(beta)} with respect to the S&P 500. The risk-free rate is ${pp(rf, 1)}. The current spot price of the S&P 500 is ${fmtNum(S0)} and the multiplier of each futures contract is 250.`);
  const v = rint(0, 3);
  const base = p_(`Unhedged: V<sub>t+1</sub> = V(1 + r<sub>f</sub> + α − βr<sub>f</sub>) + Vβr<sub>M</sub> + Ve = ${expr(c0, V * beta, V)}.`);
  if (v === 0) {
    return mcText('PS6.unhedged', '6', html + p_('Which expression gives the value of your unhedged portfolio (in $ million) at t+1?'), expr(c0, V * beta, V),
      [expr(V, V, V), expr(V * (1 + rf + a), V * beta, V), expr(c0, V * beta, V * beta), expr(V * a, -V * beta, 0), expr(c0 + h0, 0, V), expr(V * (1 + a), V * beta, V)],
      p_(`The intercept is V(1 + r<sub>f</sub> + α − r<sub>f</sub>β) = ${f3(V)} × (1 + ${fmtNum(rf, 3)} + ${fmtNum(a, 3)} − ${fmtNum(rf, 3)} × ${fmtNum(beta)}) = ${f3(c0)}, the slope on the market is Vβ = ${f3(V * beta)} and the residual is Ve = ${f3(V)}e.`), true);
  }
  if (v === 1) {
    return mcText('PS6.unhedged', '6', html + p_('You sell index futures to obtain a market-neutral, portable alpha position. Which expression gives the value of the futures position (in $ million) at t+1?'), expr(h0, -V * beta, 0),
      [expr(0, -V * beta, 0), expr(h0, V * beta, 0), expr(V * rf, -V, 0), expr(h0, -V * beta, V), expr(V * rf, -V * beta, 0)],
      p_(`Sell N = Vβ/(S<sub>0</sub> × 250) = ${n} contracts. With F<sub>0</sub> = S<sub>0</sub>(1 + r<sub>f</sub>), the short position pays H<sub>t+1</sub> = Vβ(r<sub>f</sub> − r<sub>M</sub>) = ${expr(h0, -V * beta, 0)}. It has no residual: it is a position in the benchmark only.`), true);
  }
  if (v === 2) {
    return mcText('PS6.unhedged', '6', html + p_('You hedge the market exposure with S&P 500 futures. Which expression gives the value of the hedged, portable alpha portfolio (in $ million) at t+1?'), expr(V * (1 + rf + a), 0, V),
      [expr(V * (1 + rf + a), V * beta, V), expr(c0, 0, V), expr(V * (1 + a), 0, V), expr(V * (1 + rf + a), 0, V * beta), expr(V * (1 + rf + a), 0, 0)],
      base + p_(`Futures: H<sub>t+1</sub> = ${expr(h0, -V * beta, 0)}. Hedged: V<sub>t+1</sub> + H<sub>t+1</sub> = V(1 + r<sub>f</sub> + α) + Ve = ${expr(V * (1 + rf + a), 0, V)}. Market risk is gone; specific risk remains.`), true);
  }
  return mcNum('PS6.unhedged', '6', html + p_('How many S&P 500 futures contracts must you sell to obtain a market-neutral, portable alpha strategy?'), n,
    [V * 1e6 / (S0 * 250), n * beta, V * 1e6 / (beta * S0 * 250), n / 2, n + 1], x => fmtNum(x, 2),
    { sol: p_(`N = V × β / (S<sub>0</sub> × multiplier) = ${usd(V * 1e6)} × ${fmtNum(beta)} / (${fmtNum(S0)} × 250) = ${n}.`) });
}

export function PS6_fees(): Question {
  const mg = pick([0.01, 0.015, 0.02]), inc = pick([0.15, 0.2, 0.2, 0.25]), h = pick([0.01, 0.01, 0.02, 0.03, 0.05]);
  const A1 = rstep(0.5, 5, 0.25), A2 = rstep(0.5, 5, 0.25), r1 = rstep(0.06, 0.35, 0.01), r2 = rstep(-0.35, -0.02, 0.01);
  const T = A1 + A2, gross = A1 * r1 + A2 * r2, mgmt = mg * T, i1 = A1 * inc * Math.max(r1 - h, 0);
  const net = (gross - mgmt - i1) / T;
  const html = p_(`A university trust invests $${fmtNum(A1)} million in hedge fund A and $${fmtNum(A2)} million in hedge fund B. Both hedge funds charge a ${P(inc, 0)} incentive fee on returns over a hurdle rate of ${P(h, 0)} and a ${P(mg, 1)} fee on assets under management. At the end of the year fund A has a gross return of ${pp(r1, 0)} and fund B ${pp(r2, 0)}. What is the after-fees return of the trust’s investment in hedge funds in that year?`);
  const sol = p_(`Profit before fees: ${fmtNum(A1)} × ${pp(r1, 0)} + ${fmtNum(A2)} × (${pp(r2, 0)}) = ${f3(gross)} million. Management fees: ${P(mg, 1)} × ${fmtNum(T)} = ${f3(mgmt)}. Incentive fee in A: ${fmtNum(A1)} × ${fmtNum(inc)} × (${pp(r1, 0)} − ${P(h, 0)}) = ${f3(i1)}; B is below the hurdle and pays none. After fees: ${f3(gross - mgmt - i1)} million, a return of ${pp(net)} on ${fmtNum(T)} million.`);
  const wrongs = [(gross - mgmt - A1 * inc * r1) / T, (gross - mgmt - i1 - A2 * inc * (r2 - h)) / T, (gross - i1) / T, (gross - mgmt - inc * Math.max(gross / T - h, 0) * T) / T, gross / T, (gross - mgmt) / T];
  return mcNum('PS6.fees', '6', html, net, wrongs, x => pp(x, 1), { sol, last: CANNOT, step: 0.005 });
}

export function PS6_portable(): Question {
  const { n, S0, beta, V, a, rf, c0, h0 } = portableDraw();
  const html = p_(`You manage a $${f3(V)} million portfolio with an alpha of ${pp(a, 1)} and a beta of ${fmtNum(beta)} with respect to the S&P 500. The risk-free rate is ${pp(rf, 1)}. The current spot price of the S&P 500 is ${fmtNum(S0)} and the multiplier of each futures contract is 250. Write values at t+1 in $ million as a + b·r<sub>M</sub> + c·e.`);
  const parts: Part[] = [
    N('Unhedged portfolio at t+1: what is the constant a?', c0, 'musd'),
    N('… the coefficient b on the market return?', V * beta, 'musd'),
    N('… and the coefficient c on the residual?', V, 'musd'),
    C('A portable alpha strategy', ['removes the market exposure, so the expected excess return isolates alpha', 'removes both market risk and specific risk', 'doubles the market exposure to amplify alpha'], 0),
    N('How many S&P 500 futures contracts do you need for a market-neutral position?', n, 'n'),
    C('Do you buy or sell them?', ['Sell', 'Buy'], 0),
    N('Futures position at t+1: what is its constant?', h0, 'musd'),
    N('… and its coefficient on the market return?', -V * beta, 'musd'),
    N('Hedged portable alpha portfolio at t+1: what is its constant?', c0 + h0, 'musd'),
  ];
  const sol = p_(`V(1 + r<sub>f</sub> + α − r<sub>f</sub>β) = ${f3(c0)}, Vβ = ${f3(V * beta)}, so V<sub>t+1</sub> = ${expr(c0, V * beta, V)}. Selling index futures cancels the market exposure; the expected excess return is then alpha.`) +
    p_(`N = Vβ/(S<sub>0</sub> × 250) = ${usd(V * 1e6)} × ${fmtNum(beta)} / (${fmtNum(S0)} × 250) = ${n}, sold. H<sub>t+1</sub> = N × 250 × S<sub>0</sub> × (r<sub>f</sub> − r<sub>M</sub>) = ${expr(h0, -V * beta, 0)}. V<sub>t+1</sub> + H<sub>t+1</sub> = ${expr(c0 + h0, 0, V)}: no market risk, only the residual remains.`);
  return { ...Q('PS6.portable', '6', html, parts), solution: sol };
}

const EXTRA: Record<string, ConceptMc[]> = {
  '6': [
    { q: 'Explain what is meant by an “efficiently inefficient” market.', correct: ['Small inefficiencies remain that sophisticated investors with flexible strategies can exploit; they persist because the capital that can be devoted to them is limited, and they are just large enough to pay for the costs of making markets nearly efficient.'], distractors: ['Markets are fully efficient, so no investor can earn a positive alpha.', 'Markets are so inefficient that most institutional investors beat the index after fees.', 'Prices react to news only after several months, so technical analysis works.'] },
    { q: 'Why do hedge funds that diversify across many other hedge funds (funds of funds) hurt their investors through fees?', correct: ['Incentive fees are paid fund by fund, so winners collect fees even when the total portfolio loses.'], distractors: ['Management fees are charged only on losing funds.', 'Diversification raises the hurdle rate of every fund.', 'Funds of funds pay no incentive fees at all.'] },
  ],
  '3': [
    { q: 'What is meant by a “bogey” portfolio, and how is performance decomposed relative to it?', correct: ['A passive portfolio in the same asset classes with neutral weights; the difference splits into asset allocation Σ(w_P − w_B)r_B and security selection Σw_P(r_P − r_B).'], distractors: ['The best-performing fund in the peer group; the difference is all due to skill.', 'A portfolio of only T-bills; the difference is the risk premium.', 'The market portfolio levered to the fund’s beta; the difference is Jensen’s alpha.'] },
  ],
};

export function PS6_hwm(): Question {
  const inc = pick([0.2, 0.2, 0.15]), r = [rstep(0.05, 0.3, 0.01), rstep(-0.3, -0.05, 0.01), rstep(0.05, 0.35, 0.01)];
  let V = 100, hwm = 100; const g: number[] = [], fee: number[] = [], val: number[] = [];
  for (const x of r) { const gv = V * (1 + x), f = Math.max(0, gv - hwm) * inc; g.push(gv); fee.push(f); V = gv - f; val.push(V); hwm = Math.max(hwm, V); }
  const html = p_(`You invest $100 in a hedge fund with a ${P(inc, 0)} incentive fee subject to a high-water mark; ignore management fees. Gross returns in years 1–3 are ${r.map(x => pp(x, 0)).join(', ')}. Fees are deducted at the end of each year. What incentive fee is paid in year 3?`);
  const hw = Math.max(100, val[0]);
  const sol = p_(`Year 1: the value grows to ${money(g[0])}, the fee is ${P(inc, 0)} × (${money(g[0])} − $100) = ${money(fee[0])}, leaving ${money(val[0])}, the new high-water mark. Year 2: ${money(val[1])}, no fee. Year 3: ${money(g[2])} before fees; ${g[2] > hw ? `only the part above the high-water mark of ${money(hw)} is charged: ${P(inc, 0)} × ${money(g[2] - hw)} = ${money(fee[2])}.` : `still below the high-water mark of ${money(hw)}, so no incentive fee is paid.`}`);
  return mcNum('PS6.hwm', '6', html, fee[2], [inc * val[1] * r[2], inc * Math.max(0, g[2] - Math.max(100, g[0])), inc * Math.max(0, g[2] - 100), inc * r[2] * 100, 0], money, { sol, step: 1 });
}

export function PS6_fof(): Question {
  const inc = pick([0.15, 0.2, 0.2]), h = pick([0, 0.01, 0.02]), amt = rstep(1, 3, 0.5);
  const rs = shuffle([rstep(0.1, 0.35, 0.01), rstep(-0.3, -0.05, 0.01), rstep(-0.25, 0.05, 0.01)]);
  const agg = rs.reduce((s, x) => s + x, 0) / 3, fees = rs.reduce((s, x) => s + amt * inc * Math.max(x - h, 0), 0);
  const single = 3 * amt * inc * Math.max(agg - h, 0);
  const html = p_(`A fund of funds invests $${fmtNum(amt)} million in each of three hedge funds. Each fund charges an incentive fee of ${P(inc, 0)} on returns above a hurdle of ${P(h, 0)}; ignore management fees. Gross returns are ${rs.map(x => pp(x, 0)).join(', ')}. What incentive fees does the fund of funds pay in total (in $ million)?`);
  const sol = p_(`Fees are computed fund by fund: ${rs.map(x => `${fmtNum(amt)} × ${fmtNum(inc)} × max(${pp(x, 0)} − ${P(h, 0)}, 0)`).join(' + ')} = $${f3(fees)} million, although the aggregate gross return is only ${pp(agg)}. A single fund running all three strategies would charge $${f3(single)} million.`);
  return mcNum('PS6.fof', '6', html, fees, [single, rs.reduce((s, x) => s + amt * inc * (x - h), 0), rs.reduce((s, x) => s + amt * inc * Math.max(x, 0), 0), inc * Math.max(...rs) * amt], x => '$' + f3(x) + 'm', { sol, step: 0.05 });
}

export function PS6_lagBeta(): Question {
  const name = fund('Capital');
  const b0 = rstep(0.1, 0.6, 0.05), b1 = rstep(0.1, 0.5, 0.05), b2 = rstep(0.05, 0.3, 0.05);
  const rm = rstep(0.004, 0.008, 0.0005), sa = rstep(0.002, 0.006, 0.0005), adj = sa - (b1 + b2) * rm;
  const html = p_(`${name} holds illiquid securities. A regression of its monthly excess returns on the contemporaneous market excess return gives a beta of ${fmtNum(b0)} and an alpha of ${pp(sa)} per month. Adding the market excess returns of the previous two months gives coefficients of ${fmtNum(b0)}, ${fmtNum(b1)} and ${fmtNum(b2)}. The average market excess return is ${pp(rm)} per month.`);
  if (chance(0.5)) {
    return mcNum('PS6.lagBeta', '6', html + p_('What is the Scholes-Williams corrected beta?'), b0 + b1 + b2, [b0, b0 + b1, (b0 + b1 + b2) / 3, b1 + b2, b0 * 3], x => fmtNum(x, 2),
      { sol: p_(`Stale prices spread the fund’s market exposure over several months. The corrected beta sums the coefficients: ${fmtNum(b0)} + ${fmtNum(b1)} + ${fmtNum(b2)} = ${fmtNum(b0 + b1 + b2)}, ${fmtNum((b0 + b1 + b2) / b0, 2)} times the simple estimate.`) });
  }
  return mcNum('PS6.lagBeta', '6', html + p_('What is the monthly alpha after the Scholes-Williams correction?'), adj, [sa, sa + (b1 + b2) * rm, sa - (b0 + b1 + b2) * rm, sa - b1 * rm], x => pp(x, 3),
    { sol: p_(`The average excess return is α + β<sub>0</sub>r̄<sub>M</sub> = ${pp(sa + b0 * rm, 3)}. With the corrected beta ${fmtNum(b0 + b1 + b2)}, alpha = ${pp(sa + b0 * rm, 3)} − ${fmtNum(b0 + b1 + b2)} × ${pp(rm)} = ${pp(adj, 3)}: simple regressions overstate hedge fund alphas.`), step: 0.001 });
}

export const PS6_concept = () => shortAnswer('PS6.short', '6');

// ---------------------------------------------------------------------
// Problem sets and their question types
// ---------------------------------------------------------------------

export type PsTypeSpec = { key: string; name: string; gen: () => Question; fromPs: boolean };
export type PsSpec = { id: string; topic: string; title: string; types: PsTypeSpec[] };

const T = (key: string, name: string, gen: () => Question, fromPs = true): PsTypeSpec => ({ key, name, gen, fromPs });

export const PROBLEM_SETS: PsSpec[] = [
  { id: '1', topic: '1', title: 'CAPM', types: [
    T('PS1.corrPrice', 'Price after a change in correlation', PS1_corrPrice),
    T('PS1.fair', 'Fair return and alpha', PS1_fair),
    T('PS1.scenario', 'Betas, SML and alphas from two scenarios', PS1_scenario),
    T('PS1.equilibrium', 'Could this happen in a CAPM equilibrium?', PS1_equilibrium),
    T('PS1.impliedBeta', 'Implied beta', PS1_impliedBeta),
    T('PS1.zeroBeta', 'Zero-beta CAPM', PS1_zeroBeta),
    T('PS1.mimic', 'Alpha and the mimicking portfolio', PS1_mimic),
    T('PS1.project', 'Cost of equity for a project', PS1_project),
    T('PS1.cml', 'CML, CAL and risk aversion', PS1_cml, false),
    T('PS1.sim', 'Single-index model: covariance and residual risk', PS1_sim, false),
    T('PS1.liquidity', 'Liquidity-adjusted CAPM', PS1_liquidity, false),
    T('PS1.short', 'Short answers', PS1_concept, false),
  ] },
  { id: '2', topic: '2', title: 'APT', types: [
    T('PS2.surprise', 'Expected return given factor surprises', PS2_surprise),
    T('PS2.twoFactor', 'Two-factor SML', PS2_twoFactor),
    T('PS2.arbitrage', 'One-factor SML and arbitrage', PS2_arbitrage),
    T('PS2.impliedRf', 'Risk-free rate from two portfolios', PS2_impliedRf),
    T('PS2.longShort', 'Long-short alpha portfolio', PS2_longShort),
    T('PS2.diversify', 'Diversification of specific risk', PS2_diversify, false),
    T('PS2.emh', 'Forms of market efficiency', PS2_emh, false),
    T('PS2.short', 'Short answers', PS2_concept, false),
  ] },
  { id: '3', topic: '3', title: 'Portfolio performance measurement', types: [
    T('PS3.ir', 'Information ratio from a regression', PS3_ir),
    T('PS3.tstat', 'Months until alpha is significant', PS3_tstat),
    T('PS3.attribution', 'Asset allocation and security selection', PS3_attribution),
    T('PS3.short', 'Short answers', PS3_concept),
    T('PS3.ratios', 'Sharpe, Treynor, Jensen and M²', PS3_ratios, false),
    T('PS3.dwr', 'Time- and dollar-weighted returns', PS3_dwr, false),
    T('PS3.whichMeasure', 'Which measure fits?', PS3_whichMeasure, false),
  ] },
  { id: '4', topic: '4', title: 'Active portfolio management', types: [
    T('PS4.tbWeights', 'Treynor-Black weights of two stocks', PS4_tbWeights),
    T('PS4.trueFalse', 'True or false', PS4_trueFalse),
    T('PS4.simCov', 'Single-index model assumptions and covariance', PS4_simCov),
    T('PS4.bl', 'Black-Litterman exercise', PS4_bl),
    T('PS4.tb', 'Treynor-Black exercise', PS4_tb),
    T('PS4.fee', 'Fee for active management', PS4_fee),
    T('PS4.activeWeight', 'Weight of the active portfolio', PS4_activeWeight, false),
    T('PS4.sharpe', 'Sharpe ratio of the optimal portfolio', PS4_sharpe, false),
    T('PS4.te', 'Benchmark risk', PS4_te, false),
    T('PS4.short', 'Short answers', PS4_concept, false),
  ] },
  { id: '6', topic: '6', title: 'Hedge funds', types: [
    T('PS6.compare', 'Mutual funds versus hedge funds', PS6_compare),
    T('PS6.unhedged', 'Portable alpha: value expressions', PS6_unhedged),
    T('PS6.fees', 'After-fee return of two hedge funds', PS6_fees),
    T('PS6.short', 'Short answers', PS6_concept),
    T('PS6.portable', 'Portable alpha exercise', PS6_portable),
    T('PS6.hwm', 'High-water mark', PS6_hwm, false),
    T('PS6.fof', 'Incentive fees in a fund of funds', PS6_fof, false),
    T('PS6.lagBeta', 'Stale prices and Scholes-Williams beta', PS6_lagBeta, false),
  ] },
];
