// Parsers for flashcard imports: CSV/TSV text and Anki .apkg packages (legacy and zstd-compressed collections).
export type ImportedCard = { front: string; back: string };

export function parseCsv(text: string): ImportedCard[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  if (!lines.length) return [];
  const count = (ch: string) => { let n = 0, q = false; for (const c of lines[0]) { if (c === '"') q = !q; else if (c === ch && !q) n++; } return n; };
  const sep = ['\t', ';', ','].map(c => [c, count(c)] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  const src = lines.join('\n');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && cell === '') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  row.push(cell); rows.push(row);
  const header = /^(front|back|question|answer|frage|antwort|vorderseite|r(ü|ue)ckseite|term|definition)$/i;
  if (rows.length && header.test(rows[0][0].trim())) rows.shift();
  return rows.filter(r => r.length >= 2 && r[0].trim() && r[1].trim()).map(r => ({ front: r[0].trim(), back: r.slice(1).filter(Boolean).join('<br>').trim() }));
}

const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;

/** One card per cloze number; the gap shows its hint or "[…]", the answer side marks the filled gap. */
export function clozeCards(text: string, extra: string): ImportedCard[] {
  const nums = [...new Set([...text.matchAll(CLOZE)].map(m => m[1]))];
  return nums.map(n => ({
    front: text.replace(CLOZE, (_, k, ans, hint) => k === n ? `<b>[${hint || '…'}]</b>` : ans),
    back: text.replace(CLOZE, (_, k, ans) => k === n ? `<b>${ans}</b>` : ans) + (extra ? '<br><br>' + extra : ''),
  }));
}

export function notesToCards(fieldsList: string[][]): ImportedCard[] {
  const out: ImportedCard[] = [];
  for (const f of fieldsList) {
    if (!f.length) continue;
    if (/\{\{c\d+::/.test(f[0])) out.push(...clozeCards(f[0], f.slice(1).filter(Boolean).join('<br>')));
    else if (f.length >= 2 && f[0].trim() && f.slice(1).some(x => x.trim())) out.push({ front: f[0], back: f.slice(1).filter(x => x.trim()).join('<br><br>') });
  }
  return out;
}

declare global { interface Window { initSqlJs?: (cfg: { locateFile: (f: string) => string }) => Promise<{ Database: new (data: Uint8Array) => { exec: (sql: string) => { values: unknown[][] }[]; close: () => void } }> } }

function loadSqlJs(): Promise<NonNullable<Window['initSqlJs']>> {
  if (window.initSqlJs) return Promise.resolve(window.initSqlJs);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/vendor/sql-wasm.js';
    s.onload = () => window.initSqlJs ? resolve(window.initSqlJs) : reject(new Error('sql.js did not load'));
    s.onerror = () => reject(new Error('sql.js did not load'));
    document.head.appendChild(s);
  });
}

export async function parseApkg(file: Blob): Promise<ImportedCard[]> {
  const [{ default: JSZip }, { decompress }] = await Promise.all([import('jszip'), import('fzstd')]);
  const zip = await JSZip.loadAsync(file);
  let bytes: Uint8Array | null = null;
  const b = zip.file('collection.anki21b');
  if (b) bytes = decompress(await b.async('uint8array'));
  else {
    const legacy = zip.file('collection.anki21') || zip.file('collection.anki2');
    if (legacy) bytes = await legacy.async('uint8array');
  }
  if (!bytes) throw new Error('No Anki collection found in this file.');
  const init = await loadSqlJs();
  const SQL = await init({ locateFile: f => '/vendor/' + f });
  const db = new SQL.Database(bytes);
  try {
    const res = db.exec('select flds from notes order by id');
    const fields = (res[0]?.values || []).map(r => String(r[0]).split('\x1f'));
    return notesToCards(fields);
  } finally { db.close(); }
}
