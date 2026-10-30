'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { commandAt, exact, GROUPS, mathAt, search, splice, SYMBOLS, type Sym } from '@/lib/texinput';
import FormulaField, { type FormulaApi } from './FormulaField';
import Icon from './Icons';
import Rich from './Rich';

type Suggest = { start: number; items: Sym[]; i: number; query: string };
type Formula = { start: number; end: number; tex: string; display: boolean; editing: boolean };

/**
 * Note editor. Text is Markdown; /beta or \beta followed by space becomes β, and a list of matches
 * opens while you type. "Formula" opens a visual editor that writes $…$ into the text.
 */
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
  const formulaApi = useRef<FormulaApi | null>(null);
  const [preview, setPreview] = useState(true);
  const [sug, setSug] = useState<Suggest | null>(null);
  const [picker, setPicker] = useState(false);
  const [formula, setFormula] = useState<Formula | null>(null);
  const [formulaKey, setFormulaKey] = useState(0);
  // Where the caret goes once the parent has rendered the new text.
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current, c = pendingCaret.current;
    if (!el || c == null || el.value !== value) return;
    pendingCaret.current = null;
    el.focus();
    el.setSelectionRange(c, c);
  }, [value]);

  const setText = (text: string, caret: number) => {
    pendingCaret.current = caret;
    onChange(text);
    setSug(null);
  };

  const refresh = (text: string, pos: number) => {
    const c = commandAt(text, pos);
    const items = c ? search(c.query, 8) : [];
    setSug(c && items.length ? { start: c.start, items, i: 0, query: c.query } : null);
  };

  const apply = (s: Sym, extra = '') => {
    if (!sug) return;
    const pos = ref.current?.selectionStart ?? value.length;
    const r = splice(value, sug.start, pos, s.out + extra);
    setText(r.text, r.caret);
  };

  const insertAtCaret = (text: string) => {
    const el = ref.current;
    const a = el?.selectionStart ?? value.length, b = el?.selectionEnd ?? value.length;
    const r = splice(value, a, b, text);
    setText(r.text, r.caret);
  };

  const wrap = (mark: string) => {
    const el = ref.current;
    const a = el?.selectionStart ?? value.length, b = el?.selectionEnd ?? value.length;
    const r = splice(value, a, b, mark + value.slice(a, b) + mark);
    setText(r.text, b === a ? a + mark.length : r.caret);
  };

  const openFormula = () => {
    const el = ref.current;
    const a = el?.selectionStart ?? value.length, b = el?.selectionEnd ?? value.length;
    const seg = mathAt(value, a);
    setPicker(false); setSug(null);
    setFormulaKey(k => k + 1);
    setFormula(seg ? { ...seg, editing: true } : { start: a, end: b, tex: '', display: false, editing: false });
  };

  const finishFormula = (tex: string, display: boolean) => {
    if (!formula) return;
    const t = tex.trim();
    setFormula(null);
    if (!t) {
      if (formula.editing) { const r = splice(value, formula.start, formula.end, ''); setText(r.text, r.caret); }
      return;
    }
    const before = value.slice(0, formula.start), after = value.slice(formula.end);
    const ins = display
      ? (before && !before.endsWith('\n') ? '\n' : '') + '$$' + t + '$$' + (after.startsWith('\n') ? '' : '\n')
      : '$' + t + '$';
    const r = splice(value, formula.start, formula.end, ins);
    setText(r.text, r.caret);
  };

  return (
    <div className="texed">
      <div className="texbar" role="toolbar" aria-label="Formatting">
        <button type="button" className={formula ? 'on' : ''} onMouseDown={e => e.preventDefault()} onClick={openFormula} title="Visual formula editor; with the cursor in a formula, edits it">
          <Icon name="formula" size={15} />Formula
        </button>
        <button type="button" className={picker ? 'on' : ''} onMouseDown={e => e.preventDefault()} onClick={() => { setPicker(p => !p); setSug(null); }} title="All symbols, with search">
          <span className="glyph">Ω</span>Symbols
        </button>
        <span className="sep" />
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrap('**')} title="Bold"><b>B</b></button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrap('*')} title="Italic"><i>I</i></button>
        <span className="spacer" />
        <button type="button" className={preview ? 'on' : ''} aria-pressed={preview} onClick={() => setPreview(p => !p)} title="Show the note as it will look">Preview</button>
      </div>
      {picker && (
        <SymbolPicker onPick={s => { if (formula && formulaApi.current) formulaApi.current.insert(s.tex); else { insertAtCaret(s.out); setPicker(false); } }} onClose={() => setPicker(false)} />
      )}
      {formula && (
        <FormulaField key={formulaKey} initial={formula.tex} display={formula.display} editing={formula.editing} apiRef={formulaApi}
          onDone={finishFormula} onCancel={() => { setFormula(null); requestAnimationFrame(() => ref.current?.focus()); }} />
      )}
      <div className="taw">
        <textarea ref={ref} rows={rows} value={value} placeholder={placeholder} autoFocus={autoFocus} spellCheck
          onChange={e => onChange(e.target.value)}
          onSelect={e => refresh(e.currentTarget.value, e.currentTarget.selectionStart)}
          onBlur={() => setSug(null)}
          onKeyDown={e => {
            if (sug) {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const d = e.key === 'ArrowDown' ? 1 : -1;
                setSug({ ...sug, i: (sug.i + d + sug.items.length) % sug.items.length });
                return;
              }
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); apply(sug.items[sug.i]); return; }
              if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setSug(null); return; }
              if (e.key === ' ') {
                const hit = exact(sug.query);
                if (hit) { e.preventDefault(); apply(hit, ' '); return; }
              }
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) { e.preventDefault(); onSubmit(); }
          }} />
        {sug && (
          <ul className="suggest" role="listbox">
            {sug.items.map((s, i) => (
              <li key={s.cmd} role="option" aria-selected={i === sug.i} className={i === sug.i ? 'on' : ''}
                onMouseDown={e => { e.preventDefault(); apply(s); }}>
                <span className="sg">{s.label.length > 2 ? 'ƒ' : s.label}</span>
                <code>/{s.cmd}</code>
                <span className="muted">{s.label.length > 2 ? s.label : s.group}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {preview && value.trim() && <div className="texpreview"><Rich text={value} /></div>}
      <div className="texhint">Type <code>/beta</code> or <code>\beta</code> for β, <code>/wacc</code> for a formula. <b>Formula</b> opens the visual editor. Ctrl+Enter saves.</div>
    </div>
  );
}

function SymbolPicker({ onPick, onClose }: { onPick: (s: Sym) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => q.trim() ? search(q, 60) : SYMBOLS, [q]);
  return (
    <div className="picker" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); } }}>
      <label className="searchbox"><Icon name="search" size={16} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search: beta, sum, squared, wacc …"
        onKeyDown={e => { if (e.key === 'Enter' && list[0]) { e.preventDefault(); onPick(list[0]); } }} /></label>
      <div className="pickbody">
        {GROUPS.map(g => {
          const items = list.filter(s => s.group === g);
          if (!items.length) return null;
          return (
            <section key={g}>
              <h5>{g}</h5>
              <div className="pickgrid">
                {items.map(s => (
                  <button key={s.cmd} type="button" title={'/' + s.cmd} className={s.label.length > 2 ? 'word' : ''} onMouseDown={e => e.preventDefault()} onClick={() => onPick(s)}>{s.label}</button>
                ))}
              </div>
            </section>
          );
        })}
        {!list.length && <p className="note">No symbol matches “{q}”.</p>}
      </div>
    </div>
  );
}
