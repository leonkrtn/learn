'use client';

import { useState } from 'react';
import { genConceptKind } from '@/lib/engine/concepts';
import { gradeQuestion } from '@/lib/engine/grade';
import type { Answers, Graded, Question } from '@/lib/engine/types';
import QuestionView from './QuestionView';
import { useSubject } from './SubjectContext';

/** Three true/false checks from the topic's statement bank, new ones on every round. */
export default function TheoryQuiz({ topic }: { topic: string }) {
  const { bank, mod, record } = useSubject();
  const make = () => {
    const seen = new Set<string>(); const out: Question[] = [];
    for (let t = 0; out.length < 3 && t < 40; t++) { const q = genConceptKind(bank, topic, 'tf'); if (!seen.has(q.html)) { seen.add(q.html); out.push(q); } }
    return out;
  };
  const [qs, setQs] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Answers[]>([]);
  const [graded, setGraded] = useState<Graded[] | null>(null);

  if (!bank[topic]) return null;
  if (!qs) {
    return (
      <div className="actions" style={{ justifyContent: 'flex-start' }}>
        <button className="btn ghost" type="button" onClick={() => { setQs(make()); setAnswers([{}, {}, {}]); }}>Start the three checks</button>
      </div>
    );
  }

  const check = () => {
    const g = qs.map((q, i) => gradeQuestion(q, answers[i] || {}, mod.tolerance));
    g.forEach((r, i) => record(mod.typeKeyOf(qs[i].fam), topic, 'theory', r.a, r.c));
    setGraded(g);
  };
  const score = graded ? graded.reduce((s, g) => s + g.c, 0) : 0;

  return (
    <div>
      {qs.map((q, i) => (
        <section className="examq" key={i}>
          <div className="qnum">{i + 1})</div>
          <div className="qbody">
            <QuestionView q={q} answers={answers[i] || {}} graded={graded ? graded[i] : null}
              onChange={a => setAnswers(prev => prev.map((x, j) => j === i ? a : x))} />
          </div>
        </section>
      ))}
      <div className="actions">
        <span className="note">{graded ? `${score} of 3 correct` : ''}</span>
        {graded
          ? <button className="btn" type="button" onClick={() => { setQs(make()); setAnswers([{}, {}, {}]); setGraded(null); }}>Three new checks</button>
          : <button className="btn" type="button" onClick={check}>Check</button>}
      </div>
    </div>
  );
}
