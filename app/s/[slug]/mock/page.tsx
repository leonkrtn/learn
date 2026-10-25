import { notFound } from 'next/navigation';
import MockExam, { type PastMock } from '@/components/MockExam';
import { requireUser } from '@/lib/supabase/server';
import { getSubject } from '@/subjects';

export const metadata = { title: 'Mock exam' };

export default async function MockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getSubject(slug);
  if (!mod?.mock) notFound();
  const { sb } = await requireUser();
  const { data } = await sb.from('mock_results').select('id, score, max_score, minutes, created_at, parts')
    .eq('subject_slug', slug).order('created_at', { ascending: false }).limit(20);
  return <MockExam past={(data || []) as PastMock[]} />;
}
