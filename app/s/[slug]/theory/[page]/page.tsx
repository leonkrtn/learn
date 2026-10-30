import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubject } from '@/subjects';

export default async function TheoryPage({ params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params;
  const mod = getSubject(slug);
  const p = mod?.theory.find(x => x.slug === page);
  if (!mod || !p) notFound();
  const Body = p.Component;
  const i = mod.theory.indexOf(p);
  const prev = mod.theory[i - 1], next = mod.theory[i + 1];
  return (
    <div className="page">
      <div className="pagehead">
        <h1>Lecture {p.topic} · {mod.topics.find(t => t.id === p.topic)?.name}</h1>
        <span className="aside"><Link href={`/s/${slug}/cycle?topic=${p.topic}`}>Practise this lecture</Link></span>
      </div>
      <article className="panel doc">
        <h2 className="doctitle">{p.title}</h2>
        <Body />
      </article>
      <div className="pager">
        <span>{prev && <Link className="btn ghost small" href={`/s/${slug}/theory/${prev.slug}`}>← Lecture {prev.topic}</Link>}</span>
        <span>{next && <Link className="btn ghost small" href={`/s/${slug}/theory/${next.slug}`}>Lecture {next.topic} →</Link>}</span>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params;
  return { title: getSubject(slug)?.theory.find(x => x.slug === page)?.title || 'Theory' };
}
