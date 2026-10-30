'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from './Icons';
import Rich from './Rich';
import TexEditor from './TexEditor';

export type Note = {
  id: string; subject_slug: string; deck_id: string | null; page: number | null; parent_id: string | null;
  user_id: string; body: string; is_public: boolean; created_at: string; updated_at: string;
  author: string; votes: number; voted: boolean;
};

export type NotesApi = ReturnType<typeof useNotes>;

/** All notes of one deck (or the general notes of a subject when deckId is null), with the actions on them. */
export function useNotes(subject: string, deckId: string | null) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    let q = supabaseBrowser().from('slide_notes_view').select('*').eq('subject_slug', subject);
    q = deckId ? q.eq('deck_id', deckId) : q.is('deck_id', null);
    const { data, error } = await q.order('created_at');
    if (error) setError(error.message); else { setError(null); setNotes(data as Note[]); }
  }, [subject, deckId]);

  useEffect(() => { reload(); }, [reload]);

  const run = useCallback(async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    if (error) { setError(error.message); return false; }
    await reload();
    return true;
  }, [reload]);

  const sb = supabaseBrowser();
  return {
    notes, error, reload,
    post: (page: number | null, body: string, isPublic: boolean, parentId: string | null = null) =>
      run(sb.from('slide_notes').insert({ subject_slug: subject, deck_id: deckId, page, body, is_public: isPublic, parent_id: parentId })),
    edit: (id: string, body: string) => run(sb.from('slide_notes').update({ body, updated_at: new Date().toISOString() }).eq('id', id)),
    remove: (id: string) => run(sb.from('slide_notes').delete().eq('id', id)),
    vote: (n: Note) => run(n.voted ? sb.from('note_votes').delete().eq('note_id', n.id) : sb.from('note_votes').insert({ note_id: n.id })),
    toCheatsheet: async (n: Note, topic: string | null, title: string) => {
      const { error } = await sb.from('cheat_entries').insert({ subject_slug: subject, topic, title, body: n.body, sort: Date.now(), source_note_id: n.id });
      if (error) setError(error.message);
      return !error;
    },
  };
}

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Notes on one slide (page) or, with page null, on the subject in general: top-level notes by votes, replies underneath. */
export function NoteThread({ api, page, me, admin, cheat, compact }: {
  api: NotesApi;
  page: number | null;
  me: string;
  admin: boolean;
  /** Lecture and title used when a note is copied into the cheatsheet. */
  cheat: { topic: string | null; title: string };
  compact?: boolean;
}) {
  const all = (api.notes || []).filter(n => n.page === page);
  const top = all.filter(n => !n.parent_id).sort((a, b) => b.votes - a.votes || a.created_at.localeCompare(b.created_at));
  const replies = (id: string) => all.filter(n => n.parent_id === id);
  const [open, setOpen] = useState(!compact);

  if (compact && !open) {
    return (
      <button type="button" className="notestoggle" onClick={() => setOpen(true)}>
        <Icon name="reply" size={16} />{top.length ? `${all.length} note${all.length === 1 ? '' : 's'}` : 'Add a note'}
      </button>
    );
  }
  return (
    <div className="thread">
      {api.notes === null ? <div className="note">Loading notes…</div> : top.length === 0 && <div className="note empty">No notes yet. Add the first one.</div>}
      {top.map(n => (
        <NoteItem key={n.id} n={n} api={api} me={me} admin={admin} cheat={cheat}>
          {replies(n.id).map(r => <NoteItem key={r.id} n={r} api={api} me={me} admin={admin} cheat={cheat} reply />)}
        </NoteItem>
      ))}
      <Composer onPost={(body, pub) => api.post(page, body, pub)} />
      {api.error && <p className="err">{api.error}</p>}
    </div>
  );
}

function Composer({ onPost, reply, onCancel }: { onPost: (body: string, pub: boolean) => Promise<boolean>; reply?: boolean; onCancel?: () => void }) {
  const [body, setBody] = useState('');
  const [pub, setPub] = useState(true);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    if (await onPost(body.trim(), pub)) setBody('');
    setBusy(false);
  };
  return (
    <div className={'composer' + (reply ? ' reply' : '')}>
      <TexEditor value={body} onChange={setBody} rows={reply ? 2 : 3} autoFocus={reply} onSubmit={submit}
        placeholder={reply ? 'Write a reply…' : 'Add a note, a question or a formula…'} />
      <div className="composerbar">
        {!reply && (
          <div className="vis" role="radiogroup" aria-label="Visibility">
            <button type="button" className={pub ? 'on' : ''} aria-pressed={pub} onClick={() => setPub(true)}>Public</button>
            <button type="button" className={!pub ? 'on' : ''} aria-pressed={!pub} onClick={() => setPub(false)}>Only me</button>
          </div>
        )}
        <span className="spacer" />
        {onCancel && <button type="button" className="linkbtn" onClick={onCancel}>Cancel</button>}
        <button type="button" className="btn small" disabled={!body.trim() || busy} onClick={submit}>{reply ? 'Reply' : 'Post note'}</button>
      </div>
    </div>
  );
}

function NoteItem({ n, api, me, admin, cheat, reply, children }: {
  n: Note; api: NotesApi; me: string; admin: boolean; cheat: { topic: string | null; title: string }; reply?: boolean; children?: React.ReactNode;
}) {
  const mine = n.user_id === me;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(n.body);
  const [replying, setReplying] = useState(false);
  const [armed, setArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const edited = n.updated_at.slice(0, 19) !== n.created_at.slice(0, 19);

  return (
    <div className={'noteitem' + (reply ? ' isreply' : '')}>
      <div className="notehead">
        <span className="avatar small" aria-hidden>{n.author.slice(0, 1).toUpperCase()}</span>
        <b>{mine ? 'You' : n.author}</b>
        <span className="muted">{when(n.created_at)}{edited ? ' · edited' : ''}</span>
        {!n.is_public && <span className="pill">Only you</span>}
      </div>
      {editing ? (
        <div className="composer">
          <TexEditor value={draft} onChange={setDraft} rows={3} autoFocus onSubmit={async () => { if (draft.trim() && await api.edit(n.id, draft.trim())) setEditing(false); }} />
          <div className="composerbar">
            <span className="spacer" />
            <button type="button" className="linkbtn" onClick={() => { setEditing(false); setDraft(n.body); }}>Cancel</button>
            <button type="button" className="btn small" disabled={!draft.trim()} onClick={async () => { if (await api.edit(n.id, draft.trim())) setEditing(false); }}>Save</button>
          </div>
        </div>
      ) : <Rich text={n.body} className="notebody" />}
      {!editing && (
        <div className="noteactions">
          {n.is_public && (
            <button type="button" className={'act vote' + (n.voted ? ' on' : '')} onClick={() => api.vote(n)} aria-pressed={n.voted} title="Helpful">
              <Icon name="up" size={15} /><span>{n.votes}</span>
            </button>
          )}
          {!reply && <button type="button" className="act" onClick={() => setReplying(r => !r)}><Icon name="reply" size={15} />Reply</button>}
          <button type="button" className="act" onClick={async () => { if (await api.toCheatsheet(n, cheat.topic, cheat.title)) setCopied(true); }} disabled={copied}>
            <Icon name="sheet" size={15} />{copied ? 'In your cheatsheet' : 'To cheatsheet'}
          </button>
          {mine && <button type="button" className="act" onClick={() => setEditing(true)}><Icon name="edit" size={15} />Edit</button>}
          {(mine || admin) && (
            <button type="button" className={'act' + (armed ? ' danger' : '')} onClick={() => armed ? api.remove(n.id) : setArmed(true)} onBlur={() => setArmed(false)}>
              <Icon name="trash" size={15} />{armed ? 'Click again to delete' : 'Delete'}
            </button>
          )}
        </div>
      )}
      {(children || replying) && (
        <div className="replies">
          {children}
          {replying && <Composer reply onCancel={() => setReplying(false)} onPost={async b => { const ok = await api.post(n.page, b, n.is_public, n.id); if (ok) setReplying(false); return ok; }} />}
        </div>
      )}
    </div>
  );
}
