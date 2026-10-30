import assert from 'node:assert/strict';
import { test } from 'node:test';
import { commandAt, exact, mathAt, mathSegments, search, splice, SYMBOLS } from '../lib/texinput';

test('commands are unique and resolve to their symbol', () => {
  assert.equal(new Set(SYMBOLS.map(s => s.cmd)).size, SYMBOLS.length);
  assert.equal(exact('beta')!.out, 'β');
  assert.equal(exact('Delta')!.out, 'Δ');
  assert.equal(exact('delta')!.out, 'δ');
  assert.equal(exact('wacc')!.out.startsWith('$r_{wacc}'), true);
});

test('search ranks exact and prefix matches first', () => {
  assert.equal(search('bet')[0].cmd, 'beta');
  assert.equal(search('sig')[0].cmd, 'sigma');
  assert.ok(search('infinity').some(s => s.out === '∞'));
  assert.ok(search('squared').some(s => s.out === '²'));
});

test('commands are found at the start of a word, not inside formulas or words', () => {
  assert.deepEqual(commandAt('cost /beta', 10), { start: 5, query: 'beta' });
  assert.deepEqual(commandAt('\\sig', 4), { start: 0, query: 'sig' });
  assert.deepEqual(commandAt('(/', 2), { start: 1, query: '' });
  assert.equal(commandAt('and/or', 6), null);
  assert.equal(commandAt('$\\beta', 6), null, 'LaTeX inside an open formula stays LaTeX');
  assert.equal(commandAt('see $a \\cdot b$ and', 10), null);
  assert.deepEqual(commandAt('$x$ /pi', 7), { start: 4, query: 'pi' });
});

test('formula segments and splicing', () => {
  const t = 'a $x^2$ b $$\\frac{1}{2}$$ c \\$5';
  assert.deepEqual(mathSegments(t).map(m => [m.tex, m.display]), [['x^2', false], ['\\frac{1}{2}', true]]);
  assert.equal(mathAt(t, 4)!.tex, 'x^2');
  assert.equal(mathAt(t, 1), undefined);
  assert.deepEqual(splice('x /beta y', 2, 7, 'β'), { text: 'x β y', caret: 3 });
});
