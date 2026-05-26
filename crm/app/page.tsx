import { Bot, CircleDollarSign, ContactRound, MessageSquareText } from "lucide-react";
import { CrmShell } from "@/components/CrmShell";
import { getDashboardStats, getSessions } from "@/lib/crm-data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, sessions] = await Promise.all([getDashboardStats(), getSessions()]);
  const cards = [
    { label: "Sessions", value: stats.sessions, icon: Bot },
    { label: "Chats", value: stats.chats, icon: MessageSquareText },
    { label: "New contacts", value: stats.newContacts, icon: ContactRound },
    { label: "AI spend", value: `$${stats.aiSpend.toFixed(4)}`, icon: CircleDollarSign }
  ];

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Lead and chat overview</h2>
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
            <p className="eyebrow">Recent sessions</p>
            <h3>Visitor activity</h3>
          </div>
          <Link href="/sessions">View all</Link>
        </div>
        <div className="crm-table">
          {sessions.slice(0, 8).map((session) => (
            <Link href={`/sessions/${session.id}`} className="crm-row" key={session.id}>
              <span>{session.contact_email || session.id}</span>
              <span>{session.chat_count} chats</span>
              <span>{session.lead_status}</span>
            </Link>
          ))}
        </div>
      </section>
    </CrmShell>
  );
}
