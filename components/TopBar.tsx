import Link from 'next/link';

export default function TopBar({ email, crumbs }: { email: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <header className="topbar">
      <Link href="/" className="wordmark">learn</Link>
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs?.map((c, i) => (
          <span key={i}>{i > 0 && <span aria-hidden>/ </span>}{c.href ? <Link href={c.href}>{c.label}</Link> : <b>{c.label}</b>}</span>
        ))}
      </nav>
      <div className="spacer" />
      <span className="who">{email}</span>
      <form action="/auth/signout" method="post"><button className="textbtn" type="submit">Sign out</button></form>
    </header>
  );
}
