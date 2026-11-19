'use client';

import Link from 'next/link';
import { useState } from 'react';
import { allTypes } from '@/lib/subject';
import Icon from './Icons';
import { useMarks, type Mark } from './Marks';
import Runner from './Runner';
import { useSubject } from './SubjectContext';

/** First words of a question, without markup, for the list of marked questions. */
function preview(m: Mark) {
  const t = m.q.html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return t.length > 160 ? t.slice(0, 157).replace(/\s\S*$/, '') + ' …' : t;
}

/** Practise exactly your marked questions with new numbers (all, or one lecture), or review and unmark them. */
export default function MarkedView({ topic, manage }: { topic?: string; manage: boolean }) {
  const { mod } = useSubject();
  const base = `/s/${mod.slug}/marked`;
  const lecture = topic && mod.topics.some(t => t.id === topic) ? topic : undefined;

  if (!manage) {
    return (
      <>
        <div className="pagehead" style={{ maxWidth: 880 }}>
          <h1>{lecture ? `Marked questions · Lecture ${lecture}` : 'Marked questions'}</h1>
          <span className="aside">{lecture && <><Link href={base}>All lectures</Link> · </>}<Link href={`${base}?manage=1`}>Manage marked questions</Link></span>
        </div>
        <Runner mode={{ kind: 'marked', topic: lecture }} />
      </>
    );
  }
  return <ManageMarked base={base} />;
}

function ManageMarked({ base }: { base: string }) {
  const { mod } = useSubject();
  const { marks, unmark, error } = useMarks(mod.slug);
  const types = allTypes(mod);
  return (
    <div className="page">
      <div className="pagehead">
        <h1>Marked questions</h1>
        <span className="aside">{marks && marks.length > 0 && <Link href={base}>Practise all {marks.length}</Link>}</span>
      </div>
      <p className="lede">Questions you marked while practising. Practising them asks each one again with new numbers, in random order; concept questions come back with their options shuffled.</p>
      {error && <p className="err">{error}</p>}
      {marks === null ? <div aria-label="Loading"><span className="skel w40" /><span className="skel w80" /><span className="skel w60" /></div>
        : !marks.length ? <p className="note">Nothing marked yet. While you practise, mark a question with <b>Mark</b> above it or the <kbd>M</kbd> key.</p>
        : [...mod.topics, { id: '', name: 'Other' }].map(t => {
          const list = marks.filter(m => t.id ? m.topic === t.id : !mod.topics.some(x => x.id === m.topic));
          if (!list.length) return null;
          return (
            <section key={t.id || 'other'} className="markgroup panel">
              <div className="sgh">
                <h2>{t.id ? `Lecture ${t.id} · ${t.name}` : t.name}</h2>
                {t.id && <Link className="act" href={`${base}?topic=${t.id}`}><Icon name="practice" size={15} />Practise these {list.length}</Link>}
              </div>
              {list.map(m => <MarkRow key={m.sig} m={m} name={types.find(x => x.key === m.type_key)?.name ?? m.type_key} onRemove={() => unmark(m.sig)} />)}
            </section>
          );
        })}
    </div>
  );
}

function MarkRow({ m, name, onRemove }: { m: Mark; name: string; onRemove: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="markrow">
      <div className="mrbody">
        <b>{name}</b>
        <span className="muted">{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <p>{preview(m)}</p>
      </div>
      <button type="button" className={'act' + (armed ? ' danger' : ' iconly')} onClick={() => armed ? onRemove() : setArmed(true)} onBlur={() => setArmed(false)}
        title="Unmark" aria-label={armed ? 'Click again to unmark' : 'Unmark'}>
        <Icon name="trash" size={15} />{armed && 'Unmark?'}
      </button>
    </div>
  );
}
