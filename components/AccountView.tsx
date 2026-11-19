'use client';

import { useRouter } from 'next/navigation';
import DisplaySettings from './DisplaySettings';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import HistoryChart, { fmtMinutes, type Day, type Metric } from './HistoryChart';

export type AccountSubject = {
  slug: string; short: string; name: string;
  /** All-time answers (sub-questions) and correct ones. */
  answers: number; correct: number;
  mocks: number; best: { score: number; max: number } | null;
};

type Row = { day: string; subject_slug: string; answers: number; correct: number; cards: number; mocks: number; minutes: number };
type Sum = { answers: number; correct: number; cards: number; minutes: number; days: number };

const rate = (a: number, c: number) => a ? Math.round(100 * c / a) + '%' : '—';
const fmtPts = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
const fmtDate = (k: string) => new Date(k + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dayKey = (offset: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - offset); return d.toLocaleDateString('en-CA'); };

function sum(rows: Row[]): Sum {
  const days = new Set<string>();
  const s = { answers: 0, correct: 0, cards: 0, minutes: 0 };
  for (const r of rows) { s.answers += r.answers; s.correct += r.correct; s.cards += r.cards; s.minutes += r.minutes; days.add(r.day); }
  return { ...s, days: days.size };
}

/** Days in a row with any activity, ending today (or yesterday, so the streak survives until you study today). */
function streak(rows: Row[]): number {
  const days = new Set(rows.map(r => r.day));
  let start = days.has(dayKey(0)) ? 0 : 1, n = 0;
  while (days.has(dayKey(start + n))) n++;
  return n;
}

export default function AccountView({ email, name, subjects }: { email: string; name: string; subjects: AccountSubject[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [metric, setMetric] = useState<Metric>('minutes');
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    supabaseBrowser().rpc('study_activity', { p_days: 3650, p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
      .then(({ data, error }) => {
        setErr(error ? 'Your activity could not be loaded: ' + error.message : null);
        setRows(((data || []) as Row[]).map(r => ({ day: r.day, subject_slug: r.subject_slug, answers: +r.answers, correct: +r.correct, cards: +r.cards, mocks: +r.mocks, minutes: +r.minutes })));
      });
  }, []);
  useEffect(load, [load]);

  const shown = useMemo(() => (rows || []).filter(r => filter === 'all' || r.subject_slug === filter), [rows, filter]);
  const days: Day[] = useMemo(() => {
    const m = new Map<string, Day>();
    for (const r of shown) {
      const d = m.get(r.day) || { day: r.day, answers: 0, correct: 0, cards: 0, minutes: 0 };
      d.answers += r.answers; d.correct += r.correct; d.cards += r.cards; d.minutes += r.minutes;
      m.set(r.day, d);
    }
    return [...m.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [shown]);
  const periods = useMemo(() => {
    const since = (n: number) => { const k = dayKey(n - 1); return shown.filter(r => r.day >= k); };
    return [
      { label: 'Today', s: sum(since(1)) },
      { label: 'Last 7 days', s: sum(since(7)) },
      { label: 'Last 30 days', s: sum(since(30)) },
      { label: 'All time', s: sum(shown) },
    ];
  }, [shown]);
  const inRow = useMemo(() => streak(shown), [shown]);
  const perSubject = useMemo(() => new Map(subjects.map(s => {
    const own = (rows || []).filter(r => r.subject_slug === s.slug);
    return [s.slug, { minutes: own.reduce((a, r) => a + r.minutes, 0), last: own.length ? own[own.length - 1].day : null }];
  })), [rows, subjects]);

  async function reset(slug: string | null) {
    const key = slug ?? 'all';
    if (armed !== key) { setArmed(key); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = slug ? await sb.rpc('reset_subject_stats', { p_subject: slug }) : await sb.rpc('reset_all_stats');
    setBusy(false); setArmed(null);
    if (error) { setErr('The reset failed: ' + error.message); return; }
    load();
    router.refresh();
  }

  const totalA = subjects.reduce((a, s) => a + s.answers, 0);

  return (
    <div className="page account">
      <div className="pagehead"><h1>Account</h1><span className="aside">{email}</span></div>
      <ProfileName initial={name} />
      <DisplaySettings />

      <div className="sechead">
        <h2 className="sec">Your learning</h2>
        <label className="filter">Subject
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All subjects</option>
            {subjects.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </label>
      </div>
      <p className="lede">
        {rows === null ? <span className="skel w40" />
          : !periods[3].s.days ? <>Nothing practised yet.</>
          : <>{inRow > 1 ? `${inRow} days in a row with practice. ` : inRow === 0 ? 'No practice today or yesterday. ' : ''}Last 7 days: {fmtMinutes(periods[1].s.minutes)} on {periods[1].s.days} {periods[1].s.days === 1 ? 'day' : 'days'}.</>}
      </p>
      <table className="stats">
        <thead><tr><th>Period</th><th>Study time</th><th>Active days</th><th>Answers</th><th>Correct</th><th>Flashcards</th></tr></thead>
        <tbody>{periods.map(({ label, s }) => (
          <tr key={label}>
            <td>{label}</td>
            {rows === null ? <td colSpan={5}><span className="skel" /></td> : <>
              <td>{fmtMinutes(s.minutes)}</td><td>{s.days}</td><td>{s.answers}</td><td>{rate(s.answers, s.correct)}</td><td>{s.cards}</td>
            </>}
          </tr>
        ))}</tbody>
      </table>
      <div className="panel chartpanel">
        <div className="charthead">
          <label className="filter">Bars show
            <select value={metric} onChange={e => setMetric(e.target.value as Metric)}>
              <option value="minutes">Study time</option>
              <option value="answers">Answers</option>
              <option value="cards">Flashcards</option>
            </select>
          </label>
        </div>
        {rows ? <HistoryChart rows={days} metric={metric} /> : <div aria-label="Loading charts"><span className="skel w40" /><span className="skel" style={{ height: 240 }} /><span className="skel w40" /><span className="skel" style={{ height: 150 }} /></div>}
      </div>

      <h2 className="sec">By subject</h2>
      <table className="stats">
        <thead><tr><th>Subject</th><th>Study time</th><th>Last practised</th><th>Answers</th><th>Correct</th><th>Best mock exam</th><th aria-label="Actions" /></tr></thead>
        <tbody>{subjects.map(s => {
          const p = perSubject.get(s.slug);
          return (
            <tr key={s.slug}>
              <td>{s.name}</td>
              <td>{rows ? fmtMinutes(p?.minutes || 0) : ''}</td>
              <td>{rows ? (p?.last ? fmtDate(p.last) : '—') : ''}</td>
              <td>{s.answers}</td>
              <td>{rate(s.answers, s.correct)}</td>
              <td>{s.best ? `${fmtPts(s.best.score)} / ${s.best.max}` : '—'}</td>
              <td className="rowact">
                <button type="button" className={'act' + (armed === s.slug ? ' danger' : '')} disabled={busy || (!s.answers && !s.mocks)} onClick={() => reset(s.slug)}
                  onBlur={() => armed === s.slug && setArmed(null)}>
                  {armed === s.slug ? 'Click again to reset' : 'Reset'}
                </button>
              </td>
            </tr>
          );
        })}</tbody>
      </table>

      <fieldset>
        <legend>Reset progress</legend>
        <p className="note" style={{ marginTop: 0 }}>A reset deletes your answers, the right and wrong counts, the weighting of weak question types, your open question sets and your mock exam results. Flashcards, slide notes and your cheatsheet stay. Use Reset in the table for one subject.</p>
        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button type="button" className={'btn ghost small' + (armed === 'all' ? ' danger' : '')} disabled={busy || !totalA} onClick={() => reset(null)}
            onBlur={() => armed === 'all' && setArmed(null)}>
            {armed === 'all' ? 'Click again to delete everything' : 'Reset all subjects'}
          </button>
        </div>
      </fieldset>
      <p className="err" aria-live="polite">{err}</p>
    </div>
  );
}

/** Display name shown on public slide notes and shared cheatsheets; the same for every subject. */
function ProfileName({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save() {
    const v = name.trim();
    if (!v || v.length > 40) { setMsg({ ok: false, text: 'Use 1 to 40 characters.' }); return; }
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    if (!data.user) return;
    const { error } = await sb.from('profiles').upsert({ user_id: data.user.id, display_name: v, updated_at: new Date().toISOString() });
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved' });
  }
  return (
    <fieldset>
      <legend>Profile</legend>
      <p className="note" style={{ marginTop: 0 }}>Your name on public slide notes and on a shared cheatsheet. It applies to all subjects.</p>
      <div className="opt">
        <input className="textin" value={name} maxLength={40} onChange={e => { setName(e.target.value); setMsg(null); }} aria-label="Display name" />
        <button type="button" className="btn ghost small" onClick={save}>Save name</button>
        <span className={msg?.ok ? 'okmsg' : 'err'}>{msg?.text}</span>
      </div>
    </fieldset>
  );
}
