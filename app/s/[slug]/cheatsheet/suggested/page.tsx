import SuggestedSheet from '@/components/SuggestedSheet';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Suggested cheatsheet' };

/** The suggested exam cheatsheet of a subject; entries already in the user's own sheet are marked as added. */
export default async function SuggestedSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb, user } = await requireUser();
  const { data, error } = await sb.from('cheat_entries').select('title').eq('subject_slug', slug).eq('user_id', user.id);
  return <SuggestedSheet have={(data || []).map(e => e.title as string)} error={error?.message} />;
}
