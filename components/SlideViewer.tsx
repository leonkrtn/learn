'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { openPdf, type PDFDocumentProxy } from '@/lib/pdf';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from './Icons';
import { NoteThread, useNotes } from './Notes';
import type { Deck } from './SlidesIndex';
import { useSubject } from './SubjectContext';

type View = 'single' | 'all';

/** One PDF page drawn into a canvas once it scrolls near the viewport, sized to its container. */
function PdfCanvas({ doc, n, ratio, eager }: { doc: PDFDocumentProxy | null; n: number; ratio: number; eager?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(!!eager);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    if (eager) return () => ro.disconnect();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, [eager]);

  useEffect(() => {
    if (!doc || !near || !width || !canvas.current) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    doc.getPage(n).then(page => {
      if (cancelled || !canvas.current) return;
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const c = canvas.current;
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      task = page.render({ canvasContext: c.getContext('2d')!, viewport: vp });
      task.promise.catch(() => {});
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, n, near, width]);

  return (
    <div ref={box} className="pdfpage" style={{ aspectRatio: String(1 / ratio) }}>
      <canvas ref={canvas} aria-label={`Slide ${n}`} />
    </div>
  );
}

export default function SlideViewer({ deck, me, admin, initialPage, initialView }: {
  deck: Deck; me: string; admin: boolean; initialPage: number; initialView: View;
}) {
  const { mod } = useSubject();
  const notes = useNotes(mod.slug, deck.id);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(9 / 16);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [view, setView] = useState<View>(initialView);
  const thumbs = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true, loaded: PDFDocumentProxy | null = null;
    (async () => {
      const { data, error } = await supabaseBrowser().storage.from('slides').createSignedUrl(deck.storage_path, 3600);
      if (error || !data) throw new Error(error?.message || 'The file could not be opened.');
      loaded = await openPdf(data.signedUrl);
      const p1 = await loaded.getPage(1);
      const vp = p1.getViewport({ scale: 1 });
      if (!alive) { loaded.destroy(); return; }
      setRatio(vp.height / vp.width); setDoc(loaded);
    })().catch(e => alive && setErr((e as Error).message));
    return () => { alive = false; loaded?.destroy(); };
  }, [deck.storage_path]);

  useEffect(() => {
    window.history.replaceState(null, '', `?p=${page}${view === 'all' ? '&view=all' : ''}`);
    if (view === 'single') thumbs.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [page, view]);

  // Opening "All slides" with ?p= jumps to that slide.
  useEffect(() => {
    if (initialView === 'all' && initialPage > 1) document.getElementById(`slide-${initialPage}`)?.scrollIntoView();
  }, [initialView, initialPage]);

  useEffect(() => {
    if (view !== 'single') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight') setPage(p => Math.min(deck.pages, p + 1));
      if (e.key === 'ArrowLeft') setPage(p => Math.max(1, p - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, deck.pages]);

  const count = (n: number) => (notes.notes || []).filter(x => x.page === n).length;
  const pages = Array.from({ length: deck.pages }, (_, i) => i + 1);
  const cheat = (n: number) => ({ topic: deck.topic, title: `${deck.title} · slide ${n}` });
  const lecture = mod.topics.find(t => t.id === deck.topic);

  return (
    <div className="page wide">
      <div className="pagehead">
        <h1>{deck.title}</h1>
        <span className="aside"><Link href={`/s/${mod.slug}/slides`}>All slides</Link></span>
      </div>
      <div className="viewerbar">
        <span className="lec">Lecture {deck.topic}{lecture ? ' · ' + lecture.name : ''}</span>
        <span className="spacer" />
        <div className="vis" role="radiogroup" aria-label="View">
          <button type="button" className={view === 'single' ? 'on' : ''} aria-pressed={view === 'single'} onClick={() => setView('single')}>Slide by slide</button>
          <button type="button" className={view === 'all' ? 'on' : ''} aria-pressed={view === 'all'} onClick={() => setView('all')}>All slides</button>
        </div>
      </div>
      {err && <p className="err">{err}</p>}

      {view === 'single' ? (
        <div className="slidegrid">
          <div className="slidemain">
            <div className="panel slideframe"><PdfCanvas key={page} doc={doc} n={page} ratio={ratio} eager /></div>
            <div className="slidenav">
              <button type="button" className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon name="prev" size={16} />Previous</button>
              <span className="num">Slide <b>{page}</b> of {deck.pages}</span>
              <button type="button" className="btn ghost small" disabled={page >= deck.pages} onClick={() => setPage(page + 1)}>Next<Icon name="next" size={16} /></button>
            </div>
            <div className="thumbs" ref={thumbs}>
              {pages.map(n => (
                <button key={n} type="button" className={'thumb' + (n === page ? ' on' : '')} onClick={() => setPage(n)} aria-label={`Slide ${n}`}>
                  <PdfCanvas doc={doc} n={n} ratio={ratio} />
                  <span className="tn">{n}</span>
                  {count(n) > 0 && <span className="tc">{count(n)}</span>}
                </button>
              ))}
            </div>
          </div>
          <aside className="panel notespanel sticky">
            <h3>Notes on slide {page}</h3>
            <NoteThread key={page} api={notes} page={page} me={me} admin={admin} cheat={cheat(page)} />
          </aside>
        </div>
      ) : (
        <div className="slidestack">
          {pages.map(n => (
            <section key={n} className="panel slidecard" id={`slide-${n}`}>
              <div className="sch"><b>Slide {n}</b><button type="button" className="linkbtn" onClick={() => { setPage(n); setView('single'); window.scrollTo({ top: 0 }); }}>Open large</button></div>
              <PdfCanvas doc={doc} n={n} ratio={ratio} />
              <NoteThread api={notes} page={n} me={me} admin={admin} cheat={cheat(n)} compact={count(n) === 0} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
