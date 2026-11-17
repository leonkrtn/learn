import { genConcept } from '@/lib/engine/concepts';
import { resetNames } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { ProblemSet, SubjectModule } from '@/lib/subject';
import { LECTURES } from './concepts';
import { CHEATSHEET } from './cheatsheet';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import { PROBLEM_SETS } from './ps';
import { THEORY } from './theory';

const NUMERIC: [key: string, name: string, gen: () => Question][] = [
  ['L1.ipo', 'Cost of an IPO', G.L1_ipo],
  ['L1.rights', 'Rights issues', G.L1_rights],
  ['L1.winners', 'Underpricing and the winner’s curse', G.L1_winners],
  ['L2.riskyDebt', 'Risky debt: face value, spread and rating', G.L2_riskyDebt],
  ['L2.seniority', 'Senior and subordinated debt', G.L2_seniority],
  ['L2.straight', 'Financing with straight debt', G.L2_straight],
  ['L2.convertible', 'Financing with convertible debt', G.L2_convertible],
  ['L3.effort', 'Effort incentives: equity versus debt', G.L3_effort],
  ['L3.lemons', 'Asymmetric information and the pecking order', G.L3_lemons],
  ['L4.npv', 'NPV with incremental cash flows', G.L4_npv],
  ['L4.fcf', 'Free cash flow from financial statements', G.L4_fcf],
  ['L4.terminal', 'Salvage and continuation value', G.L4_terminal],
  ['L4.apv', 'APV with a debt schedule', G.L4_apv],
  ['L4.wacc', 'WACC and levered value', G.L4_wacc],
  ['L4.beta', 'Twin-firm beta and project WACC', G.L4_beta],
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
  id: ps.id, title: ps.title, topic: ps.topic, label: 'Set ' + ps.id, source: 'the quizzes and exercises',
  types: ps.types.map(t => ({ key: t.key, name: t.name, topic: ps.topic, weight: 1, gen: fresh(t.gen), fromPs: t.fromPs })),
}));

const ifd: SubjectModule = {
  slug: 'ifd',
  name: 'Investment and Financing Decisions',
  short: 'IFD',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'lecture-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  problemSets,
  FormulaSheet,
  cheatsheet: CHEATSHEET,
  // Wrong answers on a practice question link to the theory page of its lecture.
  theory: THEORY.map(p => ({ ...p, types: [...p.types, ...problemSets.filter(s => s.topic === p.topic).flatMap(s => s.types.map(t => t.key))] })),
  answerNote: 'Enter numbers without units. Amounts in millions where the question says so (72 for €72 million). Returns may be entered as 15.6 or 0.156. Decimal comma and decimal point both work.',
};

export default ifd;
