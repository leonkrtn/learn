import type { ExplainMap } from '@/lib/explain';
import { L1 } from './l1';
import { L2 } from './l2';
import { L3 } from './l3';
import { L4 } from './l4';
import { L5 } from './l5';
import { L6 } from './l6';

/** Problem-set types that practise a lecture calculation in another format share its explanation. */
const SAME: Record<string, string> = {
  'PS1.ex2a': 'L1.putInterval', 'PS1.bounds': 'L1.bounds', 'PS1.parity': 'L1.parity', 'PS1.earlyPut': 'L1.earlyPut', 'PS1.dividend': 'L1.dividend', 'PS1.short': 'L1.concept',
  'PS2.ex2b': 'L2.butterfly', 'PS2.ex3f': 'L2.strategy', 'PS2.ex4': 'L2.portfolio', 'PS2.strategy': 'L2.strategy', 'PS2.identify': 'L2.identify', 'PS2.short': 'L2.concept',
  'PS3.ex3': 'L3.dividendTree', 'PS3.ex5': 'L3.yield', 'PS3.replicate': 'L3.replicate', 'PS3.american': 'L3.american', 'PS3.nPeriod': 'L3.nPeriod', 'PS3.vol': 'L3.vol', 'PS3.short': 'L3.concept',
  'PS4.ex6': 'L4.probability', 'PS4.bs': 'L4.bs', 'PS4.lognormal': 'L4.lognormal', 'PS4.implied': 'L4.implied', 'PS4.short': 'L4.concept',
  'PS5.ex7': 'L5.floor', 'PS5.ex8': 'L5.absolute', 'PS5.ex9': 'L5.guaranteed', 'PS5.participation': 'L5.participation', 'PS5.reverse': 'L5.reverse', 'PS5.short': 'L5.concept',
};

/** One explanation per question type, opened from a wrong answer. Every new type needs an entry (tests/explain.test.ts). */
export const EXPLAIN: ExplainMap = { ...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...SAME };
