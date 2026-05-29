import Link from "next/link";
import { CrmShell } from "@/components/CrmShell";
import { getChats } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const chats = await getChats();

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Chats</p>
          <h2>All conversations</h2>
        </div>
      </header>
      <section className="crm-panel">
        <div className="crm-table">
          {chats.map((chat) => (
            <Link href={`/chats/${chat.id}`} className="crm-row crm-chats-row" key={chat.id}>
              <span>{chat.title || chat.id}</span>
              <span className="crm-muted-cell">{chat.contact_email || "—"}</span>
              <span>{chat.message_count} messages</span>
              <span>{chat.status}</span>
              <span>${Number(chat.estimated_cost_usd ?? 0).toFixed(4)}</span>
            </Link>
          ))}
        </div>
      </section>
    </CrmShell>
  );
}
