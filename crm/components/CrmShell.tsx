import Link from "next/link";
import { canCreateUsers, getCurrentUser } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/agent", label: "Agent" },
  { href: "/chats", label: "Chats" },
  { href: "/contacts", label: "Contacts" },
  { href: "/users", label: "Users", managerOnly: true }
];

export async function CrmShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <main className="crm-shell">
      <aside className="crm-sidebar">
        <div>
          <p className="eyebrow">Homeview</p>
          <h1>CRM</h1>
        </div>
        <nav aria-label="CRM navigation">
          {links.map((link) => (
            !link.managerOnly || (user && canCreateUsers(user.role)) ? (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ) : null
          ))}
        </nav>
        {user ? (
          <div className="crm-account">
            <div>
              <span>{user.email}</span>
              <strong>{user.role.replace("_", " ")}</strong>
            </div>
            <form action="/api/logout" method="post">
              <button type="submit">Log out</button>
            </form>
          </div>
        ) : null}
      </aside>
      <section className="crm-content">{children}</section>
    </main>
  );
}
