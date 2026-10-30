import { notFound } from 'next/navigation';
import type { Deck } from '@/components/SlidesIndex';
import SlideViewer from '@/components/SlideViewer';
import { requireUser } from '@/lib/supabase/server';

export default async function DeckPage({ params, searchParams }: {
  params: Promise<{ slug: string; deck: string }>;
  searchParams: Promise<{ p?: string; view?: string }>;
}) {
  const [{ slug, deck: id }, sp] = await Promise.all([params, searchParams]);
  const { sb, user } = await requireUser();
  const [deck, admin] = await Promise.all([
    sb.from('slide_decks').select('id, topic, title, pages, storage_path, created_at').eq('subject_slug', slug).eq('id', id).maybeSingle(),
    sb.rpc('is_admin'),
  ]);
  if (!deck.data) notFound();
  const d = deck.data as Deck;
  const page = Math.min(d.pages, Math.max(1, Number(sp.p) || 1));
  return <SlideViewer deck={d} me={user.id} admin={admin.data === true} initialPage={page} initialView={sp.view === 'all' ? 'all' : 'single'} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; deck: string }> }) {
  const { slug, deck } = await params;
  const { sb } = await requireUser();
  const { data } = await sb.from('slide_decks').select('title').eq('subject_slug', slug).eq('id', deck).maybeSingle();
  return { title: data?.title || 'Slides' };
}
