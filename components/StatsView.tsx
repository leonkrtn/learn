'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import HistoryChart, { type Day } from './HistoryChart';
import type { PastMock } from './MockExam';
import { useSubject } from './SubjectContext';

const rate = (a: number, c: number) => a ? Math.round(100 * c / a) + '%' : '—';
const fmtPts = (x: number) => (Math.round(x * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function StatsView({ mocks }: { mocks: PastMock[] }) {
  const { mod, stats } = useSubject();
  const [days, setDays] = useState<Day[] | null>(null);
  const [armed, setArmed] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser().rpc('daily_accuracy', { p_subject: mod.slug, p_days: 120, p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setDays(((data || []) as { day: string; answers: number; correct: number }[]).map(d => ({ day: d.day, answers: +d.answers, correct: +d.correct })));
      });
  }, [mod.slug]);

  const byTopic = mod.topics.map(t => {
    const ks = mod.types.filter(x => x.topic === t.id).map(x => x.key);
    return { t, a: ks.reduce((s, k) => s + (stats[k]?.answers || 0), 0), c: ks.reduce((s, k) => s + (stats[k]?.correct || 0), 0) };
  });
  const A = byTopic.reduce((s, x) => s + x.a, 0), C = byTopic.reduce((s, x) => s + x.c, 0);
  const types = mod.types.map(t => ({ t, s: stats[t.key] })).filter(x => x.s && x.s.answers > 0);
  const weak = types.filter(x => x.s.answers >= 3).sort((a, b) => a.s.correct / a.s.answers - b.s.correct / b.s.answers).slice(0, 6);

  async function reset() {
    if (!armed) { setArmed(true); return; }
    const { error } = await supabaseBrowser().rpc('reset_subject_stats', { p_subject: mod.slug });
    if (error) { setErr(error.message); return; }
    window.location.reload();
  }

  return (
    <div className="page">
      <div className="pagehead"><h1>Statistics</h1><span className="aside">{A} answers · {rate(A, C)} correct</span></div>
      <div style={{ minHeight: 560 }}>{days ? <HistoryChart rows={days} /> : null}</div>

      <h2 className="sec">By lecture</h2>
      <table className="stats">
        <thead><tr><th>Lecture</th><th>Answers</th><th>Correct</th><th>Rate</th></tr></thead>
        <tbody>{byTopic.map(({ t, a, c }) => <tr key={t.id}><td>{t.id} · {t.name}</td><td>{a}</td><td>{c}</td><td>{rate(a, c)}</td></tr>)}</tbody>
        <tfoot><tr><td>Total</td><td>{A}</td><td>{C}</td><td>{rate(A, C)}</td></tr></tfoot>
      </table>

      {weak.length > 0 && <>
        <h2 className="sec">Weakest question types<small>at least 3 answers</small></h2>
        <table className="stats">
          <thead><tr><th>Type</th><th>Lecture</th><th>Answers</th><th>Rate</th></tr></thead>
          <tbody>{weak.map(({ t, s }) => <tr key={t.key}><td>{t.name}</td><td>{t.topic}</td><td>{s.answers}</td><td className="weak">{rate(s.answers, s.correct)}</td></tr>)}</tbody>
        </table>
      </>}

      <h2 className="sec">All question types</h2>
      <table className="stats">
        <thead><tr><th>Type</th><th>Lecture</th><th>Answers</th><th>Correct</th><th>Rate</th><th>Recent error rate</th></tr></thead>
        <tbody>{mod.types.map(t => {
          const s = stats[t.key];
          return <tr key={t.key}><td>{t.name}</td><td>{t.topic}</td><td>{s?.answers || 0}</td><td>{s?.correct || 0}</td><td>{rate(s?.answers || 0, s?.correct || 0)}</td><td>{s ? Math.round(100 * s.ema) + '%' : '—'}</td></tr>;
        })}</tbody>
      </table>

      {mocks.length > 0 && <>
        <h2 className="sec">Mock exams</h2>
        <table className="stats">
          <thead><tr><th>Date</th><th>Time</th><th>Score</th></tr></thead>
          <tbody>{mocks.map(m => <tr key={m.id}><td>{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>{m.minutes} min</td><td>{fmtPts(+m.score)} / {+m.max_score}</td></tr>)}</tbody>
        </table>
      </>}

      <p className="note">Each sub-question (a, b, c …) counts as one answer. “Recent error rate” weights the latest attempts most; practice draws types with a high value more often.</p>
      {err && <p className="err">{err}</p>}
      <button type="button" className="btn ghost" onClick={reset}>{armed ? 'Click again to delete all statistics for ' + mod.short : 'Reset statistics'}</button>
    </div>
  );
}
