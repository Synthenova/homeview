import Link from "next/link";

export function Header() {
  return (
    <header className="site-header" aria-label="Primary navigation">
      <Link className="brand" href="/" aria-label="Homeview home">
        <span className="brand-mark" aria-hidden="true" />
        <span>Homeview</span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/#plans">Plans</Link>
        <Link href="/#examples">Demo</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <Link className="button button-dark header-cta" href="/contact">
        <span>Get quote</span>
        <span aria-hidden="true">↗</span>
      </Link>
    </header>
  );
}
