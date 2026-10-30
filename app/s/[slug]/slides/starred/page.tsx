import type { Deck } from '@/components/SlidesIndex';
import StarredSlides from '@/components/StarredSlides';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Starred slides' };

export default async function StarredPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb } = await requireUser();
  const { data, error } = await sb.from('slide_stars')
    .select('page, slide_decks!inner(id, topic, title, pages, storage_path, created_at, subject_slug)')
    .eq('slide_decks.subject_slug', slug).order('page');
  const rows = (data || []) as unknown as { page: number; slide_decks: Deck }[];
  return <StarredSlides stars={rows.map(r => ({ page: r.page, deck: r.slide_decks }))} error={error?.message} />;
}
