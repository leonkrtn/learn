import Link from 'next/link';

/** Top bar: way back to the subject list on the left, current location, account on the right. */
export default function TopBar({ email, crumbs }: { email: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <header className="topbar">
      {crumbs ? <Link href="/" className="home">← All subjects</Link> : <span className="home here">All subjects</span>}
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs?.map((c, i) => (
          <span key={i}>{i > 0 && <span aria-hidden>/ </span>}{c.href ? <Link href={c.href}>{c.label}</Link> : i === crumbs.length - 1 ? <b>{c.label}</b> : c.label}</span>
        ))}
      </nav>
      <div className="spacer" />
      <div className="right">
        <span className="who">{email}</span>
        <form action="/auth/signout" method="post"><button className="textbtn" type="submit">Sign out</button></form>
      </div>
    </header>
  );
}
