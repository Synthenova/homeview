import Link from "next/link";
import { contactEmail } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Homeview</span>
        </Link>
        <p>© 2026 Homeview Inc.<br />All rights reserved.</p>
      </div>
      <nav aria-label="Product">
        <h2>Product</h2>
        <Link href="/#plans">Plans</Link>
        <Link href="/#examples">Demo</Link>
        <Link href="/contact">Get quote</Link>
      </nav>
      <nav aria-label="Resources">
        <h2>Resources</h2>
        <Link href="/blog">Blog</Link>
        <Link href="/#questions">Questions</Link>
        <Link href="/#use-cases">Use cases</Link>
      </nav>
      <nav aria-label="Company">
        <h2>Company</h2>
        <Link href="/contact">Contact</Link>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </nav>
      <div className="socials">
        <h2>Follow us</h2>
        <div>
          <a href="#" aria-label="Instagram">◎</a>
          <a href="#" aria-label="LinkedIn">in</a>
          <a href={`mailto:${contactEmail}`} aria-label="Email">✉</a>
        </div>
      </div>
    </footer>
  );
}
