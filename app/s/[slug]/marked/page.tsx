import MarkedView from '@/components/MarkedView';

export const metadata = { title: 'Marked questions' };

export default async function MarkedPage({ searchParams }: { searchParams: Promise<{ topic?: string; manage?: string }> }) {
  const { topic, manage } = await searchParams;
  return <MarkedView topic={topic} manage={manage === '1'} />;
}
