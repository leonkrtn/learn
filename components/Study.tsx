'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rating, createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useSubject } from './SubjectContext';

export type StudyCard = { id: string; front: string; back: string; state: Record<string, unknown> | null };

type Item = { id: string; front: string; back: string; card: Card; isNew: boolean };

const scheduler = fsrs({ enable_fuzz: true });
const GRADES: [Grade, string, string][] = [[Rating.Again, 'Again', 'again'], [Rating.Hard, 'Hard', ''], [Rating.Good, 'Good', ''], [Rating.Easy, 'Easy', '']];
/** Cards due again within this window stay in the current session. */
const LEARN_AHEAD = 20 * 60 * 1000;

function revive(s: Record<string, unknown>): Card {
  return { ...(s as unknown as Card), due: new Date(s.due as string), last_review: s.last_review ? new Date(s.last_review as string) : undefined };
}

function fmtIvl(ms: number): string {
  const m = ms / 60000;
  if (m < 1) return '<1 min';
  if (m < 60) return Math.round(m) + ' min';
  const h = m / 60;
  if (h < 24) return Math.round(h) + ' h';
  const d = h / 24;
  if (d < 31) return Math.round(d) + ' d';
  if (d < 365) return (d / 30).toFixed(1).replace(/\.0$/, '') + ' mo';
  return (d / 365).toFixed(1).replace(/\.0$/, '') + ' y';
}

export default function Study({ deckName, cards, newLimit }: { deckName: string; cards: StudyCard[]; newLimit: number }) {
  const { mod } = useSubject();
  const router = useRouter();
  const initial = useMemo(() => {
    const now = Date.now();
    const due = cards.filter(c => c.state && Date.parse(c.state.due as string) <= now)
      .map(c => ({ id: c.id, front: c.front, back: c.back, card: revive(c.state!), isNew: false }))
      .sort((a, b) => a.card.due.getTime() - b.card.due.getTime());
    const fresh = cards.filter(c => !c.state).slice(0, newLimit)
      .map(c => ({ id: c.id, front: c.front, back: c.back, card: createEmptyCard(new Date()), isNew: true }));
    // Interleave new cards between reviews.
    const out: Item[] = [];
    const gap = fresh.length ? Math.max(1, Math.floor(due.length / fresh.length)) : 0;
    let f = 0;
    due.forEach((d, i) => { out.push(d); if (gap && (i + 1) % gap === 0 && f < fresh.length) out.push(fresh[f++]); });
    while (f < fresh.length) out.push(fresh[f++]);
    return out;
  }, [cards, newLimit]);

  const [queue, setQueue] = useState<Item[]>(initial);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const busy = useRef(false);

  const cur = queue[0];
  const preview = useMemo(() => cur ? scheduler.repeat(cur.card, now) : null, [cur, now]);

  const rate = useCallback(async (g: Grade) => {
    if (!cur || !shown || busy.current) return;
    busy.current = true;
    const t = new Date();
    const next = scheduler.next(cur.card, t, g).card;
    const rest = queue.slice(1);
    const again = next.due.getTime() - t.getTime() <= LEARN_AHEAD;
    setQueue(again ? [...rest, { ...cur, card: next, isNew: false }] : rest);
    setShown(false); setDone(d => d + 1); setNow(new Date());
    const sb = supabaseBrowser();
    const [a, b] = await Promise.all([
      sb.from('card_states').upsert({ card_id: cur.id, due: next.due.toISOString(), fsrs: next }, { onConflict: 'user_id,card_id' }),
      sb.from('card_reviews').insert({ card_id: cur.id, rating: g }),
    ]);
    const e = a.error || b.error;
    setErr(e ? 'Review not saved: ' + e.message : null);
    busy.current = false;
  }, [cur, shown, queue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setShown(true); setNow(new Date()); return; }
      if (shown) {
        const i = ['1', '2', '3', '4'].indexOf(e.key);
        if (i >= 0) { e.preventDefault(); rate(GRADES[i][0]); }
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); rate(Rating.Good); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shown, rate]);


  return (
    <div className="page">
      <div className="pagehead"><h1>{deckName}</h1><span className="aside"><Link href={`/s/${mod.slug}/cards`} onClick={() => router.refresh()}>All decks</Link></span></div>
      <div className="studymeta">
        <span>{done} reviewed</span>
        <span>{queue.length} in this session</span>
      </div>
      {cur ? (
        <div className="card">
          <div className="face">
            <div dangerouslySetInnerHTML={{ __html: cur.front }} />
            {shown && <div className="back" dangerouslySetInnerHTML={{ __html: cur.back }} />}
          </div>
          {shown && preview ? (
            <div className="bar">
              {GRADES.map(([g, label, cls], i) => (
                <button key={label} type="button" className={cls} onClick={() => rate(g)}>
                  {label}<span className="kbd">{i + 1}</span>
                  <small>{fmtIvl(preview[g].card.due.getTime() - now.getTime())}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="bar one"><button type="button" onClick={() => { setShown(true); setNow(new Date()); }}>Show answer<span className="kbd">Space</span></button></div>
          )}
        </div>
      ) : (
        <div className="endbox panel">
          <h2>Done for now</h2>
          <p>{done ? `You reviewed ${done} cards.` : 'Nothing to study in this deck right now.'} Cards come back on their own when it is a good time to repeat them.</p>
          <Link className="btn" href={`/s/${mod.slug}/cards`} onClick={() => router.refresh()}>Back to decks</Link>
        </div>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
