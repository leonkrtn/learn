'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { calcView } from '@/lib/calc';
import { fmtSolution } from '@/lib/engine/grade';
import type { Question } from '@/lib/engine/types';
import { resolveExplainer, type Explainer } from '@/lib/explain';
import { allTypes, type SubjectModule } from '@/lib/subject';
import Icon from './Icons';
import Rich from './Rich';

const LET = 'abcdefghij';
const R = ({ src, className }: { src: string; className?: string }) => <Rich text={src} className={className} />;
/** A calculation step; fractions in display size so the numbers stay readable. */
const Step = ({ md }: { md: string }) => <Rich text={md.replace(/\\frac(?=\{)/g, '\\dfrac')} />;
const Html = ({ html, className }: { html: string; className?: string }) => <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;

/** Modal lightbox with a title and a close button; closes on Escape, the button or a click on the backdrop. */
function Lightbox({ kicker, title, onClose, children }: { kicker: string; title: ReactNode; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    // The page behind stays put while the lightbox scrolls.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <dialog ref={ref} className="explain" aria-labelledby="explain-title" onClose={onClose}
      onClick={ev => { if (ev.target === ref.current) ref.current?.close(); }}>
      <div className="explainin">
        <header className="explainhead">
          <div>
            <p className="explainunit">{kicker}</p>
            <h2 id="explain-title">{title}</h2>
          </div>
          <button type="button" className="explainclose" aria-label="Close" onClick={() => ref.current?.close()}><Icon name="close" size={22} /></button>
        </header>
        <div className="explainbody">{children}</div>
      </div>
    </dialog>
  );
}

function useTypeInfo(mod: SubjectModule, typeKey: string) {
  return useMemo(() => {
    const type = allTypes(mod).find(t => t.key === typeKey);
    const ps = mod.problemSets?.find(p => p.types.some(t => t.key === typeKey));
    const theory = mod.theory.find(p => p.types.includes(typeKey)) || (!ps && type ? mod.theory.find(p => p.topic === type.topic) : undefined);
    const unit = ps ? `${ps.label ?? 'Problem set ' + ps.id}: ${ps.title}` : mod.topics.find(t => t.id === type?.topic)?.name || '';
    return { type, theory, unit, e: resolveExplainer(mod.explain, typeKey) };
  }, [mod, typeKey]);
}

/** The general method of the question type, kept short next to the calculation. */
function Method({ e, mod, theory }: { e: Explainer; mod: SubjectModule; theory?: { slug: string; title: string } }) {
  return (
    <>
      <section><h3>The idea</h3><R src={e.idea} /></section>
      <section className="pitfall"><h3>Common mistakes</h3><R src={e.pitfalls} /></section>
      <details className="explainmethod">
        <summary>General method and a worked example</summary>
        <R src={e.steps} className="steps" />
        <h4>Example</h4>
        <R src={e.example} className="exproblem" />
        <R src={e.solution} className="steps" />
        <R src={e.answer} className="exanswer" />
      </details>
      {theory && <p className="explainmore">The full lecture explanation: <Link href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link></p>}
    </>
  );
}

/** The correct answer of a part as text. */
function answerOf(q: Question, k: number): string {
  const p = q.parts[k];
  if (p.type === 'num') return fmtSolution(p);
  return p.options[p.correct];
}

/**
 * Lightbox for one part of a checked question: the calculation with the question's own numbers up to this part's
 * answer, earlier parts collapsed, and the type's method alongside. Without a calculation it shows the stored
 * solution and the type's explanation.
 */
export function PartDialog({ mod, q, part, onClose }: { mod: SubjectModule; q: Question; part: number; onClose: () => void }) {
  const typeKey = mod.typeKeyOf(q.fam);
  const { type, theory, unit, e } = useTypeInfo(mod, typeKey);
  const view = useMemo(() => calcView(q, part), [q, part]);
  const p = q.parts[part];
  const single = q.parts.length === 1 && p.type === 'mc';
  const kicker = [type?.name, unit].filter(Boolean).join(' · ');
  const title = single || p.type === 'mc' ? (type?.name || 'Explanation') : <><span className="partlbl">{LET[part]})</span> <Html html={p.prompt} /></>;

  if (!view) {
    // Concept questions and stored questions without a calculation: the reasoning plus the type's explanation.
    return (
      <Lightbox kicker={unit || 'Explanation'} title={title} onClose={onClose}>
        <div className="explaincol">
          {q.solution && <section><h3>Why</h3><div className="qtext" dangerouslySetInnerHTML={{ __html: q.solution }} /></section>}
          {e && <>
            <section><h3>What the question asks</h3><R src={e.task} /></section>
            <section><h3>The idea</h3><R src={e.idea} /></section>
            <section className="pitfall"><h3>Common mistakes</h3><R src={e.pitfalls} /></section>
          </>}
        </div>
        <div className="explaincol worked">
          {e ? <>
            <section><h3>Worked example</h3><R src={e.example} className="exproblem" /></section>
            <section><h3>Solution</h3><R src={e.solution} className="steps" /></section>
            <section className="exanswer"><h3>Answer</h3><R src={e.answer} /></section>
            {theory && <p className="explainmore">The full lecture explanation: <Link href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link></p>}
          </> : <p className="note">No explanation for this question type yet.</p>}
        </div>
      </Lightbox>
    );
  }

  return (
    <Lightbox kicker={kicker} title={title} onClose={onClose}>
      <div className="explaincol calccol">
        {view.earlier.length > 0 && (
          <section>
            <h3>Earlier parts this builds on</h3>
            {view.earlier.map(g => (
              <details className="calcgroup" key={g.part}>
                <summary>
                  <span className="partlbl">{LET[g.part]})</span> <Html html={q.parts[g.part].type === 'mc' ? '' : (q.parts[g.part] as { prompt: string }).prompt} />
                  <span className="calcres">{answerOf(q, g.part)}</span>
                </summary>
                <ol className="calcsteps">{g.steps.map((s, i) => <li key={i} className={s.key ? 'res' : ''}><Step md={s.md} /></li>)}</ol>
              </details>
            ))}
          </section>
        )}
        <section>
          <h3>{view.earlier.length ? 'This part' : 'The calculation'}</h3>
          <ol className="calcsteps">
            {view.own.map((s, i) => <li key={i} className={i === view.own.length - 1 ? 'res final' : s.key ? 'res' : ''}><Step md={s.md} /></li>)}
          </ol>
        </section>
        <section className="exanswer"><h3>Answer</h3><p>{answerOf(q, part)}</p></section>
      </div>
      <div className="explaincol worked">
        {e ? <Method e={e} mod={mod} theory={theory} /> : null}
      </div>
    </Lightbox>
  );
}
