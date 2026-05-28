import { CircleDollarSign, ContactRound, MessageSquareText } from "lucide-react";
import { CrmShell } from "@/components/CrmShell";
import { getContacts, getDashboardStats } from "@/lib/crm-data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, contacts] = await Promise.all([getDashboardStats(), getContacts()]);
  const cards = [
    { label: "Contacts", value: stats.contacts, icon: ContactRound },
    { label: "Messages", value: stats.messages, icon: MessageSquareText },
    { label: "New contacts", value: stats.newContacts, icon: ContactRound },
    { label: "AI spend", value: `$${stats.aiSpend.toFixed(4)}`, icon: CircleDollarSign }
  ];

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Lead overview</h2>
        </div>
      </header>
      <div className="crm-stats">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="crm-stat" key={label}>
            <Icon aria-hidden="true" size={20} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="crm-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Recent contacts</p>
            <h3>Lead activity</h3>
          </div>
          <Link href="/contacts">View all</Link>
        </div>
        <div className="crm-table">
          {contacts.slice(0, 8).map((contact: Awaited<typeof contacts>[number]) => (
            <Link
              href={`/contacts?contact=${encodeURIComponent(contact.emailNormalized)}`}
              className="crm-row dashboard-contact-row"
              key={contact.emailNormalized}
            >
              <span>
                <strong>{contact.displayName || contact.email}</strong>
                <small>{contact.email}</small>
              </span>
              <span>{contact.statusLabel}</span>
              <span>{contact.tags.length ? contact.tags.map((tag) => tag.name).join(", ") : "No tags"}</span>
            </Link>
          ))}
        </div>
      </section>
    </CrmShell>
  );
}
