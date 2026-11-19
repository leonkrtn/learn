import type { ReactNode } from 'react';
import SettingsTabs from '@/components/SettingsTabs';
import { HomeSidebar } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { getCatalog } from '@/lib/queries';
import { requireUser } from '@/lib/supabase/server';
import { getSubject } from '@/subjects';

/** Settings, the same for all subjects: display preferences and help. */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const { sb, user } = await requireUser();
  const { subjects } = await getCatalog(sb);
  return (
    <div className="shell">
      <HomeSidebar email={user.email || ''} active="settings" subjects={subjects.filter(s => getSubject(s.slug)).map(s => ({ slug: s.slug, short: s.short_name, name: s.name }))} />
      <div className="content">
        <TopBar crumbs={[{ href: '/', label: 'Dashboard' }, { label: 'Settings' }]} />
        <main className="main">
          <div className="page settings">
            <div className="pagehead"><h1>Settings</h1></div>
            <SettingsTabs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
