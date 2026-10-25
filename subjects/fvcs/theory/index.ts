import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';
import L3 from './L3';
import L4 from './L4';
import L5 from './L5';
import L6 from './L6';

export const THEORY: TheoryPage[] = [
  { slug: 'lecture-1', topic: '1', title: 'MM propositions: why leverage moves the cost of equity but not the WACC', types: ['L1.project', 'L1.mm2', 'L1.recap', 'L1.eps', 'L1.beta', 'L1.homemade', 'L1.concept'], Component: L1 },
  { slug: 'lecture-2', topic: '2', title: 'Interest tax shields, the after-tax WACC and τ*', types: ['L2.itsFinite', 'L2.income', 'L2.recapTax', 'L2.target', 'L2.personal', 'L2.hamada', 'L2.concept'], Component: L2 },
  { slug: 'lecture-3', topic: '3', title: 'Financial distress and the trade-off theory', types: ['L3.twoState', 'L3.multiState', 'L3.tradeoff', 'L3.concept'], Component: L3 },
  { slug: 'lecture-4', topic: '4', title: 'Agency costs and benefits of debt', types: ['L4.assetSub', 'L4.overhang', 'L4.cashout', 'L4.petron', 'L4.empire', 'L4.concept'], Component: L4 },
  { slug: 'lecture-5', topic: '5', title: 'Signalling, lemons and the pecking order', types: ['L5.financing', 'L5.lemons', 'L5.signal', 'L5.concept'], Component: L5 },
  { slug: 'lecture-6', topic: '6', title: 'Venture rounds, dilution and SPACs', types: ['L6.vc', 'L6.rounds', 'L6.spac', 'L6.concept'], Component: L6 },
];
