import CyclePicker from '@/components/CyclePicker';

export const metadata = { title: 'Cycle by lecture' };

export default async function CyclePage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return <CyclePicker topic={topic} />;
}
