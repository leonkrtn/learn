'use client';

import { Fragment } from 'react';
import { comboKeys, comboText } from '@/lib/shortcuts';
import { usePrefs } from './Prefs';

/** Key combos as <kbd>s, with ⌥ ⌘ ⇧ on a Mac and Alt, Ctrl, Shift elsewhere; several combos are alternatives. */
export default function Keys({ k }: { k: string | string[] }) {
  const { mac } = usePrefs();
  const list = Array.isArray(k) ? k : [k];
  return (
    <span className="keycombo">
      {list.map((c, i) => (
        <Fragment key={i}>{i > 0 && <span className="or">/</span>}{comboKeys(c, mac).map((p, j) => <kbd key={j}>{p}</kbd>)}</Fragment>
      ))}
    </span>
  );
}

/** A combo as plain text for titles and running text: "⌥C" on a Mac, "Alt+C" elsewhere. */
export function useCombo(combo: string): string {
  return comboText(combo, usePrefs().mac);
}
