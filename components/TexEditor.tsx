'use client';

import { useRef, useState } from 'react';
import { TEX_TOOLS } from '@/lib/rich';
import Rich from './Rich';

/** Text area with a formula toolbar and a live preview. Markdown for text, $…$ and $$…$$ for LaTeX. */
export default function TexEditor({ value, onChange, placeholder, rows = 5, autoFocus, onSubmit }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  /** Ctrl/Cmd + Enter */
  onSubmit?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(true);

  const insert = (text: string, caret: number) => {
    const el = ref.current;
    if (!el) return;
    const a = el.selectionStart, b = el.selectionEnd;
    const sel = value.slice(a, b);
    // With a selection, wrap it: the selection goes where the cursor would land.
    const next = value.slice(0, a) + text.slice(0, caret) + sel + text.slice(caret) + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); const pos = a + caret + sel.length; el.setSelectionRange(pos, pos); });
  };

  return (
    <div className="texed">
      <div className="texbar" role="toolbar" aria-label="Formula tools">
        {TEX_TOOLS.map(t => (
          <button key={t.label} type="button" title={t.title} onMouseDown={e => e.preventDefault()} onClick={() => insert(t.text, t.caret)}>{t.label}</button>
        ))}
        <span className="spacer" />
        <label className="pv"><input type="checkbox" checked={preview} onChange={e => setPreview(e.target.checked)} /> Preview</label>
      </div>
      <textarea ref={ref} rows={rows} value={value} placeholder={placeholder} autoFocus={autoFocus} spellCheck
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) { e.preventDefault(); onSubmit(); } }} />
      {preview && value.trim() && <div className="texpreview"><Rich text={value} /></div>}
      <div className="texhint">**bold**, *italic*, - list, $r_E$ inline, $$…$$ on its own line. Ctrl+Enter saves.</div>
    </div>
  );
}
