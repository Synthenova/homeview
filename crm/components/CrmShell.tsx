import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/sessions", label: "Sessions" },
  { href: "/chats", label: "Chats" },
  { href: "/contacts", label: "Contacts" }
];

export function CrmShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="crm-shell">
      <aside className="crm-sidebar">
        <div>
          <p className="eyebrow">Homeview</p>
          <h1>CRM</h1>
        </div>
        <nav aria-label="CRM navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="crm-content">{children}</section>
    </main>
  );
}
