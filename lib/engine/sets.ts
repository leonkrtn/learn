// Fixed question sets: questions are drawn 20 at a time and kept (with the answers given) until the set is done,
// so a set looks the same after a reload or on another device. Pure helpers; storage lives in the Runner.
import { gradeQuestion } from './grade';
import { pickAdaptive, type EmaMap } from './select';
import type { Answers, Question, TypeDef } from './types';

export const SET_SIZE = 20;
/** Upper bound when repeats are added to a set whose questions have all been seen (matches the table's check). */
export const SET_MAX = 40;

export type SetItem = { type: string; q: Question; answers?: Answers; checked?: boolean; seen?: boolean };
/** `pos` may equal `items.length`: the set is finished and the next one has not been drawn yet. */
export type QSet = { pool: string; items: SetItem[]; pos: number };

/** Short fingerprint of a question pool, so a change in the enabled types starts a new set. */
export function poolKey(keys: string[]): string {
  let h = 5381;
  for (const c of [...keys].sort().join(',')) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return keys.length + ':' + h.toString(36);
}

const gen = (t: TypeDef, ctx: Parameters<TypeDef['gen']>[0]): Question | null => { try { return t.gen(ctx); } catch { return null; } };

/** Adaptive draw of `n` questions from `pool` (topics evenly, weak types more often, no type twice in a row). */
export function drawItems(pool: TypeDef[], ctx: Parameters<TypeDef['gen']>[0], ema: EmaMap, n: number, last: { type?: string; topic?: string } = {}): SetItem[] {
  const out: SetItem[] = [];
  for (let t = 0; out.length < n && pool.length && t < n * 3; t++) {
    const type = pickAdaptive(pool, ema, last);
    last = { type: type.key, topic: type.topic };
    const q = gen(type, ctx);
    if (q) out.push({ type: type.key, q });
  }
  return out;
}

/** A stored set is usable if it was drawn from the same pool and every type still exists. */
export function isUsable(s: QSet | null | undefined, pool: string, types: TypeDef[]): s is QSet {
  if (!s || s.pool !== pool || !Array.isArray(s.items) || !s.items.length) return false;
  if (!Number.isInteger(s.pos) || s.pos < 0 || s.pos > s.items.length) return false;
  const keys = new Set(types.map(t => t.key));
  return s.items.every(it => it && keys.has(it.type) && it.q && Array.isArray(it.q.parts) && it.q.parts.length > 0);
}

/** Shown at least once; sets stored before `seen` existed count everything up to the position. */
export const isSeen = (s: QSet, i: number) => i <= s.pos || !!s.items[i]?.seen || !!s.items[i]?.checked;

/** Moves to question `i` (clamped) and marks it seen. */
export function goTo(s: QSet, i: number): QSet {
  const pos = Math.max(0, Math.min(i, s.items.length - 1));
  return { ...s, pos, items: s.items.map((x, j) => j === pos && !x.seen ? { ...x, seen: true } : x) };
}

/**
 * Puts a repeat of the current question right after it and moves there. It counts as one of the set's questions,
 * so the last unseen question makes room; on the last question it opens the next set (`refill` supplies the rest).
 */
export function insertRepeat(s: QSet, item: SetItem, refill: (n: number) => SetItem[]): QSet {
  const seen = { ...item, seen: true };
  if (s.pos >= s.items.length - 1 || s.items.length >= SET_MAX) return { pool: s.pool, items: [seen, ...refill(SET_SIZE - 1)], pos: 0 };
  const items = [...s.items.slice(0, s.pos + 1), seen, ...s.items.slice(s.pos + 1)];
  if (items.length > SET_SIZE) {
    // Never drop a question that was already shown; with none left unseen the set grows by one.
    let k = -1;
    for (let j = items.length - 1; j > s.pos + 1; j--) if (!isSeen({ ...s, items }, j)) { k = j; break; }
    if (k >= 0) items.splice(k, 1);
  }
  return { ...s, items, pos: s.pos + 1 };
}

/** Answers and correct parts over the checked questions of a set. */
export function setTally(s: QSet | null, tolerance: number): { a: number; c: number } {
  let a = 0, c = 0;
  for (const it of s?.items || []) {
    if (!it.checked) continue;
    const g = gradeQuestion(it.q, it.answers || {}, tolerance);
    a += g.a; c += g.c;
  }
  return { a, c };
}
