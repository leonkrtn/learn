import type { ExplainMap } from '@/lib/explain';
import { L1 } from './l1';
import { L2 } from './l2';

/** One explanation per question type, opened from a wrong answer. Every new type needs an entry (tests/explain.test.ts). */
export const EXPLAIN: ExplainMap = { ...L1, ...L2 };
