'use client';

import { useEffect, useRef } from 'react';
import { UNIT, fmtSolution } from '@/lib/engine/grade';
import type { Answers, Graded, Question } from '@/lib/engine/types';

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
  const box = useRef<HTMLDivElement>(null);
  const locked = !!graded;
  const set = (i: number, v: string | number) => { if (!locked) onChange({ ...answers, [i]: v }); };

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
      <div className="qtext" dangerouslySetInnerHTML={{ __html: wrapTables(q.html) }} />
      {single ? (
        <>
          <ul className={'mc' + (single.tf ? ' tf' : '')}>
            {single.options.map((o, i) => {
              const sel = answers[0] === i;
              const cls = graded ? (i === single.correct ? 'isright' : sel ? 'iswrong' : '') : sel ? 'sel' : '';
              return (
                <li key={i}>
                  <button type="button" className={cls} onClick={() => set(0, i)} aria-pressed={sel}>
                    {single.tf ? o : <><span className="letter">{LET[i]})</span><span>{o}</span><span className="mark">{graded && i === single.correct ? '✓' : ''}</span></>}
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
                <div className="prompt" dangerouslySetInnerHTML={{ __html: p.type === 'mc' ? '' : p.prompt }} />
                <div className="ansbox">
                  {p.type === 'num' ? (
                    <div className="numbox">
                      <span className="unit pre">{UNIT[p.unit][1] ? UNIT[p.unit][0] : ''}</span>
                      <input className={'numin' + (r ? (r.ok ? ' ok' : ' bad') : '')} type="text" inputMode="decimal" autoComplete="off"
                        autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="next" aria-label={'Answer ' + LET[i]}
                        readOnly={locked} value={(answers[i] as string) ?? ''} onChange={e => set(i, e.target.value)} onKeyDown={onKey} />
                      <span className="unit">{UNIT[p.unit][1] ? '' : UNIT[p.unit][0]}</span>
                    </div>
                  ) : p.type === 'choice' ? (
                    <div className={'seg' + (p.options.some(o => o.length > 14) ? ' stack' : '')}>
                      {p.options.map((o, j) => {
                        const sel = answers[i] === j;
                        const cls = r ? (j === p.correct ? 'isright' : sel ? 'iswrong' : '') : sel ? 'sel' : '';
                        return <button type="button" key={j} className={cls} onClick={() => set(i, j)} aria-pressed={sel}>{o}</button>;
                      })}
                    </div>
                  ) : null}
                </div>
                <div className={'fb' + (r ? (r.ok ? ' ok' : ' bad') : '')}>
                  {r ? (r.ok ? 'Correct' : 'Correct answer: ' + (p.type === 'num' ? fmtSolution(p) : p.type === 'choice' ? p.options[p.correct] : '')) : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
