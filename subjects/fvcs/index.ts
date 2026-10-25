import { genConcept, genConceptKind } from '@/lib/engine/concepts';
import { resetNames } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { MockExam, SubjectModule } from '@/lib/subject';
import { LECTURES } from './concepts';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import { THEORY } from './theory';

const NUMERIC: [key: string, name: string, gen: () => Question][] = [
  ['L1.project', 'Project financing with debt and equity', G.L1_project],
  ['L1.mm2', 'MM II and the WACC', G.L1_mm2],
  ['L1.recap', 'Leveraged recap (perfect market)', G.L1_recap],
  ['L1.eps', 'Leverage and EPS', G.L1_eps],
  ['L1.beta', 'Levered and unlevered betas', G.L1_beta],
  ['L1.homemade', 'Homemade leverage', G.L1_homemade],
  ['L2.itsFinite', 'PV of interest tax shields', G.L2_itsFinite],
  ['L2.income', 'Interest deduction and income limit', G.L2_income],
  ['L2.recapTax', 'Recap with corporate taxes', G.L2_recapTax],
  ['L2.target', 'Tax shield with target D/E', G.L2_target],
  ['L2.personal', 'Personal taxes and τ*', G.L2_personal],
  ['L2.hamada', 'Levered beta formula and WACC', G.L2_hamada],
  ['L3.twoState', 'Distress costs: two outcomes', G.L3_twoState],
  ['L3.multiState', 'Distress costs: several outcomes', G.L3_multiState],
  ['L3.tradeoff', 'Trade-off theory: optimal debt', G.L3_tradeoff],
  ['L4.assetSub', 'Asset substitution', G.L4_assetSub],
  ['L4.overhang', 'Debt overhang', G.L4_overhang],
  ['L4.cashout', 'Cashing out', G.L4_cashout],
  ['L4.petron', 'Strategy choice under leverage', G.L4_petron],
  ['L4.empire', 'Agency benefits of debt', G.L4_empire],
  ['L5.financing', 'Cost of financing sources', G.L5_financing],
  ['L5.lemons', 'Adverse selection in equity markets', G.L5_lemons],
  ['L5.signal', 'Leverage as a signal', G.L5_signal],
  ['L6.vc', 'Venture capital rounds', G.L6_vc],
  ['L6.rounds', 'Multiple funding rounds', G.L6_rounds],
  ['L6.spac', 'SPAC deal analysis', G.L6_spac],
];

const topicIds = Object.keys(LECTURES);
const fresh = (f: () => Question) => () => { resetNames(); return f(); };

const types: TypeDef[] = topicIds.flatMap(t => {
  const nums = NUMERIC.filter(([k]) => k.startsWith('L' + t + '.'));
  return [
    ...nums.map(([key, name, gen]) => ({ key, name, topic: t, weight: 0.65 / nums.length, gen: fresh(gen) })),
    { key: 'L' + t + '.concept', name: 'Concept questions', topic: t, weight: 0.35, gen: (ctx: GenCtx) => genConcept(ctx.bank, t) },
  ];
});

const genByKey = (k: string) => { const f = NUMERIC.find(n => n[0] === k)![2]; resetNames(); return f(); };

function pickFam(pool: [string, number][], used: Set<string>): string {
  const opts = pool.filter(([k]) => !used.has(k));
  const tot = opts.reduce((s, o) => s + o[1], 0);
  let r = Math.random() * tot;
  for (const o of opts) { r -= o[1]; if (r <= 0) { used.add(o[0]); return o[0]; } }
  used.add(opts[0][0]); return opts[0][0];
}

function lecsDistinct(n: number, weights: number[]): string[] {
  const out: string[] = [];
  const pool = topicIds.map((l, i) => [l, weights[i]] as [string, number]);
  while (out.length < n) {
    const opts = pool.filter(([l]) => !out.includes(l));
    const tot = opts.reduce((s, o) => s + o[1], 0);
    let r = Math.random() * tot;
    for (const o of opts) { r -= o[1]; if (r <= 0) { out.push(o[0]); break; } }
    if (r > 0) out.push(opts[opts.length - 1][0]);
  }
  return out;
}

/** Structure of the real paper: 4 parts, 20 points, 120 minutes. */
function buildExam(ctx: GenCtx): MockExam {
  const used = new Set<string>();
  const P1a: [string, number][] = [['L2.recapTax', 4], ['L1.recap', 1], ['L1.eps', 1], ['L1.project', 1], ['L1.mm2', 1]];
  const P1b: [string, number][] = [['L2.target', 4], ['L2.itsFinite', 1.5], ['L2.personal', 1], ['L2.hamada', 1], ['L1.beta', 1], ['L1.homemade', 0.5]];
  const P2a: [string, number][] = [['L4.assetSub', 3], ['L4.petron', 1.5], ['L4.cashout', 1], ['L3.twoState', 1.5], ['L3.multiState', 1]];
  const P2b: [string, number][] = [['L4.overhang', 3], ['L3.tradeoff', 1], ['L4.empire', 1], ['L5.financing', 1.5], ['L5.lemons', 1], ['L3.multiState', 0.5]];
  const P2c: [string, number][] = [['L6.vc', 4], ['L6.rounds', 1], ['L6.spac', 1]];
  const num = (pools: [string, number][][]) => pools.map(p => genByKey(pickFam(p, used)));
  const part1 = num([P1a, P1b]), part2 = num([P2a, P2b, P2c]);
  const mc = lecsDistinct(3, [1, 3, 2, 2.5, 1.5, 1.5]).map(l => genConceptKind(ctx.bank, l, 'false'));
  const seen = new Set<string>();
  const short = lecsDistinct(5, [1, 2, 2, 2, 1.5, 2]).map(l => {
    let q = genConceptKind(ctx.bank, l, 'open');
    for (let t = 0; t < 20 && seen.has(q.html); t++) q = genConceptKind(ctx.bank, l, 'open');
    seen.add(q.html); return q;
  });
  const tf = lecsDistinct(3, [2, 1.5, 1, 1.5, 2, 2]).map(l => genConceptKind(ctx.bank, l, 'tf'));
  part1.forEach(q => q.pts = 2); part2.forEach(q => q.pts = 2); mc.forEach(q => q.pts = 1); short.forEach(q => q.pts = 0.8); tf.forEach(q => q.pts = 1);
  return {
    parts: [
      { title: 'Part 1', pts: 4, qs: part1 },
      { title: 'Part 2', pts: 6, qs: part2 },
      { title: 'Part 3', pts: 7, qs: [...mc, ...short], note: 'Questions 1–3: only one answer is correct. Questions 4–8: choose the answer that best describes the correct short answer.' },
      { title: 'Part 4', pts: 3, qs: tf, note: 'Decide whether each statement is TRUE or FALSE.' },
    ],
  };
}

const fvcs: SubjectModule = {
  slug: 'fvcs',
  name: 'Firm Value and Capital Structure',
  short: 'FVCS',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'lecture-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  mock: {
    minutes: 120,
    maxPts: 20,
    intro: ['You have 120 minutes to complete the exam.', 'Please round all results to two decimals.', 'If you consider something ambiguous, make a sound assumption.', 'The formula sheet is available in the sidebar.'],
    build: buildExam,
    grade: s => (Math.round(s * 10) / 10).toFixed(1) + ' on the 0–20 scale' + (s >= 9.5 ? ', pass' : ', fail'),
  },
  FormulaSheet,
  theory: THEORY,
  answerNote: 'Enter numbers without units. Percentages may be entered as 12.5 or 0.125. Decimal comma and decimal point both work. Use the minus sign for negative values.',
};

export default fvcs;
