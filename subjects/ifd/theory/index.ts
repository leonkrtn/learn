import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';
import L3 from './L3';
import L4 from './L4';

export const THEORY: TheoryPage[] = [
  { slug: 'lecture-1', topic: '1', title: 'Equity financing: the cost of an IPO, rights issues and the winner’s curse', types: ['L1.ipo', 'L1.rights', 'L1.winners', 'L1.concept'], Component: L1 },
  { slug: 'lecture-2', topic: '2', title: 'Debt financing: pricing risky debt, ratings, seniority and convertibles', types: ['L2.riskyDebt', 'L2.seniority', 'L2.straight', 'L2.convertible', 'L2.concept'], Component: L2 },
  { slug: 'lecture-3', topic: '3', title: 'Incentives and information: why debt can beat equity', types: ['L3.effort', 'L3.lemons', 'L3.concept'], Component: L3 },
  { slug: 'lecture-4', topic: '4', title: 'Capital budgeting: free cash flows, the discount rate, APV and WACC', types: ['L4.npv', 'L4.fcf', 'L4.terminal', 'L4.apv', 'L4.wacc', 'L4.beta', 'L4.concept'], Component: L4 },
];
