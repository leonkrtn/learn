import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcView } from '../lib/calc';
import { calc, tn, tp } from '../lib/engine/gen-helpers';
import type { Question } from '../lib/engine/types';
import { renderRich } from '../lib/rich';
import { allTypes } from '../lib/subject';
import { SUBJECTS } from '../subjects';
import { BANK as FD } from '../subjects/fd/concepts';
import { BANK as FI } from '../subjects/fi/concepts';
import { BANK as FV } from '../subjects/fv/concepts';
import { BANK as FVCS } from '../subjects/fvcs/concepts';
import { BANK as IFD } from '../subjects/ifd/concepts';
import { BANK as PIF } from '../subjects/pif/concepts';

const BANKS = { fd: FD, fi: FI, fv: FV, fvcs: FVCS, ifd: IFD, pif: PIF } as const;
const RUNS = Number(process.env.CALC_RUNS || 40);

test('tn and tp format numbers for formulas', () => {
  assert.equal(tn(1234567.891, 4), '1{,}234{,}567.89');
  assert.equal(tn(1.277289, 6), '1.28');
  assert.equal(tn(-12.5, 1), '-12.50');
  assert.equal(tn(0.085, 4), '0.085');
  assert.equal(tn(0.00079365, 6), '0.00079');
  assert.equal(tn(35, 0), '35');
  assert.equal(tp(0.12345, 4), '12.35\\%');
});

test('calcView groups the steps of earlier parts and ends at the part’s result', () => {
  const c = calc();
  c.s('x'); c.r('a', 'A', 1); c.s('y'); c.r('b', 'B', 2); c.s('z'); c.r('c', 'C', 3);
  const q: Question = { fam: 'X', topic: '1', html: '', calc: c.steps, parts: [
    { type: 'num', prompt: 'p1', ans: 1, unit: 'n', key: 'A' }, { type: 'num', prompt: 'p3', ans: 3, unit: 'n', key: 'C' },
  ] };
  const v = calcView(q, 1)!;
  assert.deepEqual(v.earlier.map(g => g.steps.map(s => s.md)), [['x', 'a']]);
  assert.deepEqual(v.own.map(s => s.md), ['y', 'b', 'z', 'c']);
  assert.deepEqual(calcView(q, 0)!.own.map(s => s.md), ['x', 'a']);
});

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1e-9, 1e-3 * Math.abs(b));

/** Problems with one generated question, or '' if it is fine. */
function check(q: Question): string {
  const graded = q.parts.filter(p => p.type !== 'mc' || p.key);
  if (!graded.length) return '';
  if (!q.calc?.length) return 'no calc';
  for (const [i, p] of q.parts.entries()) {
    if (p.type === 'mc' && !p.key) continue;
    if (!p.key) return `part ${i} has no key`;
    const v = calcView(q, i);
    if (!v) return `part ${i} (${p.key}) has no result step`;
    const last = v.own[v.own.length - 1];
    const ans = p.type === 'num' ? p.ans : p.type === 'mc' ? p.ans : undefined;
    if (ans != null) {
      if (last.value == null) return `step for ${p.key} has no value`;
      if (!close(last.value, ans)) return `step for ${p.key} gives ${last.value}, answer is ${ans}`;
    }
  }
  for (const s of q.calc) {
    const warned: string[] = [], warn = console.warn;
    console.warn = (m: string) => { warned.push(String(m)); };
    let h: string;
    try { h = renderRich(s.md); } finally { console.warn = warn; }
    if (h.includes('katex-error')) return `formula error in "${s.md}"`;
    if (warned.length) return `${warned[0]} in "${s.md}"`;
    if (/\$[^\s$]/.test(h.replace(/<[^>]+>/g, '').replace(/\$\d/g, ''))) return `unpaired $ in "${s.md}"`;
    if (/NaN|Infinity|undefined/.test(s.md)) return `bad number in "${s.md}"`;
    // A single backslash in a template literal turns \t, \f, \b … into control characters (\times → tab + "imes").
    if (/[\u0000-\u0009\u000b-\u001f]/.test(s.md)) return `control character (unescaped backslash?) in "${JSON.stringify(s.md)}"`;
  }
  return '';
}

for (const [slug, mod] of Object.entries(SUBJECTS)) {
  test(`${slug}: every part of every generated question has its worked calculation`, () => {
    const ctx = { bank: BANKS[slug as keyof typeof BANKS] };
    const problems: string[] = [];
    for (const t of allTypes(mod)) {
      for (let k = 0; k < RUNS; k++) {
        const msg = check(t.gen(ctx));
        if (msg) { problems.push(`${t.key}: ${msg}`); break; }
      }
    }
    assert.deepEqual(problems, []);
  });
}
