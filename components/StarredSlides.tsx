'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from './Icons';
import { PdfCanvas, useDeckPdf } from './Pdf';
import type { Deck } from './SlidesIndex';
import { useSubject } from './SubjectContext';

type Star = { page: number; deck: Deck };

/** Every slide you starred in this subject, by lecture and file. */
export default function StarredSlides({ stars: initial, error }: { stars: Star[]; error?: string }) {
  const { mod } = useSubject();
  const [stars, setStars] = useState(initial);
  const [err, setErr] = useState(error || null);
  const decks = [...new Map(stars.map(s => [s.deck.id, s.deck])).values()]
    .sort((a, b) => a.topic.localeCompare(b.topic, undefined, { numeric: true }) || a.created_at.localeCompare(b.created_at));

  async function unstar(s: Star) {
    const { error } = await supabaseBrowser().from('slide_stars').delete().eq('deck_id', s.deck.id).eq('page', s.page);
    if (error) { setErr(error.message); return; }
    setStars(xs => xs.filter(x => !(x.deck.id === s.deck.id && x.page === s.page)));
  }

  return (
    <div className="page wide">
      <div className="pagehead"><h1>Starred slides</h1><span className="aside"><Link href={`/s/${mod.slug}/slides`}>All slides</Link></span></div>
      <p className="lede">Slides you starred, across all lectures of {mod.short}. Only you see your stars. Star a slide in the viewer with the star button or the S key.</p>
      {err && <p className="err">{err}</p>}
      {!stars.length && <p className="note">Nothing starred yet.</p>}
      <div className="starlist">
        {decks.map(d => <DeckStars key={d.id} deck={d} pages={stars.filter(s => s.deck.id === d.id).map(s => s.page).sort((a, b) => a - b)} onUnstar={unstar} />)}
      </div>
    </div>
  );
}

function DeckStars({ deck, pages, onUnstar }: { deck: Deck; pages: number[]; onUnstar: (s: Star) => void }) {
  const { mod } = useSubject();
  const { doc, ratio, err } = useDeckPdf(deck.storage_path);
  return (
    <section className="panel stargroup">
      <div className="sgh">
        <h2><span className="lec">Lecture {deck.topic}</span> {deck.title}</h2>
        <span className="note">{pages.length} starred</span>
      </div>
      {err && <p className="err">{err}</p>}
      <div className="stargrid">
        {pages.map(p => (
          <div key={p} className="starcell">
            <Link href={`/s/${mod.slug}/slides/${deck.id}?p=${p}`} className="starthumb" aria-label={`Open slide ${p}`}>
              <PdfCanvas doc={doc} n={p} ratio={ratio} />
            </Link>
            <div className="starmeta">
              <span>Slide {p}</span>
              <button type="button" className="act star on" onClick={() => onUnstar({ page: p, deck })} title="Remove star"><Icon name="star" size={14} filled />Unstar</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
