import Link from 'next/link';

export function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="nav__brand">
        OpenNexus
      </Link>
      <div className="nav__links">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/docs">Docs</Link>
      </div>
    </nav>
  );
}
