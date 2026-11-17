// Explanations per question type, opened from a wrong answer. Each is written once as Markdown with $…$ formulas
// (rendered by lib/rich.ts) in the `ex` template, which splits it at the section markers below.

export const SECTIONS = ['task', 'idea', 'steps', 'example', 'solution', 'answer', 'pitfalls'] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * - task: what the question gives and what it asks for
 * - idea: why the method works
 * - steps: the solution path as a numbered list
 * - example / solution / answer: one fixed worked example, its numbered solution and the result
 * - pitfalls: the typical mistakes as a bullet list
 */
export type Explainer = Record<Section, string>;

/** An explanation, or the key of the type whose explanation applies (same calculation in another format). */
export type ExplainMap = Record<string, Explainer | string>;

/**
 * Template tag for an explanation. Backslashes stay as written (LaTeX), `\`` gives a backtick for inline code,
 * and lines `@task`, `@idea`, `@steps`, `@example`, `@solution`, `@answer`, `@pitfalls` open the sections.
 */
export function ex(strings: TemplateStringsArray, ...values: unknown[]): Explainer {
  const src = euroOutOfMath(String.raw(strings, ...values).replace(/\\`/g, '`'));
  const out: Partial<Explainer> = {};
  let cur: Section | null = null;
  const buf: string[] = [];
  const flush = () => { if (cur) out[cur] = dedent(buf.join('\n')); buf.length = 0; };
  for (const line of src.split('\n')) {
    const m = /^\s*@([a-z]+)\s*$/.exec(line);
    if (m && (SECTIONS as readonly string[]).includes(m[1])) { flush(); cur = m[1] as Section; continue; }
    buf.push(line);
  }
  flush();
  for (const s of SECTIONS) out[s] ??= '';
  return out as Explainer;
}

/** KaTeX has no glyph for €, so an amount that ends a formula moves out of it: `$x = €1{,}200$` becomes `$x =$ €1,200`. */
function euroOutOfMath(s: string): string {
  return s.replace(/\$([^$\n]*?)\s*€\s*([\d.,{}]+)\s*\$/g, (_, head: string, num: string) =>
    (head.trim() ? '$' + head.trim() + '$ ' : '') + '€' + num.replace(/\{,\}/g, ','));
}

function dedent(s: string): string {
  const lines = s.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
  const ind = Math.min(...lines.filter(l => l.trim()).map(l => /^ */.exec(l)![0].length));
  return lines.map(l => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n');
}

/** Follows references to the explanation that applies to a type key. */
export function resolveExplainer(map: ExplainMap, key: string): Explainer | undefined {
  let v = map[key];
  for (let i = 0; typeof v === 'string' && i < 5; i++) v = map[v];
  return typeof v === 'object' ? v : undefined;
}
