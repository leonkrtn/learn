'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from './Icons';
import Rich from './Rich';
import { useSubject } from './SubjectContext';
import TexEditor from './TexEditor';

export type Entry = { id: string; topic: string | null; title: string; body: string; sort: number; updated_at: string };
export type SharedSheet = { user_id: string; author: string; entries: number; updated_at: string };

type Group = { id: string | null; name: string };

export function groupsOf(topics: { id: string; name: string }[]): Group[] {
  return [{ id: null, name: 'General' }, ...topics.map(t => ({ id: t.id, name: `Lecture ${t.id} · ${t.name}` }))];
}

/** Entries of one group, in order; entries whose lecture no longer exists fall back to General. */
export function inGroup(entries: Entry[], g: Group, topics: { id: string }[]) {
  return entries.filter(e => g.id === null ? !e.topic || !topics.some(t => t.id === e.topic) : e.topic === g.id).sort((a, b) => a.sort - b.sort);
}

export function matches(e: Entry, q: string) {
  const s = q.trim().toLowerCase();
  return !s || e.title.toLowerCase().includes(s) || e.body.toLowerCase().includes(s);
}

export default function CheatsheetView({ entries: initial, readOnly, author, shared: initialShared, others, error }: {
  entries: Entry[]; readOnly: boolean; author: string | null; shared: boolean; others: SharedSheet[]; error?: string;
}) {
  const { mod } = useSubject();
  const sb = supabaseBrowser();
  const [entries, setEntries] = useState(initial);
  const [shared, setShared] = useState(initialShared);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null | undefined>(undefined);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(error || null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const groups = useMemo(() => groupsOf(mod.topics), [mod.topics]);

  const fail = (m: string) => { setErr(m); return false; };

  async function save(id: string | null, v: { title: string; body: string; topic: string | null }) {
    if (id) {
      const { data, error } = await sb.from('cheat_entries').update({ ...v, updated_at: new Date().toISOString() }).eq('id', id).select('id, topic, title, body, sort, updated_at').single();
      if (error) return fail(error.message);
      setEntries(es => es.map(e => e.id === id ? data as Entry : e));
    } else {
      const { data, error } = await sb.from('cheat_entries').insert({ ...v, subject_slug: mod.slug, sort: Date.now() }).select('id, topic, title, body, sort, updated_at').single();
      if (error) return fail(error.message);
      setEntries(es => [...es, data as Entry]);
    }
    setErr(null);
    return true;
  }

  async function remove(id: string) {
    const { error } = await sb.from('cheat_entries').delete().eq('id', id);
    if (error) { fail(error.message); return; }
    setEntries(es => es.filter(e => e.id !== id));
  }

  /** Moves an entry into a group, before another entry or at the end. */
  async function move(id: string, g: Group, beforeId: string | null) {
    const list = inGroup(entries, g, mod.topics).filter(e => e.id !== id);
    const i = beforeId ? list.findIndex(e => e.id === beforeId) : -1;
    let sort: number;
    if (i < 0) sort = list.length ? list[list.length - 1].sort + 1 : Date.now();
    else sort = i === 0 ? list[0].sort - 1 : (list[i - 1].sort + list[i].sort) / 2;
    const prev = entries;
    setEntries(es => es.map(e => e.id === id ? { ...e, topic: g.id, sort } : e));
    const { error } = await sb.from('cheat_entries').update({ topic: g.id, sort }).eq('id', id);
    if (error) { setEntries(prev); fail(error.message); }
  }

  async function toggleShare() {
    const next = !shared;
    const { data: u } = await sb.auth.getUser();
    if (!u.user) { fail('You are signed out. Sign in again to share.'); return; }
    const { error } = await sb.from('cheatsheets').upsert({ user_id: u.user.id, subject_slug: mod.slug, shared: next, updated_at: new Date().toISOString() });
    if (error) { fail(error.message); return; }
    setShared(next);
  }

  async function copy(list: Entry[]) {
    const base = Date.now();
    const { error } = await sb.from('cheat_entries').insert(list.map((e, i) => ({ subject_slug: mod.slug, topic: e.topic, title: e.title, body: e.body, sort: base + i })));
    if (error) { fail(error.message); return; }
    setCopied(c => new Set([...c, ...list.map(e => e.id)]));
  }

  const dropProps = (g: Group, beforeId: string | null) => readOnly ? {} : {
    onDragOver: (e: React.DragEvent) => { if (drag) { e.preventDefault(); e.stopPropagation(); setOver((beforeId || 'end:' + g.id)); } },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (drag && drag !== beforeId) move(drag, g, beforeId); setDrag(null); setOver(null); },
  };

  return (
    <div className="page wide">
      <div className="pagehead">
        <h1>{readOnly ? `${author}’s cheatsheet` : 'My cheatsheet'}</h1>
        <span className="aside">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
      </div>
      {readOnly ? (
        <div className="banner">
          <span>A classmate’s shared cheatsheet for {mod.short}. Copy entries you want to keep; your copy is private.</span>
          <span className="spacer" />
          <button type="button" className="btn small" disabled={!entries.length || entries.every(e => copied.has(e.id))} onClick={() => copy(entries.filter(e => !copied.has(e.id)))}>Copy all to mine</button>
          <Link className="btn ghost small" href={`/s/${mod.slug}/cheatsheet`}>Back to mine</Link>
        </div>
      ) : (
        <p className="lede">The formulas and facts you keep looking up. Write text in Markdown and formulas in LaTeX; drag entries to reorder them or move them to another lecture. Print it as a compact A4 sheet when you build your exam cheatsheet.</p>
      )}

      <div className="sheetbar">
        <label className="searchbox"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your entries" /></label>
        <span className="spacer" />
        {!readOnly && (
          <>
            <label className="switch" title="Classmates can read a shared cheatsheet and copy entries from it">
              <input type="checkbox" checked={shared} onChange={toggleShare} /><span className="track" /><span>Shared with classmates</span>
            </label>
            <button type="button" className="btn ghost small" onClick={() => window.print()} disabled={!entries.length}><Icon name="print" size={16} />Print A4</button>
            <button type="button" className="btn small" onClick={() => { setAdding(null); setEditing(null); }}><Icon name="plus" size={16} />New entry</button>
          </>
        )}
      </div>
      {err && <p className="err">{err}</p>}

      <div className="sheetgroups">
        {groups.map(g => {
          const list = inGroup(entries, g, mod.topics).filter(e => matches(e, q));
          const addingHere = adding !== undefined && adding === g.id;
          if (readOnly && !list.length) return null;
          if (q && !list.length) return null;
          return (
            <section key={String(g.id)} className={'sheetgroup' + (!list.length && !addingHere ? ' isempty' : '') + (over === 'end:' + g.id ? ' dropping' : '')} {...dropProps(g, null)}>
              <div className="sgh">
                <h2>{g.name}</h2>
                {!readOnly && <button type="button" className="act" onClick={() => { setAdding(g.id); setEditing(null); }}><Icon name="plus" size={15} />Add</button>}
              </div>
              {addingHere && (
                <EntryEditor topics={mod.topics} initial={{ title: '', body: '', topic: g.id }} onCancel={() => setAdding(undefined)}
                  onSave={async v => { if (await save(null, v)) setAdding(undefined); }} />
              )}
              {list.map(e => editing === e.id ? (
                <EntryEditor key={e.id} topics={mod.topics} initial={{ title: e.title, body: e.body, topic: e.topic }} onCancel={() => setEditing(null)}
                  onSave={async v => { if (await save(e.id, v)) setEditing(null); }} />
              ) : (
                <article key={e.id} className={'centry' + (drag === e.id ? ' dragging' : '') + (over === e.id ? ' dropbefore' : '')}
                  draggable={!readOnly} onDragStart={ev => { setDrag(e.id); ev.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
                  {...dropProps(g, e.id)}>
                  <div className="ceh">
                    {!readOnly && <span className="grip" aria-hidden><Icon name="grip" size={16} /></span>}
                    <b>{e.title || 'Untitled'}</b>
                    <span className="spacer" />
                    {readOnly ? (
                      <button type="button" className="act" disabled={copied.has(e.id)} onClick={() => copy([e])}><Icon name="copy" size={15} />{copied.has(e.id) ? 'Copied' : 'Copy to mine'}</button>
                    ) : (
                      <>
                        <button type="button" className="act" onClick={() => { setEditing(e.id); setAdding(undefined); }}><Icon name="edit" size={15} />Edit</button>
                        <DeleteButton onDelete={() => remove(e.id)} />
                      </>
                    )}
                  </div>
                  {e.body && <Rich text={e.body} className="cebody" />}
                </article>
              ))}
              
            </section>
          );
        })}
        {q && !entries.some(e => matches(e, q)) && <p className="note">No entry matches “{q}”.</p>}
      </div>

      {!readOnly && (
        <>
          <h2 className="sec">Shared by classmates<small>read and copy</small></h2>
          {others.length ? (
            <div className="theorylist">
              {others.map(o => (
                <Link key={o.user_id} href={`/s/${mod.slug}/cheatsheet?from=${o.user_id}`}>
                  <span className="lec">{o.entries} entries</span><span className="t">{o.author}</span>
                  <span className="d">updated {new Date(o.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </Link>
              ))}
            </div>
          ) : <p className="note">No classmate has shared a cheatsheet for {mod.short} yet.</p>}
        </>
      )}

      <PrintSheet entries={entries} title={`${mod.short} · ${mod.name}`} groups={groups} topics={mod.topics} />
    </div>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button type="button" className={'act' + (armed ? ' danger' : '')} onClick={() => armed ? onDelete() : setArmed(true)} onBlur={() => setArmed(false)}>
      <Icon name="trash" size={15} />{armed ? 'Click again to delete' : 'Delete'}
    </button>
  );
}

function EntryEditor({ initial, topics, onSave, onCancel }: {
  initial: { title: string; body: string; topic: string | null };
  topics: { id: string; name: string }[];
  onSave: (v: { title: string; body: string; topic: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const ok = v.title.trim() || v.body.trim();
  const submit = async () => { if (!ok || busy) return; setBusy(true); await onSave({ ...v, title: v.title.trim(), body: v.body.trim() }); setBusy(false); };
  return (
    <div className="centry editing">
      <div className="editrow">
        <label className="field grow"><span>Title</span><input value={v.title} autoFocus onChange={e => setV({ ...v, title: e.target.value })} placeholder="e.g. WACC with taxes" /></label>
        <label className="field"><span>Lecture</span>
          <select value={v.topic ?? ''} onChange={e => setV({ ...v, topic: e.target.value || null })}>
            <option value="">General</option>
            {topics.map(t => <option key={t.id} value={t.id}>Lecture {t.id} · {t.name}</option>)}
          </select>
        </label>
      </div>
      <TexEditor value={v.body} onChange={body => setV({ ...v, body })} rows={5} onSubmit={submit} placeholder="$$r_{wacc} = \frac{E}{E+D} r_E + \frac{D}{E+D} r_D (1-\tau_c)$$" />
      <div className="composerbar">
        <span className="spacer" />
        <button type="button" className="linkbtn" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn small" disabled={!ok || busy} onClick={submit}>Save entry</button>
      </div>
    </div>
  );
}

/** Hidden on screen; the only thing printed. Dense multi-column A4 layout. */
function PrintSheet({ entries, title, groups, topics }: { entries: Entry[]; title: string; groups: Group[]; topics: { id: string }[] }) {
  return (
    <div className="cheatprint" aria-hidden>
      <div className="cph">{title}</div>
      <div className="cpcols">
        {groups.map(g => {
          const list = inGroup(entries, g, topics);
          if (!list.length) return null;
          return (
            <section key={String(g.id)}>
              <h3>{g.name}</h3>
              {list.map(e => (
                <div key={e.id} className="cpe">
                  {e.title && <b>{e.title}</b>}
                  {e.body && <Rich text={e.body} />}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
