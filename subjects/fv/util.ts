// Shared helpers for the Firm Valuation generators: discounting, currencies, sums for worked calculations.
import { fmtNum, pick, tn, tq } from '@/lib/engine/gen-helpers';
import type { Unit } from '@/lib/engine/types';

export const pv = (cf: number, r: number, t: number) => cf / Math.pow(1 + r, t);
export const annuity = (cf: number, r: number, n: number) => cf / r * (1 - 1 / Math.pow(1 + r, n));
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const ROUND_NOTE = 'Round only your final answers.';

/** Terms joined with their signs for a formula: a + b − c. */
export const sumMd = (xs: number[]) => xs.map((x, i) => (i === 0 ? tn(x) : x < 0 ? ' - ' + tn(-x) : ' + ' + tn(x))).join('');

/** A currency for amounts in millions and per-share values. `md` is the symbol for running text in a calculation step. */
export type Cur = { sym: string; md: string; mUnit: Unit; sUnit: Unit; tag: string; M: (x: number, d?: number) => string; S: (x: number) => string };

const mk = (sym: string, md: string, mUnit: Unit, sUnit: Unit, tag: string, space = false): Cur => ({
  sym, md, mUnit, sUnit, tag,
  M: (x, d = 2) => (x < 0 ? '−' : '') + sym + (space ? ' ' : '') + fmtNum(Math.abs(x), d) + ' million',
  S: x => (x < 0 ? '−' : '') + sym + (space ? ' ' : '') + fmtNum(Math.abs(x), 2),
});

export const EUR = mk('€', '€', 'm', 'eur', '');
export const USD = mk('$', '\\$', 'musd', 'usd', '');
export const GBP = mk('£', '£', 'n', 'n', ' (in £ million)');
export const JPY = mk('JPY', 'JPY', 'n', 'n', ' (in JPY million)', true);
/** Per-share prompt tag for currencies without their own unit. */
export const perShareTag = (c: Cur) => c.sUnit === 'n' ? ` (in ${c.sym})` : '';
export const anyCur = () => pick([EUR, EUR, USD, USD, GBP]);

/** "(€ million)" for a calculation step. */
export const inM = (c: Cur) => `(${c.md} million)`;
/** A number in parentheses when negative, for use after an operator in a formula. */
export const q = tq;
