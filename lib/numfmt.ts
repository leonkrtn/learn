// Display preferences for numbers: decimal separator and decimals in worked calculations and solutions.
// Set in the browser from the user's display settings (components/Prefs.tsx); the server and tests use the defaults.

export type Sep = 'point' | 'comma';
export type NumPrefs = { sep: Sep; decimals: number };

let cur: NumPrefs = { sep: 'point', decimals: 2 };
export const setNumPrefs = (p: NumPrefs) => { cur = { sep: p.sep, decimals: Math.min(4, Math.max(2, Math.round(p.decimals))) }; };
export const numPrefs = () => cur;

const NUM = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+/g;
const swap = (m: string) => m.replace(/[.,]/g, c => (c === ',' ? '.' : ','));

/** Plain text or generated HTML with English number formatting (1,234.56), shown in the chosen format. Tags stay untouched. */
export function localizeText(s: string, sep: Sep = cur.sep): string {
  if (sep === 'point' || !s) return s;
  return s.split(/(<[^>]*>)/).map(part => (part.startsWith('<') ? part : part.replace(NUM, swap))).join('');
}

/** Markdown with $…$ formulas from the generators and explanations; code stays untouched. */
export function localizeMd(md: string, sep: Sep = cur.sep): string {
  if (sep === 'point' || !md) return md;
  return md.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/).map(chunk => {
    if (/^(```|~~~|`)/.test(chunk)) return chunk;
    return chunk.split(/(\$\$[\s\S]+?\$\$|(?<!\\)\$[^$\n]+?(?<!\\)\$)/).map(seg => {
      if (!seg.startsWith('$')) return localizeText(seg, sep);
      // In formulas thousands are written {,}: they become points, decimal points become {,}.
      return seg.replace(/\{,\}/g, '\u0001').replace(/(\d)\.(\d)/g, '$1{,}$2').replace(/\u0001/g, '.');
    }).join('');
  }).join('');
}
