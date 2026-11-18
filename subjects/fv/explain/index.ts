import type { ExplainMap } from '@/lib/explain';
import { L1 } from './l1';
import { L2 } from './l2';
import { L3 } from './l3';
import { L4 } from './l4';
import { L5 } from './l5';
import { L6 } from './l6';
import { L7 } from './l7';
import { APV } from './ps';

/** Problem-set types that practise a lecture type's calculation point to its explanation. */
const SAME: Record<string, string> = {
  'X2.q1': 'L2.retention', 'X2.q2': 'L2.hModel', 'X2.q3': 'L2.deferred', 'X2.gordon': 'L2.gordon', 'X2.twoStage': 'L2.twoStage', 'X2.fcf': 'L2.fcf', 'X2.dcf': 'L2.dcf', 'X2.apv': 'L2.apv', 'X2.short': 'L2.concept',
  'X3.q1': 'L3.market', 'X3.q2': 'L3.fundamental', 'X3.q3': 'L3.margin', 'X3.hist': 'L3.hist', 'X3.trend': 'L3.trend', 'X3.fundamental': 'L3.fundamental', 'X3.short': 'L3.concept',
  'X4.q2': 'L4.bottomUp', 'X4.implied': 'L4.implied', 'X4.beta': 'L4.beta', 'X4.segments': 'L4.bottomUp', 'X4.debt': 'L4.debt', 'X4.short': 'L4.concept',
  'X6.q1': 'L6.case', 'X6.q2': 'L6.options', 'X6.holdings': 'L6.holdings', 'X6.options': 'L6.options', 'X6.cash': 'L6.cash', 'X6.commit': 'L6.commit', 'X6.short': 'L6.concept',
  'X7.q1': 'L7.multiples', 'X7.q2': 'L7.concept', 'X7.zimco': 'L7.exit', 'X7.lam': 'L7.exit', 'X7.astor': 'L7.regression', 'X7.compare': 'L7.compare', 'X7.fundPE': 'L7.fundPE', 'X7.regression': 'L7.regression', 'X7.short': 'L7.concept',
  'E21.q1': 'L3.fundamental', 'E21.q2': 'L4.implied', 'E21.q4': 'L4.beta', 'E21.q5': 'E21.q3', 'E21.IIc': 'E21.III',
  'E22.q1': 'L4.beta', 'E22.q2': 'L2.retention', 'E22.q3': 'E21.q3', 'E22.q4': 'L5.rf', 'E22.II1': 'L2.apv', 'E22.II2': 'L7.compare', 'E22.III': 'E21.III',
  'E23.q1': 'L4.implied', 'E23.q2': 'L4.bottomUp', 'E23.q3': 'E21.q3', 'E23.q4': 'L5.crp', 'E23.q5': 'L3.hist', 'E23.IIa': 'L6.case', 'E23.III': 'E21.III',
  'E24.q1': 'L4.beta', 'E24.q3': 'E21.q3', 'E24.q4': 'L2.gordon', 'E24.q5': 'L3.fundamental', 'E24.IIa': 'L6.case', 'E24.IIb': 'L4.bottomUp', 'E24.III': 'E21.III',
};

/** One explanation per question type, opened from a wrong answer. Every new type needs an entry (tests/explain.test.ts). */
export const EXPLAIN: ExplainMap = { ...L1, ...L2, ...APV, ...L3, ...L4, ...L5, ...L6, ...L7, ...SAME };
