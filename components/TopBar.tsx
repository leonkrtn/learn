import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon from './Icons';

/** Top bar: current location on the left, page actions and sign-out on the right; profile and settings sit at the foot of the sidebar. */
export default function TopBar({ crumbs, actions }: { crumbs?: { href?: string; label: string }[]; actions?: ReactNode }) {
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
        <form action="/auth/signout" method="post"><button className="iconbtn" type="submit" title="Sign out"><Icon name="signout" size={18} /><span>Sign out</span></button></form>
      </div>
    </header>
  );
}
