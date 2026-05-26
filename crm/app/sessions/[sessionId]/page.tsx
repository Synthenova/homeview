import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactQueryTable, type ContactQuery } from "@/components/ContactQueryTable";
import { CrmShell } from "@/components/CrmShell";
import { getSession } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { session, chats, contacts } = await getSession(sessionId);

  if (!session) notFound();

  const serializedContacts = contacts.map((contact) => ({
    ...contact,
    created_at: contact.created_at.toISOString()
  })) as ContactQuery[];

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Session</p>
          <h2>{session.contact_email || session.id}</h2>
        </div>
        <span className="crm-pill">{session.lead_status}</span>
      </header>
      <div className="crm-grid">
        <section className="crm-panel">
          <div className="panel-head">
            <h3>Chats</h3>
          </div>
          <div className="crm-table">
            {chats.map((chat) => (
              <Link href={`/chats/${chat.id}`} className="crm-row" key={chat.id}>
                <span>{chat.title || "New chat"}</span>
                <span>{chat.message_count} messages</span>
                <span>{chat.status}</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="crm-panel">
          <div className="panel-head">
            <h3>Contact queries</h3>
          </div>
          <ContactQueryTable contacts={serializedContacts} />
        </section>
      </div>
    </CrmShell>
  );
}
