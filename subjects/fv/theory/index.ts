import type { TheoryPage } from '@/lib/subject';
import L1 from './L1';
import L2 from './L2';

export const THEORY: TheoryPage[] = [
  { slug: 'lecture-1', topic: '1', title: 'Efficient markets, event studies, firm and equity value', types: ['L1.pv', 'L1.bridge', 'L1.event', 'L1.concept'], Component: L1 },
  { slug: 'lecture-2', topic: '2', title: 'Dividend discount models, free cash flows and the terminal value', types: ['L2.gordon', 'L2.retention', 'L2.twoStage', 'L2.hModel', 'L2.fcf', 'L2.dcf', 'L2.fcfe', 'L2.deferred', 'L2.concept'], Component: L2 },
];
