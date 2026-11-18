'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icons';
import Logo from './Logo';
import { useSubject } from './SubjectContext';

function Brand() {
  return <Link href="/" className="brand" aria-label="learn, all subjects"><Logo /></Link>;
}

export default function Sidebar() {
  const { mod } = useSubject();
  const path = usePathname();
  const base = '/s/' + mod.slug;
  const item = (href: string, label: string, icon: string, exact = false) => {
    const full = base + href;
    const on = exact ? path === full : path === full || path.startsWith(full + '/');
    return (
      <Link className={'item' + (on ? ' on' : '')} href={full}>
        <Icon name={icon} /><span>{label}</span>
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
        {mod.problemSets && item('/ps', 'Problem sets', 'ps')}
        {mod.mock && item('/mock', 'Mock exam', 'mock')}
        <div className="group">Learn</div>
        {item('/cards', 'Flashcards', 'cards')}
        {item('/theory', 'Theory', 'theory')}
        {item('/formulas', 'Formula sheet', 'formula')}
        {item('/slides', 'Slides', 'slides')}
        <div className="group">You</div>
        {item('/cheatsheet', 'My cheatsheet', 'sheet')}
        {item('/settings', 'Settings', 'settings')}
        <Link className="item" href="/account"><Icon name="user" /><span>Account</span></Link>
      </nav>
    </aside>
  );
}

/** Sidebar on the dashboard and the account page: the subjects that are ready to practise. */
export function HomeSidebar({ subjects, active = 'home' }: { subjects: { slug: string; short: string; name: string }[]; active?: 'home' | 'account' }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav>
        <Link className={'item' + (active === 'home' ? ' on' : '')} href="/"><Icon name="home" /><span>Dashboard</span></Link>
        <Link className={'item' + (active === 'account' ? ' on' : '')} href="/account"><Icon name="user" /><span>Account</span></Link>
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
