import Link from "next/link";
import { CrmShell } from "@/components/CrmShell";
import { getSessions } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Sessions</p>
          <h2>Browser visitors</h2>
        </div>
      </header>
      <section className="crm-panel">
        <div className="crm-table">
          {sessions.map((session) => (
            <Link href={`/sessions/${session.id}`} className="crm-row" key={session.id}>
              <span>{session.contact_email || session.id}</span>
              <span>{session.chat_count} chats</span>
              <span>{session.message_count} messages</span>
              <span>{session.lead_status}</span>
            </Link>
          ))}
        </div>
      </section>
    </CrmShell>
  );
}
