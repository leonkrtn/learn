// "Same question, new numbers": redraw a question's generator until it yields the same variant with the same
// sub-questions. Generators pick a scenario and a subset of parts at random, so candidates are compared by shape
// (part types, units, choice options) and wording with numbers and names masked out.
import type { Part, Question } from './types';

/** Numeric questions only; concept questions (all multiple choice from the statement bank) have no numbers to change. */
export const canRepeat = (q: Question) => q.parts.some(p => p.type !== 'mc');

const words = (s: string) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/[−-]?[$€£]?\d[\d.,]*/g, ' # ')
  .replace(/\b[A-Z][a-z’']+\b/g, ' ')
  .toLowerCase()
  .split(/[^a-z#]+/)
  .filter(Boolean);

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size && !b.size) return 1;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i);
};

/** Fixed labels (e.g. Underpriced / Overpriced) must agree; options computed from the inputs only need the same count. */
const sameOptions = (a: string[], b: string[]) => a.length === b.length &&
  (a.some(x => /\d/.test(x)) || a.map(x => words(x).join(' ')).sort().join('|') === b.map(x => words(x).join(' ')).sort().join('|'));

const promptOf = (p: Part) => p.type === 'mc' ? '' : p.prompt;

function compatible(a: Part, b: Part): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'num' && b.type === 'num') return a.unit === b.unit;
  if (a.type === 'choice' && b.type === 'choice') return sameOptions(a.options, b.options);
  if (a.type === 'mc' && b.type === 'mc') return a.options.length === b.options.length && !!a.tf === !!b.tf;
  return false;
}

/**
 * Best ordered match of the original's parts inside the candidate's parts (same order, candidate may hold more).
 * Returns the matched parts and the mean prompt similarity, or null if no full match exists.
 */
function matchParts(orig: Part[], cand: Part[]): { parts: Part[]; sim: number } | null {
  const k = orig.length, m = cand.length;
  if (m < k) return null;
  const os = orig.map(p => new Set(words(promptOf(p))));
  const cs = cand.map(p => new Set(words(promptOf(p))));
  // dp[i][j]: best total similarity matching orig[0..i) inside cand[0..j)
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(m + 1).fill(-Infinity));
  for (let j = 0; j <= m; j++) dp[0][j] = 0;
  for (let i = 1; i <= k; i++) {
    for (let j = i; j <= m; j++) {
      let best = dp[i][j - 1];
      if (dp[i - 1][j - 1] > -Infinity && compatible(orig[i - 1], cand[j - 1])) best = Math.max(best, dp[i - 1][j - 1] + jaccard(os[i - 1], cs[j - 1]));
      dp[i][j] = best;
    }
  }
  if (dp[k][m] === -Infinity) return null;
  const parts: Part[] = [];
  for (let i = k, j = m; i > 0; j--) {
    if (dp[i][j] === dp[i][j - 1]) continue;
    parts.unshift(cand[j - 1]);
    i--;
  }
  return { parts, sim: dp[k][m] / Math.max(1, k) };
}

const raw = (q: Question) => q.html + '\u0000' + q.parts.map(promptOf).join('\u0000');

/**
 * Draws from `gen` until a candidate matches `orig` in variant and sub-questions but differs in its numbers.
 * Searches `ms` for the closest match, and up to `maxMs` while none fits yet (rare sub-question combinations).
 * Returns null if the question has no numbers or no candidate fits within the budget.
 */
export function sameWithNewNumbers(orig: Question, gen: () => Question, { ms = 200, maxMs = 1500 } = {}): Question | null {
  if (!canRepeat(orig)) return null;
  const html = new Set(words(orig.html));
  const before = raw(orig);
  const t0 = Date.now();
  let best: { q: Question; score: number } | null = null;
  for (let t = 0; ; t++) {
    const el = t < 20 ? 0 : Date.now() - t0;
    if (el > maxMs || (best && el > ms)) break;
    let c: Question;
    try { c = gen(); } catch { continue; }
    if (c.fam !== orig.fam) continue;
    const m = matchParts(orig.parts, c.parts);
    if (!m) continue;
    const q: Question = { ...c, parts: m.parts, pts: orig.pts };
    if (raw(q) === before) continue;
    const exact = c.parts.length === orig.parts.length;
    const score = (0.65 * m.sim + 0.35 * jaccard(html, new Set(words(c.html)))) * (exact ? 1 : 0.9);
    if (!best || score > best.score) best = { q, score };
    if (exact && score > 0.97) break;
  }
  return best?.q ?? null;
}
