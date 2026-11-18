// Which steps of a question's worked calculation belong to one part: everything up to the step that yields the
// part's answer, with the steps that already answered earlier parts grouped per part (shown collapsed).
import type { CalcStep, Question } from './engine/types';

export type CalcGroup = { part: number; steps: CalcStep[] };
export type CalcView = { earlier: CalcGroup[]; own: CalcStep[] };

const lastIndex = (steps: CalcStep[], key: string) => {
  for (let i = steps.length - 1; i >= 0; i--) if (steps[i].key === key) return i;
  return -1;
};

/** The calculation for part `k`, or null when the question has none for it. */
export function calcView(q: Question, k: number): CalcView | null {
  const key = q.parts[k]?.key, steps = q.calc;
  if (!steps?.length || !key) return null;
  const end = lastIndex(steps, key);
  if (end < 0) return null;
  const marks = q.parts
    .map((p, j) => ({ part: j, at: j !== k && p.key ? lastIndex(steps, p.key) : -1 }))
    .filter(m => m.at >= 0 && m.at < end)
    .sort((a, b) => a.at - b.at);
  const earlier: CalcGroup[] = [];
  let from = 0;
  for (const m of marks) {
    if (m.at >= from) earlier.push({ part: m.part, steps: steps.slice(from, m.at + 1) });
    from = Math.max(from, m.at + 1);
  }
  return { earlier, own: steps.slice(from, end + 1) };
}
