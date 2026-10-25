import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubject } from '@/subjects';

export const metadata = { title: 'Theory' };

export default async function TheoryIndex({ params }: { params: Promise<{ slug: string }> }) {
  const mod = getSubject((await params).slug);
  if (!mod) notFound();
  return (
    <div className="page">
      <div className="pagehead"><h1>Theory</h1></div>
      <p className="lede">One page per lecture: the argument step by step, the formulas, an interactive model to play with, a worked example, the usual mistakes and three quick checks. Wrong answers in practice link to the matching page.</p>
      <div className="theorylist">
        {mod.theory.map(p => (
          <Link key={p.slug} href={`/s/${mod.slug}/theory/${p.slug}`}>
            <span className="lec">Lecture {p.topic}</span>
            <span className="t">{p.title}</span>
            <span className="d">{mod.topics.find(t => t.id === p.topic)?.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
