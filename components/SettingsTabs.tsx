'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [{ href: '/settings', label: 'Display' }, { href: '/settings/help', label: 'Help' }];

export default function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Settings">
      {TABS.map(t => <Link key={t.href} href={t.href} className={path === t.href ? 'on' : ''} aria-current={path === t.href ? 'page' : undefined}>{t.label}</Link>)}
    </nav>
  );
}
