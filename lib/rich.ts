// Small Markdown subset with LaTeX math, for notes and cheatsheet entries written by users.
// Everything is HTML-escaped first; only the markup produced here (and KaTeX output, with trust off) reaches the page.
import katex from 'katex';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function tex(src: string, display: boolean): string {
  return katex.renderToString(src, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore', maxSize: 20, maxExpand: 500, output: 'html' });
}

function inline(s: string): string {
  return s
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
}

/** Renders `$…$`, `$$…$$`, **bold**, *italic*, `code`, `## headings`, `- lists`, `1. lists` and paragraphs. */
export function renderRich(src: string): string {
  const math: string[] = [];
  const hold = (html: string) => '\u0000' + (math.push(html) - 1) + '\u0000';
  let s = src.replace(/\r\n?/g, '\n').replace(/\\\$/g, '\u0001');
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, t: string) => '\n\n' + hold('<div class="mathblock">' + tex(t.trim(), true) + '</div>') + '\n\n');
  s = s.replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$/g, (_, t: string) => hold(tex(t, false)));
  s = esc(s).replace(/\u0001/g, '$');

  const out: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => { if (para.length) out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.tag}>`); list = null; };
  for (const line of s.split('\n')) {
    const ul = /^\s*[-*]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line), h = /^#{1,3}\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const tag = ul ? 'ul' : 'ol';
      if (list && list.tag !== tag) flushList();
      list ||= { tag, items: [] };
      list.items.push((ul || ol)![1]);
    } else if (h) {
      flushPara(); flushList(); out.push('<h4>' + inline(h[1]) + '</h4>');
    } else if (!line.trim()) {
      flushPara(); flushList();
    } else {
      flushList(); para.push(line);
    }
  }
  flushPara(); flushList();
  // Display formulas stand on their own lines, so their paragraph wrapper is dropped.
  return out.join('').replace(/<p>(\u0000\d+\u0000)<\/p>/g, '$1').replace(/\u0000(\d+)\u0000/g, (_, i: string) => math[+i]);
}

/** LaTeX snippets for the formula toolbar: inserted text and where the cursor lands (offset from the start). */
export const TEX_TOOLS: { label: string; title: string; text: string; caret: number }[] = [
  { label: '$x$', title: 'Inline formula', text: '$$', caret: 1 },
  { label: '$$', title: 'Formula on its own line', text: '\n$$\n\n$$\n', caret: 4 },
  { label: 'a/b', title: 'Fraction', text: '\\frac{}{}', caret: 6 },
  { label: 'xₙ', title: 'Subscript', text: '_{}', caret: 2 },
  { label: 'xⁿ', title: 'Superscript', text: '^{}', caret: 2 },
  { label: '√', title: 'Square root', text: '\\sqrt{}', caret: 6 },
  { label: 'Σ', title: 'Sum', text: '\\sum_{t=1}^{T} ', caret: 15 },
  { label: '·', title: 'Multiplication dot', text: ' \\cdot ', caret: 7 },
  { label: '≈', title: 'Approximately', text: ' \\approx ', caret: 9 },
  { label: '( )', title: 'Large brackets', text: '\\left(  \\right)', caret: 7 },
  { label: 'β', title: 'beta', text: '\\beta', caret: 5 },
  { label: 'σ', title: 'sigma', text: '\\sigma', caret: 6 },
  { label: 'τ', title: 'tau', text: '\\tau', caret: 4 },
  { label: 'ρ', title: 'rho', text: '\\rho', caret: 4 },
  { label: 'Δ', title: 'Delta', text: '\\Delta', caret: 6 },
];
