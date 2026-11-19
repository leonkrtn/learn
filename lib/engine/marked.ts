// Marked questions: a question marked while practising is kept as a template and asked again with new numbers.
import { canRepeat, sameWithNewNumbers } from './repeat';
import type { Question, TypeDef } from './types';

/** Fingerprint of one concrete question (generator, wording with its numbers, sub-questions), so it is marked once. */
export function questionSig(q: Question): string {
  const s = [q.fam, q.html, ...q.parts.map(p => (p.type === 'mc' ? '' : p.prompt) + '|' + ('options' in p ? p.options.join('|') : ''))].join('\u0000');
  let a = 5381, b = 52711;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = ((a * 33) ^ c) >>> 0; b = ((b * 31) + c) >>> 0; }
  return q.fam.slice(0, 40) + ':' + a.toString(36) + b.toString(36);
}

const shuffled = <T,>(n: number, rnd: () => number) => {
  const o = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
};

/**
 * The marked question again: with numbers, the same variant and sub-questions with new numbers; without numbers
 * (concept questions), the same question with its options in a new order. Falls back to the original.
 */
export function variantOf(template: Question, type: TypeDef, ctx: Parameters<TypeDef['gen']>[0], rnd = Math.random): Question {
  if (canRepeat(template)) return sameWithNewNumbers(template, () => type.gen(ctx)) ?? template;
  return {
    ...template,
    parts: template.parts.map(p => {
      if (p.type !== 'mc' || p.tf || p.options.length < 3) return p;
      const o = shuffled(p.options.length, rnd);
      return { ...p, options: o.map(i => p.options[i]), correct: o.indexOf(p.correct) };
    }),
  };
}
