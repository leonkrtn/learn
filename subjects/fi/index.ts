import { genConcept, genConceptKind } from '@/lib/engine/concepts';
import { pick, resetNames } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { MockExam, SubjectModule } from '@/lib/subject';
import { LECTURES } from './concepts';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import { THEORY } from './theory';

const NUMERIC: [key: string, name: string, gen: () => Question][] = [
  ['L1.capm', 'CAPM: fair return, alpha, implied beta', G.L1_capm],
  ['L1.scenario', 'Betas and alphas from two scenarios', G.L1_scenario],
  ['L1.sim', 'Single-index model', G.L1_sim],
  ['L1.cml', 'CML, CAL and diversified portfolios', G.L1_cml],
  ['L1.zeroBeta', 'Zero-beta CAPM and mimicking portfolios', G.L1_zeroBeta],
  ['L1.equilibrium', 'What can happen in a CAPM equilibrium?', G.L1_equilibrium],
  ['L2.surprise', 'Factor surprises and conditional returns', G.L2_surprise],
  ['L2.twoFactor', 'Two-factor APT risk premiums', G.L2_twoFactor],
  ['L2.arbitrage', 'One-factor APT and arbitrage', G.L2_arbitrage],
  ['L2.longShort', 'Long-short alpha portfolios', G.L2_longShort],
  ['L3.ratios', 'Sharpe, Treynor, Jensen and M²', G.L3_ratios],
  ['L3.ir', 'Information ratio and residual risk', G.L3_ir],
  ['L3.tstat', 'Significance of alpha', G.L3_tstat],
  ['L3.attribution', 'Performance attribution', G.L3_attribution],
  ['L3.dwr', 'Time- vs. dollar-weighted returns', G.L3_dwr],
  ['L4.treynorBlack', 'Treynor-Black model', G.L4_treynorBlack],
  ['L4.blackLitterman', 'Black-Litterman model', G.L4_blackLitterman],
  ['L4.fee', 'Value of active management', G.L4_fee],
  ['L5.markowitz', 'Two-asset Markowitz portfolios', G.L5_markowitz],
  ['L5.shrinkage', 'Shrinkage of weights and covariances', G.L5_shrinkage],
  ['L6.portable', 'Portable alpha with futures', G.L6_portable],
  ['L6.fees', 'Hedge fund fees', G.L6_fees],
  ['L6.hwm', 'High-water mark', G.L6_hwm],
  ['L6.lagBeta', 'Scholes-Williams beta', G.L6_lagBeta],
];

const topicIds = Object.keys(LECTURES);
const fresh = (f: () => Question) => () => { resetNames(); return f(); };

const types: TypeDef[] = topicIds.flatMap(t => {
  const nums = NUMERIC.filter(([k]) => k.startsWith('L' + t + '.'));
  return [
    ...nums.map(([key, name, gen]) => ({ key, name, topic: t, weight: 0.6 / nums.length, gen: fresh(gen) })),
    { key: 'L' + t + '.concept', name: 'Concept questions', topic: t, weight: 0.4, gen: (ctx: GenCtx) => genConcept(ctx.bank, t) },
  ];
});

/** One self-contained numeric sub-question, like the calculation multiple-choice items of Part I. */
function single(f: () => Question): Question {
  resetNames();
  const q = f();
  const nums = q.parts.filter(p => p.type === 'num' && !p.prompt.startsWith('…'));
  return { ...q, parts: [pick(nums)] };
}

function distinct(n: number, pool: string[]): string[] {
  const out: string[] = [];
  while (out.length < n) { const x = pick(pool.filter(p => !out.includes(p))); out.push(x); }
  return out;
}

/** Same structure as the sample exam: 26 questions, 100 marks, 120 minutes. */
function buildExam(ctx: GenCtx): MockExam {
  const tfTopics = [...topicIds, ...topicIds, '1', '3', '6', '4', '6', '2', '5'].slice(0, 13);
  const seen = new Set<string>();
  const tf = tfTopics.map(t => {
    let q = genConceptKind(ctx.bank, t, 'tf');
    for (let k = 0; k < 20 && seen.has(q.html); k++) q = genConceptKind(ctx.bank, t, 'tf');
    seen.add(q.html); return q;
  });
  const calc = [G.L3_ratios, G.L1_cml, G.L3_ir, G.L1_capm, G.L1_sim, G.L6_fees].map(single);
  const p2 = [fresh(G.L4_treynorBlack)(), fresh(G.L3_attribution)(), fresh(G.L6_portable)()];
  const short = distinct(3, ['2', '4', '5', '1', '3']).map(t => genConceptKind(ctx.bank, t, 'open'));
  const disc = distinct(2, ['6', '3']).map(t => genConceptKind(ctx.bank, t, 'open'));
  [...tf, ...calc].forEach(q => q.pts = 2);
  p2[0].pts = 12; p2[1].pts = 6; p2[2].pts = 9;
  short.forEach(q => q.pts = 7); disc.forEach(q => q.pts = 7);
  return {
    parts: [
      { title: 'Part I', pts: 38, qs: [...tf, ...calc], note: 'Multiple choice, 2 marks each. Questions 14–19 are calculations; in the exam they come with options, here you enter the number.' },
      { title: 'Part II', pts: 27, qs: p2, note: 'Problem solving. Use at least three decimal places.' },
      { title: 'Part III', pts: 21, qs: short, note: 'Short answers, 7 marks each. Choose the answer that best matches a full short answer.' },
      { title: 'Part IV', pts: 14, qs: disc, note: 'Discussion. In the exam this is one essay; here two questions test the key points it should cover.' },
    ],
  };
}

const fi: SubjectModule = {
  slug: 'fi',
  name: 'Financial Investments',
  short: 'FI',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'lecture-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  mock: {
    minutes: 120,
    maxPts: 100,
    intro: ['You have 120 minutes, with no tolerance.', 'In all computations use at least three decimal places.', 'If you cannot obtain a result you need later, assume a value and carry on.', 'Wrong multiple-choice answers get zero; there are no negative marks.'],
    build: buildExam,
    grade: s => (s / 5).toFixed(1) + ' on the 0–20 scale',
  },
  FormulaSheet,
  theory: THEORY,
  answerNote: 'Enter numbers without units. Percentages may be entered as 8.33 or 0.0833. Weights and ratios are plain decimals. Decimal comma and decimal point both work.',
};

export default fi;
