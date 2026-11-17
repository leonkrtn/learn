import type { ExplainMap } from '@/lib/explain';
import { L1 } from './l1';
import { L2 } from './l2';
import { L3 } from './l3';
import { L4 } from './l4';

/** Problem-set types that practise a lecture calculation in another format share its explanation. */
const SAME: Record<string, string> = {
  'PS1.ipo': 'L1.ipo', 'PS1.ipoMc': 'L1.ipo', 'PS1.rights': 'L1.rights', 'PS1.rightsMc': 'L1.rights', 'PS1.winners': 'L1.winners', 'PS1.short': 'L1.concept',
  'PS2.arden': 'L2.seniority', 'PS2.rating': 'L2.riskyDebt', 'PS2.faceMc': 'L2.riskyDebt', 'PS2.straight': 'L2.straight', 'PS2.convertible': 'L2.convertible', 'PS2.short': 'L2.concept',
  'PS3.effort': 'L3.effort', 'PS3.kappaMc': 'L3.effort', 'PS3.lemons': 'L3.lemons', 'PS3.pecking': 'L3.lemons', 'PS3.short': 'L3.concept',
  'PS4.fcf': 'L4.fcf', 'PS4.relevant': 'L4.npv', 'PS4.npvMc': 'L4.npv', 'PS4.apv': 'L4.apv', 'PS4.waccMc': 'L4.wacc', 'PS4.betaMc': 'L4.beta', 'PS4.terminalMc': 'L4.terminal', 'PS4.short': 'L4.concept',
};

/** One explanation per question type, opened from a wrong answer. Every new type needs an entry (tests/explain.test.ts). */
export const EXPLAIN: ExplainMap = { ...L1, ...L2, ...L3, ...L4, ...SAME };
