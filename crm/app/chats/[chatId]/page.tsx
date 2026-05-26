import { notFound } from "next/navigation";
import { CrmShell } from "@/components/CrmShell";
import { getChat } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const { chat, messages, runs } = await getChat(chatId);

  if (!chat) notFound();

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Conversation</p>
          <h2>{chat.title || chat.id}</h2>
        </div>
        <span className="crm-pill">{chat.status}</span>
      </header>
      <div className="crm-grid">
        <section className="crm-panel">
          <div className="panel-head">
            <h3>Transcript</h3>
          </div>
          <div className="crm-transcript">
            {messages.map((message) => (
              <article className={`crm-message ${message.role}`} key={message.id}>
                <span>{message.role}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="crm-panel">
          <div className="panel-head">
            <h3>Runs</h3>
          </div>
          <div className="crm-table">
            {runs.map((run) => (
              <div className="crm-row" key={run.id}>
                <span>{run.status}</span>
                <span>{run.model || "model"}</span>
                <span>{run.error || "ok"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CrmShell>
  );
}
