import type { ExplainMap } from '@/lib/explain';
import { L1 } from './l1';
import { L2 } from './l2';
import { L3 } from './l3';
import { L4 } from './l4';
import { L5 } from './l5';
import { L6 } from './l6';
import { L7 } from './l7';
import { L8 } from './l8';

/** One explanation per question type, opened from a wrong answer. Every new type needs an entry (tests/explain.test.ts). */
export const EXPLAIN: ExplainMap = { ...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7, ...L8 };
