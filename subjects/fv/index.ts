import { genConcept, genConceptKind, type ConceptKind } from '@/lib/engine/concepts';
import { chance, pick, resetNames, shuffle } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { MockExam, ProblemSet, SubjectModule } from '@/lib/subject';
import { LECTURES } from './concepts';
import { CHEATSHEET } from './cheatsheet';
import { EXPLAIN } from './explain';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import * as G3 from './gen3';
import * as G4 from './gen4';
import * as G6 from './gen6';
import { L6_case, caseAccounts, caseApv, caseGrowth } from './case';
import { MOCK_MC, PROBLEM_SETS } from './ps';
import { THEORY } from './theory';

// Lecture 8 is added here once its slides are available; its extra question is a problem set.
const NUMERIC: [key: string, name: string, gen: () => Question][] = [
  ['L1.pv', 'DCF value versus market price', G.L1_pv],
  ['L1.bridge', 'Firm value and equity value', G.L1_bridge],
  ['L1.event', 'Event study: abnormal returns', G.L1_event],
  ['L2.gordon', 'Gordon growth model', G.L2_gordon],
  ['L2.retention', 'Retention, ROE and value', G.L2_retention],
  ['L2.twoStage', 'Two-stage DDM', G.L2_twoStage],
  ['L2.hModel', 'H-model', G.L2_hModel],
  ['L2.fcf', 'FCFF and FCFE from accounts', G.L2_fcf],
  ['L2.dcf', 'FCFF valuation and equity bridge', G.L2_dcf],
  ['L2.fcfe', 'FCFE valuation', G.L2_fcfe],
  ['L2.deferred', 'Deferred taxes and preferred stock', G.L2_deferred],
  ['L2.apv', 'Adjusted present value', G6.L2_apv],
  ['L3.hist', 'Historical growth: averages and variability', G3.L3_hist],
  ['L3.trend', 'Trend regression for negative earnings', G3.L3_trend],
  ['L3.fundamental', 'Fundamental growth: reinvestment and returns', G3.L3_fundamental],
  ['L3.market', 'Growth from market size and share', G3.L3_market],
  ['L3.margin', 'Revenue growth and margin path', G3.L3_margin],
  ['L4.implied', 'Implied equity risk premium', G4.L4_implied],
  ['L4.beta', 'Unlevered, relevered and total betas', G4.L4_beta],
  ['L4.bottomUp', 'Bottom-up betas and mergers', G4.L4_bottomUp],
  ['L4.debt', 'Cost of debt from a synthetic rating', G4.L4_debt],
  ['L4.wacc', 'Cost of capital (WACC)', G4.L4_wacc],
  ['L5.rf', 'Local-currency risk-free rate', G4.L5_rf],
  ['L5.crp', 'Country risk premium', G4.L5_crp],
  ['L5.ke', 'Cost of equity with country risk', G4.L5_ke],
  ['L6.options', 'Management options: diluted, treasury stock, option value', G6.L6_options],
  ['L6.holdings', 'Cross holdings and minority interests', G6.L6_holdings],
  ['L6.cash', 'Cash and the cost of net debt', G6.L6_cash],
  ['L6.commit', 'Contractual commitments as debt', G6.L6_commit],
  ['L6.case', 'Full valuation case (exam Part II)', L6_case],
  ['L7.multiples', 'Valuing with peer multiples', G6.L7_multiples],
  ['L7.compare', 'P/E and EV/EBITDA of two firms', G6.L7_compare],
  ['L7.fundPE', 'Multiples from fundamentals: P/E, PEG, P/B', G6.L7_fundPE],
  ['L7.exit', 'Terminal multiples and young firms', G6.L7_exit],
  ['L7.regression', 'Regression multiples', G6.L7_regression],
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

const problemSets: ProblemSet[] = PROBLEM_SETS.map(ps => ({
  id: ps.id, title: ps.title, topic: ps.topic, label: ps.label, source: ps.source, unit: 'Lecture',
  types: ps.types.map(t => ({ key: t.key, name: t.name, topic: t.topic, weight: 1, gen: fresh(t.gen), fromPs: t.fromPs })),
}));

const byKey = new Map([...types, ...problemSets.flatMap(p => p.types)].map(t => [t.key, t]));
const gen = (key: string, ctx: GenCtx) => byKey.get(key)!.gen(ctx);
const lecs = (n: number, from: string[]) => shuffle(from).slice(0, n);

/** Structure of the real paper: Part I five multiple-choice questions, Part II a valuation case, Part III (an essay in
 * the real exam) as multiple-choice concept questions. Questions are drawn evenly from all lectures. */
function buildExam(ctx: GenCtx): MockExam {
  const all = topicIds;
  const p1 = lecs(5, all).map(l => {
    const keys = MOCK_MC[l];
    return keys && chance(0.7) ? gen(pick(keys), ctx) : genConceptKind(ctx.bank, l, pick<ConceptKind>(['false', 'true']));
  });
  p1.forEach(q => q.pts = 3);
  resetNames();
  const r = Math.random();
  const kase = r < 0.4 ? caseGrowth('L6.case', '6', { nParts: [6, 8] }) : r < 0.55 ? caseGrowth('L2.apv', '2', { apv: true }) : r < 0.8 ? caseAccounts('L6.case', '6', { nParts: [6, 8] }) : caseApv('L2.apv', '2', { nParts: [5, 7] });
  kase.pts = 35;
  const extra = lecs(2, ['1', '3', '4', '5', '7']).map(l => {
    const nums = types.filter(t => t.topic === l && !t.key.endsWith('.concept'));
    const q = pick(nums).gen(ctx); q.pts = 10; return q;
  });
  const seen = new Set<string>();
  const p3 = [...all, ...lecs(3, all)].map((l, i) => {
    let q = genConceptKind(ctx.bank, l, i % 2 ? 'false' : 'open');
    for (let k = 0; k < 20 && seen.has(q.html + q.parts.map(p => 'options' in p ? p.options.join() : '').join()); k++) q = genConceptKind(ctx.bank, l, i % 2 ? 'false' : 'open');
    seen.add(q.html + q.parts.map(p => 'options' in p ? p.options.join() : '').join());
    q.pts = 3; return q;
  });
  return {
    parts: [
      { title: 'Part I', pts: 15, qs: p1, note: 'Multiple choice, suggested time 15 minutes. Only one answer is correct; there is no negative marking.' },
      { title: 'Part II', pts: 55, qs: [kase, ...extra], note: 'Suggested time 45 minutes. Questions within this part earn different points. Round only your final answers.' },
      { title: 'Part III', pts: 30, qs: shuffle(p3), note: 'Suggested time 30 minutes. In the real exam this part is an essay; here it is replaced by multiple-choice questions on the concepts of all lectures.' },
    ],
  };
}

const fv: SubjectModule = {
  slug: 'fv',
  name: 'Firm Valuation',
  short: 'FV',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'lecture-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  mock: {
    minutes: 90,
    maxPts: 100,
    intro: [
      'Closed-book exam, 90 minutes, three parts as in the past papers 2021–2024.',
      'Part I: 15 points (about 15 minutes). Part II: 55 points (about 45 minutes). Part III: 30 points (about 30 minutes).',
      'Multiple-choice questions: there is no negative marking.',
      'In the real exam Part III is an essay; here it is replaced by multiple-choice questions on the concepts of all lectures.',
      '100 points correspond to a grade of 20. You need at least 7.5 out of 20 in the final exam to pass.',
      'The formula sheet is available in the sidebar.',
    ],
    build: buildExam,
    grade: s => (Math.round(s / 5 * 10) / 10).toFixed(1) + ' on the 0–20 scale' + (s / 5 >= 7.5 ? ', above the 7.5 minimum for the final exam' : ', below the 7.5 minimum for the final exam'),
  },
  problemSets,
  FormulaSheet,
  cheatsheet: CHEATSHEET,
  // Wrong answers on a problem-set question link to the theory page of the lecture it practises.
  theory: THEORY.map(p => ({ ...p, types: [...p.types, ...problemSets.flatMap(s => s.types).filter(t => t.topic === p.topic).map(t => t.key)] })),
  explain: EXPLAIN,
  answerNote: 'Enter numbers without units. Percentages may be entered as 12.5 or 0.125. Betas and multiples as plain numbers. Amounts in millions unless the question asks per share. Decimal comma and decimal point both work. Use the minus sign for negative values.',
};

export default fv;
