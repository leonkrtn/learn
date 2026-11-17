import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SECTIONS, ex, resolveExplainer } from '../lib/explain';
import { renderRich } from '../lib/rich';
import { allTypes } from '../lib/subject';
import { SUBJECTS } from '../subjects';

test('the ex template splits sections, keeps backslashes and dedents', () => {
  const e = ex`
    @task
    Find $\frac{a}{b}$ with \`x = 1\`.
    @steps
    1. one
    2. two
  `;
  assert.equal(e.task, 'Find $\\frac{a}{b}$ with `x = 1`.');
  assert.equal(e.steps, '1. one\n2. two');
  assert.equal(e.idea, '');
});

test('code blocks and tables render, escaped', () => {
  const h = renderRich('```\nIf x < 1 Then y = "$5"\n```\n\n| a | $b$ |\n|---|---|\n| <i>1</i> | 2 |');
  assert.ok(h.includes('<pre><code>If x &lt; 1 Then y = &quot;$5&quot;</code></pre>'));
  assert.ok(h.includes('<thead><tr><th>a</th><th><span class="katex">'));
  assert.ok(h.includes('<td>&lt;i&gt;1&lt;/i&gt;</td>'));
});

for (const [slug, mod] of Object.entries(SUBJECTS)) {
  test(`${slug}: every question type has a complete explanation with a worked example`, () => {
    const keys = new Set(allTypes(mod).map(t => t.key));
    for (const key of keys) {
      const e = resolveExplainer(mod.explain, key);
      assert.ok(e, `${slug} ${key}: no explanation (add it to subjects/${slug}/explain)`);
      for (const s of SECTIONS) assert.ok(e[s].trim().length > 20, `${slug} ${key}: section ${s} is empty or too short`);
      for (const s of ['steps', 'solution'] as const) assert.match(e[s], /^1\. /m, `${slug} ${key}: ${s} must be a numbered list`);
      assert.match(e.pitfalls, /^- /m, `${slug} ${key}: pitfalls must be a bullet list`);
    }
    for (const [key, v] of Object.entries(mod.explain)) {
      assert.ok(keys.has(key), `${slug}: explanation for unknown type ${key}`);
      if (typeof v === 'string') assert.ok(typeof mod.explain[v] === 'object', `${slug} ${key}: refers to ${v}, which has no explanation of its own`);
    }
  });

  test(`${slug}: explanations render without formula errors`, () => {
    for (const [key, v] of Object.entries(mod.explain)) {
      if (typeof v === 'string') continue;
      for (const s of SECTIONS) for (const line of v[s].split('\n')) {
        const warn = console.warn, warned: string[] = [];
        console.warn = (m: string) => { warned.push(String(m)); };
        let h: string;
        try { h = renderRich(line); } finally { console.warn = warn; }
        assert.ok(!h.includes('katex-error'), `${slug} ${key} ${s}: formula error in "${line}"`);
        assert.ok(!/\$[^\s$]/.test(h.replace(/<[^>]+>/g, '').replace(/\$\d/g, '')), `${slug} ${key} ${s}: unpaired $ in "${line}"`);
        // KaTeX has no glyph for €; keep amounts outside formulas.
        assert.ok(!warned.length, `${slug} ${key} ${s}: ${warned[0]} in "${line}"`);
      }
    }
  });
}
