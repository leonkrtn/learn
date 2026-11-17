import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';
import L3 from './L3';
import L4 from './L4';
import L5 from './L5';
import L6 from './L6';

export const THEORY: TheoryPage[] = [
  { slug: 'lecture-1', topic: '1', title: 'Options: payoffs, bounds, put-call parity and early exercise', types: ['L1.bounds', 'L1.parity', 'L1.putInterval', 'L1.earlyPut', 'L1.dividend', 'L1.concept'], Component: L1 },
  { slug: 'lecture-2', topic: '2', title: 'Trading strategies: spreads, straddles, strangles and butterflies', types: ['L2.strategy', 'L2.butterfly', 'L2.portfolio', 'L2.identify', 'L2.concept'], Component: L2 },
  { slug: 'lecture-3', topic: '3', title: 'The binomial model: replication, risk-neutral valuation, American options and dividends', types: ['L3.replicate', 'L3.twoStep', 'L3.american', 'L3.nPeriod', 'L3.dividendTree', 'L3.yield', 'L3.vol', 'L3.concept'], Component: L3 },
  { slug: 'lecture-4', topic: '4', title: 'Black-Scholes and the lognormal model: probabilities, prices and implied volatility', types: ['L4.bs', 'L4.probability', 'L4.dividends', 'L4.implied', 'L4.lognormal', 'L4.concept'], Component: L4 },
  { slug: 'lecture-5', topic: '5', title: 'Structured products: decomposition, valuation and the issuer’s margin', types: ['L5.guaranteed', 'L5.floor', 'L5.absolute', 'L5.participation', 'L5.reverse', 'L5.concept'], Component: L5 },
  { slug: 'lecture-6', topic: '6', title: 'Forwards, futures and swaps: cost of carry, margins, hedging and swap valuation', types: ['L6.forward', 'L6.value', 'L6.hedge', 'L6.margin', 'L6.swap', 'L6.concept'], Component: L6 },
];
