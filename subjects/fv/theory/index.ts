import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';
import L3 from './L3';
import L4 from './L4';
import L5 from './L5';
import L6 from './L6';
import L7 from './L7';

export const THEORY: TheoryPage[] = [
  { slug: 'lecture-1', topic: '1', title: 'Efficient markets, event studies, firm and equity value', types: ['L1.pv', 'L1.bridge', 'L1.event', 'L1.concept'], Component: L1 },
  { slug: 'lecture-2', topic: '2', title: 'Dividend discount models, free cash flows, the terminal value and APV', types: ['L2.gordon', 'L2.retention', 'L2.twoStage', 'L2.hModel', 'L2.fcf', 'L2.dcf', 'L2.fcfe', 'L2.deferred', 'L2.apv', 'L2.concept'], Component: L2 },
  { slug: 'lecture-3', topic: '3', title: 'Historical, analyst and fundamental growth', types: ['L3.hist', 'L3.trend', 'L3.fundamental', 'L3.market', 'L3.margin', 'L3.concept'], Component: L3 },
  { slug: 'lecture-4', topic: '4', title: 'Risk-free rate, equity premium, beta, cost of debt and WACC', types: ['L4.implied', 'L4.beta', 'L4.bottomUp', 'L4.debt', 'L4.wacc', 'L4.concept'], Component: L4 },
  { slug: 'lecture-5', topic: '5', title: 'Discount rates in emerging markets', types: ['L5.rf', 'L5.crp', 'L5.ke', 'L5.concept'], Component: L5 },
  { slug: 'lecture-6', topic: '6', title: 'Cash, holdings, options, commitments and what-if analysis', types: ['L6.options', 'L6.holdings', 'L6.cash', 'L6.commit', 'L6.case', 'L6.concept'], Component: L6 },
  { slug: 'lecture-7', topic: '7', title: 'Relative valuation with multiples', types: ['L7.multiples', 'L7.compare', 'L7.fundPE', 'L7.exit', 'L7.regression', 'L7.concept'], Component: L7 },
];
