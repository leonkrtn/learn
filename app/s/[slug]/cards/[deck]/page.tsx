import { notFound } from 'next/navigation';
import Study, { type StudyCard } from '@/components/Study';
import { getDecks, loadSubject } from '@/lib/queries';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Study' };

export default async function StudyPage({ params }: { params: Promise<{ slug: string; deck: string }> }) {
  const { slug, deck } = await params;
  const { sb } = await requireUser();
  const [decks, data, cards, states] = await Promise.all([
    getDecks(sb, slug),
    loadSubject(sb, slug),
    sb.from('cards').select('id, front, back, sort').eq('deck_id', deck).order('sort').limit(5000),
    sb.from('card_states').select('card_id, due, fsrs, cards!inner(deck_id)').eq('cards.deck_id', deck).limit(5000),
  ]);
  const d = decks.find(x => x.deck_id === deck);
  if (!d) notFound();
  const newPerDay = Number((data.settings as { newPerDay?: number } | null)?.newPerDay ?? 20);
  const stateMap = new Map((states.data || []).map(s => [s.card_id as string, s.fsrs as Record<string, unknown>]));
  const list: StudyCard[] = (cards.data || []).map(c => ({ id: c.id, front: c.front, back: c.back, state: stateMap.get(c.id) || null }));
  return <Study deckName={d.name} cards={list} newLimit={Math.max(0, newPerDay - d.new_today)} />;
}
