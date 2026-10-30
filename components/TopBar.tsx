import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon from './Icons';

/** Top bar: current location on the left, page actions and account on the right. */
export default function TopBar({ email, crumbs, actions }: { email: string; crumbs?: { href?: string; label: string }[]; actions?: ReactNode }) {
  const initials = (email.split('@')[0].match(/[a-z0-9]/gi) || ['?']).slice(0, 2).join('').toUpperCase();
  return (
    <header className="topbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs ? crumbs.map((c, i) => (
          <span key={i}>{i > 0 && <span className="sep" aria-hidden>/</span>}{c.href ? <Link href={c.href}>{c.label}</Link> : i === crumbs.length - 1 ? <b>{c.label}</b> : c.label}</span>
        )) : <b>Dashboard</b>}
      </nav>
      <div className="spacer" />
      <div className="right">
        {actions}
        <span className="avatar" aria-hidden>{initials}</span>
        <span className="who">{email}</span>
        <form action="/auth/signout" method="post"><button className="iconbtn" type="submit" title="Sign out"><Icon name="signout" size={18} /><span>Sign out</span></button></form>
      </div>
    </header>
  );
}
