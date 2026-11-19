'use client';

import { useEffect, useRef, useState } from 'react';
import { UNIT, fmtSolution } from '@/lib/engine/grade';
import { localizeText as L } from '@/lib/numfmt';
import type { Answers, Graded, Question } from '@/lib/engine/types';
import { PartDialog } from './Explain';
import { useSubject } from './SubjectContext';

const LET = 'abcdefghij';
const wrapTables = (html: string) => html.replace(/<table/g, '<div class="tablewrap"><table').replace(/<\/table>/g, '</table></div>');

export default function QuestionView({ q, answers, onChange, graded, onSubmit, autoFocus, lastEnterBlurs }: {
  q: Question;
  answers: Answers;
  onChange: (a: Answers) => void;
  graded: Graded | null;
  /** Enter in the last field calls this. */
  onSubmit?: () => void;
  autoFocus?: boolean;
  lastEnterBlurs?: boolean;
}) {
  const { mod } = useSubject();
  const box = useRef<HTMLDivElement>(null);
  const locked = !!graded;
  const set = (i: number, v: string | number) => { if (!locked) onChange({ ...answers, [i]: v }); };
  // After checking, a click on an answer field opens the calculation of that part.
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => setOpen(null), [q]);
  const show = (i: number) => { if (locked) setOpen(i); };
  const tip = locked ? 'Show the calculation' : undefined;

  useEffect(() => {
    if (!autoFocus || !box.current || !window.matchMedia('(pointer: fine)').matches) return;
    box.current.querySelector<HTMLInputElement>('input.numin')?.focus({ preventScroll: true });
  }, [q, autoFocus]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const inputs = [...(box.current?.querySelectorAll<HTMLInputElement>('input.numin') || [])];
    const i = inputs.indexOf(e.currentTarget);
    if (i >= 0 && i < inputs.length - 1) inputs[i + 1].focus();
    else if (lastEnterBlurs) e.currentTarget.blur();
    else onSubmit?.();
  };

  const single = q.parts.length === 1 && q.parts[0].type === 'mc' ? q.parts[0] : null;

  return (
    <div ref={box}>
      <div className="qtext" dangerouslySetInnerHTML={{ __html: wrapTables(L(q.html)) }} />
      {single ? (
        <>
          <ul className={'mc' + (single.tf ? ' tf' : '')}>
            {single.options.map((o, i) => {
              const sel = answers[0] === i;
              const cls = graded ? (i === single.correct ? 'isright' : sel ? 'iswrong' : '') : sel ? 'sel' : '';
              return (
                <li key={i}>
                  <button type="button" className={cls} onClick={() => (locked ? show(0) : set(0, i))} aria-pressed={sel} title={locked ? 'Show the explanation' : undefined}>
                    {single.tf ? o : <><span className="letter">{LET[i]})</span><span>{L(o)}</span><span className="mark">{graded && i === single.correct ? '✓' : ''}</span></>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={'mcfb ' + (graded ? (graded.results[0].ok ? 'ok' : 'bad') : '')}>
            {graded ? (graded.results[0].ok ? 'Correct' : graded.results[0].answered ? 'Incorrect' : 'Not answered') : ''}
          </div>
        </>
      ) : (
        <div className="parts">
          {q.parts.map((p, i) => {
            const r = graded?.results[i];
            return (
              <div className={'part' + (p.type === 'choice' ? ' choice' : '')} key={i}>
                <div className="lbl">{LET[i]})</div>
                <div className="prompt" dangerouslySetInnerHTML={{ __html: p.type === 'mc' ? '' : L(p.prompt) }} />
                <div className="ansbox">
                  {p.type === 'num' ? (
                    <div className="numbox">
                      <span className="unit">{UNIT[p.unit]}</span>
                      <input className={'numin' + (r ? (r.ok ? ' ok' : ' bad') : '') + (locked ? ' calcable' : '')} type="text" inputMode="decimal" autoComplete="off"
                        autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="next" aria-label={'Answer ' + LET[i]}
                        readOnly={locked} value={(answers[i] as string) ?? ''} onChange={e => set(i, e.target.value)} onKeyDown={onKey}
                        onClick={() => show(i)} title={tip} />
                    </div>
                  ) : p.type === 'choice' && p.options.length > 6 && locked ? (
                    <button type="button" className={'selin calcable' + (r ? (r.ok ? ' ok' : ' bad') : '')} onClick={() => show(i)} title={tip}>
                      {typeof answers[i] === 'number' ? L(p.options[answers[i] as number]) : 'Not answered'}
                    </button>
                  ) : p.type === 'choice' && p.options.length > 6 ? (
                    <select className={'selin' + (r ? (r.ok ? ' ok' : ' bad') : '')} aria-label={'Answer ' + LET[i]} disabled={locked}
                      value={typeof answers[i] === 'number' ? String(answers[i]) : ''} onChange={e => e.target.value !== '' && set(i, +e.target.value)}>
                      <option value="">Choose…</option>
                      {p.options.map((o, j) => <option key={j} value={j}>{L(o)}</option>)}
                    </select>
                  ) : p.type === 'choice' ? (
                    <div className={'seg' + (p.options.some(o => o.length > 14) ? ' stack' : '')}>
                      {p.options.map((o, j) => {
                        const sel = answers[i] === j;
                        const cls = r ? (j === p.correct ? 'isright' : sel ? 'iswrong' : '') : sel ? 'sel' : '';
                        return <button type="button" key={j} className={cls} onClick={() => (locked ? show(i) : set(i, j))} aria-pressed={sel} title={tip}>{L(o)}</button>;
                      })}
                    </div>
                  ) : null}
                </div>
                <div className={'fb' + (r ? (r.ok ? ' ok' : ' bad') : '')}>
                  {r ? (r.ok ? 'Correct' : 'Correct answer: ' + (p.type === 'num' ? fmtSolution(p) : p.type === 'choice' ? L(p.options[p.correct]) : '')) : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Reserved before checking so nothing moves. */}
      <p className="calchint" style={{ visibility: graded ? 'visible' : 'hidden' }}>
        {single ? 'Click an option to see the explanation.' : 'Click an answer field to see its full calculation.'}
      </p>
      {open != null && <PartDialog mod={mod} q={q} part={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
