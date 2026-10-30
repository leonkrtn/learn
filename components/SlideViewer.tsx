'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from './Icons';
import { pinNumbers, topNotes, NoteThread, useNotes, type Note, type Pin, type PinCtl } from './Notes';
import { Fit, PdfCanvas, useDeckPdf } from './Pdf';
import type { Deck } from './SlidesIndex';
import { useSubject } from './SubjectContext';

type View = 'single' | 'all';
type Focus = null | 'slide' | 'notes';

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (['INPUT', 'TEXTAREA', 'SELECT', 'MATH-FIELD'].includes(el.tagName) || el.isContentEditable);
};

/** Numbered pins of a slide's notes, laid over the page; while placing, a click sets the new note's pin. */
function PinLayer({ notes, page, pin, show, onPlace }: { notes: Note[] | null; page: number; pin?: PinCtl; show: boolean; onPlace?: (p: Pin) => void }) {
  const nums = pinNumbers(notes, page);
  const pinned = topNotes(notes, page).filter(n => n.x != null && n.y != null);
  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pin?.placing) return;
    const r = e.currentTarget.getBoundingClientRect();
    const round = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
    pin.setPlacing(false);
    onPlace?.({ x: round((e.clientX - r.left) / r.width), y: round((e.clientY - r.top) / r.height) });
  };
  return (
    <div className={'pinlayer' + (pin?.placing ? ' placing' : '')} onClick={place}>
      {show && pinned.map(n => (
        <span key={n.id} className={'pinmark onslide' + (pin?.hover === n.id ? ' hl' : '')} style={{ left: `${n.x! * 100}%`, top: `${n.y! * 100}%` }}
          onMouseEnter={() => pin?.setHover(n.id)} onMouseLeave={() => pin?.setHover(null)}>{nums.get(n.id)}</span>
      ))}
      {pin?.draft && <span className="pinmark onslide draft" style={{ left: `${pin.draft.x * 100}%`, top: `${pin.draft.y * 100}%` }} />}
      {pin?.placing && <span className="pinhint">Click the spot your note is about · Esc cancels</span>}
    </div>
  );
}

export default function SlideViewer({ deck, me, admin, initialPage, initialView }: {
  deck: Deck; me: string; admin: boolean; initialPage: number; initialView: View;
}) {
  const { mod } = useSubject();
  const notes = useNotes(mod.slug, deck.id);
  const { doc, ratio, err } = useDeckPdf(deck.storage_path);
  const [page, setPage] = useState(initialPage);
  const [view, setView] = useState<View>(initialView);
  const [focus, setFocus] = useState<Focus>(null);
  const [stars, setStars] = useState<Set<number>>(new Set());
  const [onlyStars, setOnlyStars] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<Pin | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [starErr, setStarErr] = useState<string | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);

  const pin: PinCtl = { draft, placing, setPlacing: on => { setPlacing(on); if (on) setShowPins(true); }, clear: () => { setDraft(null); setPlacing(false); }, hover, setHover };

  useEffect(() => {
    supabaseBrowser().from('slide_stars').select('page').eq('deck_id', deck.id)
      .then(({ data }) => setStars(new Set(((data || []) as { page: number }[]).map(r => r.page))));
  }, [deck.id]);

  const toggleStar = useCallback(async (n: number) => {
    const sb = supabaseBrowser();
    const on = !stars.has(n);
    setStars(s => { const x = new Set(s); if (on) x.add(n); else x.delete(n); return x; });
    const { error } = on ? await sb.from('slide_stars').insert({ deck_id: deck.id, page: n }) : await sb.from('slide_stars').delete().eq('deck_id', deck.id).eq('page', n);
    if (error) {
      setStarErr(error.message);
      setStars(s => { const x = new Set(s); if (on) x.delete(n); else x.add(n); return x; });
    }
  }, [stars, deck.id]);

  const all = useMemo(() => Array.from({ length: deck.pages }, (_, i) => i + 1), [deck.pages]);
  const nav = useMemo(() => onlyStars ? all.filter(n => stars.has(n)) : all, [onlyStars, all, stars]);
  const at = nav.indexOf(page);
  const go = useCallback((d: number) => {
    if (!nav.length) return;
    const i = at < 0 ? 0 : Math.min(nav.length - 1, Math.max(0, at + d));
    setPage(nav[i]); setDraft(null); setPlacing(false);
  }, [nav, at]);

  // With "starred only" on, stay on a starred slide.
  useEffect(() => { if (onlyStars && nav.length && !nav.includes(page)) setPage(nav[0]); }, [onlyStars, nav, page]);

  useEffect(() => {
    window.history.replaceState(null, '', `?p=${page}${view === 'all' ? '&view=all' : ''}`);
    if (view === 'single') thumbs.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [page, view]);

  useEffect(() => {
    if (initialView === 'all' && initialPage > 1) document.getElementById(`slide-${initialPage}`)?.scrollIntoView();
  }, [initialView, initialPage]);

  // No page scrolling behind the maximised view.
  useEffect(() => {
    if (!focus) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [focus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (placing) setPlacing(false);
        else if (focus) setFocus(null);
        return;
      }
      if (view === 'all' && !focus) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      if (e.key === 's') toggleStar(page);
      if (e.key === 'f') setFocus(f => f ? null : 'slide');
      if (e.key === 'n') setFocus(f => f === 'notes' ? 'slide' : 'notes');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, focus, placing, go, page, toggleStar]);

  const count = (n: number) => (notes.notes || []).filter(x => x.page === n).length;
  const cheat = (n: number) => ({ topic: deck.topic, title: `${deck.title} · slide ${n}` });
  const lecture = mod.topics.find(t => t.id === deck.topic);
  const starred = stars.has(page);

  const stage = (
    <PdfCanvas key={page} doc={doc} n={page} ratio={ratio} eager>
      <PinLayer notes={notes.notes} page={page} pin={pin} show={showPins} onPlace={setDraft} />
    </PdfCanvas>
  );
  const starBtn = (
    <button type="button" className={'act star' + (starred ? ' on' : '')} onClick={() => toggleStar(page)} aria-pressed={starred} title="Star this slide for yourself (S)">
      <Icon name="star" size={16} filled={starred} />{starred ? 'Starred' : 'Star'}
    </button>
  );
  const pinsBtn = (
    <button type="button" className={'act' + (showPins ? ' on' : '')} onClick={() => setShowPins(s => !s)} aria-pressed={showPins} title="Show the pins of notes on the slide">
      <Icon name="pin" size={16} />Pins
    </button>
  );
  const pager = (
    <span className="pager-in">
      <button type="button" className="iconbtn" disabled={at <= 0} onClick={() => go(-1)} aria-label="Previous slide"><Icon name="prev" size={16} /></button>
      <span className="num">Slide <b>{page}</b> of {deck.pages}{onlyStars && at >= 0 ? <> · starred {at + 1} of {nav.length}</> : null}</span>
      <button type="button" className="iconbtn" disabled={at < 0 || at >= nav.length - 1} onClick={() => go(1)} aria-label="Next slide"><Icon name="next" size={16} /></button>
    </span>
  );
  const notesFor = (n: number) => (
    <NoteThread key={n} api={notes} page={n} me={me} admin={admin} cheat={cheat(n)} pin={pin} />
  );
  const empty = onlyStars && !nav.length;

  return (
    <div className="page wide">
      <div className="pagehead">
        <h1>{deck.title}</h1>
        <span className="aside"><Link href={`/s/${mod.slug}/slides/starred`}>Starred slides</Link> · <Link href={`/s/${mod.slug}/slides`}>All slides</Link></span>
      </div>
      <div className="viewerbar">
        <span className="lec">Lecture {deck.topic}{lecture ? ' · ' + lecture.name : ''}</span>
        <span className="spacer" />
        <label className="switch" title="Show only the slides you starred">
          <input type="checkbox" checked={onlyStars} onChange={e => setOnlyStars(e.target.checked)} /><span className="track" /><span>Starred only ({stars.size})</span>
        </label>
        <div className="vis" role="radiogroup" aria-label="View">
          <button type="button" className={view === 'single' ? 'on' : ''} aria-pressed={view === 'single'} onClick={() => setView('single')}>Slide by slide</button>
          <button type="button" className={view === 'all' ? 'on' : ''} aria-pressed={view === 'all'} onClick={() => setView('all')}>All slides</button>
        </div>
        <button type="button" className="btn ghost small" onClick={() => setFocus('slide')} disabled={empty} title="Maximise the slide (F)"><Icon name="expand" size={16} />Maximise</button>
      </div>
      {(err || starErr) && <p className="err">{err || starErr}</p>}
      {empty && <p className="note">No starred slides in this file yet. Star a slide with the star button or the S key.</p>}

      {!empty && view === 'single' && (
        <div className="slidegrid">
          <div className="slidemain">
            <div className="panel slideframe">{stage}</div>
            <div className="slidenav">
              {pager}
              <span className="spacer" />
              {starBtn}{pinsBtn}
            </div>
            <div className="thumbs" ref={thumbs}>
              {nav.map(n => (
                <button key={n} type="button" className={'thumb' + (n === page ? ' on' : '')} onClick={() => { setPage(n); setDraft(null); setPlacing(false); }} aria-label={`Slide ${n}`}>
                  <PdfCanvas doc={doc} n={n} ratio={ratio} />
                  <span className="tn">{stars.has(n) && <Icon name="star" size={11} filled />}{n}</span>
                  {count(n) > 0 && <span className="tc">{count(n)}</span>}
                </button>
              ))}
            </div>
          </div>
          <aside className="panel notespanel sticky">
            <h3>Notes on slide {page}</h3>
            {notesFor(page)}
          </aside>
        </div>
      )}

      {!empty && view === 'all' && (
        <div className="slidestack">
          {nav.map(n => (
            <section key={n} className="panel slidecard" id={`slide-${n}`}>
              <div className="sch">
                <b>Slide {n}</b>
                <span className="spacer" />
                <button type="button" className={'act star' + (stars.has(n) ? ' on' : '')} onClick={() => toggleStar(n)} aria-pressed={stars.has(n)}><Icon name="star" size={15} filled={stars.has(n)} />{stars.has(n) ? 'Starred' : 'Star'}</button>
                <button type="button" className="act" onClick={() => { setPage(n); setView('single'); window.scrollTo({ top: 0 }); }}>Open large</button>
              </div>
              <PdfCanvas doc={doc} n={n} ratio={ratio}><PinLayer notes={notes.notes} page={n} show={showPins} /></PdfCanvas>
              <NoteThread api={notes} page={n} me={me} admin={admin} cheat={cheat(n)} compact={count(n) === 0} />
            </section>
          ))}
        </div>
      )}

      {focus && !empty && (
        <div className="focus" role="dialog" aria-label={`${deck.title}, maximised`}>
          <div className="focusbar">
            <b className="ft">{deck.title}</b>
            {pager}
            <span className="spacer" />
            {starBtn}{pinsBtn}
            <div className="vis" role="radiogroup" aria-label="Layout">
              <button type="button" className={focus === 'slide' ? 'on' : ''} aria-pressed={focus === 'slide'} onClick={() => setFocus('slide')}>Slide only</button>
              <button type="button" className={focus === 'notes' ? 'on' : ''} aria-pressed={focus === 'notes'} onClick={() => setFocus('notes')}>With notes</button>
            </div>
            <button type="button" className="iconbtn" onClick={() => setFocus(null)} title="Close (Esc)" aria-label="Close"><Icon name="close" size={16} /></button>
          </div>
          <div className={'focusbody' + (focus === 'notes' ? ' withnotes' : '')}>
            <Fit ratio={ratio}><div className="focusslide">{stage}</div></Fit>
            {focus === 'notes' && (
              <aside className="focusnotes">
                <h3>Notes on slide {page}</h3>
                {notesFor(page)}
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
