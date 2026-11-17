import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';
import L3 from './L3';
import L4 from './L4';
import L5 from './L5';
import L6 from './L6';
import L7 from './L7';
import L8 from './L8';

export const THEORY: TheoryPage[] = [
  { slug: 'class-1', topic: '1', title: 'Variables, cell references and For loops', types: ['L1.trace', 'L1.cells', 'L1.types', 'L1.concept'], Component: L1 },
  { slug: 'class-2', topic: '2', title: 'Arrays, If / ElseIf / Else and debugging', types: ['L2.array', 'L2.signal', 'L2.filter', 'L2.errors', 'L2.concept'], Component: L2 },
  { slug: 'class-3', topic: '3', title: 'Case 1: automating the progressive income tax model', types: ['L3.tax', 'L3.table', 'L3.code', 'L3.concept'], Component: L3 },
  { slug: 'class-4', topic: '4', title: 'Parameterised Subs, Call and batch processing', types: ['L4.call', 'L4.batch', 'L4.args', 'L4.concept'], Component: L4 },
  { slug: 'class-5', topic: '5', title: 'Simulation: Rnd, NormInv and WorksheetFunction', types: ['L5.uniform', 'L5.norm', 'L5.array', 'L5.errors', 'L5.concept'], Component: L5 },
  { slug: 'class-6', topic: '6', title: 'Range objects, summary statistics and the covariance matrix', types: ['L6.stats', 'L6.matrix', 'L6.range', 'L6.concept'], Component: L6 },
  { slug: 'class-7', topic: '7', title: 'User-defined functions: structure, arguments and arrays', types: ['L7.trace', 'L7.uniform', 'L7.syntax', 'L7.concept'], Component: L7 },
  { slug: 'class-8', topic: '8', title: 'UDFs applied: Sharpe and Sortino ratios', types: ['L8.sharpe', 'L8.sortino', 'L8.compare', 'L8.concept'], Component: L8 },
];
