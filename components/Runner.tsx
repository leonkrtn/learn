'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gradeQuestion } from '@/lib/engine/grade';
import { CycleBag, pickAdaptive } from '@/lib/engine/select';
import type { Answers, Graded, Question, TypeDef } from '@/lib/engine/types';
import QuestionView from './QuestionView';
import { useSubject } from './SubjectContext';

export type RunnerMode =
  | { kind: 'practice' }
  | { kind: 'cycle'; topic: string }
  | { kind: 'review' };

type Current = { type: TypeDef; q: Question };
type Tally = { a: number; c: number };

const LET = 'abcdefghij';

export default function Runner({ mode }: { mode: RunnerMode }) {
  const { mod, bank, settings, stats, due, record } = useSubject();
  const enabled = useMemo(() => {
    const on = settings.enabled ? new Set(settings.enabled) : null;
    return mod.types.filter(t => !on || on.has(t.key));
  }, [mod, settings.enabled]);

  const pool = useMemo(() => {
    if (mode.kind === 'cycle') return mod.types.filter(t => t.topic === mode.topic && enabled.includes(t));
    return enabled;
  }, [mode, mod, enabled]);

  const bag = useRef<CycleBag | null>(null);
  const reviewQueue = useRef<string[] | null>(null);
  const last = useRef<{ type?: string; topic?: string }>({});
  const emaRef = useRef<Record<string, number>>({});
  emaRef.current = Object.fromEntries(Object.entries(stats).map(([k, s]) => [k, s.ema]));

  const sessionLen = mode.kind === 'practice' && settings.mode === 'session' ? settings.sessionLen : null;

  const draw = useCallback((): Current | null => {
    let type: TypeDef | undefined;
    if (mode.kind === 'cycle') {
      if (!pool.length) return null;
      if (!bag.current) bag.current = new CycleBag(pool.map(t => t.key));
      const k = bag.current.next();
      type = pool.find(t => t.key === k);
    } else if (mode.kind === 'review') {
      if (!reviewQueue.current) {
        const now = Date.now();
        reviewQueue.current = due.filter(d => Date.parse(d.due_at) <= now).sort((a, b) => a.box - b.box).map(d => d.type_key);
      }
      const k = reviewQueue.current.shift();
      if (!k) return null;
      type = mod.types.find(t => t.key === k);
      if (!type) return draw();
    } else {
      if (!pool.length) return null;
      type = pickAdaptive(pool, emaRef.current, last.current);
    }
    if (!type) return null;
    last.current = { type: type.key, topic: type.topic };
    let q: Question;
    try { q = type.gen({ bank }); } catch { return mode.kind === 'review' ? draw() : null; }
    return { type, q };
  }, [mode, pool, due, mod, bank]);

  const [cur, setCur] = useState<Current | null>(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [graded, setGraded] = useState<Graded | null>(null);
  const [n, setN] = useState(0);
  const [tally, setTally] = useState<Tally>({ a: 0, c: 0 });
  const [byTopic, setByTopic] = useState<Record<string, Tally>>({});
  const [done, setDone] = useState(false);

  // The first question is drawn on the client so server and client markup agree.
  useEffect(() => {
    bag.current = null; reviewQueue.current = null; last.current = {};
    setCur(draw()); setStarted(true); setAnswers({}); setGraded(null); setN(0); setTally({ a: 0, c: 0 }); setByTopic({}); setDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, mode.kind === 'cycle' ? mode.topic : '', pool.length, settings.mode, settings.sessionLen]);

  const check = useCallback(() => {
    if (!cur || graded) return;
    const g = gradeQuestion(cur.q, answers, mod.tolerance);
    setGraded(g);
    setTally(t => ({ a: t.a + g.a, c: t.c + g.c }));
    setByTopic(b => { const x = b[cur.type.topic] || { a: 0, c: 0 }; return { ...b, [cur.type.topic]: { a: x.a + g.a, c: x.c + g.c } }; });
    record(cur.type.key, cur.type.topic, mode.kind, g.a, g.c, { fam: cur.q.fam, answers });
  }, [cur, graded, answers, mod.tolerance, record, mode.kind]);

  const next = useCallback(() => {
    const k = n + 1;
    if (sessionLen && k >= sessionLen) { setDone(true); return; }
    setN(k); setAnswers({}); setGraded(null); setCur(draw());
    window.scrollTo({ top: 0 });
  }, [n, sessionLen, draw]);

  const skip = useCallback(() => { setAnswers({}); setGraded(null); setCur(draw()); window.scrollTo({ top: 0 }); }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') {
        if (t && t.tagName === 'BUTTON' && !t.dataset.primary) return;
        e.preventDefault();
        if (graded) next(); else check();
        return;
      }
      if (!cur || graded) return;
      const single = cur.q.parts.length === 1 && cur.q.parts[0].type === 'mc' ? cur.q.parts[0] : null;
      if (!single) return;
      const k = e.key.toLowerCase();
      const i = single.tf ? (k === 't' ? 0 : k === 'f' ? 1 : -1) : LET.indexOf(k);
      if (i >= 0 && i < single.options.length) setAnswers({ 0: i });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cur, graded, check, next]);

  const theory = cur ? mod.theory.find(p => p.types.includes(cur.type.key)) : undefined;
  const st = cur ? stats[cur.type.key] : undefined;
  const topicName = (id: string) => mod.topics.find(t => t.id === id)?.name || id;
  const rate = (t: Tally) => t.a ? Math.round(100 * t.c / t.a) + '%' : '—';

  if (!started) return <div className="meta" />;

  if (!cur) {
    return (
      <div className="page">
        <div className="endbox">
          {mode.kind === 'review'
            ? <><h2>Nothing due</h2><p>No question type is due for review. Types you get wrong come back here one day later, then after 3, 7, 16 and 35 days.</p>{tally.a > 0 && <p className="note">This round: {tally.c} of {tally.a} answers correct.</p>}</>
            : <><h2>No question types selected</h2><p>Turn on at least one type in <Link href={`/s/${mod.slug}/settings`}>Settings</Link>.</p></>}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page">
        <div className="endbox">
          <h2>Session complete</h2>
          <div className="score">{rate(tally)}</div>
          <p>{tally.c} of {tally.a} answers correct across {sessionLen} questions.</p>
          <table className="stats">
            <thead><tr><th>Lecture</th><th>Correct</th><th>Rate</th></tr></thead>
            <tbody>{Object.keys(byTopic).sort().map(l => <tr key={l}><td>{l} · {topicName(l)}</td><td>{byTopic[l].c} / {byTopic[l].a}</td><td>{rate(byTopic[l])}</td></tr>)}</tbody>
          </table>
          <button className="btn" type="button" data-primary="1" onClick={() => { setDone(false); setN(0); setTally({ a: 0, c: 0 }); setByTopic({}); setAnswers({}); setGraded(null); setCur(draw()); }}>Start new session</button>
        </div>
      </div>
    );
  }

  const cycleInfo = mode.kind === 'cycle' && bag.current ? { pos: bag.current.pos, size: bag.current.size, round: bag.current.round } : null;
  const wrong = graded && graded.c < graded.a;

  return (
    <div className="with-rail">
      <div>
        <div className="meta">
          <div className="qno">
            {cycleInfo ? `Question ${cycleInfo.pos} of ${cycleInfo.size}` : sessionLen ? `Question ${n + 1}` : `Question ${n + 1}`}
            <small>{sessionLen ? `of ${sessionLen} · ` : ''}{cur.type.name}</small>
          </div>
          <div>{tally.a ? <>Correct: <b>{tally.c}</b> of {tally.a}</> : `Lecture ${cur.type.topic}`}</div>
        </div>
        <QuestionView q={cur.q} answers={answers} onChange={setAnswers} graded={graded} onSubmit={check} autoFocus />
        <div className="theorylink" style={{ visibility: wrong && theory ? 'visible' : 'hidden' }}>
          {theory ? <>Revisit the explanation: <Link href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link></> : ' '}
        </div>
        <div className="actions">
          <button type="button" className="linkbtn" style={{ visibility: graded ? 'hidden' : 'visible' }} onClick={skip}>Skip</button>
          <button type="button" className="btn" data-primary="1" onClick={graded ? next : check}>
            {graded ? (sessionLen && n + 1 >= sessionLen ? 'See results' : 'Next question') : 'Check'}
          </button>
        </div>
        <p className="note" style={{ marginTop: 26 }}>{mod.answerNote}</p>
      </div>
      <aside className="rail">
        <div className="block">
          <h4>{cycleInfo ? `Round ${cycleInfo.round}` : 'This session'}</h4>
          <div className="big">{rate(tally)}</div>
          <dl><dt>Answers</dt><dd>{tally.a}</dd><dt>Correct</dt><dd>{tally.c}</dd></dl>
        </div>
        <div className="block">
          <h4>This question type</h4>
          <dl>
            <dt>Answered before</dt><dd>{st?.answers ?? 0}</dd>
            <dt>Rate</dt><dd>{st && st.answers ? Math.round(100 * st.correct / st.answers) + '%' : '—'}</dd>
            <dt>Lecture</dt><dd>{cur.type.topic}</dd>
          </dl>
        </div>
        {theory && <div className="block"><h4>Theory</h4><Link href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link></div>}
        <div className="note">Enter checks and moves on. In multiple choice, press a–d, or t/f.</div>
      </aside>
    </div>
  );
}
