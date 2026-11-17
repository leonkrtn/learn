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

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

/** Renders `$…$`, `$$…$$`, **bold**, *italic*, `code`, fenced code blocks, `| tables |`, `## headings`, `- lists`, `1. lists` and paragraphs. */
export function renderRich(src: string): string {
  const math: string[] = [];
  const hold = (html: string) => '\u0000' + (math.push(html) - 1) + '\u0000';
  let s = src.replace(/\r\n?/g, '\n');
  // Code blocks first, so dollar signs and asterisks inside them stay literal.
  s = s.replace(/^(```|~~~)[^\n]*\n([\s\S]*?)\n?\1[ \t]*$/gm, (_, _f: string, code: string) => '\n\n' + hold('<pre><code>' + esc(code) + '</code></pre>') + '\n\n');
  s = s.replace(/\\\$/g, '\u0001');
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, t: string) => '\n\n' + hold('<div class="mathblock">' + tex(t.trim(), true) + '</div>') + '\n\n');
  s = s.replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$/g, (_, t: string) => hold(tex(t, false)));
  s = esc(s).replace(/\u0001/g, '$');

  const out: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;
  let para: string[] = [];
  let table: string[] = [];
  const flushPara = () => { if (para.length) out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.tag}>`); list = null; };
  const flushTable = () => {
    if (!table.length) return;
    // A rule line of dashes under the first row makes it the header.
    const head = table.length > 1 && /^\|?\s*:?-{3,}/.test(table[1]) ? cells(table[0]) : null;
    const body = (head ? table.slice(2) : table).map(cells);
    const row = (r: string[], tag: string) => '<tr>' + r.map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>';
    out.push('<div class="tablewrap"><table class="data">' + (head ? '<thead>' + row(head, 'th') + '</thead>' : '') + '<tbody>' + body.map(r => row(r, 'td')).join('') + '</tbody></table></div>');
    table = [];
  };
  for (const line of s.split('\n')) {
    if (/^\s*\|/.test(line)) { flushPara(); flushList(); table.push(line); continue; }
    flushTable();
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
  flushPara(); flushList(); flushTable();
  // Display formulas stand on their own lines, so their paragraph wrapper is dropped.
  return out.join('').replace(/<p>(\u0000\d+\u0000)<\/p>/g, '$1').replace(/\u0000(\d+)\u0000/g, (_, i: string) => math[+i]);
}
