import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradeQuestion, isOk, parseNum } from '../lib/engine/grade';
import { CycleBag, pickAdaptive } from '../lib/engine/select';
import fvcs from '../subjects/fvcs';
import { BANK } from '../subjects/fvcs/concepts';

test('parseNum accepts comma and point formats', () => {
  const cases: [string, number][] = [
    ['12,5', 12.5], ['12.5', 12.5], ['-3,25', -3.25], ['(1.234,56)', -1234.56], ['1,234.56', 1234.56],
    ['1.234.567', 1234567], ['€ 2 500,5', 2500.5], ['−7,1', -7.1], ['12.5%', 12.5], ['0,125', 0.125], ['45 million', 45], ['3.2m', 3.2],
  ];
  for (const [s, x] of cases) assert.equal(parseNum(s), x, s);
  assert.ok(Number.isNaN(parseNum('')));
  assert.ok(Number.isNaN(parseNum('abc')));
});

test('isOk: 2% band with absolute floors, percent as fraction', () => {
  assert.ok(isOk(100, 'm', 102));
  assert.ok(!isOk(100, 'm', 102.1));
  assert.ok(isOk(0.3, 'eur', 0.31));
  assert.ok(!isOk(0.3, 'eur', 0.312));
  assert.ok(isOk(12.5, 'pct', 0.125));
  assert.ok(isOk(1.2, 'pct', 1.25));
  assert.ok(!isOk(1.2, 'pct', 1.26));
  assert.ok(!isOk(5, 'm', NaN));
});

test('every generator runs 400 times with finite answers', () => {
  const ctx = { bank: BANK };
  for (const t of fvcs.types) {
    for (let i = 0; i < 400; i++) {
      const q = t.gen(ctx);
      assert.equal(fvcs.typeKeyOf(q.fam), t.key, t.key + ' produced ' + q.fam);
      assert.ok(q.parts.length > 0, t.key + ' has no parts');
      for (const p of q.parts) {
        if (p.type === 'num') assert.ok(Number.isFinite(p.ans), t.key + ': ' + p.prompt);
        else assert.ok(p.correct >= 0 && p.correct < p.options.length, t.key + ': bad correct index');
      }
      assert.ok(!/NaN|undefined|Infinity/.test(q.html + q.parts.map(p => 'prompt' in p ? p.prompt : '').join('')), t.key + ' text: ' + q.html.slice(0, 200));
    }
  }
});

test('grading the generated solutions scores full marks', () => {
  const ctx = { bank: BANK };
  for (const t of fvcs.types) {
    const q = t.gen(ctx);
    const answers = Object.fromEntries(q.parts.map((p, i) => [i, p.type === 'num' ? String(p.ans).replace('.', ',') : p.correct]));
    const g = gradeQuestion(q, answers, fvcs.tolerance);
    assert.equal(g.c, g.a, t.key);
  }
});

test('mock exam has the real structure and 20 points', () => {
  for (let i = 0; i < 50; i++) {
    const ex = fvcs.mock!.build({ bank: BANK });
    assert.deepEqual(ex.parts.map(p => p.qs.length), [2, 3, 8, 3]);
    const pts = ex.parts.reduce((s, p) => s + p.qs.reduce((a, q) => a + (q.pts || 0), 0), 0);
    assert.ok(Math.abs(pts - 20) < 1e-9);
  }
});

test('cycle mode: each round contains every type once, no repeat at the boundary', () => {
  for (const topic of fvcs.topics) {
    const keys = fvcs.types.filter(t => t.topic === topic.id).map(t => t.key);
    const bag = new CycleBag(keys);
    let prev = '';
    for (let r = 0; r < 30; r++) {
      const round = keys.map(() => bag.next());
      assert.deepEqual([...round].sort(), [...keys].sort());
      assert.notEqual(round[0], prev);
      prev = round[round.length - 1];
    }
  }
});

test('adaptive pick never repeats the previous type and favours weak types', () => {
  const types = fvcs.types.filter(t => t.topic === '1');
  let last = { type: undefined as string | undefined, topic: undefined as string | undefined };
  const counts: Record<string, number> = {};
  for (let i = 0; i < 6000; i++) {
    const t = pickAdaptive(types, { 'L1.beta': 1 }, last);
    assert.notEqual(t.key, last.type);
    counts[t.key] = (counts[t.key] || 0) + 1;
    last = { type: t.key, topic: t.topic };
  }
  assert.ok(counts['L1.beta'] > counts['L1.eps'] * 2);
});
