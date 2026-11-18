import AccountView, { type AccountSubject } from '@/components/AccountView';
import { HomeSidebar } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { getCatalog } from '@/lib/queries';
import { requireUser } from '@/lib/supabase/server';
import { getSubject } from '@/subjects';

export const metadata = { title: 'Account' };

type Stat = { subject_slug: string; answers: number; correct: number };
type Mock = { subject_slug: string; score: number; max_score: number };

/** Profile, study activity across all subjects, and resetting the right/wrong tracking. */
export default async function AccountPage() {
  const { sb, user } = await requireUser();
  const [{ subjects, error }, stats, mocks, profile] = await Promise.all([
    getCatalog(sb),
    sb.from('type_stats').select('subject_slug, answers, correct'),
    sb.from('mock_results').select('subject_slug, score, max_score'),
    sb.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle(),
  ]);
  const st = (stats.data || []) as Stat[];
  const mk = (mocks.data || []) as Mock[];
  const list: AccountSubject[] = subjects.filter(s => getSubject(s.slug)).map(s => {
    const rows = st.filter(r => r.subject_slug === s.slug);
    const ms = mk.filter(m => m.subject_slug === s.slug);
    const best = ms.reduce<Mock | null>((b, m) => !b || +m.score / +m.max_score > +b.score / +b.max_score ? m : b, null);
    return {
      slug: s.slug, short: s.short_name, name: s.name,
      answers: rows.reduce((a, r) => a + r.answers, 0), correct: rows.reduce((a, r) => a + r.correct, 0),
      mocks: ms.length, best: best ? { score: +best.score, max: +best.max_score } : null,
    };
  });
  const email = user.email || '';
  return (
    <div className="shell">
      <HomeSidebar active="account" subjects={list.map(s => ({ slug: s.slug, short: s.short, name: s.name }))} />
      <div className="content">
        <TopBar email={email} crumbs={[{ href: '/', label: 'Dashboard' }, { label: 'Account' }]} />
        <main className="main">
          {error && <p className="err">The database is not set up yet ({error.message}). Run supabase/setup.sql in the Supabase SQL editor.</p>}
          <AccountView email={email} name={profile.data?.display_name ?? email.split('@')[0]} subjects={list} />
        </main>
      </div>
    </div>
  );
}
