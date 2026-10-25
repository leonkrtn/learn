import { genConcept } from '@/lib/engine/concepts';
import { resetNames } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { SubjectModule } from '@/lib/subject';
import { LECTURES } from './concepts';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import { THEORY } from './theory';

// Lectures 3–8 are added here once their slides are available.
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

const fv: SubjectModule = {
  slug: 'fv',
  name: 'Firm Valuation',
  short: 'FV',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'lecture-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  // No mock exam until the structure of the final exam is known.
  FormulaSheet,
  theory: THEORY,
  answerNote: 'Enter numbers without units. Percentages may be entered as 12.5 or 0.125. Decimal comma and decimal point both work. Use the minus sign for negative values.',
};

export default fv;
