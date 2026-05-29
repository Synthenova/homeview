import { notFound } from "next/navigation";
import { CrmShell } from "@/components/CrmShell";
import { getChat } from "@/lib/crm-data";
import { truncateWords } from "@/lib/format";

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
          <h2 className="crm-chat-detail-title" title={chat.title || chat.id}>
            {truncateWords(chat.title || chat.id)}
          </h2>
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
        <section className="crm-panel crm-runs-panel">
          <div className="panel-head">
            <h3>Runs</h3>
          </div>
          <div className="crm-runs-list">
            {runs.map((run) => (
              <div className="crm-runs-row" key={run.id}>
                <span className="crm-run-status">{run.status}</span>
                <span className="crm-run-model">{run.model || "—"}</span>
                <span className="crm-run-result">{run.error || "ok"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CrmShell>
  );
}
