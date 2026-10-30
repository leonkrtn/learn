'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabaseBrowser } from '@/lib/supabase/client';
import { groupsOf, inGroup, matches, type Entry } from './CheatsheetView';
import Icon from './Icons';
import Rich from './Rich';
import { useSubject } from './SubjectContext';

/** Top-bar button (or Alt+C, which stays clear of the a–d answer keys) that slides in your cheatsheet, read-only, with search; on every subject page but the cheatsheet itself. */
export default function CheatDrawer() {
  const { mod } = useSubject();
  const path = usePathname();
  const base = '/s/' + mod.slug;
  const active = !path.startsWith(base + '/cheatsheet');
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [q, setQ] = useState('');

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
      if (e.key === 'Escape' && open) setOpen(false);
      // Works from an answer box too; e.code, because Alt+C types another character on a Mac.
      if (e.code === 'KeyC' && e.altKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen(o => !o); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, open]);

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
            <Link href={`${base}/cheatsheet`} className="act">Edit</Link>
            <button type="button" className="act" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button>
          </div>
          <label className="searchbox"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" autoFocus /></label>
          <div className="drawerbody">
            {entries === null ? <div aria-label="Loading"><span className="skel w40" /><span className="skel w80" /><span className="skel w60" /></div> : !entries.length ? (
              <p className="note">Your cheatsheet for {mod.short} is empty. <Link href={`${base}/cheatsheet`}>Add entries</Link> or copy notes from the slides.</p>
            ) : groupsOf(mod.topics).map(g => {
              const list = inGroup(entries, g, mod.topics).filter(e => matches(e, q));
              if (!list.length) return null;
              return (
                <section key={String(g.id)}>
                  <h4>{g.name}</h4>
                  {list.map(e => <div key={e.id} className="dentry">{e.title && <b>{e.title}</b>}{e.body && <Rich text={e.body} />}</div>)}
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
