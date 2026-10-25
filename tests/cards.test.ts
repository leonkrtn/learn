import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clozeCards, notesToCards, parseCsv } from '../lib/cards/parse';

test('CSV: separator detection, quotes, header row', () => {
  assert.deepEqual(parseCsv('Front;Back\n"a; b";"c ""q"""\nx;y\n'), [{ front: 'a; b', back: 'c "q"' }, { front: 'x', back: 'y' }]);
  assert.deepEqual(parseCsv('one\ttwo\nthree\tfour'), [{ front: 'one', back: 'two' }, { front: 'three', back: 'four' }]);
  assert.deepEqual(parseCsv('#separator:comma\nq,a'), [{ front: 'q', back: 'a' }]);
});

test('cloze notes become one card per gap', () => {
  const c = clozeCards('{{c1::MM I}} and {{c2::MM II::prop}}', '');
  assert.equal(c.length, 2);
  assert.equal(c[1].front, 'MM I and <b>[prop]</b>');
  assert.equal(c[1].back, 'MM I and <b>MM II</b>');
  assert.equal(notesToCards([['front only', '']]).length, 0);
});
