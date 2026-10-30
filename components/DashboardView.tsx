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

const pct = (c: number, a: number) => Math.round(100 * c / a) + '%';

export default function DashboardView({ d }: { d: DashData }) {
  const ready = d.subjects.filter(s => getSubject(s.slug));
  const A = ready.reduce((a, s) => a + s.answers, 0), C = ready.reduce((a, s) => a + s.correct, 0);
  const worst = d.weak[0];
  const wMod = worst && getSubject(worst.slug)!;
  const wType = worst && wMod!.types.find(x => x.key === worst.type);
  const last = d.mocks[0];
  return (
    <div className="dash">
      <header className="dashhead">
        {worst ? (
          <>
            <h1>{Math.round(100 * worst.rate)}% on {wType?.name || worst.type}</h1>
            <p className="greet">Your weakest question type, in {wMod!.name}. <Link href={`/s/${worst.slug}/cycle?topic=${wType?.topic || ''}`}>Practise lecture {wType?.topic}</Link></p>
          </>
        ) : A ? (
          <><h1>{A} answers, {pct(C, A)} correct</h1><p className="greet">Weak spots show up here after three answers per question type.</p></>
        ) : (
          <><h1>Nothing answered yet</h1><p className="greet">{ready[0] ? <>Start with <Link href={`/s/${ready[0].slug}`}>{ready[0].name}</Link>.</> : 'No subject is ready yet.'}</p></>
        )}
        {A > 0 && (
          <p className="tally num">
            {A} answers · {pct(C, A)} correct{last ? <> · last mock exam {last.score.toFixed(1)} of {last.max} ({getSubject(last.slug)?.short || last.slug}, {new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</> : null}
          </p>
        )}
      </header>
      {d.error && <p className="err">The database is not set up yet ({d.error}). Run supabase/setup.sql in the Supabase SQL editor.</p>}
      <div className="dashgrid">
        <div className="subjects">
          {d.trimesters.map(t => {
            const list = d.subjects.filter(s => s.trimester === t.id);
            if (!list.length) return null;
            return (
              <section className="tri" key={t.id}>
                <h2>{t.name}</h2>
                {list.map(s => getSubject(s.slug) ? (
                  <Link className="subjrow" href={`/s/${s.slug}`} key={s.slug}>
                    <span className="code">{s.short}</span>
                    <span className="name">{s.name}</span>
                    <span className="meter" aria-hidden><span style={{ width: (s.answers ? Math.round(100 * s.correct / s.answers) : 0) + '%' }} /></span>
                    <span className="k num">{s.answers ? <><b>{pct(s.correct, s.answers)}</b> of {s.answers}</> : 'not started'}</span>
                  </Link>
                ) : (
                  <div className="subjrow off" key={s.slug}>
                    <span className="code">{s.short}</span><span className="name">{s.name}</span><span /><span className="k">In preparation</span>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
        <aside className="side">
          <h3>Practise next</h3>
          {d.weak.length > 1 ? (
            <ul>{d.weak.slice(1).map(w => {
              const mod = getSubject(w.slug)!;
              const t = mod.types.find(x => x.key === w.type);
              return <li key={w.slug + w.type}><Link href={`/s/${w.slug}/cycle?topic=${t?.topic || ''}`}><small>{mod.short}</small>{t?.name || w.type}</Link><span className="v weak num">{Math.round(100 * w.rate)}%</span></li>;
            })}</ul>
          ) : <div className="empty">Listed after three answers per question type.</div>}
          <h3>Mock exams</h3>
          {d.mocks.length ? (
            <ul>{d.mocks.map((m, i) => (
              <li key={i}><Link href={`/s/${m.slug}/mock`}><small>{getSubject(m.slug)?.short || m.slug}</small>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Link><span className="v num">{m.score.toFixed(1)} / {m.max}</span></li>
            ))}</ul>
          ) : <div className="empty">None taken yet.</div>}
        </aside>
      </div>
    </div>
  );
}
