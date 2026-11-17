// Helpers for suggested cheatsheets (subjects/<slug>/cheatsheet.ts).
import type { ConceptBank } from './engine/types';
import type { SheetBlock } from './subject';

/** A "Key facts" entry from the first true statements of a lecture's concept bank, as a Markdown list. */
export function keyFacts(bank: ConceptBank, topic: string, n: number): SheetBlock {
  const safe = (s: string) => s.replace(/\$/g, '\\$').replace(/\*/g, '∗').replace(/`/g, '’');
  return { topic, title: `Key facts (lecture ${topic})`, body: bank[topic].T.slice(0, n).map(s => '- ' + safe(s)).join('\n') };
}
