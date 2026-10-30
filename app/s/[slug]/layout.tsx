import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import CheatDrawer from '@/components/CheatDrawer';
import { SubjectProvider } from '@/components/SubjectContext';
import Sidebar from '@/components/Sidebar';
import SyncNotice from '@/components/SyncNotice';
import TopBar from '@/components/TopBar';
import { loadSubject } from '@/lib/queries';
import { requireUser } from '@/lib/supabase/server';
import { getSubject } from '@/subjects';

export default async function SubjectLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getSubject(slug);
  if (!mod) notFound();
  const { sb, user } = await requireUser();
  const data = await loadSubject(sb, slug);
  return (
    <>
      <SubjectProvider slug={slug} bank={data.bank} initialSettings={data.settings} initialStats={data.stats} initialDue={data.due}>
        <div className="shell">
          <Sidebar />
          <div className="content">
            <TopBar email={user.email || ''} crumbs={[{ href: '/', label: data.trimesterName || 'Subjects' }, { label: mod.name }]} />
            <main className="main">
              {data.error && <p className="err" style={{ marginTop: 24 }}>The database is not set up yet ({data.error.message}). Run supabase/setup.sql in the Supabase SQL editor.</p>}
              <SyncNotice />
              {children}
            </main>
            <CheatDrawer />
          </div>
        </div>
      </SubjectProvider>
    </>
  );
}
