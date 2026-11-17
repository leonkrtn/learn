import type { ExplainMap } from '@/lib/explain';
import { L1 } from './l1';
import { L2 } from './l2';
import { L3 } from './l3';
import { L4 } from './l4';
import { L5 } from './l5';
import { L6 } from './l6';
import { PS } from './ps';

/** Problem-set types that practise a lecture calculation in another format share its explanation. */
const SAME: Record<string, string> = {
  'PS1.fair': 'L1.capm', 'PS1.impliedBeta': 'L1.capm', 'PS1.project': 'L1.capm', 'PS1.scenario': 'L1.scenario', 'PS1.equilibrium': 'L1.equilibrium',
  'PS1.zeroBeta': 'L1.zeroBeta', 'PS1.mimic': 'L1.zeroBeta', 'PS1.cml': 'L1.cml', 'PS1.sim': 'L1.sim', 'PS1.simBeta': 'L1.sim', 'PS1.short': 'L1.concept',
  'PS2.surprise': 'L2.surprise', 'PS2.twoFactor': 'L2.twoFactor', 'PS2.arbitrage': 'L2.arbitrage', 'PS2.impliedRf': 'L2.arbitrage', 'PS2.longShort': 'L2.longShort', 'PS2.short': 'L2.concept',
  'PS3.ir': 'L3.ir', 'PS3.hfWeight': 'L3.ir', 'PS3.tstat': 'L3.tstat', 'PS3.attribution': 'L3.attribution', 'PS3.ratios': 'L3.ratios', 'PS3.m2Steps': 'L3.ratios', 'PS3.dwr': 'L3.dwr', 'PS3.short': 'L3.concept',
  'PS4.tbWeights': 'L4.treynorBlack', 'PS4.tb': 'L4.treynorBlack', 'PS4.activeWeight': 'L4.treynorBlack', 'PS4.sharpe': 'L4.treynorBlack', 'PS4.te': 'L4.treynorBlack', 'PS4.tbSteps': 'L4.treynorBlack',
  'PS4.bl': 'L4.blackLitterman', 'PS4.blPosterior': 'L4.blackLitterman', 'PS4.fee': 'L4.fee', 'PS4.feeInverse': 'L4.fee', 'PS4.trueFalse': 'L4.concept', 'PS4.short': 'L4.concept',
  'PS5.tangency': 'L5.markowitz', 'PS5.gmv': 'L5.markowitz', 'PS5.shrink': 'L5.shrinkage', 'PS5.trueFalse': 'L5.concept', 'PS5.short': 'L5.concept',
  'PS6.portable': 'L6.portable', 'PS6.unhedged': 'L6.portable', 'PS6.hedgeInverse': 'L6.portable', 'PS6.fees': 'L6.fees', 'PS6.fof': 'L6.fees',
  'PS6.hwm': 'L6.hwm', 'PS6.hwmRecover': 'L6.hwm', 'PS6.lagBeta': 'L6.lagBeta', 'PS6.short': 'L6.concept',
};

/** One explanation per question type, opened from a wrong answer. Every new type needs an entry (tests/explain.test.ts). */
export const EXPLAIN: ExplainMap = { ...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...PS, ...SAME };
