'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gradeQuestion } from '@/lib/engine/grade';
import { canRepeat, sameWithNewNumbers } from '@/lib/engine/repeat';
import type { Answers, Graded, Question } from '@/lib/engine/types';
import { allTypes, type MockExam as Exam } from '@/lib/subject';
import { supabaseBrowser } from '@/lib/supabase/client';
import QuestionView from './QuestionView';
import { useSubject } from './SubjectContext';

export type PastMock = { id: number; score: number; max_score: number; minutes: number; created_at: string; parts: { title: string; score: number; pts: number }[] };

type Retry = { q: Question; answers: Answers; graded: Graded | null } | 'failed';

type Saved = { exam: Exam; answers: Answers[][]; start: number };

const fmtPts = (x: number) => (Math.round(x * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function MockExam({ past }: { past: PastMock[] }) {
  const { mod, bank, record } = useSubject();
  const spec = mod.mock!;
  const router = useRouter();
  const KEY = 'mock-in-progress:' + mod.slug;

  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Answers[][]>([]);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [graded, setGraded] = useState<Graded[][] | null>(null);
  const [result, setResult] = useState<{ total: number; parts: { title: string; score: number; pts: number }[]; minutes: number } | null>(null);
  const [armed, setArmed] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const submitted = useRef(false);
  /** After submitting: a question repeated with new numbers, keyed by "part-question". Does not change the exam score. */
  const [retries, setRetries] = useState<Record<string, Retry>>({});

  const typeOf = (q: Question) => allTypes(mod).find(t => t.key === mod.typeKeyOf(q.fam));
  const retry = (key: string, q: Question) => {
    const t = typeOf(q);
    const nq = t ? sameWithNewNumbers(q, () => t.gen({ bank })) : null;
    setRetries(r => ({ ...r, [key]: nq ? { q: nq, answers: {}, graded: null } : 'failed' }));
  };
  const checkRetry = (key: string) => {
    const r = retries[key];
    if (!r || r === 'failed' || r.graded) return;
    const g = gradeQuestion(r.q, r.answers, mod.tolerance);
    setRetries(x => ({ ...x, [key]: { ...r, graded: g } }));
    record(mod.typeKeyOf(r.q.fam), r.q.topic, 'practice', g.a, g.c, { fam: r.q.fam, answers: r.answers });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw) as Saved; setExam(s.exam); setAnswers(s.answers); setStart(s.start); }
    } catch { /* storage unavailable */ }
    setNow(Date.now());
  }, [KEY]);

  useEffect(() => {
    if (!exam || result) return;
    try { localStorage.setItem(KEY, JSON.stringify({ exam, answers, start } satisfies Saved)); } catch { /* ignore */ }
  }, [KEY, exam, answers, start, result]);

  const left = exam && !result ? Math.max(0, spec.minutes * 60 - Math.floor((now - start) / 1000)) : 0;

  const begin = () => {
    const ex = spec.build({ bank });
    submitted.current = false;
    setExam(ex); setAnswers(ex.parts.map(p => p.qs.map(() => ({})))); setStart(Date.now()); setNow(Date.now());
    setGraded(null); setResult(null); setArmed(false); setSaveErr(null); setRetries({});
    window.scrollTo({ top: 0 });
  };

  const submit = useCallback(async (force: boolean) => {
    if (!exam || submitted.current) return;
    const g = exam.parts.map((p, i) => p.qs.map((q, j) => gradeQuestion(q, answers[i]?.[j] || {}, mod.tolerance)));
    const unanswered = g.flat().reduce((s, x) => s + x.results.filter(r => !r.answered).length, 0);
    if (unanswered && !force && !armed) { setArmed(true); return; }
    submitted.current = true;
    const parts = exam.parts.map((p, i) => ({ title: p.title, pts: p.pts, score: p.qs.reduce((s, q, j) => s + (q.pts || 0) * g[i][j].c / g[i][j].a, 0) }));
    const total = parts.reduce((s, p) => s + p.score, 0);
    const minutes = Math.round((Date.now() - start) / 60000);
    setGraded(g); setResult({ total, parts, minutes });
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    exam.parts.forEach((p, i) => p.qs.forEach((q, j) => {
      const key = mod.typeKeyOf(q.fam);
      record(key, q.topic, 'mock', g[i][j].a, g[i][j].c);
    }));
    const { error } = await supabaseBrowser().from('mock_results').insert({
      subject_slug: mod.slug, score: Math.round(total * 100) / 100, max_score: spec.maxPts, minutes,
      parts: parts.map(p => ({ ...p, score: Math.round(p.score * 100) / 100 })),
    });
    setSaveErr(error ? 'The result could not be saved: ' + error.message : null);
    window.scrollTo({ top: 0 });
    router.refresh();
  }, [exam, answers, armed, start, mod, spec.maxPts, record, KEY, router]);

  useEffect(() => {
    if (!exam || result) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [exam, result]);

  useEffect(() => { if (exam && !result && now && left === 0) submit(true); }, [left, exam, result, now, submit]);

  if (!now) return <div className="page" />;

  if (!exam) {
    return (
      <div className="page">
        <div className="pagehead"><h1>Mock exam</h1><span className="aside">{spec.maxPts} points · {spec.minutes} minutes</span></div>
        <div className="examintro"><ul>{spec.intro.map(s => <li key={s}>{s}</li>)}</ul></div>
        <p className="lede">The paper follows the real structure. The timer runs from the moment you start and the paper is submitted automatically when it reaches zero. Leaving the page keeps the attempt on this device; the clock keeps running.</p>
        <div className="actions" style={{ justifyContent: 'flex-start' }}><button className="btn" type="button" onClick={begin}>Start the exam</button></div>
        <h2 className="sec">Previous attempts</h2>
        {past.length ? (
          <table className="stats">
            <thead><tr><th>Date</th>{past[0].parts.map(p => <th key={p.title}>{p.title}</th>)}<th>Time</th><th>Score</th></tr></thead>
            <tbody>{past.map(m => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                {m.parts.map(p => <td key={p.title}>{fmtPts(p.score)} / {p.pts}</td>)}
                <td>{m.minutes} min</td>
                <td><b>{fmtPts(+m.score)}</b> / {+m.max_score}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="note">No mock exams yet.</p>}
      </div>
    );
  }

  const mm = Math.floor(left / 60), ss = left % 60;
  const unansweredNow = exam.parts.reduce((s, p, i) => s + p.qs.reduce((a, q, j) => a + q.parts.filter((pp, k) => {
    const v = answers[i]?.[j]?.[k];
    return pp.type === 'num' ? !(typeof v === 'string' && v.trim()) : typeof v !== 'number';
  }).length, 0), 0);

  return (
    <div className="page">
      <div className="timerbar">
        <span>{result ? 'Submitted' : `${unansweredNow} answers open`}</span>
        <span>{result ? `${fmtPts(result.total)} / ${spec.maxPts} points` : <>Time remaining <span className={'time' + (left < 600 ? ' low' : '')}>{mm}:{String(ss).padStart(2, '0')}</span></>}</span>
      </div>
      {result && (
        <div className="endbox panel">
          <h2>Result</h2>
          <div className="score">{fmtPts(result.total)} <span>/ {spec.maxPts}</span></div>
          {spec.grade && <p>{spec.grade(result.total)}. Time used: {result.minutes} minutes.</p>}
          <table className="stats"><thead><tr><th>Part</th><th>Points</th></tr></thead>
            <tbody>{result.parts.map(p => <tr key={p.title}><td>{p.title}</td><td>{fmtPts(p.score)} / {p.pts}</td></tr>)}</tbody></table>
          <p className="note">Points within a question are split equally across its sub-questions. Corrections are shown below.</p>
          {saveErr && <p className="err">{saveErr}</p>}
          <button className="btn" type="button" onClick={begin}>New mock exam</button>
        </div>
      )}
      {exam.parts.map((pt, i) => (
        <section key={pt.title}>
          <h3 className="part-h">{pt.title} <span>({pt.pts} points)</span></h3>
          {pt.note && <p className="part-note">{pt.note}</p>}
          {pt.qs.map((q, j) => (
            <section className="examq" key={j}>
              <div className="qnum">{j + 1})</div>
              <div className="qbody">
                <QuestionView q={q} answers={answers[i]?.[j] || {}} graded={graded ? graded[i][j] : null} lastEnterBlurs
                  onChange={a => setAnswers(prev => prev.map((row, x) => x !== i ? row : row.map((cell, y) => y === j ? a : cell)))} />
                <div className="pts">{fmtPts(q.pts || 0)} points{graded ? ` · scored ${fmtPts((q.pts || 0) * graded[i][j].c / graded[i][j].a)}` : ''}</div>
                {graded && canRepeat(q) && typeOf(q) && (() => {
                  const key = i + '-' + j, r = retries[key];
                  return (
                    <div className="retry">
                      {r && r !== 'failed' && (
                        <>
                          <h4>Same question, new numbers</h4>
                          <QuestionView q={r.q} answers={r.answers} graded={r.graded} onSubmit={() => checkRetry(key)}
                            onChange={a => setRetries(x => ({ ...x, [key]: { ...r, answers: a } }))} />
                        </>
                      )}
                      <div className="actions">
                        <span className="note">{r === 'failed' ? 'No variant with new numbers found.' : r?.graded ? `${r.graded.c} of ${r.graded.a} correct` : ''}</span>
                        {r && r !== 'failed' && !r.graded
                          ? <button className="btn" type="button" onClick={() => checkRetry(key)}>Check</button>
                          : <button className="btn ghost" type="button" onClick={() => retry(key, q)}>{r && r !== 'failed' ? 'Again with new numbers' : 'Same question, new numbers'}</button>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>
          ))}
        </section>
      ))}
      {!result && (
        <div className="actions">
          <span className="note">{armed ? `${unansweredNow} answers are still empty.` : ''}</span>
          <button className="btn" type="button" onClick={() => submit(false)}>{armed ? `Submit anyway (${unansweredNow} open)` : 'Submit exam'}</button>
        </div>
      )}
    </div>
  );
}
