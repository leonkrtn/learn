import Link from 'next/link';
import Runner from '@/components/Runner';
import TypePicker from '@/components/TypePicker';

export const metadata = { title: 'Practice' };

export default async function PracticePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pick?: string }> }) {
  const [{ slug }, { pick }] = await Promise.all([params, searchParams]);
  if (pick === '1') return <TypePicker />;
  return (
    <>
      <div className="pagehead" style={{ maxWidth: 880 }}>
        <h1>Practice</h1>
        <span className="aside"><Link href={`/s/${slug}?pick=1`}>Choose question types</Link></span>
      </div>
      <Runner mode={{ kind: 'practice' }} />
    </>
  );
}
