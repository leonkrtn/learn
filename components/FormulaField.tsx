'use client';

import 'mathlive/fonts.css';
import type { MathfieldElement } from 'mathlive';
import { useEffect, useRef, useState } from 'react';

export type FormulaApi = { insert: (tex: string) => void };

/** Visual formula editor (MathLive): fractions, indices and Greek letters appear typeset while you type. */
export default function FormulaField({ initial, display: display0, editing, onDone, onCancel, apiRef }: {
  initial: string;
  display: boolean;
  editing: boolean;
  onDone: (tex: string, display: boolean) => void;
  onCancel: () => void;
  apiRef: { current: FormulaApi | null };
}) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const [display, setDisplay] = useState(display0);
  const [ready, setReady] = useState(false);
  // The element is created once; these refs keep its key handler on the latest callbacks.
  const done = useRef(() => {});
  const cancel = useRef(onCancel);
  done.current = () => onDone(field.current?.value || '', display);
  cancel.current = onCancel;

  useEffect(() => {
    let alive = true;
    import('mathlive').then(({ MathfieldElement }) => {
      if (!alive || !host.current) return;
      MathfieldElement.fontsDirectory = null;
      MathfieldElement.soundsDirectory = null;
      const f = new MathfieldElement();
      f.mathVirtualKeyboardPolicy = 'manual';
      f.smartFence = true;
      f.value = initial;
      f.setAttribute('aria-label', 'Formula');
      f.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); done.current(); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel.current(); }
      }, { capture: true });
      host.current.appendChild(f);
      field.current = f;
      apiRef.current = { insert: tex => { f.insert(tex, { focus: true, selectionMode: 'placeholder' }); } };
      setReady(true);
      requestAnimationFrame(() => f.focus());
    });
    return () => { alive = false; field.current?.remove(); field.current = null; apiRef.current = null; };
    // Created once per opening; the parent remounts this component for another formula.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="formula">
      <div ref={host} className="mfhost">{!ready && <span className="note">Loading formula editor…</span>}</div>
      <div className="formulabar">
        <span className="note">Type <code>\frac</code>, <code>/</code> for a fraction, <code>^</code> and <code>_</code> for powers and indices. Enter inserts.</span>
        <span className="spacer" />
        <label className="pv"><input type="checkbox" checked={display} onChange={e => setDisplay(e.target.checked)} /> Own line</label>
        <button type="button" className="linkbtn" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn small" disabled={!ready} onClick={() => done.current()}>{editing ? 'Update' : 'Insert'}</button>
      </div>
    </div>
  );
}
