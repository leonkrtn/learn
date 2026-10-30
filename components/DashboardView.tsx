import Link from 'next/link';
import { getSubject } from '@/subjects';

export type DashSubject = { slug: string; name: string; short: string; trimester: number; answers: number; correct: number };
export type DashData = {
  name: string;
  error?: string;
  trimesters: { id: number; name: string }[];
  subjects: DashSubject[];
  weak: { slug: string; type: string; rate: number }[];
  mocks: { slug: string; score: number; max: number; date: string }[];
};

export default function DashboardView({ d }: { d: DashData }) {
  const ready = d.subjects.filter(s => getSubject(s.slug));
  const A = ready.reduce((a, s) => a + s.answers, 0), C = ready.reduce((a, s) => a + s.correct, 0);
  return (
    <div className="dash">
      <div className="dashhead">
        <h1>Welcome back, {d.name}</h1>
        <p className="greet">Pick a subject to practise, or pick up where your weakest question types are.</p>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Answers</span><b>{A}</b></div>
        <div className="kpi"><span>Correct</span><b>{A ? Math.round(100 * C / A) + '%' : '—'}</b></div>
        <div className="kpi"><span>Subjects</span><b>{ready.length}</b></div>
        <div className="kpi"><span>Last mock exam</span><b>{d.mocks.length ? <>{d.mocks[0].score.toFixed(1)}<small> / {d.mocks[0].max}</small></> : '—'}</b></div>
      </div>
      <div className="dashgrid">
        <div>
          {d.error && <p className="err">The database is not set up yet ({d.error}). Run supabase/setup.sql in the Supabase SQL editor.</p>}
          {d.trimesters.map(t => {
            const list = d.subjects.filter(s => s.trimester === t.id);
            if (!list.length) return null;
            return (
              <section className="tri" key={t.id}>
                <h2>{t.name}</h2>
                <div className="subjgrid">
                  {list.map(s => {
                    const rate = s.answers ? Math.round(100 * s.correct / s.answers) : 0;
                    return getSubject(s.slug) ? (
                      <Link className="subjcard" href={`/s/${s.slug}`} key={s.slug}>
                        <span className="badge">{s.short}</span>
                        <span className="name">{s.name}</span>
                        <span className="bar"><span style={{ width: rate + '%' }} /></span>
                        <span className="k"><span><b>{s.answers ? rate + '%' : '—'}</b> correct</span><span><b>{s.answers}</b> answers</span></span>
                      </Link>
                    ) : (
                      <div className="subjcard off" key={s.slug}>
                        <span className="badge">{s.short}</span>
                        <span className="name">{s.name}</span>
                        <span className="bar" />
                        <span className="k"><span>In preparation</span></span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <div className="side">
          <div className="widget">
            <h3>Worth another look</h3>
            {d.weak.length ? (
              <ul>{d.weak.map(w => {
                const mod = getSubject(w.slug)!;
                const t = mod.types.find(x => x.key === w.type);
                return <li key={w.slug + w.type}><Link href={`/s/${w.slug}/cycle?topic=${t?.topic || ''}`}>{mod.short}: {t?.name || w.type}</Link><span className="v weak">{Math.round(100 * w.rate)}%</span></li>;
              })}</ul>
            ) : <div className="empty">Shown after three answers per type.</div>}
          </div>
          <div className="widget">
            <h3>Recent mock exams</h3>
            {d.mocks.length ? (
              <ul>{d.mocks.map((m, i) => (
                <li key={i}><Link href={`/s/${m.slug}/mock`}>{getSubject(m.slug)?.short || m.slug}, {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Link><span className="v">{m.score.toFixed(2)} / {m.max}</span></li>
              ))}</ul>
            ) : <div className="empty">No mock exams yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
