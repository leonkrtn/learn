import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradeQuestion, isOk, parseNum } from '../lib/engine/grade';
import { CycleBag, pickAdaptive } from '../lib/engine/select';
import { SUBJECTS } from '../subjects';
import fvcs from '../subjects/fvcs';
import { BANK } from '../subjects/fvcs/concepts';
import { BANK as FV_BANK } from '../subjects/fv/concepts';
import { BANK as FI_BANK } from '../subjects/fi/concepts';
import { BANK as IFD_BANK } from '../subjects/ifd/concepts';
import { BANK as FD_BANK } from '../subjects/fd/concepts';
import { binom, bs, impliedVol, Phi } from '../subjects/fd/generators';
import { renderRich } from '../lib/rich';
import { clearRating, ratingOf, RATING_NAMES, solveFace } from '../subjects/ifd/generators';
import fi from '../subjects/fi';

const BANKS: Record<string, typeof BANK> = { fvcs: BANK, fv: FV_BANK, fi: FI_BANK, ifd: IFD_BANK, fd: FD_BANK };

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

test('every generator of every subject runs 400 times with finite answers', () => {
  for (const mod of Object.values(SUBJECTS)) {
  const fvcs = mod;
  const ctx = { bank: BANKS[mod.slug] };
  for (const t of mod.types) {
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
  }
});

test('grading the generated solutions scores full marks', () => {
  for (const mod of Object.values(SUBJECTS)) for (const t of mod.types) {
    const fvcs = mod;
    const q = t.gen({ bank: BANKS[mod.slug] });
    const answers = Object.fromEntries(q.parts.map((p, i) => [i, p.type === 'num' ? p.ans.toFixed(8).replace('.', ',') : p.correct]));
    const g = gradeQuestion(q, answers, fvcs.tolerance);
    assert.equal(g.c, g.a, t.key + ' ' + JSON.stringify(q.parts.map(p => p.type === 'num' ? p.ans : p.correct)));
  }
});

test('FI problem sets: every type runs 400 times, A–E options are distinct and the solution scores full marks', () => {
  const sets = fi.problemSets!;
  assert.deepEqual(sets.map(p => p.id), ['1', '2', '3', '4', '5', '6']);
  const keys = sets.flatMap(p => p.types.map(t => t.key));
  assert.equal(new Set(keys).size, keys.length, 'duplicate problem-set keys');
  for (const p of sets) {
    assert.ok(p.types.some(t => t.fromPs) && p.types.some(t => !t.fromPs), 'PS ' + p.id + ' needs both groups');
    for (const t of p.types) {
      assert.equal(t.topic, p.topic);
      for (let i = 0; i < 400; i++) {
        const q = t.gen({ bank: FI_BANK });
        assert.equal(q.fam, t.key, t.key + ' produced ' + q.fam);
        assert.equal(fi.typeKeyOf(q.fam), t.key, t.key + ' maps to another type');
        assert.ok(q.solution && !/NaN|undefined|Infinity/.test(q.solution), t.key + ' solution: ' + (q.solution || '').slice(0, 200));
        assert.ok(!/NaN|undefined|Infinity/.test(q.html + q.parts.map(x => 'prompt' in x ? x.prompt : '').join('')), t.key + ' text: ' + q.html.slice(0, 200));
        for (const x of q.parts) {
          if (x.type === 'num') { assert.ok(Number.isFinite(x.ans), t.key + ': ' + x.prompt); continue; }
          assert.ok(x.correct >= 0 && x.correct < x.options.length, t.key + ': bad correct index');
          assert.equal(new Set(x.options).size, x.options.length, t.key + ' repeats an option: ' + x.options.join(' | '));
          assert.ok(!x.options.some(o => /NaN|undefined|Infinity/.test(o)), t.key + ' option text');
          if (x.type === 'mc' && !x.tf && q.parts.length === 1) assert.ok(x.options.length >= 4 && x.options.length <= 5, t.key + ' has ' + x.options.length + ' options');
        }
        const answers = Object.fromEntries(q.parts.map((x, j) => [j, x.type === 'num' ? x.ans.toFixed(8).replace('.', ',') : x.correct]));
        const g = gradeQuestion(q, answers, fi.tolerance);
        assert.equal(g.c, g.a, t.key);
      }
    }
  }
});

test('problem sets of every subject: unique keys, solutions, distinct options, full marks for the solution', () => {
  for (const mod of Object.values(SUBJECTS)) {
    const sets = mod.problemSets || [];
    const keys = sets.flatMap(p => p.types.map(t => t.key));
    assert.equal(new Set([...keys, ...mod.types.map(t => t.key)]).size, keys.length + mod.types.length, mod.slug + ': duplicate keys');
    for (const p of sets) for (const t of p.types) for (let i = 0; i < 300; i++) {
      const q = t.gen({ bank: BANKS[mod.slug] });
      assert.equal(q.fam, t.key, t.key + ' produced ' + q.fam);
      assert.equal(mod.typeKeyOf(q.fam), t.key);
      assert.ok(q.solution && !/NaN|undefined|Infinity/.test(q.solution), t.key + ' solution');
      assert.ok(!/NaN|undefined|Infinity/.test(q.html + q.parts.map(x => 'prompt' in x ? x.prompt : '').join('')), t.key + ' text');
      for (const x of q.parts) {
        if (x.type === 'num') { assert.ok(Number.isFinite(x.ans), t.key + ': ' + x.prompt); continue; }
        assert.ok(x.correct >= 0 && x.correct < x.options.length, t.key + ': bad correct index');
        assert.equal(new Set(x.options).size, x.options.length, t.key + ' repeats an option: ' + x.options.join(' | '));
      }
      const answers = Object.fromEntries(q.parts.map((x, j) => [j, x.type === 'num' ? x.ans.toFixed(8).replace('.', ',') : x.correct]));
      const g = gradeQuestion(q, answers, mod.tolerance);
      assert.equal(g.c, g.a, t.key);
    }
  }
});

test('IFD reproduces the quiz and lecture numbers', () => {
  // Arden: €60m raised, 100 or 54 equally likely, r_f 5% → face 72, spread 15% → CC; after the junior issue → B-.
  const F = solveFace([100, 54], [0.5, 0.5], 60 * 1.05);
  assert.ok(Math.abs(F - 72) < 1e-6);
  assert.equal(RATING_NAMES[ratingOf(72 / 60 - 1 - 0.05)], 'CC');
  const B1 = (0.5 * 72 + 0.5 * 62) / 1.05;
  assert.equal(RATING_NAMES[ratingOf(72 / B1 - 1 - 0.05)], 'B-');
  // Additional material, Meridian: spread 5.42% → B.
  assert.equal(RATING_NAMES[ratingOf(0.0542)], 'B');
  assert.ok(clearRating(0.15) && clearRating(0.0542));
  // BluePeak: straight debt face value 250.
  assert.ok(Math.abs(solveFace([700, 400, 200], [0.3, 0.6, 0.1], 245) - 250) < 1e-6);
  // Effort with debt: 0.6F + 0.4·75 = 100.
  assert.ok(Math.abs(solveFace([125, 75, 0], [0.6, 0.4, 0], 100) - 116.6667) < 1e-3);
});

test('FD reproduces the lecture and problem set 1 numbers', () => {
  const near = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b}`);
  // Lecture: one-period call, S0 = 100, u = 1.2712, d = 0.8521, r = 6.18%, X = 110 → 8.07.
  near(binom({ S: 100, X: 110, n: 1, u: 1.2712, d: 0.8521, growth: 1.0618, disc: 1 / 1.0618 }).V[0][0], 8.07, 0.01, 'one period');
  // Lecture: American put, u = 1.1752, d = 0.8857, r = 3.04%, X = 110 → 11.79, exercised at the down node.
  const am = binom({ S: 100, X: 110, n: 2, u: 1.1752, d: 0.8857, growth: 1.0304, disc: 1 / 1.0304, put: true, american: true });
  near(am.V[0][0], 11.79, 0.01, 'American put'); assert.ok(am.ex[1][1] && !am.ex[1][0]);
  // Lecture: four periods, u = 1.1, d = 0.95, r = 5%, X = 120: the slide rounds π to 0.67 and gets 6.5; exactly π = 2/3 and 6.39.
  near(binom({ S: 100, X: 120, n: 4, u: 1.1, d: 0.95, growth: 1.05, disc: 1 / 1.05 }).V[0][0], 6.39, 0.005, 'four periods');
  // Hull's textbook values: S = 42, X = 40, r = 10%, σ = 20%, T = 0.5 → c = 4.76, p = 0.81.
  const h = bs(42, 40, 0.5, 0.1, 0.2); near(h.c, 4.76, 0.005, 'BS call'); near(h.p, 0.81, 0.005, 'BS put');
  near(impliedVol(h.c, 42, 40, 0.5, 0.1), 0.2, 1e-4, 'implied vol'); near(Phi(1.96), 0.975, 1e-4, 'Phi');
  // PS1 2A: put interval for strike 15 → 6.70 to 7.30.
  near(4 - 12 + 15 * Math.exp(-0.02), 6.70, 0.01, 'p ask'); near(4.6 - 12 + 15 * Math.exp(-0.02), 7.30, 0.01, 'p bid');
  // PS1 6: real-world 20.2%, risk-neutral 18.6%.
  const T = 3 / 52, sq = 0.4 * Math.sqrt(T);
  near(Phi((Math.log(11 / 12) + (0.2 - 0.08) * T) / sq), 0.202, 0.001, 'real-world'); near(bs(11, 12, T, 0.1, 0.4).Nd2, 0.186, 0.001, 'risk-neutral');
  // PS1 7, 8 and 9: lead product 861.66, Nokia K 822.16, α 11.34.
  near(1000 * Math.exp(-0.15) + bs(500, 300, 3, 0.05, 0.03 * Math.sqrt(52), -0.04).p, 861.66, 0.05, 'lead');
  const nk = bs(10, 10, 2 / 12, 0.04, 0.5); near(950 / (Math.exp(-0.04 / 6) + (nk.c + nk.p) / 10), 822.16, 0.05, 'Nokia');
  near((950 - 900 * Math.exp(-0.04 / 6)) / bs(5, 10, 2 / 12, 0.04, 0.6).p, 11.34, 0.01, 'alpha');
});

test('suggested cheatsheets: known lectures, unique titles, formulas that KaTeX can render', () => {
  for (const mod of Object.values(SUBJECTS)) {
    const blocks = mod.cheatsheet || [];
    assert.ok(blocks.length > 5, mod.slug + ' has no suggested cheatsheet');
    assert.equal(new Set(blocks.map(b => b.title)).size, blocks.length, mod.slug + ': duplicate titles');
    for (const b of blocks) {
      assert.ok(b.topic === null || mod.topics.some(t => t.id === b.topic), mod.slug + ': unknown lecture ' + b.topic);
      const html = renderRich(b.body);
      assert.ok(!/katex-error/.test(html), mod.slug + ' / ' + b.title + ': ' + (html.match(/katex-error[^>]*>([^<]*)/)?.[1] || ''));
      // Every $ left in the text must be an escaped dollar sign (\$) of the source, not a formula that failed to render.
      const dollars = (html.replace(/<[^>]+>/g, '').match(/\$/g) || []).length, escaped = (b.body.match(/\\\$/g) || []).length;
      assert.equal(dollars, escaped, mod.slug + ' / ' + b.title + ': unrendered $');
    }
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

test('FI mock exam follows the sample exam: 26 questions, 100 marks', () => {
  for (let i = 0; i < 50; i++) {
    const ex = fi.mock!.build({ bank: FI_BANK });
    assert.deepEqual(ex.parts.map(p => p.qs.length), [19, 3, 3, 2]);
    assert.deepEqual(ex.parts.map(p => p.qs.reduce((a, q) => a + (q.pts || 0), 0)), [38, 27, 21, 14]);
  }
});

test('cycle mode: each round contains every type once, no repeat at the boundary', () => {
  for (const mod of Object.values(SUBJECTS)) for (const topic of mod.topics) {
    const keys = mod.types.filter(t => t.topic === topic.id).map(t => t.key);
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
