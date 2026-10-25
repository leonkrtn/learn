'use client';

import Link from 'next/link';
import Runner from './Runner';
import { useSubject } from './SubjectContext';

/** Lecture list, or the cycle runner for one lecture: each round asks every type of that lecture once. */
export default function CyclePicker({ topic }: { topic?: string }) {
  const { mod, settings, stats } = useSubject();
  const on = settings.enabled ? new Set(settings.enabled) : null;
  if (topic && mod.topics.some(t => t.id === topic)) {
    return (
      <>
        <div className="pagehead" style={{ maxWidth: 880 }}>
          <h1>Lecture {topic} cycle</h1>
          <span className="aside"><Link href={`/s/${mod.slug}/cycle`}>All lectures</Link></span>
        </div>
        <Runner mode={{ kind: 'cycle', topic }} />
      </>
    );
  }
  return (
    <div className="page">
      <div className="pagehead"><h1>Cycle by lecture</h1></div>
      <p className="lede">A round asks every question type of one lecture exactly once, in random order, with new numbers each time. Use it to cover a lecture completely before moving on.</p>
      <div className="theorylist">
        {mod.topics.map(t => {
          const types = mod.types.filter(x => x.topic === t.id && (!on || on.has(x.key)));
          const a = types.reduce((s, x) => s + (stats[x.key]?.answers || 0), 0);
          const c = types.reduce((s, x) => s + (stats[x.key]?.correct || 0), 0);
          return (
            <Link key={t.id} href={`/s/${mod.slug}/cycle?topic=${t.id}`}>
              <span className="lec">Lecture {t.id}</span>
              <span className="t">{t.name}</span>
              <span className="d">{types.length} types · {a ? Math.round(100 * c / a) + '% correct' : 'not started'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
