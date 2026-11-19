'use client';

import { useState } from 'react';
import { localizeText } from '@/lib/numfmt';
import { ACCENTS, type Prefs } from '@/lib/prefs';
import { usePrefs } from './Prefs';

const SIZE_LABEL: Record<Prefs['size'], string> = { small: 'Small', normal: 'Normal', large: 'Large', larger: 'Larger' };
const ACCENT_LABEL: Record<Prefs['accent'], string> = { blue: 'Blue', teal: 'Teal', violet: 'Violet', orange: 'Orange', graphite: 'Graphite' };

/** Text size, accent colour, decimal separator and decimals; applied at once and saved to the account. */
export default function DisplaySettings() {
  const { prefs, update } = usePrefs();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = async (p: Partial<Prefs>) => {
    const err = await update({ ...prefs, ...p });
    setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Saved' });
  };
  const row = <K extends keyof Prefs>(label: string, key: K, opts: [Prefs[K], string][], hint?: string) => (
    <div className="prefrow">
      <span className="preflabel">{label}{hint && <small>{hint}</small>}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {opts.map(([v, text]) => (
          <button type="button" key={String(v)} role="radio" aria-checked={prefs[key] === v} className={prefs[key] === v ? 'sel' : ''} onClick={() => set({ [key]: v } as Partial<Prefs>)}>{text}</button>
        ))}
      </div>
    </div>
  );
  const sample = 1234.56789;
  return (
    <fieldset>
      <legend>Display</legend>
      <p className="note" style={{ marginTop: 0 }}>Applies to all subjects and is saved to your account. Answers can always be typed with a comma or a point.</p>
      {row('Text size', 'size', (Object.keys(SIZE_LABEL) as Prefs['size'][]).map(k => [k, SIZE_LABEL[k]]))}
      <div className="prefrow">
        <span className="preflabel">Accent colour<small>Buttons, links, charts and the active item</small></span>
        <div className="seg swatches" role="radiogroup" aria-label="Accent colour">
          {(Object.keys(ACCENTS) as Prefs['accent'][]).map(k => (
            <button type="button" key={k} role="radio" aria-checked={prefs.accent === k} className={prefs.accent === k ? 'sel' : ''} onClick={() => set({ accent: k })}>
              <span className="swatch" style={{ background: ACCENTS[k] }} aria-hidden />{ACCENT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      {row('Decimal separator', 'sep', [['point', '1,234.56'], ['comma', '1.234,56']], 'In questions, solutions and worked calculations')}
      {row('Decimals in results', 'decimals', [[2, '2'], [3, '3'], [4, '4']], 'Worked calculations and correct answers; applies to new questions')}
      <p className="note">Example: {localizeText(sample.toLocaleString('en-US', { minimumFractionDigits: prefs.decimals, maximumFractionDigits: prefs.decimals }), prefs.sep)}{' '}
        <span className={msg?.ok ? 'okmsg' : 'err'} aria-live="polite">{msg?.text}</span></p>
    </fieldset>
  );
}
