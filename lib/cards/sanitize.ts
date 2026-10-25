// Keeps simple formatting from imported cards and drops everything that could run code or load media.
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'SUB', 'SUP', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'CODE', 'PRE', 'BLOCKQUOTE', 'HR', 'H1', 'H2', 'H3', 'H4']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'AUDIO', 'VIDEO', 'SVG', 'MATH', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT']);

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  const walk = (el: Element) => {
    for (const child of [...el.children]) {
      if (DROP.has(child.tagName)) { child.remove(); continue; }
      walk(child);
      if (!ALLOWED.has(child.tagName)) { child.replaceWith(...child.childNodes); continue; }
      for (const a of [...child.attributes]) child.removeAttribute(a.name);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML.replace(/\[sound:[^\]]*\]/g, '').trim();
}
