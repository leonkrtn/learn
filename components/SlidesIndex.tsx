'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { openPdf } from '@/lib/pdf';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from './Icons';
import { NoteThread, useNotes } from './Notes';
import { useSubject } from './SubjectContext';

export type Deck = { id: string; topic: string; title: string; pages: number; storage_path: string; created_at: string };

const MAX_MB = 50;

/** Slides per lecture, the admin's upload form, and the general notes on the subject. */
export default function SlidesIndex({ decks, me, admin, error }: { decks: Deck[]; me: string; admin: boolean; error?: string }) {
  const { mod } = useSubject();
  const notes = useNotes(mod.slug, null);
  return (
    <div className="page">
      <div className="pagehead"><h1>Slides</h1><span className="aside"><Link href={`/s/${mod.slug}/slides/starred`}>Starred slides</Link> · {decks.length} file{decks.length === 1 ? '' : 's'}</span></div>
      <p className="lede">The lecture slides, one page per slide with notes underneath. Notes are public by default; switch to “Only me” for private ones. Good notes can go straight into your cheatsheet.</p>
      {error && <p className="err">{error}</p>}
      {admin && <Upload />}
      <div className="slidelist">
        {mod.topics.map(t => {
          const list = decks.filter(d => d.topic === t.id);
          return (
            <section key={t.id} className="slidegroup">
              <div className="sghead"><span className="lec">Lecture {t.id}</span><b>{t.name}</b></div>
              {list.length ? list.map(d => <DeckRow key={d.id} d={d} admin={admin} />) : <div className="sgempty">No slides uploaded yet.</div>}
            </section>
          );
        })}
      </div>

      <h2 className="sec">General notes on {mod.short}<small>not tied to a slide</small></h2>
      <div className="panel notespanel">
        <NoteThread api={notes} page={null} me={me} admin={admin} cheat={{ topic: null, title: 'General note' }} />
      </div>
    </div>
  );
}

function DeckRow({ d, admin }: { d: Deck; admin: boolean }) {
  const { mod } = useSubject();
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function remove() {
    if (!armed) { setArmed(true); return; }
    const sb = supabaseBrowser();
    const { error } = await sb.from('slide_decks').delete().eq('id', d.id);
    if (error) { setErr(error.message); return; }
    await sb.storage.from('slides').remove([d.storage_path]);
    router.refresh();
  }
  return (
    <div className="deckline">
      <Link href={`/s/${mod.slug}/slides/${d.id}`} className="dl"><Icon name="slides" /><span className="t">{d.title}</span><span className="n">{d.pages} slides</span></Link>
      {admin && <button type="button" className={'act' + (armed ? ' danger' : '')} onClick={remove} onBlur={() => setArmed(false)}><Icon name="trash" size={15} />{armed ? 'Click again to delete with all notes' : 'Delete'}</button>}
      {err && <span className="err">{err}</span>}
    </div>
  );
}

function Upload() {
  const { mod } = useSubject();
  const router = useRouter();
  const [topic, setTopic] = useState(mod.topics[0]?.id || '1');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function pick(f: File | null) {
    setMsg(null); setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '));
  }

  async function upload() {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { setMsg({ ok: false, text: `The file is larger than ${MAX_MB} MB.` }); return; }
    setBusy(true); setMsg(null);
    try {
      const doc = await openPdf(await file.arrayBuffer());
      const pages = doc.numPages;
      await doc.destroy();
      const sb = supabaseBrowser();
      const path = `${mod.slug}/${crypto.randomUUID()}.pdf`;
      const up = await sb.storage.from('slides').upload(path, file, { contentType: 'application/pdf' });
      if (up.error) throw new Error(up.error.message);
      const ins = await sb.from('slide_decks').insert({ subject_slug: mod.slug, topic, title: title.trim() || file.name, storage_path: path, pages });
      if (ins.error) { await sb.storage.from('slides').remove([path]); throw new Error(ins.error.message); }
      setMsg({ ok: true, text: `Uploaded, ${pages} slides.` });
      setFile(null); setTitle('');
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || 'This file could not be read as a PDF.' });
    }
    setBusy(false);
  }

  return (
    <div className="panel uploadbox">
      <div className="uploadhead"><Icon name="upload" /><b>Upload slides</b><span className="muted">PDF, up to {MAX_MB} MB · only you can upload</span></div>
      <div className="uploadrow">
        <label className="field"><span>Lecture</span>
          <select value={topic} onChange={e => setTopic(e.target.value)}>
            {mod.topics.map(t => <option key={t.id} value={t.id}>Lecture {t.id} · {t.name}</option>)}
          </select>
        </label>
        <label className="field grow"><span>Title</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lecture 2 slides" /></label>
        <label className="field"><span>File</span>
          <input type="file" accept="application/pdf,.pdf" onChange={e => pick(e.target.files?.[0] || null)} />
        </label>
        <button type="button" className="btn" disabled={!file || busy} onClick={upload}>{busy ? 'Uploading…' : 'Upload'}</button>
      </div>
      <div className="formmsg">{msg && <span className={msg.ok ? 'okmsg' : 'err'}>{msg.text}</span>}</div>
    </div>
  );
}
