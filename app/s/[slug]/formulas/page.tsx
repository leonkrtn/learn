import { notFound } from 'next/navigation';
import { getSubject } from '@/subjects';

export const metadata = { title: 'Formula sheet' };

export default async function FormulasPage({ params }: { params: Promise<{ slug: string }> }) {
  const mod = getSubject((await params).slug);
  if (!mod) notFound();
  const Sheet = mod.FormulaSheet;
  return (
    <div className="page">
      <div className="pagehead"><h1>Formula sheet</h1><span className="aside">Exactly what you get in the exam</span></div>
      <div className="panel doc"><Sheet /></div>
    </div>
  );
}
