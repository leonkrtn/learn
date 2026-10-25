import Link from 'next/link';
import { getSubject } from '@/subjects';

export type DashSubject = { slug: string; name: string; short: string; trimester: number; answers: number; correct: number; due: number; cards: number };
export type DashData = {
  name: string;
  error?: string;
  trimesters: { id: number; name: string }[];
  subjects: DashSubject[];
  weak: { slug: string; type: string; rate: number }[];
  mocks: { slug: string; score: number; max: number; date: string }[];
};

export default function DashboardView({ d }: { d: DashData }) {
  const todo = d.subjects.filter(s => getSubject(s.slug) && (s.due || s.cards));
  return (
    <div className="dash">
      <div>
        <h1>Subjects</h1>
        <p className="greet">Signed in as {d.name}. Pick a subject to practise, or start with what is due on the right.</p>
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
                  <span className="k"><b>{s.due + s.cards}</b>due today</span>
                </Link>
              ) : (
                <div className="subjrow off" key={s.slug}>
                  <span className="short">{s.short}</span><span className="name">{s.name}</span>
                  <span className="k">In preparation</span><span /><span />
                </div>
              ))}
            </section>
          );
        })}
      </div>
      <div className="side">
        <h3>Due today</h3>
        {todo.length ? (
          <ul>{todo.flatMap(s => [
            ...(s.due ? [<li key={s.slug + 'r'}><Link href={`/s/${s.slug}/review`}>{s.short}: question types to review</Link><span className="v">{s.due}</span></li>] : []),
            ...(s.cards ? [<li key={s.slug + 'c'}><Link href={`/s/${s.slug}/cards`}>{s.short}: flashcards</Link><span className="v">{s.cards}</span></li>] : []),
          ])}</ul>
        ) : <div className="empty">Nothing due. New cards and reviews appear here.</div>}

        <h3>Weakest question types</h3>
        {d.weak.length ? (
          <ul>{d.weak.map(w => {
            const mod = getSubject(w.slug)!;
            const t = mod.types.find(x => x.key === w.type);
            return <li key={w.slug + w.type}><Link href={`/s/${w.slug}/cycle?topic=${t?.topic || ''}`}>{mod.short}: {t?.name || w.type}</Link><span className="v weak">{Math.round(100 * w.rate)}%</span></li>;
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
