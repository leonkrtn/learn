// Multiple-choice builders shared by the problem-set generators: A–E options from a computed answer and the values
// of typical mistakes, "None of the others" as a possible answer, and the "choose the closest number" variant.
import { Q, chance, p_, pick, rstep, shuffle } from './gen-helpers';
import type { ConceptMc, Question } from './types';

export const NONE = 'None of the others';
export const NONE_ABOVE = 'None of the above';
export const CANNOT = 'It cannot be determined';

export type Vec = number[];
export type McOpt = {
  /** Worked solution shown after checking. */
  sol: string;
  /** Allow the "Choose the closest number" variant of PS 3, in which the exact value may be missing. */
  closest?: boolean;
  /** Text of option E; "None of the others" can itself be the right answer. */
  last?: string;
  /** Additive step for filler options when the answer is zero. */
  step?: number;
};

const gap = (a: Vec, b: Vec) => Math.max(...a.map((x, i) => Math.abs(x - b[i]) / Math.max(Math.abs(x), Math.abs(b[i]), 1e-12)));
const finite = (v: Vec) => v.every(Number.isFinite);

export function mcVec(fam: string, topic: string, html: string, ans: Vec, wrongs: Vec[], fmt: (v: Vec) => string, o: McOpt): Question {
  const far = (a: Vec, b: Vec) => gap(a, b) > 0.05 && fmt(a) !== fmt(b);
  const pool: Vec[] = [];
  const add = (w: Vec) => { if (finite(w) && far(w, ans) && pool.every(p => far(p, w))) pool.push(w); };
  shuffle(wrongs).forEach(add);
  for (const f of shuffle([0.5, 0.75, 1.25, 1.5, 2, -1, 0.6, 1.8, 3, 0.4])) {
    if (pool.length >= 6) break;
    add(ans.map(x => Math.abs(x) < 1e-9 ? Math.abs(f) * (o.step ?? 0.01) : x * f));
  }
  for (let k = 1; pool.length < 4 && k < 60; k++) add(ans.map(x => x + k * (o.step ?? (Math.abs(x) * 0.3 || 0.01))));

  const scalar = ans.length === 1;
  if (o.closest && scalar && chance(0.35)) {
    const a = ans[0];
    const listed = chance(0.5);
    const shown = listed ? a : a * (1 + pick([-1, 1]) * rstep(0.08, 0.16, 0.01));
    const d0 = Math.abs(shown - a);
    const opts = pool.filter(p => Math.abs(p[0] - a) > Math.max(2.5 * d0, 0.08 * Math.abs(a)) && far(p, [shown])).slice(0, 4);
    if (opts.length === 4) {
      const all = shuffle([[shown], ...opts]);
      const note = listed ? '' : ` The exact value, ${fmt(ans)}, is not listed; the closest option is ${fmt([shown])}.`;
      return {
        ...Q(fam, topic, html + p_('(Choose the closest number.)'), [{ type: 'mc', options: all.map(fmt), correct: all.findIndex(x => x[0] === shown) }]),
        solution: o.sol + p_(`<b>Answer:</b> ${fmt(ans)}.${note}`),
      };
    }
  }
  const last = o.last ?? NONE;
  const noneRight = last === NONE && chance(0.15);
  const nums = shuffle(noneRight ? pool.slice(0, 4) : [ans, ...pool.slice(0, 3)]);
  const options = [...nums.map(fmt), last];
  const correct = noneRight ? 4 : nums.indexOf(ans);
  const tail = noneRight ? ` It is not among A–D, so the answer is “${NONE}”.` : '';
  return { ...Q(fam, topic, html, [{ type: 'mc', options, correct }]), solution: o.sol + p_(`<b>Answer:</b> ${fmt(ans)}.${tail}`) };
}

export const mcNum = (fam: string, topic: string, html: string, ans: number, wrongs: number[], fmt: (x: number) => string, o: McOpt) =>
  mcVec(fam, topic, html, [ans], wrongs.map(w => [w]), v => fmt(v[0]), o);

/** A–E with text options: the right one, three or four wrong ones and, if asked, "None of the above" as option E. */
export function mcText(fam: string, topic: string, html: string, right: string, wrong: string[], sol: string, none = true): Question {
  const w = shuffle([...new Set(wrong.filter(x => x !== right))]);
  const noneRight = none && w.length >= 4 && chance(0.12);
  const listed = shuffle(noneRight ? w.slice(0, 4) : [right, ...w.slice(0, none ? 3 : 4)]);
  const options = none ? [...listed, NONE_ABOVE] : listed;
  const correct = noneRight ? options.length - 1 : listed.indexOf(right);
  const tail = noneRight ? p_(`None of A–D is right, so the answer is “${NONE_ABOVE}”.`) : '';
  return { ...Q(fam, topic, html, [{ type: 'mc', options, correct }]), solution: sol + tail };
}

/** Short-answer question as multiple choice; one wrong option is the right answer to another question of the topic. */
export function shortAnswer(fam: string, topic: string, items: ConceptMc[]): Question {
  const it = pick(items);
  const right = pick(it.correct);
  const borrowed = pick(items.filter(x => x !== it).flatMap(x => x.correct));
  return mcText(fam, topic, p_(it.q) + p_('Which answer fits best?'), right, [...it.distractors, borrowed], p_(right));
}
