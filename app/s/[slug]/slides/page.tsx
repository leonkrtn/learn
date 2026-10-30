import SlidesIndex, { type Deck } from '@/components/SlidesIndex';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Slides' };

export default async function SlidesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb, user } = await requireUser();
  const [decks, admin] = await Promise.all([
    sb.from('slide_decks').select('id, topic, title, pages, storage_path, created_at').eq('subject_slug', slug).order('created_at'),
    sb.rpc('is_admin'),
  ]);
  return <SlidesIndex decks={(decks.data || []) as Deck[]} me={user.id} admin={admin.data === true} error={decks.error?.message} />;
}
