import ProblemSets from '@/components/ProblemSets';

export const metadata = { title: 'Problem sets' };

export default async function ProblemSetsPage({ searchParams }: { searchParams: Promise<{ set?: string; run?: string }> }) {
  const { set, run } = await searchParams;
  return <ProblemSets set={set} run={run === '1'} />;
}
