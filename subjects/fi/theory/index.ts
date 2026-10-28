import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';
import L3 from './L3';
import L4 from './L4';
import L5 from './L5';
import L6 from './L6';

export const THEORY: TheoryPage[] = [
  { slug: 'lecture-1', topic: '1', title: 'Why only beta is priced: from Markowitz to the SML', types: ['L1.capm', 'L1.scenario', 'L1.sim', 'L1.cml', 'L1.zeroBeta', 'L1.equilibrium', 'L1.concept'], Component: L1 },
  { slug: 'lecture-2', topic: '2', title: 'No-arbitrage pricing and how efficient markets are', types: ['L2.surprise', 'L2.twoFactor', 'L2.arbitrage', 'L2.longShort', 'L2.concept'], Component: L2 },
  { slug: 'lecture-3', topic: '3', title: 'Choosing the right performance measure, and how long skill takes to show', types: ['L3.ratios', 'L3.ir', 'L3.tstat', 'L3.attribution', 'L3.dwr', 'L3.concept'], Component: L3 },
  { slug: 'lecture-4', topic: '4', title: 'Treynor-Black, Black-Litterman and the value of active management', types: ['L4.treynorBlack', 'L4.blackLitterman', 'L4.fee', 'L4.concept'], Component: L4 },
  { slug: 'lecture-5', topic: '5', title: 'Estimation error: why optimised portfolios disappoint', types: ['L5.markowitz', 'L5.shrinkage', 'L5.concept'], Component: L5 },
  { slug: 'lecture-6', topic: '6', title: 'Hedge funds: portable alpha, fees and measuring performance', types: ['L6.portable', 'L6.fees', 'L6.hwm', 'L6.lagBeta', 'L6.concept'], Component: L6 },
];
