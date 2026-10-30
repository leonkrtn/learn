import CheatsheetView, { type Entry, type SharedSheet } from '@/components/CheatsheetView';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'My cheatsheet' };

/** Your own cheatsheet, or with ?from=<user id> a classmate's shared one (read-only). */
export default async function CheatsheetPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ slug }, { from }] = await Promise.all([params, searchParams]);
  const { sb, user } = await requireUser();
  const owner = from && /^[0-9a-f-]{36}$/i.test(from) && from !== user.id ? from : user.id;
  const [entries, sheet, shared] = await Promise.all([
    sb.from('cheat_entries').select('id, topic, title, body, sort, updated_at').eq('subject_slug', slug).eq('user_id', owner).order('sort'),
    sb.from('cheatsheets').select('shared').eq('subject_slug', slug).eq('user_id', user.id).maybeSingle(),
    sb.from('shared_cheatsheets').select('user_id, author, entries, updated_at').eq('subject_slug', slug).neq('user_id', user.id).order('updated_at', { ascending: false }),
  ]);
  const author = owner === user.id ? null : (shared.data || []).find(s => s.user_id === owner)?.author || 'A classmate';
  return (
    <CheatsheetView
      key={owner}
      entries={(entries.data || []) as Entry[]}
      readOnly={owner !== user.id}
      author={author}
      shared={!!sheet.data?.shared}
      others={(shared.data || []) as SharedSheet[]}
      error={entries.error?.message}
    />
  );
}
