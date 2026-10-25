import type { TypeDef } from './types';

export type EmaMap = Record<string, number>;

/**
 * Adaptive draw: topics equally often, inside a topic by base weight times (1 + 3·error EMA).
 * The same type never comes twice in a row.
 */
export function pickAdaptive(types: TypeDef[], ema: EmaMap, last: { type?: string; topic?: string }, rnd = Math.random): TypeDef {
  const topics = [...new Set(types.map(t => t.topic))];
  let topic = topics[Math.floor(rnd() * topics.length)];
  if (topics.length > 1 && topic === last.topic && rnd() < 0.5) {
    const others = topics.filter(t => t !== topic);
    topic = others[Math.floor(rnd() * others.length)];
  }
  let pool = types.filter(t => t.topic === topic && t.key !== last.type);
  if (!pool.length) pool = types.filter(t => t.key !== last.type);
  if (!pool.length) pool = types;
  return weighted(pool, t => t.weight * (1 + 3 * (ema[t.key] || 0)), rnd);
}

export function weighted<T>(items: T[], w: (x: T) => number, rnd = Math.random): T {
  const tot = items.reduce((s, x) => s + w(x), 0);
  let r = rnd() * tot;
  for (const x of items) { r -= w(x); if (r <= 0) return x; }
  return items[items.length - 1];
}

export function shuffle<T>(a: T[], rnd = Math.random): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

/** Shuffle bag: every round holds each key exactly once; no repeat across the round boundary. */
export class CycleBag {
  private bag: string[] = [];
  private last: string | null = null;
  round = 0;
  pos = 0;
  constructor(private keys: string[], private rnd = Math.random) {}
  get size() { return this.keys.length; }
  next(): string {
    if (!this.bag.length) {
      let b = shuffle(this.keys, this.rnd);
      if (b.length > 1 && b[0] === this.last) [b[0], b[1]] = [b[1], b[0]];
      this.bag = b;
      this.round++;
      this.pos = 0;
    }
    const k = this.bag.shift()!;
    this.pos++;
    this.last = k;
    return k;
  }
}

/** New EMA of the error rate after one graded question. */
export const nextEma = (prev: number, total: number, correct: number) => 0.6 * (prev || 0) + 0.4 * ((total - correct) / Math.max(1, total));
