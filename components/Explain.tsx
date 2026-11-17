'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveExplainer, type Explainer } from '@/lib/explain';
import { allTypes, type SubjectModule } from '@/lib/subject';
import Icon from './Icons';
import Rich from './Rich';
import { useSubject } from './SubjectContext';

/** Button that opens the explanation of a question type in a lightbox. Renders nothing for a type without one. */
export default function ExplainButton({ typeKey, hidden }: { typeKey: string; hidden?: boolean }) {
  const { mod } = useSubject();
  const [open, setOpen] = useState(false);
  const e = resolveExplainer(mod.explain, typeKey);
  if (!e) return null;
  return (
    <>
      <button type="button" className="explainbtn" style={{ visibility: hidden ? 'hidden' : 'visible' }} onClick={() => setOpen(true)}>
        Explain this question type
      </button>
      {open && <ExplainDialog mod={mod} typeKey={typeKey} e={e} onClose={() => setOpen(false)} />}
    </>
  );
}

const R = ({ src, className }: { src: string; className?: string }) => <Rich text={src} className={className} />;

export function ExplainDialog({ mod, typeKey, e, onClose }: { mod: SubjectModule; typeKey: string; e: Explainer; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const type = useMemo(() => allTypes(mod).find(t => t.key === typeKey), [mod, typeKey]);
  const ps = mod.problemSets?.find(p => p.types.some(t => t.key === typeKey));
  const theory = mod.theory.find(p => p.types.includes(typeKey)) || (!ps && type ? mod.theory.find(p => p.topic === type.topic) : undefined);
  const unit = ps ? `${ps.label || 'Problem set'} ${ps.id}: ${ps.title}` : mod.topics.find(t => t.id === type?.topic)?.name || '';

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
            <p className="explainunit">{unit}{unit && ' · '}How to solve this question type</p>
            <h2 id="explain-title">{type?.name || typeKey}</h2>
          </div>
          <button type="button" className="explainclose" aria-label="Close" onClick={() => ref.current?.close()}><Icon name="close" size={22} /></button>
        </header>
        <div className="explainbody">
          <div className="explaincol">
            <section><h3>What the question asks</h3><R src={e.task} /></section>
            <section><h3>The idea</h3><R src={e.idea} /></section>
            <section><h3>Step by step</h3><R src={e.steps} className="steps" /></section>
            <section className="pitfall"><h3>Common mistakes</h3><R src={e.pitfalls} /></section>
          </div>
          <div className="explaincol worked">
            <section>
              <h3>Worked example</h3>
              <R src={e.example} className="exproblem" />
            </section>
            <section><h3>Solution</h3><R src={e.solution} className="steps" /></section>
            <section className="exanswer"><h3>Answer</h3><R src={e.answer} /></section>
            {theory && <p className="explainmore">The full lecture explanation: <Link href={`/s/${mod.slug}/theory/${theory.slug}`}>{theory.title}</Link></p>}
          </div>
        </div>
      </div>
    </dialog>
  );
}
