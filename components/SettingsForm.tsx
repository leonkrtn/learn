'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSubject, type Settings } from './SubjectContext';

export default function SettingsForm() {
  const { mod, settings, saveSettings } = useSubject();
  const router = useRouter();
  const all = mod.types.map(t => t.key);
  const [s, setS] = useState<Settings>(settings);
  const [on, setOn] = useState<Set<string>>(new Set(settings.enabled ?? all));
  const [saved, setSaved] = useState(false);

  const toggle = (keys: string[], value: boolean) => setOn(prev => {
    const n = new Set(prev);
    keys.forEach(k => value ? n.add(k) : n.delete(k));
    return n;
  });

  async function apply() {
    const enabled = on.size === all.length ? null : all.filter(k => on.has(k));
    await saveSettings({ ...s, enabled: enabled && enabled.length ? enabled : null });
    setSaved(true);
    router.push(`/s/${mod.slug}`);
  }

  return (
    <div className="page">
      <div className="pagehead"><h1>Settings</h1><span className="aside">Saved to your account</span></div>
      <div style={{ height: 22 }} />
      <fieldset>
        <legend>Practice mode</legend>
        <label className="opt"><input type="radio" name="mode" checked={s.mode === 'endless'} onChange={() => setS({ ...s, mode: 'endless' })} /> Endless: one question after another</label>
        <label className="opt"><input type="radio" name="mode" checked={s.mode === 'session'} onChange={() => setS({ ...s, mode: 'session' })} /> Session of
          <select value={s.sessionLen} onChange={e => setS({ ...s, mode: 'session', sessionLen: +e.target.value })}>
            {[10, 15, 20, 30, 40].map(n => <option key={n} value={n}>{n}</option>)}
          </select> questions, then a score</label>
      </fieldset>

      <fieldset>
        <legend>Question types</legend>
        <p className="note" style={{ marginTop: 0 }}>Each lecture and each question type can be switched on its own, for example to drill only one calculation. Lectures are drawn equally often; types you get wrong come back more often, always with new numbers.</p>
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
      </fieldset>

      <fieldset>
        <legend>Flashcards</legend>
        <label className="opt">New cards per deck and day
          <select value={s.newPerDay} onChange={e => setS({ ...s, newPerDay: +e.target.value })}>
            {[5, 10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Answers</legend>
        <p className="note" style={{ marginTop: 0 }}>{mod.answerNote} Answers within {Math.round(mod.tolerance * 100)}% of the solution count as correct, with a floor of ±0.05 percentage points for percentages and ±0.011 otherwise, so rounding never costs you a mark.</p>
      </fieldset>

      <div className="actions" style={{ justifyContent: 'flex-start', gap: 24 }}>
        <button type="button" className="btn" onClick={apply}>Apply and start</button>
        {saved && <span className="okmsg">Saved</span>}
        {on.size === 0 && <span className="err">With nothing selected, all types are used.</span>}
      </div>
    </div>
  );
}
