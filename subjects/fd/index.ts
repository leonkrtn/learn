import { genConcept } from '@/lib/engine/concepts';
import { resetNames } from '@/lib/engine/gen-helpers';
import type { GenCtx, Question, TypeDef } from '@/lib/engine/types';
import type { ProblemSet, SubjectModule } from '@/lib/subject';
import { CHEATSHEET } from './cheatsheet';
import { LECTURES } from './concepts';
import FormulaSheet from './FormulaSheet';
import * as G from './generators';
import { PROBLEM_SETS } from './ps';
import { THEORY } from './theory';

const NUMERIC: [key: string, name: string, gen: () => Question][] = [
  ['L1.bounds', 'Intrinsic value, time value and bounds', G.L1_bounds],
  ['L1.parity', 'Put-call parity and arbitrage', G.L1_parity],
  ['L1.putInterval', 'Arbitrage-free put quotes from call quotes', G.L1_putInterval],
  ['L1.earlyPut', 'Early exercise of an American put', G.L1_earlyPut],
  ['L1.dividend', 'Dividends: bounds and early exercise of calls', G.L1_dividend],
  ['L2.strategy', 'Spreads, straddles, strangles and butterflies', G.L2_strategy],
  ['L2.butterfly', 'Cheapest butterfly from bid-ask quotes', G.L2_butterfly],
  ['L2.portfolio', 'Portfolio of options: value and payoff', G.L2_portfolio],
  ['L2.identify', 'Name the strategy', G.L2_identify],
  ['L3.replicate', 'One-period replication and arbitrage', G.L3_replicate],
  ['L3.twoStep', 'Two-period tree from volatility', G.L3_twoStep],
  ['L3.american', 'American versus European put', G.L3_american],
  ['L3.nPeriod', 'n-period binomial formula', G.L3_nPeriod],
  ['L3.dividendTree', 'Tree with a discrete dividend', G.L3_dividendTree],
  ['L3.yield', 'Index options with a dividend yield', G.L3_yield],
  ['L3.vol', 'Volatility from historical prices', G.L3_vol],
  ['L4.bs', 'Black-Scholes prices and delta', G.L4_bs],
  ['L4.probability', 'Exercise probabilities and implied volatility', G.L4_probability],
  ['L4.dividends', 'Black-Scholes with dividends', G.L4_dividends],
  ['L4.implied', 'Implied volatility', G.L4_implied],
  ['L4.lognormal', 'Distribution of the share price', G.L4_lognormal],
  ['L5.guaranteed', 'Guarantee plus options: α for the margin', G.L5_guaranteed],
  ['L5.floor', 'Commodity-linked product: bond plus put', G.L5_floor],
  ['L5.absolute', 'Absolute-return product K(1 + |R|)', G.L5_absolute],
  ['L5.participation', 'Capital-protected note: participation rate', G.L5_participation],
  ['L5.reverse', 'Reverse convertible: coupon', G.L5_reverse],
  ['L6.forward', 'Forward prices and cash-and-carry arbitrage', G.L6_forward],
  ['L6.value', 'Value of a forward contract', G.L6_value],
  ['L6.hedge', 'Hedging with futures', G.L6_hedge],
  ['L6.margin', 'Futures margin account', G.L6_margin],
  ['L6.swap', 'Swap rate and swap value', G.L6_swap],
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
  id: ps.id, title: ps.title, topic: ps.topic, label: 'Problem set 1, part ' + ps.id, source: 'problem set 1',
  types: ps.types.map(t => ({ key: t.key, name: t.name, topic: ps.topic, weight: 1, gen: fresh(t.gen), fromPs: t.fromPs })),
}));

const fd: SubjectModule = {
  slug: 'fd',
  name: 'Financial Derivatives',
  short: 'FD',
  tolerance: 0.02,
  topics: topicIds.map(id => ({ id, name: LECTURES[id], theory: 'lecture-' + id })),
  types,
  typeKeyOf: fam => /\.(false|true|tf|open)$/.test(fam) ? fam.replace(/\.[a-z]+$/, '.concept') : fam,
  problemSets,
  FormulaSheet,
  // Wrong answers on a practice question link to the theory page of its lecture.
  theory: THEORY.map(p => ({ ...p, types: [...p.types, ...problemSets.filter(s => s.topic === p.topic).flatMap(s => s.types.map(t => t.key))] })),
  cheatsheet: CHEATSHEET,
  answerNote: 'Enter numbers without units. Prices and amounts in euros (index options in index points); deltas, α and contract numbers as plain numbers. Rates, probabilities and volatilities may be entered as 12.5 or 0.125. Continuous compounding, days/365 and months/12 unless the question says otherwise. Decimal comma and decimal point both work.',
};

export default fd;
