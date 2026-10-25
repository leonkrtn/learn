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
  return (
    <div className="dash">
      <div>
        <h1>Subjects</h1>
        <p className="greet">Signed in as {d.name}. Pick a subject to practise.</p>
        {d.error && <p className="err">The database is not set up yet ({d.error}). Run supabase/setup.sql in the Supabase SQL editor.</p>}
        {d.trimesters.map(t => {
          const list = d.subjects.filter(s => s.trimester === t.id);
          if (!list.length) return null;
          return (
            <section className="tri" key={t.id}>
              <h2>{t.name}</h2>
              {list.map(s => getSubject(s.slug) ? (
                <Link className="subjrow" href={`/s/${s.slug}`} key={s.slug}>
                  <span className="short">{s.short}</span>
                  <span className="name">{s.name}</span>
                  <span className="k"><b>{s.answers ? Math.round(100 * s.correct / s.answers) + '%' : '—'}</b>correct</span>
                  <span className="k"><b>{s.answers}</b>answers</span>
                </Link>
              ) : (
                <div className="subjrow off" key={s.slug}>
                  <span className="short">{s.short}</span><span className="name">{s.name}</span>
                  <span className="k">In preparation</span><span />
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <div className="side">
        <h3>Worth another look</h3>
        {d.weak.length ? (
          <ul>{d.weak.map(w => {
            const mod = getSubject(w.slug)!;
            const t = mod.types.find(x => x.key === w.type);
            return <li key={w.slug + w.type}><Link href={`/s/${w.slug}/cycle?topic=${t?.topic || ''}`}>{mod.short}: {t?.name || w.type}</Link><span className="v">{Math.round(100 * w.rate)}%</span></li>;
          })}</ul>
        ) : <div className="empty">Shown after three answers per type.</div>}

        <h3>Recent mock exams</h3>
        {d.mocks.length ? (
          <ul>{d.mocks.map((m, i) => (
            <li key={i}><Link href={`/s/${m.slug}/mock`}>{getSubject(m.slug)?.short || m.slug}, {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Link><span className="v">{m.score.toFixed(2)} / {m.max}</span></li>
          ))}</ul>
        ) : <div className="empty">No mock exams yet.</div>}
      </div>
    </div>
  );
}
