'use client';

import { SHORTCUTS } from '@/lib/shortcuts';
import Keys from './Keys';
import { usePrefs } from './Prefs';

/** Help under Settings: every keyboard shortcut, labelled for the keyboard in front of you. */
export default function ShortcutHelp() {
  const { mac } = usePrefs();
  return (
    <fieldset>
      <legend>Keyboard shortcuts</legend>
      <p className="note" style={{ marginTop: 0 }}>
        {mac
          ? <>Shown for a Mac: <kbd>⌥</kbd> is the Option key, <kbd>⌘</kbd> the Command key. On Windows and Linux use Alt and Ctrl instead.</>
          : <>Shown for Windows and Linux. On a Mac use Option (⌥) instead of Alt and Command (⌘) instead of Ctrl.</>}
        {' '}Single-letter keys do nothing while you type in a field.
      </p>
      {SHORTCUTS.map(g => (
        <section key={g.name} className="keygroup">
          <h3>{g.name}{g.where && <small>{g.where}</small>}</h3>
          <dl>
            {g.items.map((s, i) => (
              <div key={i}><dt><Keys k={s.keys} /></dt><dd>{s.label}</dd></div>
            ))}
          </dl>
        </section>
      ))}
    </fieldset>
  );
}
