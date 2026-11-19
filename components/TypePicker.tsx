'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSubject } from './SubjectContext';

/** Choose the lectures and question types that Practice draws from, then start. */
export default function TypePicker() {
  const { mod, settings, saveSettings } = useSubject();
  const router = useRouter();
  const all = mod.types.map(t => t.key);
  const [on, setOn] = useState<Set<string>>(new Set(settings.enabled ?? all));

  const toggle = (keys: string[], value: boolean) => setOn(prev => {
    const n = new Set(prev);
    keys.forEach(k => value ? n.add(k) : n.delete(k));
    return n;
  });

  async function start() {
    const enabled = on.size === all.length ? null : all.filter(k => on.has(k));
    await saveSettings({ ...settings, enabled });
    router.push(`/s/${mod.slug}`);
  }

  return (
    <div className="page">
      <div className="pagehead"><h1>Practice</h1><span className="aside">{on.size} of {all.length} question types</span></div>
      <p className="lede">Switch lectures or single question types on and off, for example to drill one calculation. Lectures are drawn equally often; types you get wrong come back more often, always with new numbers.</p>
      <div className="actions" style={{ justifyContent: 'flex-start', margin: '6px 0 14px' }}>
        <button type="button" className="linkbtn" onClick={() => setOn(new Set(all))}>Select all</button>
        <button type="button" className="linkbtn" onClick={() => setOn(new Set())}>Clear all</button>
      </div>
      <div className="cols2">
        {mod.topics.map(t => {
          const keys = mod.types.filter(x => x.topic === t.id).map(x => x.key);
          const n = keys.filter(k => on.has(k)).length;
          return (
            <div className="topicset" key={t.id}>
              <label className="opt">
                <input type="checkbox" checked={n === keys.length} ref={el => { if (el) el.indeterminate = n > 0 && n < keys.length; }}
                  onChange={e => toggle(keys, e.target.checked)} />
                Lecture {t.id} · {t.name}
              </label>
              {mod.types.filter(x => x.topic === t.id).map(x => (
                <label className="opt sub" key={x.key}>
                  <input type="checkbox" checked={on.has(x.key)} onChange={e => toggle([x.key], e.target.checked)} /> {x.name}
                </label>
              ))}
            </div>
          );
        })}
      </div>
      <div className="actions" style={{ justifyContent: 'flex-start', gap: 24 }}>
        <button type="button" className="btn" disabled={on.size === 0} onClick={start}>Practise selection</button>
      </div>
    </div>
  );
}
