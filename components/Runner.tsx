'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gradeQuestion } from '@/lib/engine/grade';
import { canRepeat, sameWithNewNumbers } from '@/lib/engine/repeat';
import { SET_SIZE, drawItems, goTo, insertRepeat, isSeen, isUsable, poolKey, setTally, type QSet, type SetItem } from '@/lib/engine/sets';
import { allTypes } from '@/lib/subject';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Answers, Graded, TypeDef } from '@/lib/engine/types';
import QuestionView from './QuestionView';
import { useSubject } from './SubjectContext';

/** Practice over the enabled types (or only those of one lecture), or problem-set practice. */
export type RunnerMode =
  | { kind: 'practice'; topic?: string }
  | { kind: 'ps'; set?: string };

type Tally = { a: number; c: number };

const LET = 'abcdefghij';
const ANSWER_SAVE_DELAY = 1000;

const patchItem = (s: QSet, p: Partial<SetItem>): QSet => ({ ...s, items: s.items.map((x, i) => i === s.pos ? { ...x, ...p } : x) });
/** Marks everything up to the position as seen (sets stored before `seen` existed). */
const markSeen = (s: QSet): QSet => ({ ...s, items: s.items.map((x, i) => i <= s.pos && !x.seen ? { ...x, seen: true } : x) });
const sameTime = (a: string | null, b: string | null) => !!a && !!b && Date.parse(a) === Date.parse(b);

export default function Runner({ mode }: { mode: RunnerMode }) {
  const { mod, bank, settings, stats, record, setFocusTopic } = useSubject();
  const types = useMemo(() => allTypes(mod), [mod]);
  const enabled = useMemo(() => {
    const on = settings.enabled ? new Set(settings.enabled) : null;
    return mod.types.filter(t => !on || on.has(t.key));
  }, [mod, settings.enabled]);

  const topic = mode.kind === 'practice' && mode.topic ? mode.topic : null;
  const pool = useMemo(() => {
    if (mode.kind === 'ps') {
      const on = settings.ps ? new Set(settings.ps) : null;
      return (mod.problemSets || []).filter(p => !mode.set || p.id === mode.set).flatMap(p => p.types).filter(t => !on || on.has(t.key));
    }
    // One lecture: its enabled types, or all of them if none is enabled.
    if (topic) { const own = mod.types.filter(t => t.topic === topic); const on = own.filter(t => enabled.includes(t)); return on.length ? on : own; }
    return enabled;
  }, [mode, mod, enabled, settings.ps, topic]);

  // Every mode keeps a stored set of 20, one per scope; a single lecture has its own.
  const scope = mode.kind === 'ps' ? 'ps' + (mode.set ? ':' + mode.set : '') : topic ? 'lecture:' + topic : 'practice';
  const poolSig = poolKey(pool.map(t => t.key));

  const emaRef = useRef<Record<string, number>>({});
  emaRef.current = Object.fromEntries(Object.entries(stats).map(([k, s]) => [k, s.ema]));

  /** Questions for a new set, continuing after `after`. */
  const fill = useCallback((n: number, after?: SetItem): SetItem[] => {
    const lastType = after && types.find(t => t.key === after.type);
    return drawItems(pool, { bank }, emaRef.current, n, lastType ? { type: lastType.key, topic: lastType.topic } : {});
  }, [pool, types, bank]);

  const [set, setSet] = useState<QSet | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const setRef = useRef<QSet | null>(null);
  setRef.current = set;
  const savedAt = useRef<string | null>(null);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((s: QSet) => {
    if (answerTimer.current) { clearTimeout(answerTimer.current); answerTimer.current = null; }
    const at = new Date().toISOString();
    savedAt.current = at;
    supabaseBrowser().from('practice_sets')
      .upsert({ subject_slug: mod.slug, scope, pool: s.pool, items: s.items, pos: s.pos, updated_at: at }, { onConflict: 'user_id,subject_slug,scope' })
      .then(({ error }) => setSaveErr(error ? 'Your progress in this set was not saved: ' + error.message : null));
  }, [mod.slug, scope]);

  const update = useCallback((s: QSet, persist = true) => { setSet(s); if (persist) save(s); }, [save]);

  const fresh = useCallback((after?: SetItem): QSet => goTo({ pool: poolSig, items: fill(SET_SIZE, after), pos: 0 }, 0), [poolSig, fill]);

  /** Loads the stored set, or draws a new one if there is none, it is finished, or the pool changed. */
  const load = useCallback(async (initial: boolean) => {
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
  }, [mod.slug, scope, poolSig, types, fresh, update]);

  // The first set is drawn on the client so server and client markup agree.
  useEffect(() => {
    setSaveErr(null); setLoaded(false); setSet(null);
    let live = true;
    load(true).finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, poolSig]);

  // Back from another device or tab: pick up where that one left off; leaving: save typed answers now.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') load(false);
      else if (answerTimer.current && setRef.current) save(setRef.current);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load, save]);

  const item = set && set.pos < set.items.length ? set.items[set.pos] : null;
  const type: TypeDef | undefined = item ? types.find(t => t.key === item.type) : undefined;
  const answers: Answers = item?.answers || {};
  const graded: Graded | null = useMemo(() => item?.checked ? gradeQuestion(item.q, item.answers || {}, mod.tolerance) : null, [item, mod.tolerance]);
  const tally = setTally(set, mod.tolerance);

  const setAnswers = useCallback((a: Answers) => {
    const s = setRef.current;
    if (!s || s.pos >= s.items.length || s.items[s.pos].checked) return;
    const n = patchItem(s, { answers: a });
    setRef.current = n;
    setSet(n);
    if (answerTimer.current) clearTimeout(answerTimer.current);
    answerTimer.current = setTimeout(() => { answerTimer.current = null; if (setRef.current) save(setRef.current); }, ANSWER_SAVE_DELAY);
  }, [save]);

  const check = useCallback(() => {
    if (!set || !item || !type || item.checked) return;
    const g = gradeQuestion(item.q, answers, mod.tolerance);
    update(patchItem(set, { answers, checked: true }));
    record(type.key, type.topic, mode.kind, g.a, g.c, { fam: item.q.fam, answers });
  }, [set, item, type, answers, mod.tolerance, update, record, mode.kind]);

  const advance = useCallback(() => {
    if (!set) return;
    const pos = set.pos + 1;
    if (pos < set.items.length) update(goTo(set, pos));
    else {
      const n = fresh(set.items[set.items.length - 1]);
      update(n.items.length ? n : { ...set, pos });
    }
    window.scrollTo({ top: 0 });
  }, [set, fresh, update]);

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
    update(insertRepeat(set, next, n => fill(n, next)));
    window.scrollTo({ top: 0 });
  }, [set, item, type, repeatable, bank, update, fill]);
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
          {mode.kind === 'ps'
              ? <><h2>No question types selected</h2><p>Turn on at least one type on the <Link href={`/s/${mod.slug}/ps`}>problem sets page</Link>.</p></>
              : <><h2>No question types selected</h2><p>Turn on at least one type in <Link href={`/s/${mod.slug}/settings`}>Settings</Link>.</p></>}
          {saveErr && <p className="err">{saveErr}</p>}
        </div>
      </div>
    );
  }

  const cur = set!;
  const progress = { pos: cur.pos + 1, size: cur.items.length };
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
            {`Question ${progress.pos} of ${progress.size}`}
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
          <h4>This set</h4>
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
