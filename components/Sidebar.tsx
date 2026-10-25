'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSubject } from './SubjectContext';

export default function Sidebar() {
  const { mod } = useSubject();
  const path = usePathname();
  const base = '/s/' + mod.slug;
  const item = (href: string, label: string, exact = false) => {
    const full = base + href;
    const on = exact ? path === full : path === full || path.startsWith(full + '/');
    return (
      <Link className={'item' + (on ? ' on' : '')} href={full}>
        <span>{label}</span>
      </Link>
    );
  };
  return (
    <aside className="sidebar">
      <div className="subj"><div className="short">{mod.short}</div><div className="long">{mod.name}</div></div>
      <nav>
        <div className="group">Practice</div>
        {item('', 'Practice', true)}
        {item('/cycle', 'Cycle by lecture')}
        {item('/review', 'Review')}
        {mod.mock && item('/mock', 'Mock exam')}
        <div className="group">Learn</div>
        {item('/cards', 'Flashcards')}
        {item('/theory', 'Theory')}
        {item('/formulas', 'Formula sheet')}
        <div className="group">You</div>
        {item('/stats', 'Statistics')}
        {item('/settings', 'Settings')}
      </nav>
    </aside>
  );
}
