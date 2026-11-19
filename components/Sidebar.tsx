'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icons';
import Logo from './Logo';
import { useSubject } from './SubjectContext';

/** Bottom of every sidebar: your profile (account page) and, to its right, a gear for the settings. */
function SideFoot({ email, active }: { email: string; active?: 'account' | 'settings' | null }) {
  return (
    <div className="sidefoot">
      <Link className={'profile' + (active === 'account' ? ' on' : '')} href="/account" title="Account">
        <span className="avatar small" aria-hidden>{initials(email)}</span><span className="who">{email}</span>
      </Link>
      <Link className={'gear' + (active === 'settings' ? ' on' : '')} href="/settings" title="Settings" aria-label="Settings"><Icon name="settings" size={19} /></Link>
    </div>
  );
}

export function initials(email: string) {
  return (email.split('@')[0].match(/[a-z0-9]/gi) || ['?']).slice(0, 2).join('').toUpperCase();
}

function Brand() {
  return <Link href="/" className="brand" aria-label="learn, all subjects"><Logo /></Link>;
}

export default function Sidebar({ email }: { email: string }) {
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
        {item('/cycle', 'Cycle by lecture', 'cycle')}
        {mod.problemSets && item('/ps', 'Problem sets', 'ps')}
        {mod.mock && item('/mock', 'Mock exam', 'mock')}
        <div className="group">Learn</div>
        {item('/cards', 'Flashcards', 'cards')}
        {item('/theory', 'Theory', 'theory')}
        {item('/formulas', 'Formula sheet', 'formula')}
        {item('/slides', 'Slides', 'slides')}
        <div className="group">You</div>
        {item('/cheatsheet', 'My cheatsheet', 'sheet')}
      </nav>
      <SideFoot email={email} />
    </aside>
  );
}

/** Sidebar on the dashboard, account and settings pages: the subjects that are ready to practise. */
export function HomeSidebar({ email, subjects, active = 'home' }: { email: string; subjects: { slug: string; short: string; name: string }[]; active?: 'home' | 'account' | 'settings' }) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav>
        <Link className={'item' + (active === 'home' ? ' on' : '')} href="/"><Icon name="home" /><span>Dashboard</span></Link>
        <div className="group">Subjects</div>
        {subjects.map(s => (
          <Link className="item" href={`/s/${s.slug}`} key={s.slug} title={s.name}>
            <span className="dot">{s.short}</span><span>{s.name}</span>
          </Link>
        ))}
      </nav>
      <SideFoot email={email} active={active === 'home' ? null : active} />
    </aside>
  );
}
