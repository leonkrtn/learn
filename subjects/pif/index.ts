import { genConcept, genConceptKind } from '@/lib/engine/concepts';
import { resetNames } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { MockExam, SubjectModule } from '@/lib/subject';
import { CHEATSHEET } from './cheatsheet';
import { LECTURES } from './concepts';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import { THEORY } from './theory';

const NUMERIC: [key: string, name: string, gen: () => Question][] = [
  ['L1.trace', 'Trace a For loop', G.L1_trace],
  ['L1.cells', 'Cells(row, col): reading and writing cells', G.L1_cells],
  ['L1.types', 'Variable types, assignment and &', G.L1_types],
  ['L2.array', 'Arrays and accumulators', G.L2_array],
  ['L2.signal', 'If / ElseIf / Else: which branch runs', G.L2_signal],
  ['L2.filter', 'Loop with an If: classify and count', G.L2_filter],
  ['L2.errors', 'Debugging: which error?', G.L2_errors],
  ['L3.tax', 'Progressive income tax with the Case 1 table', G.L3_tax],
  ['L3.table', 'Build a progressive tax table', G.L3_table],
  ['L3.code', 'The core loop: Exit For, < and <=', G.L3_code],
  ['L4.call', 'Classify(income, out_row) called in a loop', G.L4_call],
  ['L4.batch', 'Tax_Batch and Tax_One', G.L4_batch],
  ['L4.args', 'Call arguments and who owns which change', G.L4_args],
  ['L5.uniform', 'Uniform draws: Rnd() * (b − a) + a', G.L5_uniform],
  ['L5.norm', 'Normal draws with NormInv', G.L5_norm],
  ['L5.array', 'Writing an array to a Range', G.L5_array],
  ['L5.errors', 'Set, errors and the two ways to call Excel functions', G.L5_errors],
  ['L6.stats', 'Average, StDev_S, Covariance_S and correlation', G.L6_stats],
  ['L6.matrix', 'The covariance matrix', G.L6_matrix],
  ['L6.range', 'Range objects and the summary table', G.L6_range],
  ['L7.trace', 'Trace a user-defined function', G.L7_trace],
  ['L7.uniform', 'UniformArray: ReDim and array results', G.L7_uniform],
  ['L7.syntax', 'Function syntax', G.L7_syntax],
  ['L8.sharpe', 'sharpe_ratio from daily returns', G.L8_sharpe],
  ['L8.sortino', 'Sortino ratio and downside volatility', G.L8_sortino],
  ['L8.compare', 'Sharpe ratio, skewness and kurtosis', G.L8_compare],
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

/** Moodle quiz in the Safe Exam Browser: concept items, code reading and the finance cases; 100 marks in 120 minutes. */
function buildExam(ctx: GenCtx): MockExam {
  const seen = new Set<string>();
  const concept = [...topicIds, '1', '2', '5', '7'].map(t => {
    let q = genConcept(ctx.bank, t);
    for (let k = 0; k < 20 && seen.has(q.html); k++) q = genConcept(ctx.bank, t);
    seen.add(q.html); return q;
  });
  const reading = [G.L1_trace, G.L2_signal, G.L2_errors, G.L3_code, G.L4_batch, G.L5_array, G.L5_errors, G.L6_range, G.L7_trace, G.L7_syntax].map(f => fresh(f)());
  const cases = [G.L3_tax, G.L6_stats, G.L8_sharpe, G.L8_sortino].map(f => fresh(f)());
  concept.forEach(q => q.pts = 2);
  reading.forEach(q => q.pts = 4);
  cases.forEach(q => q.pts = 9);
  return {
    parts: [
      { title: 'Part I', pts: 24, qs: concept, note: 'Concepts: true/false and multiple choice, 2 marks each.' },
      { title: 'Part II', pts: 40, qs: reading, note: 'Read the code: what does it write, show or raise? 4 marks each, shared equally between sub-questions.' },
      { title: 'Part III', pts: 36, qs: cases, note: 'The course cases: income tax, portfolio statistics, Sharpe and Sortino ratios. 9 marks each.' },
    ],
  };
}

const pif: SubjectModule = {
  slug: 'pif',
  name: 'Programming in Finance',
  short: 'PIF',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'class-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  mock: {
    minutes: 120,
    maxPts: 100,
    intro: [
      'You have 120 minutes. The exam runs on Moodle in Safe Exam Browser mode.',
      'Open book: printed notes may be used.',
      'Enter returns, standard deviations and covariances as decimals (0.0123), taxes in euros.',
      'The structure of this mock is an estimate built from the class material, not the official paper.',
    ],
    build: buildExam,
    grade: s => (s / 5).toFixed(1) + ' on the 0–20 scale',
  },
  FormulaSheet,
  cheatsheet: CHEATSHEET,
  theory: THEORY,
  answerNote: 'Enter numbers without units. Returns, standard deviations, covariances and ratios as decimals (0.0123); taxes in euros; rates in percent may be entered as 26.5 or 0.265. Decimal comma and decimal point both work.',
};

export default pif;
