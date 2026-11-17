'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gradeQuestion } from '@/lib/engine/grade';
import { canRepeat, sameWithNewNumbers } from '@/lib/engine/repeat';
import { CycleBag } from '@/lib/engine/select';
import { SET_SIZE, drawItems, goTo, insertRepeat, isSeen, isUsable, poolKey, reviewItems, setTally, type QSet, type SetItem } from '@/lib/engine/sets';
import { allTypes } from '@/lib/subject';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Answers, Graded, TypeDef } from '@/lib/engine/types';
import ExplainButton from './Explain';
import QuestionView from './QuestionView';
import { useSubject } from './SubjectContext';

export type RunnerMode =
  | { kind: 'practice' }
  | { kind: 'cycle'; topic: string }
  | { kind: 'review' }
  | { kind: 'ps'; set?: string };

type Tally = { a: number; c: number };

const LET = 'abcdefghij';
const ANSWER_SAVE_DELAY = 1000;
/** The lecture cycle keeps this many earlier questions in memory to jump back to. */
const CYCLE_KEEP = 20;

const patchItem = (s: QSet, p: Partial<SetItem>): QSet => ({ ...s, items: s.items.map((x, i) => i === s.pos ? { ...x, ...p } : x) });
/** Marks everything up to the position as seen (sets stored before `seen` existed). */
const markSeen = (s: QSet): QSet => ({ ...s, items: s.items.map((x, i) => i <= s.pos && !x.seen ? { ...x, seen: true } : x) });
const sameTime = (a: string | null, b: string | null) => !!a && !!b && Date.parse(a) === Date.parse(b);

export default function Runner({ mode }: { mode: RunnerMode }) {
  const { mod, bank, settings, stats, due, record, setFocusTopic } = useSubject();
  const types = useMemo(() => allTypes(mod), [mod]);
  const enabled = useMemo(() => {
    const on = settings.enabled ? new Set(settings.enabled) : null;
    return mod.types.filter(t => !on || on.has(t.key));
  }, [mod, settings.enabled]);

  const pool = useMemo(() => {
    if (mode.kind === 'cycle') return mod.types.filter(t => t.topic === mode.topic && enabled.includes(t));
    if (mode.kind === 'ps') {
      const on = settings.ps ? new Set(settings.ps) : null;
      return (mod.problemSets || []).filter(p => !mode.set || p.id === mode.set).flatMap(p => p.types).filter(t => !on || on.has(t.key));
    }
    if (mode.kind === 'review') return types;
    return enabled;
  }, [mode, mod, enabled, settings.ps, types]);

  // Practice, problem sets and review keep a stored set of 20; the lecture cycle runs in memory.
  const stored = mode.kind !== 'cycle';
  const scope = mode.kind === 'ps' ? 'ps' + (mode.set ? ':' + mode.set : '') : mode.kind;
  const poolSig = mode.kind === 'review' ? 'review' : poolKey(pool.map(t => t.key));

  const emaRef = useRef<Record<string, number>>({});
  emaRef.current = Object.fromEntries(Object.entries(stats).map(([k, s]) => [k, s.ema]));
  const dueRef = useRef(due);
  dueRef.current = due;
  const bag = useRef<CycleBag | null>(null);

  /** Questions for a new set (or the next cycle question), continuing after `after`. */
  const fill = useCallback((n: number, after?: SetItem): SetItem[] => {
    if (mode.kind === 'review') {
      const now = Date.now();
      return reviewItems(dueRef.current.filter(d => Date.parse(d.due_at) <= now && d.type_key !== after?.type), types, { bank }, n);
    }
    if (mode.kind === 'cycle') {
      if (!pool.length) return [];
      if (!bag.current) bag.current = new CycleBag(pool.map(t => t.key));
      const type = pool.find(t => t.key === bag.current!.next());
      return type ? drawItems([type], { bank }, {}, 1) : [];
    }
    const lastType = after && types.find(t => t.key === after.type);
    return drawItems(pool, { bank }, emaRef.current, n, lastType ? { type: lastType.key, topic: lastType.topic } : {});
  }, [mode.kind, pool, types, bank]);

  const [set, setSet] = useState<QSet | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [runTally, setRunTally] = useState<Tally>({ a: 0, c: 0 });
  const setRef = useRef<QSet | null>(null);
  setRef.current = set;
  const savedAt = useRef<string | null>(null);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((s: QSet) => {
    if (!stored) return;
    if (answerTimer.current) { clearTimeout(answerTimer.current); answerTimer.current = null; }
    const at = new Date().toISOString();
    savedAt.current = at;
    supabaseBrowser().from('practice_sets')
      .upsert({ subject_slug: mod.slug, scope, pool: s.pool, items: s.items, pos: s.pos, updated_at: at }, { onConflict: 'user_id,subject_slug,scope' })
      .then(({ error }) => setSaveErr(error ? 'Your progress in this set was not saved: ' + error.message : null));
  }, [stored, mod.slug, scope]);

  const update = useCallback((s: QSet, persist = true) => { setSet(s); if (persist) save(s); }, [save]);

  const fresh = useCallback((after?: SetItem): QSet => goTo({ pool: poolSig, items: fill(stored ? SET_SIZE : 1, after), pos: 0 }, 0), [poolSig, fill, stored]);

  /** Loads the stored set, or draws a new one if there is none, it is finished, or the pool changed. */
  const load = useCallback(async (initial: boolean) => {
    if (!stored) return;
    const { data, error } = await supabaseBrowser().from('practice_sets').select('pool, items, pos, updated_at')
      .eq('subject_slug', mod.slug).eq('scope', scope).maybeSingle();
    if (error) setSaveErr('Your saved set could not be loaded: ' + error.message);
    if (!initial && (!data || sameTime(data.updated_at, savedAt.current))) return;
    const s = data as (QSet & { updated_at: string }) | null;
    if (s && isUsable(s, poolSig, types) && s.pos < s.items.length) {
      savedAt.current = s.updated_at;
      setSet(markSeen({ pool: s.pool, items: s.items, pos: s.pos }));
    } else if (initial || (s && s.pos >= s.items.length)) {
      const n = fresh();
      update(n, n.items.length > 0 || !!s);
    }
  }, [stored, mod.slug, scope, poolSig, types, fresh, update]);

  // The first set is drawn on the client so server and client markup agree.
  useEffect(() => {
    bag.current = null;
    setRunTally({ a: 0, c: 0 }); setSaveErr(null); setLoaded(false); setSet(null);
    let live = true;
    if (stored) load(true).finally(() => { if (live) setLoaded(true); });
    else { setSet(fresh()); setLoaded(true); }
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, poolSig, mode.kind === 'cycle' ? mode.topic : '']);

  // Back from another device or tab: pick up where that one left off; leaving: save typed answers now.
  useEffect(() => {
    if (!stored) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') load(false);
      else if (answerTimer.current && setRef.current) save(setRef.current);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [stored, load, save]);

  const item = set && set.pos < set.items.length ? set.items[set.pos] : null;
  const type: TypeDef | undefined = item ? types.find(t => t.key === item.type) : undefined;
  const answers: Answers = item?.answers || {};
  const graded: Graded | null = useMemo(() => item?.checked ? gradeQuestion(item.q, item.answers || {}, mod.tolerance) : null, [item, mod.tolerance]);
  const tally = stored ? setTally(set, mod.tolerance) : runTally;

  const setAnswers = useCallback((a: Answers) => {
    const s = setRef.current;
    if (!s || s.pos >= s.items.length || s.items[s.pos].checked) return;
    const n = patchItem(s, { answers: a });
    setRef.current = n;
    setSet(n);
    if (answerTimer.current) clearTimeout(answerTimer.current);
    if (stored) answerTimer.current = setTimeout(() => { answerTimer.current = null; if (setRef.current) save(setRef.current); }, ANSWER_SAVE_DELAY);
  }, [stored, save]);

  const check = useCallback(() => {
    if (!set || !item || !type || item.checked) return;
    const g = gradeQuestion(item.q, answers, mod.tolerance);
    if (!stored) setRunTally(t => ({ a: t.a + g.a, c: t.c + g.c }));
    update(patchItem(set, { answers, checked: true }));
    record(type.key, type.topic, mode.kind, g.a, g.c, { fam: item.q.fam, answers });
  }, [set, item, type, answers, mod.tolerance, stored, update, record, mode.kind]);

  const advance = useCallback(() => {
    if (!set) return;
    const pos = set.pos + 1;
    if (pos < set.items.length) update(goTo(set, pos));
    else if (!stored) {
      const items = [...set.items, ...fill(1, set.items[set.items.length - 1])].slice(-CYCLE_KEEP);
      update(goTo({ ...set, items }, items.length - 1));
    } else {
      const n = fresh(set.items[set.items.length - 1]);
      update(n.items.length ? n : { ...set, pos }, stored);
    }
    window.scrollTo({ top: 0 });
  }, [set, fresh, fill, update, stored]);

  /** Back to an earlier question of the set (or forward again to one already shown). */
  const jump = useCallback((i: number) => {
    if (!set || i === set.pos || i < 0 || i >= set.items.length || !isSeen(set, i)) return;
    update(goTo(set, i));
    window.scrollTo({ top: 0 });
  }, [set, update]);

  /** Same variant and sub-questions with fresh numbers; it becomes the next question of the set. */
  const repeatable = !!item && !!type && !!graded && canRepeat(item.q);
  const [repeatFailed, setRepeatFailed] = useState(false);
  const repeat = useCallback(() => {
    if (!set || !item || !type || !repeatable) return;
    const q = sameWithNewNumbers(item.q, () => type.gen({ bank }));
    if (!q) { setRepeatFailed(true); return; }
    const next: SetItem = { type: type.key, q };
    update(stored ? insertRepeat(set, next, n => fill(n, next))
      : goTo({ ...set, items: [...set.items.slice(0, set.pos + 1), next, ...set.items.slice(set.pos + 1)].slice(-CYCLE_KEEP) }, Math.min(set.pos + 1, CYCLE_KEEP - 1)));
    window.scrollTo({ top: 0 });
  }, [set, item, type, repeatable, bank, stored, update, fill]);
  useEffect(() => setRepeatFailed(false), [item]);
  useEffect(() => { setFocusTopic(type?.topic ?? null); }, [type, setFocusTopic]);
  useEffect(() => () => setFocusTopic(null), [setFocusTopic]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.tagName === 'MATH-FIELD' || t.isContentEditable)) return;
      // Typing in the cheatsheet drawer or reading an explanation must not answer or advance the question.
      if (t?.closest?.('.drawer') || document.querySelector('dialog[open]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') {
        if (t && t.tagName === 'BUTTON' && !t.dataset.primary) return;
        e.preventDefault();
        if (graded) advance(); else check();
        return;
      }
      if (graded && e.key.toLowerCase() === 'r') { e.preventDefault(); repeat(); return; }
      if (set && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); jump(set.pos + (e.key === 'ArrowLeft' ? -1 : 1)); return; }
      if (!item || graded) return;
      const single = item.q.parts.length === 1 && item.q.parts[0].type === 'mc' ? item.q.parts[0] : null;
      if (!single) return;
      const k = e.key.toLowerCase();
      const i = single.tf ? (k === 't' ? 0 : k === 'f' ? 1 : -1) : LET.indexOf(k);
      if (i >= 0 && i < single.options.length) setAnswers({ 0: i });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [set, item, graded, check, advance, repeat, jump, setAnswers]);

  const theory = type ? mod.theory.find(p => p.types.includes(type.key)) : undefined;
  const st = type ? stats[type.key] : undefined;
  const unitName = mode.kind === 'ps' ? (mod.problemSets?.[0]?.label?.replace(/\s*\S+$/, '') || 'Problem set') : 'Lecture';
  const rate = (t: Tally) => t.a ? Math.round(100 * t.c / t.a) + '%' : '—';

  if (!loaded) return <div className="meta" />;

  if (!item || !type) {
    return (
      <div className="page">
        <div className="endbox panel">
          {mode.kind === 'review'
            ? <><h2>Nothing to review</h2><p>Question types you get wrong show up here again a day later, then after 3, 7, 16 and 35 days, always with new numbers. Come by whenever it suits you.</p>{tally.a > 0 && <p className="note">Last set: {tally.c} of {tally.a} answers correct.</p>}</>
            : mode.kind === 'ps'
              ? <><h2>No question types selected</h2><p>Turn on at least one type on the <Link href={`/s/${mod.slug}/ps`}>problem sets page</Link>.</p></>
              : <><h2>No question types selected</h2><p>Turn on at least one type in <Link href={`/s/${mod.slug}/settings`}>Settings</Link>.</p></>}
          {saveErr && <p className="err">{saveErr}</p>}
        </div>
      </div>
    );
  }

  const cycleInfo = mode.kind === 'cycle' && bag.current ? { pos: bag.current.pos, size: bag.current.size, round: bag.current.round } : null;
  const cur = set!;
  const newest = cur.pos === cur.items.length - 1;
  // The cycle counts its round; when looking back, the header counts the questions kept in memory instead.
  const progress = cycleInfo && newest ? { pos: cycleInfo.pos, size: cycleInfo.size } : { pos: cur.pos + 1, size: cur.items.length };
  const wrong = graded && graded.c < graded.a;
  const nav = cur.items.map((it, i) => {
    if (!isSeen(cur, i)) return 'unseen';
    if (!it.checked) return 'open';
    const g = gradeQuestion(it.q, it.answers || {}, mod.tolerance);
    return g.c === g.a ? 'ok' : 'bad';
  });

  return (
    <div className="with-rail">
      <div className="panel qpanel">
        <div className="meta">
          <div className="qno">
            {cycleInfo && !newest ? 'Earlier question' : `Question ${progress.pos} of ${progress.size}`}
            <small>{type.name}</small>
          </div>
          <div>{tally.a ? <>Correct: <b>{tally.c}</b> of {tally.a}</> : `${unitName} ${type.topic}`}</div>
        </div>
        <nav className="qnav" aria-label="Questions in this set">
          {nav.map((st, i) => (
            <button key={i} type="button" className={st + (i === cur.pos ? ' cur' : '')} disabled={st === 'unseen'} onClick={() => jump(i)}
              aria-current={i === cur.pos ? 'step' : undefined}
              title={st === 'unseen' ? 'Not reached yet' : `Question ${i + 1}: ${st === 'ok' ? 'correct' : st === 'bad' ? 'not fully correct' : 'not checked'}`}>
              {i + 1}
            </button>
          ))}
        </nav>
        <QuestionView q={item.q} answers={answers} onChange={setAnswers} graded={graded} onSubmit={check} autoFocus />
        <div className="theorylink" style={{ visibility: wrong ? 'visible' : 'hidden' }}>
          <ExplainButton typeKey={type.key} hidden={!wrong} />
          {theory ? <span>Revisit the lecture: <Link href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link></span> : ' '}
        </div>
        <div className="actions">
          <div className="actl">
            <button type="button" className="linkbtn" style={{ visibility: cur.pos > 0 ? 'visible' : 'hidden' }} onClick={() => jump(cur.pos - 1)}>← Previous</button>
            {graded
              ? <button type="button" className="linkbtn" style={{ visibility: repeatable ? 'visible' : 'hidden' }} onClick={repeat} disabled={repeatFailed}>
                  {repeatFailed ? 'No variant with new numbers found' : 'Same question, new numbers'}
                </button>
              : <button type="button" className="linkbtn" onClick={advance}>Skip</button>}
          </div>
          <button type="button" className="btn" data-primary="1" onClick={graded ? advance : check}>
            {graded ? 'Next question' : 'Check'}
          </button>
        </div>
        <p className="note answernote">{mod.answerNote}</p>
        {saveErr && <p className="err">{saveErr}</p>}
      </div>
      <aside className="rail">
        <div className="block">
          <h4>{cycleInfo ? `Round ${cycleInfo.round}` : 'This set'}</h4>
          {tally.a ? (
            <div className="big">{rate(tally)}<small>{tally.c} of {tally.a} correct</small></div>
          ) : <div className="quiet-big">No answers yet</div>}
          <div className="meter" aria-hidden><span style={{ width: `${Math.round(100 * progress.pos / progress.size)}%` }} /></div>
          <h4 className="sub">This question type</h4>
          <dl>
            <dt>Answered before</dt><dd>{st?.answers ?? 0}</dd>
            {st && st.answers > 0 && <><dt>Your rate</dt><dd>{Math.round(100 * st.correct / st.answers)}%</dd></>}
            <dt>{unitName}</dt><dd>{type.topic}</dd>
          </dl>
          {theory && <Link className="raillink" href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link>}
          <p className="keys"><span><kbd>Enter</kbd> check, then next</span><span><kbd>a</kbd>–<kbd>e</kbd> or <kbd>t</kbd> <kbd>f</kbd> choose</span><span><kbd>R</kbd> same question, new numbers</span><span><kbd>←</kbd> <kbd>→</kbd> earlier questions</span><span><kbd>Alt</kbd> <kbd>C</kbd> cheatsheet</span></p>
        </div>
      </aside>
    </div>
  );
}
