import DashboardView, { type DashData } from '@/components/DashboardView';
import TopBar from '@/components/TopBar';
import { getCatalog, getDecks, studyable } from '@/lib/queries';
import { requireUser } from '@/lib/supabase/server';
import { getSubject } from '@/subjects';

export const metadata = { title: 'Dashboard' };

type Stat = { subject_slug: string; type_key: string; answers: number; correct: number };

export default async function Dashboard() {
  const { sb, user } = await requireUser();
  const [{ trimesters, subjects, error }, stats, reviews, mocks, settings] = await Promise.all([
    getCatalog(sb),
    sb.from('type_stats').select('subject_slug, type_key, answers, correct'),
    sb.from('review_items').select('subject_slug, due_at'),
    sb.from('mock_results').select('subject_slug, score, max_score, created_at').order('created_at', { ascending: false }).limit(5),
    sb.from('user_settings').select('subject_slug, settings'),
  ]);
  const decks = Object.fromEntries(await Promise.all(subjects.map(async s => [s.slug, await getDecks(sb, s.slug)] as const)));
  const newPer = (slug: string) => Number((settings.data || []).find(x => x.subject_slug === slug)?.settings?.newPerDay ?? 20);
  const now = Date.now();
  const st = (stats.data || []) as Stat[];
  const data: DashData = {
    name: (user.email || '').split('@')[0],
    error: error?.message,
    trimesters,
    subjects: subjects.map(s => {
      const rows = st.filter(r => r.subject_slug === s.slug);
      return {
        slug: s.slug, name: s.name, short: s.short_name, trimester: s.trimester_id,
        answers: rows.reduce((a, r) => a + r.answers, 0), correct: rows.reduce((a, r) => a + r.correct, 0),
        due: (reviews.data || []).filter(r => r.subject_slug === s.slug && Date.parse(r.due_at) <= now).length,
        cards: (decks[s.slug] || []).reduce((a, d) => a + studyable(d, newPer(s.slug)), 0),
      };
    }),
    weak: st.filter(r => r.answers >= 3 && getSubject(r.subject_slug))
      .map(r => ({ slug: r.subject_slug, type: r.type_key, rate: r.correct / r.answers }))
      .sort((a, b) => a.rate - b.rate).slice(0, 6),
    mocks: (mocks.data || []).map(m => ({ slug: m.subject_slug, score: +m.score, max: +m.max_score, date: m.created_at })),
  };
  return (
    <>
      <TopBar email={user.email || ''} />
      <DashboardView d={data} />
    </>
  );
}
