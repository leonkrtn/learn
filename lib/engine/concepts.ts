// Concept questions drawn from a statement bank: pick-the-false, pick-the-true, true/false, short answer as MC.
import { Q, p_, pick, shuffle, v } from './gen-helpers';
import type { ConceptBank, Question } from './types';

export type ConceptKind = 'false' | 'true' | 'tf' | 'open';

export function genConceptKind(bank: ConceptBank, topic: string, kind: ConceptKind, prefix = 'L'): Question {
  const B = bank[topic];
  if (!B || (!B.T.length && !B.MC.length)) throw new Error('Empty concept bank for topic ' + topic);
  const key = prefix + topic + '.' + kind;
  if (kind === 'false' && B.F.length && B.T.length >= 3) {
    const opts = shuffle([pick(B.F), ...shuffle(B.T).slice(0, 3)]);
    const f = opts.findIndex(o => B.F.includes(o));
    return Q(key, topic, p_(v('Which of the following statements is FALSE?', 'Identify the FALSE statement.')), [{ type: 'mc', options: opts, correct: f }]);
  }
  if (kind === 'true' && B.T.length && B.F.length >= 3) {
    const opts = shuffle([pick(B.T), ...shuffle(B.F).slice(0, 3)]);
    const t = opts.findIndex(o => B.T.includes(o));
    return Q(key, topic, p_(v('Which of the following statements is TRUE?', 'Which one of the following statements is correct?')), [{ type: 'mc', options: opts, correct: t }]);
  }
  if (kind === 'open' && B.MC.length) {
    const item = pick(B.MC);
    const right = pick(item.correct);
    const opts = shuffle([right, ...item.distractors]);
    return Q(key, topic, p_(item.q), [{ type: 'mc', options: opts, correct: opts.indexOf(right) }]);
  }
  const isT = B.F.length ? Math.random() < 0.5 : true;
  const s = pick(isT ? B.T : B.F);
  return Q(prefix + topic + '.tf', topic, p_('True or false?') + '<blockquote>' + s + '</blockquote>', [{ type: 'mc', options: ['True', 'False'], correct: isT ? 0 : 1, tf: true }]);
}

export function genConcept(bank: ConceptBank, topic: string, prefix = 'L'): Question {
  const r = Math.random();
  return genConceptKind(bank, topic, r < 0.35 ? 'false' : r < 0.48 ? 'true' : r < 0.73 ? 'tf' : 'open', prefix);
}
