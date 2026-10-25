import Link from 'next/link';
import DeleteDeck from '@/components/DeleteDeck';
import { getDecks, loadSubject, studyable } from '@/lib/queries';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Flashcards' };

export default async function CardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb } = await requireUser();
  const [decks, data] = await Promise.all([getDecks(sb, slug), loadSubject(sb, slug)]);
  const newPerDay = Number((data.settings as { newPerDay?: number } | null)?.newPerDay ?? 20);
  return (
    <div className="page">
      <div className="pagehead"><h1>Flashcards</h1><span className="aside"><Link href={`/s/${slug}/cards/import`}>Import Anki or CSV deck</Link></span></div>
      <p className="lede">Rate each card Again, Hard, Good or Easy; the FSRS scheduler picks the next date so you see a card shortly before you would forget it. Up to {newPerDay} new cards per deck and day (change in Settings).</p>
      <div className="decks">
        <div className="deckrow head"><span>Deck</span><span className="n">Due</span><span className="n">New</span><span className="n">Total</span><span /></div>
        {decks.map(d => {
          const can = studyable(d, newPerDay);
          return (
            <div className="deckrow" key={d.deck_id}>
              <span className="name">{d.name}<small>{d.owner_id ? 'Your deck · ' + d.source.toUpperCase() : 'Official deck'}</small></span>
              <span className={'n' + (d.due ? ' due' : '')}>{d.due}</span>
              <span className="n">{Math.min(d.fresh, Math.max(0, newPerDay - d.new_today))}</span>
              <span className="n">{d.total}</span>
              <span className="go">
                {can > 0 ? <Link className="btn small" href={`/s/${slug}/cards/${d.deck_id}`}>Study {can}</Link> : <span className="note">Done for today</span>}
                {d.owner_id && <DeleteDeck id={d.deck_id} />}
              </span>
            </div>
          );
        })}
        {!decks.length && <p className="note">No decks yet.</p>}
      </div>
    </div>
  );
}
