import Link from 'next/link';
import Runner from '@/components/Runner';
import { getSubject } from '@/subjects';

export const metadata = { title: 'Practice' };

/** Practice over the enabled types; `?topic=` limits it to one lecture (linked from theory pages and the dashboard). */
export default async function PracticePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ topic?: string }> }) {
  const [{ slug }, { topic }] = await Promise.all([params, searchParams]);
  const t = topic ? getSubject(slug)?.topics.find(x => x.id === topic) : undefined;
  if (!t) return <Runner mode={{ kind: 'practice' }} />;
  return (
    <>
      <div className="pagehead" style={{ maxWidth: 880 }}>
        <h1>Lecture {t.id} · {t.name}</h1>
        <span className="aside"><Link href={`/s/${slug}`}>All lectures</Link></span>
      </div>
      <Runner mode={{ kind: 'practice', topic: t.id }} />
    </>
  );
}
