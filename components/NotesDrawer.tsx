'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabaseBrowser } from '@/lib/supabase/client';
import { groupsOf } from './CheatsheetView';
import Icon from './Icons';
import { useCombo } from './Keys';
import Rich from './Rich';
import { useSubject } from './SubjectContext';
import TexEditor from './TexEditor';

type StudyNote = { id: string; topic: string | null; body: string; done: boolean; created_at: string };
type Draft = { topic: string | null; body: string };
type Show = 'open' | 'done';

const COLS = 'id, topic, body, done, created_at';

/** Top-bar button (or Alt+N / ⌥N) that slides in your private study notes for the subject: what to look at again, open questions, to-dos. A new note is filed under the lecture of the question on screen; ticking one off moves it to Done. */
export default function NotesDrawer({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const { mod, focusTopic } = useSubject();
  const combo = useCombo('alt+N');
  const [notes, setNotes] = useState<StudyNote[] | null>(null);
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('open');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const topic = focusTopic && mod.topics.some(t => t.id === focusTopic) ? focusTopic : null;
  const sb = supabaseBrowser();

  useEffect(() => {
    if (!open) return;
    sb.auth.getUser().then(({ data }) =>
      sb.from('study_notes').select(COLS).eq('subject_slug', mod.slug).eq('user_id', data.user?.id || '').order('created_at')
        .then(({ data: rows, error }) => { if (error) setErr('Your notes could not be loaded: ' + error.message); setNotes((rows || []) as StudyNote[]); }));
  }, [open, mod.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (['TEXTAREA', 'MATH-FIELD'].includes(t.tagName) || t.isContentEditable)) return;
      if (e.key === 'Escape' && open && !adding && !editing) setOpen(false);
      // e.code, because Alt+N is a dead key on a Mac.
      if (e.code === 'KeyN' && e.altKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setOpen(!open); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, adding, editing, setOpen]);

  const fail = (m: string) => { setErr(m); return false; };

  async function add(v: Draft) {
    const { data, error } = await sb.from('study_notes').insert({ ...v, subject_slug: mod.slug }).select(COLS).single();
    if (error) return fail('The note could not be saved: ' + error.message);
    setErr(null); setAdding(false); setShow('open');
    setNotes(ns => [...(ns || []), data as StudyNote]);
    return true;
  }

  async function update(id: string, v: Partial<Draft & { done: boolean }>) {
    const prev = notes;
    setNotes(ns => (ns || []).map(n => n.id === id ? { ...n, ...v } : n));
    const { error } = await sb.from('study_notes').update({ ...v, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { setNotes(prev); return fail('The note could not be saved: ' + error.message); }
    setErr(null);
    return true;
  }

  async function remove(id: string) {
    const { error } = await sb.from('study_notes').delete().eq('id', id);
    if (error) { fail('The note could not be deleted: ' + error.message); return; }
    setNotes(ns => (ns || []).filter(n => n.id !== id));
  }

  const s = q.trim().toLowerCase();
  const visible = (notes || []).filter(n => n.done === (show === 'done') && (!s || n.body.toLowerCase().includes(s)));
  const count = (d: boolean) => (notes || []).filter(n => n.done === d).length;
  const known = (id: string | null) => id !== null && mod.topics.some(t => t.id === id);

  return (
    <>
      <button type="button" className={'iconbtn cheatbtn' + (open ? ' on' : '')} onClick={() => setOpen(!open)} aria-expanded={open} title={`Your notes: what to look at again (${combo})`}>
        <Icon name="notes" size={18} />Notes
      </button>
      {open && createPortal(
        <aside className="drawer" aria-label="My notes">
          <div className="drawerhead">
            <b>My notes</b>
            <span className="spacer" />
            <button type="button" className="act" onClick={() => { setAdding(a => !a); setEditing(null); setErr(null); }} aria-pressed={adding}><Icon name="plus" size={15} />New note</button>
            <button type="button" className="act" onClick={() => setOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button>
          </div>
          <div className="notesbar">
            <label className="searchbox"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" /></label>
            <div className="vis" role="radiogroup" aria-label="Show">
              <button type="button" className={show === 'open' ? 'on' : ''} aria-pressed={show === 'open'} onClick={() => setShow('open')}>Open {notes ? count(false) : ''}</button>
              <button type="button" className={show === 'done' ? 'on' : ''} aria-pressed={show === 'done'} onClick={() => setShow('done')}>Done {notes ? count(true) : ''}</button>
            </div>
          </div>
          <div className="drawerbody">
            {adding && <NoteEditor topics={mod.topics} initial={{ topic, body: '' }} onCancel={() => setAdding(false)} onSave={add} label="Save note" />}
            {err && <p className="err">{err}</p>}
            {notes === null ? <div aria-label="Loading"><span className="skel w40" /><span className="skel w80" /><span className="skel w60" /></div> : !visible.length ? (
              adding ? null : <p className="note">{s ? `No ${show} note matches “${q}”.`
                : show === 'done' ? 'Nothing ticked off yet.'
                : <>No open notes for {mod.short}. Jot down what you want to look at again with <b>New note</b> or {combo}, from any page.</>}</p>
            ) : groupsOf(mod.topics).map(g => {
              const list = visible.filter(n => g.id === null ? !known(n.topic) : n.topic === g.id);
              if (!list.length) return null;
              return (
                <section key={String(g.id)}>
                  <h4>{g.name}</h4>
                  {list.map(n => editing === n.id ? (
                    <NoteEditor key={n.id} topics={mod.topics} initial={{ topic: known(n.topic) ? n.topic : null, body: n.body }} label="Save"
                      onCancel={() => setEditing(null)} onSave={async v => { if (await update(n.id, v)) setEditing(null); return true; }} />
                  ) : (
                    <NoteRow key={n.id} n={n} onToggle={() => update(n.id, { done: !n.done })} onEdit={() => { setEditing(n.id); setAdding(false); }} onDelete={() => remove(n.id)} />
                  ))}
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

function NoteRow({ n, onToggle, onEdit, onDelete }: { n: StudyNote; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <div className={'snote' + (n.done ? ' done' : '')}>
      <input type="checkbox" checked={n.done} onChange={onToggle} aria-label={n.done ? 'Mark as open' : 'Mark as done'} title={n.done ? 'Mark as open' : 'Done'} />
      <div className="snbody">
        <Rich text={n.body} />
        <span className="muted">{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      </div>
      <div className="noteactions">
        <button type="button" className="act quiet iconly" onClick={onEdit} title="Edit" aria-label="Edit"><Icon name="edit" size={15} /></button>
        <button type="button" className={'act quiet' + (armed ? ' danger' : ' iconly')} onClick={() => armed ? onDelete() : setArmed(true)} onBlur={() => setArmed(false)}
          title="Delete" aria-label={armed ? 'Click again to delete' : 'Delete'}>
          <Icon name="trash" size={15} />{armed && 'Delete?'}
        </button>
      </div>
    </div>
  );
}

function NoteEditor({ initial, topics, onSave, onCancel, label }: {
  initial: Draft; topics: { id: string; name: string }[]; label: string;
  onSave: (v: Draft) => Promise<boolean>; onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const submit = async () => { if (!v.body.trim() || busy) return; setBusy(true); await onSave({ ...v, body: v.body.trim() }); setBusy(false); };
  return (
    <div className="centry editing">
      <label className="field"><span>Lecture</span>
        <select value={v.topic ?? ''} onChange={e => setV({ ...v, topic: e.target.value || null })}>
          <option value="">General</option>
          {topics.map(t => <option key={t.id} value={t.id}>Lecture {t.id} · {t.name}</option>)}
        </select>
      </label>
      <TexEditor value={v.body} onChange={body => setV({ ...v, body })} rows={3} autoFocus onSubmit={submit} placeholder="e.g. Go over the APV vs WACC example again" />
      <div className="composerbar">
        <span className="spacer" />
        <button type="button" className="linkbtn" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn small" disabled={!v.body.trim() || busy} onClick={submit}>{label}</button>
      </div>
    </div>
  );
}
