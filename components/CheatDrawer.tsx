'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabaseBrowser } from '@/lib/supabase/client';
import { EntryEditor, groupsOf, inGroup, matches, type Entry } from './CheatsheetView';
import Icon from './Icons';
import Rich from './Rich';
import { useSubject } from './SubjectContext';

/** Top-bar button (or Alt+C, which stays clear of the a–d answer keys) that slides in your cheatsheet with search and a quick "new entry" (filed under the lecture of the question on screen); on every subject page but the cheatsheet itself. */
export default function CheatDrawer() {
  const { mod, focusTopic } = useSubject();
  const path = usePathname();
  const base = '/s/' + mod.slug;
  const active = !path.startsWith(base + '/cheatsheet');
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const topic = focusTopic && mod.topics.some(t => t.id === focusTopic) ? focusTopic : null;

  async function add(v: { title: string; body: string; topic: string | null }) {
    const { data, error } = await supabaseBrowser().from('cheat_entries').insert({ ...v, subject_slug: mod.slug, sort: Date.now() })
      .select('id, topic, title, body, sort, updated_at').single();
    if (error) { setErr('The entry could not be saved: ' + error.message); return; }
    setErr(null); setAdding(false); setAdded((data as Entry).id);
    setEntries(es => [...(es || []), data as Entry]);
  }

  useEffect(() => {
    if (!open) return;
    supabaseBrowser().auth.getUser().then(({ data }) =>
      supabaseBrowser().from('cheat_entries').select('id, topic, title, body, sort, updated_at')
        .eq('subject_slug', mod.slug).eq('user_id', data.user?.id || '').order('sort')
        .then(({ data: rows }) => setEntries((rows || []) as Entry[])));
  }, [open, mod.slug]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (['TEXTAREA', 'MATH-FIELD'].includes(t.tagName) || t.isContentEditable)) return;
      if (e.key === 'Escape' && open && !adding) setOpen(false);
      // Works from an answer box too; e.code, because Alt+C types another character on a Mac.
      if (e.code === 'KeyC' && e.altKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen(o => !o); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, open, adding]);

  if (!active) return null;
  return (
    <>
      <button type="button" className={'iconbtn cheatbtn' + (open ? ' on' : '')} onClick={() => setOpen(o => !o)} aria-expanded={open} title="Your cheatsheet (Alt+C)">
        <Icon name="sheet" size={18} />Cheatsheet
      </button>
      {/* In a portal: the top bar's backdrop filter would otherwise become the drawer's containing block. */}
      {open && createPortal(
        <aside className="drawer" aria-label="My cheatsheet">
          <div className="drawerhead">
            <b>My cheatsheet</b>
            <span className="spacer" />
            <button type="button" className="act" onClick={() => { setAdding(a => !a); setErr(null); }} aria-pressed={adding}><Icon name="plus" size={15} />New entry</button>
            <Link href={`${base}/cheatsheet`} className="act">Edit</Link>
            <button type="button" className="act" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button>
          </div>
          <label className="searchbox"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" autoFocus /></label>
          <div className="drawerbody">
            {adding && (
              <EntryEditor topics={mod.topics} initial={{ title: '', body: '', topic }} onCancel={() => setAdding(false)} onSave={add} />
            )}
            {err && <p className="err">{err}</p>}
            {entries === null ? <div aria-label="Loading"><span className="skel w40" /><span className="skel w80" /><span className="skel w60" /></div> : !entries.length ? (
              adding ? null : <p className="note">Your cheatsheet for {mod.short} is empty. Add an entry with <b>New entry</b> above, on the <Link href={`${base}/cheatsheet`}>cheatsheet page</Link>, or copy notes from the slides.</p>
            ) : groupsOf(mod.topics).map(g => {
              const list = inGroup(entries, g, mod.topics).filter(e => matches(e, q));
              if (!list.length) return null;
              return (
                <section key={String(g.id)}>
                  <h4>{g.name}</h4>
                  {list.map(e => <div key={e.id} className={'dentry' + (e.id === added ? ' fresh' : '')}>{e.title && <b>{e.title}</b>}{e.body && <Rich text={e.body} />}</div>)}
                </section>
              );
            })}
          </div>
        </aside>,
        document.body,
      )}
    </>
  );
}
