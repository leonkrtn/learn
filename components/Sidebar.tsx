'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSubject } from './SubjectContext';

export default function Sidebar({ cardsDue }: { cardsDue: number }) {
  const { mod, due } = useSubject();
  const path = usePathname();
  const base = '/s/' + mod.slug;
  const now = Date.now();
  const dueNow = due.filter(d => Date.parse(d.due_at) <= now).length;
  const item = (href: string, label: string, count?: number, exact = false) => {
    const full = base + href;
    const on = exact ? path === full : path === full || path.startsWith(full + '/');
    return (
      <Link className={'item' + (on ? ' on' : '')} href={full}>
        <span>{label}</span>
        {count != null && <span className={'count' + (count > 0 ? ' due' : '')}>{count}</span>}
      </Link>
    );
  };
  return (
    <aside className="sidebar">
      <div className="subj"><div className="short">{mod.short}</div><div className="long">{mod.name}</div></div>
      <nav>
        <div className="group">Practice</div>
        {item('', 'Practice', undefined, true)}
        {item('/cycle', 'Cycle by lecture')}
        {item('/review', 'Review due', dueNow)}
        {mod.mock && item('/mock', 'Mock exam')}
        <div className="group">Learn</div>
        {item('/cards', 'Flashcards', cardsDue)}
        {item('/theory', 'Theory')}
        {item('/formulas', 'Formula sheet')}
        <div className="group">You</div>
        {item('/stats', 'Statistics')}
        {item('/settings', 'Settings')}
      </nav>
    </aside>
  );
}
