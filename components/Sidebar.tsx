'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from './Icons';
import Logo from './Logo';
import { useSubject } from './SubjectContext';

function Brand() {
  return <Link href="/" className="brand" aria-label="learn, all subjects"><Logo /></Link>;
}

export default function Sidebar() {
  const { mod, due } = useSubject();
  const path = usePathname();
  const base = '/s/' + mod.slug;
  // Counted after mount so server and client markup agree.
  const [dueNow, setDueNow] = useState(0);
  useEffect(() => { const now = Date.now(); setDueNow(due.filter(d => Date.parse(d.due_at) <= now).length); }, [due]);
  const item = (href: string, label: string, icon: string, exact = false, count = 0) => {
    const full = base + href;
    const on = exact ? path === full : path === full || path.startsWith(full + '/');
    return (
      <Link className={'item' + (on ? ' on' : '')} href={full}>
        <Icon name={icon} /><span>{label}</span>{count > 0 && <span className="count">{count}</span>}
      </Link>
    );
  };
  return (
    <aside className="sidebar">
      <Brand />
      <Link href="/" className="back"><Icon name="back" size={18} /><span>All subjects</span></Link>
      <div className="subj">
        <span className="badge">{mod.short}</span>
        <span className="long">{mod.name}</span>
      </div>
      <nav>
        <div className="group">Practice</div>
        {item('', 'Practice', 'practice', true)}
        {item('/cycle', 'Cycle by lecture', 'cycle')}
        {item('/review', 'Review', 'review', false, dueNow)}
        {mod.mock && item('/mock', 'Mock exam', 'mock')}
        <div className="group">Learn</div>
        {item('/cards', 'Flashcards', 'cards')}
        {item('/theory', 'Theory', 'theory')}
        {item('/formulas', 'Formula sheet', 'formula')}
        <div className="group">You</div>
        {item('/stats', 'Statistics', 'stats')}
        {item('/settings', 'Settings', 'settings')}
      </nav>
    </aside>
  );
}

/** Sidebar on the dashboard: the subjects that are ready to practise. */
export function HomeSidebar({ subjects }: { subjects: { slug: string; short: string; name: string }[] }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav>
        <Link className="item on" href="/"><Icon name="home" /><span>Dashboard</span></Link>
        <div className="group">Subjects</div>
        {subjects.map(s => (
          <Link className="item" href={`/s/${s.slug}`} key={s.slug} title={s.name}>
            <span className="dot">{s.short}</span><span>{s.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
