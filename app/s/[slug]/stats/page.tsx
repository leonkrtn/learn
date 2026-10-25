import type { PastMock } from '@/components/MockExam';
import StatsView from '@/components/StatsView';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'Statistics' };

export default async function StatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb } = await requireUser();
  const { data } = await sb.from('mock_results').select('id, score, max_score, minutes, created_at, parts')
    .eq('subject_slug', slug).order('created_at', { ascending: false }).limit(10);
  return <StatsView mocks={(data || []) as PastMock[]} />;
}
