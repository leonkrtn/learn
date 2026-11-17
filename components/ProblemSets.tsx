'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PsType } from '@/lib/subject';
import Runner from './Runner';
import { useSubject } from './SubjectContext';

const rate = (a: number, c: number) => a ? Math.round(100 * c / a) + '% correct' : 'not started';

/** Choose problem sets and their question types, then practise them; `run` shows the runner for the saved choice. */
export default function ProblemSets({ set, run }: { set?: string; run?: boolean }) {
  const { mod, settings, saveSettings, stats } = useSubject();
  const router = useRouter();
  const sets = mod.problemSets || [];
  const all = sets.flatMap(p => p.types.map(t => t.key));
  const [on, setOn] = useState<Set<string>>(new Set(settings.ps ?? all));

  if (run) {
    const ps = sets.find(p => p.id === set);
    return (
      <>
        <div className="pagehead" style={{ maxWidth: 880 }}>
          <h1>{ps ? `${ps.label ?? 'Problem set ' + ps.id}: ${ps.title}` : 'Problem sets'}</h1>
          <span className="aside"><Link href={`/s/${mod.slug}/ps`}>Change selection</Link></span>
        </div>
        <Runner mode={{ kind: 'ps', set: ps?.id }} />
      </>
    );
  }

  const toggle = (keys: string[], value: boolean) => setOn(prev => {
    const n = new Set(prev);
    keys.forEach(k => value ? n.add(k) : n.delete(k));
    return n;
  });

  async function start(id?: string) {
    const ps = all.filter(k => on.has(k));
    await saveSettings({ ...settings, ps: ps.length === all.length ? null : ps });
    router.push(`/s/${mod.slug}/ps?run=1${id ? '&set=' + id : ''}`);
  }

  const box = (t: PsType) => (
    <label className="opt sub" key={t.key}>
      <input type="checkbox" checked={on.has(t.key)} onChange={e => toggle([t.key], e.target.checked)} /> {t.name}
    </label>
  );

  return (
    <div className="page">
      <div className="pagehead"><h1>Problem sets</h1><span className="aside">{all.length} question types</span></div>
      <p className="lede">Questions in the format of the problem sets and quizzes: single calculations as multiple choice with options A to E, cases with several parts as number entry, and short-answer questions as “which answer fits best”. Each set also covers lecture content the exercises leave out, in the same format. Every question comes with new numbers and a worked solution.</p>
      {sets.map(p => {
        const keys = p.types.map(t => t.key);
        const n = keys.filter(k => on.has(k)).length;
        const a = keys.reduce((s, k) => s + (stats[k]?.answers || 0), 0), c = keys.reduce((s, k) => s + (stats[k]?.correct || 0), 0);
        return (
          <fieldset key={p.id} className="psset">
            <legend>
              <label className="opt">
                <input type="checkbox" checked={n === keys.length} ref={el => { if (el) el.indeterminate = n > 0 && n < keys.length; }}
                  onChange={e => toggle(keys, e.target.checked)} />
                {p.label ?? 'Problem set ' + p.id}: {p.title}
              </label>
            </legend>
            <div className="cols2">
              {p.types.some(t => t.fromPs) && <div>
                <h3 className="pscol">From {p.source ?? 'the problem set'}</h3>
                {p.types.filter(t => t.fromPs).map(box)}
              </div>}
              {p.types.some(t => !t.fromPs) && <div>
                <h3 className="pscol">{p.types.some(t => t.fromPs) ? 'More from lecture ' + p.topic : 'From lecture ' + p.topic + ' (no quiz or exercise yet)'}</h3>
                {p.types.filter(t => !t.fromPs).map(box)}
              </div>}
            </div>
            <div className="psfoot">
              <span className="note">{n} of {keys.length} selected · {rate(a, c)}</span>
              <button type="button" className="btn ghost small" disabled={n === 0} onClick={() => start(p.id)}>Practise {(p.label ?? 'set ' + p.id).replace(/^Problem set/, 'set').replace(/^Set/, 'set')}</button>
            </div>
          </fieldset>
        );
      })}
      <div className="actions" style={{ justifyContent: 'flex-start', gap: 24 }}>
        <button type="button" className="btn" disabled={on.size === 0} onClick={() => start()}>Practise selection</button>
        <button type="button" className="linkbtn" onClick={() => setOn(new Set(all))}>Select all</button>
        <button type="button" className="linkbtn" onClick={() => setOn(new Set())}>Clear all</button>
      </div>
    </div>
  );
}
