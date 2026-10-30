import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderRich } from '../lib/rich';

test('user text is escaped, never interpreted as HTML', () => {
  const h = renderRich('<img src=x onerror=alert(1)> **bold** <script>x</script>');
  assert.ok(!h.includes('<img') && !h.includes('<script'));
  assert.ok(h.includes('&lt;img') && h.includes('<strong>bold</strong>'));
  const m = renderRich('$\\href{javascript:alert(1)}{x}$');
  assert.ok(!m.includes('javascript:'), 'KaTeX runs with trust off');
});

test('inline and display math, lists, headings and paragraphs', () => {
  const h = renderRich('## WACC\nCost $r_E$ and \\$5\n\n$$\\frac{E}{E+D}$$\n- one\n- *two*\n1. first');
  assert.ok(h.startsWith('<h4>WACC</h4><p>Cost <span class="katex">'));
  assert.ok(h.includes('and $5</p>'));
  assert.ok(h.includes('<div class="mathblock"><span class="katex-display">'));
  assert.ok(!/<p>\s*<div/.test(h), 'display math is not wrapped in a paragraph');
  assert.ok(h.includes('<ul><li>one</li><li><em>two</em></li></ul><ol><li>first</li></ol>'));
});

test('prices with dollar signs and spaces are left alone', () => {
  const h = renderRich('costs $ 5 and $ 6');
  assert.ok(!h.includes('katex'));
});
