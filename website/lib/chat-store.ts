import { generateId, type UIMessage } from "ai";
import { sql } from "./db";

export type ChatSummary = {
  id: string;
  sessionId: string;
  title: string;
  status: string;
  activeStreamId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview: string | null;
};

export type ChatRecord = {
  id: string;
  sessionId: string;
  title: string | null;
  status: string;
  activeStreamId: string | null;
  messages: UIMessage[];
};

export function createSessionId() {
  return `sess_${generateId()}`;
}

export function createChatId() {
  return `chat_${generateId()}`;
}

export function createRunId() {
  return `run_${generateId()}`;
}

export function createStreamId() {
  return `stream_${generateId()}`;
}

export function getMessageText(message: UIMessage | undefined) {
  if (!message) return "";
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function ensureSession({
  sessionId,
  userAgent,
  referrer,
  landingPage
}: {
  sessionId: string;
  userAgent?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
}) {
  await sql`
    insert into visitor_sessions (id, user_agent, referrer, landing_page)
    values (${sessionId}, ${userAgent ?? null}, ${referrer ?? null}, ${landingPage ?? null})
    on conflict (id) do update set
      last_seen_at = now(),
      user_agent = coalesce(visitor_sessions.user_agent, excluded.user_agent),
      referrer = coalesce(visitor_sessions.referrer, excluded.referrer),
      landing_page = coalesce(visitor_sessions.landing_page, excluded.landing_page)
  `;
}

export async function touchSession(sessionId: string) {
  await sql`
    update visitor_sessions
    set last_seen_at = now()
    where id = ${sessionId}
  `;
}

export async function ensureChat({
  chatId,
  sessionId,
  title
}: {
  chatId: string;
  sessionId: string;
  title?: string | null;
}) {
  await sql`
    insert into chat_threads (id, session_id, title)
    values (${chatId}, ${sessionId}, ${title ?? "New chat"})
    on conflict (id) do update set
      updated_at = now()
  `;
}

export async function createChat(sessionId: string) {
  const id = createChatId();
  await ensureChat({ chatId: id, sessionId, title: "New chat" });
  return id;
}

export async function listChats(sessionId: string): Promise<ChatSummary[]> {
  const rows = await sql`
    select
      id,
      session_id,
      coalesce(title, 'New chat') as title,
      status,
      active_stream_id,
      last_error,
      created_at,
      updated_at,
      message_count,
      last_message_preview
    from crm_chat_summaries
    where session_id = ${sessionId}
    order by updated_at desc
  `;

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    status: row.status,
    activeStreamId: row.active_stream_id,
    lastError: row.last_error,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    messageCount: row.message_count,
    lastMessagePreview: row.last_message_preview
  }));
}

export async function readChat(chatId: string): Promise<ChatRecord | null> {
  const rows = await sql`
    select id, session_id, title, status, active_stream_id
    from chat_threads
    where id = ${chatId}
    limit 1
  `;

  if (rows.length === 0) return null;

  const messages = await sql`
    select id, role, parts, metadata
    from chat_messages
    where chat_id = ${chatId}
    order by created_at asc
  `;

  return {
    id: rows[0].id,
    sessionId: rows[0].session_id,
    title: rows[0].title,
    status: rows[0].status,
    activeStreamId: rows[0].active_stream_id,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata
    }))
  };
}

export async function saveMessages({
  chatId,
  sessionId,
  messages
}: {
  chatId: string;
  sessionId: string;
  messages: UIMessage[];
}) {
  if (messages.length === 0) return;

  await sql.begin(async (tx) => {
    for (const message of messages) {
      await tx`
        insert into chat_messages (id, chat_id, session_id, role, parts, content, metadata)
        values (
          ${message.id},
          ${chatId},
          ${sessionId},
          ${message.role},
          ${tx.json((message.parts ?? []) as never)},
          ${getMessageText(message)},
          ${tx.json((message.metadata ?? {}) as never)}
        )
        on conflict (id) do update set
          parts = excluded.parts,
          content = excluded.content,
          metadata = excluded.metadata
      `;
    }

    const title = getMessageText(messages.find((message) => message.role === "user")).slice(0, 80);

    await tx`
      update chat_threads
      set
        title = case
          when title is null or title = 'New chat' then ${title || "New chat"}
          else title
        end,
        updated_at = now()
      where id = ${chatId}
    `;
  });
}

export async function setActiveStream({
  chatId,
  streamId
}: {
  chatId: string;
  streamId: string | null;
}) {
  await sql`
    update chat_threads
    set active_stream_id = ${streamId}, updated_at = now()
    where id = ${chatId}
  `;
}

export async function createRun({
  runId,
  chatId,
  sessionId,
  streamId,
  model
}: {
  runId: string;
  chatId: string;
  sessionId: string;
  streamId: string;
  model: string;
}) {
  await sql`
    insert into chat_runs (id, chat_id, session_id, status, stream_id, model)
    values (${runId}, ${chatId}, ${sessionId}, 'running', ${streamId}, ${model})
  `;
}

export async function completeRun({
  runId,
  chatId,
  status,
  error
}: {
  runId: string;
  chatId: string;
  status: "completed" | "failed" | "interrupted";
  error?: string | null;
}) {
  await sql.begin(async (tx) => {
    await tx`
      update chat_runs
      set status = ${status}, completed_at = now(), error = ${error ?? null}
      where id = ${runId}
    `;
    await tx`
      update chat_threads
      set
        status = ${status === "completed" ? "completed" : status},
        active_stream_id = null,
        last_error = ${error ?? null},
        updated_at = now()
      where id = ${chatId}
    `;
  });
}

export async function saveUsage({
  runId,
  chatId,
  sessionId,
  model,
  usage
}: {
  runId: string;
  chatId: string;
  sessionId: string;
  model: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    [key: string]: unknown;
  };
}) {
  await sql`
    insert into ai_usage (
      run_id,
      chat_id,
      session_id,
      model,
      input_tokens,
      output_tokens,
      total_tokens,
      raw_usage
    )
    values (
      ${runId},
      ${chatId},
      ${sessionId},
      ${model},
      ${usage.inputTokens ?? null},
      ${usage.outputTokens ?? null},
      ${usage.totalTokens ?? null},
      ${sql.json(usage as never)}
    )
  `;
}

export async function saveContactQuery({
  sessionId,
  name,
  email,
  projectType,
  message
}: {
  sessionId?: string | null;
  name?: string | null;
  email: string;
  projectType?: string | null;
  message: string;
}) {
  await sql.begin(async (tx) => {
    await tx`
      insert into contact_queries (session_id, name, email, project_type, message)
      values (${sessionId ?? null}, ${name ?? null}, ${email}, ${projectType ?? null}, ${message})
    `;

    if (sessionId) {
      await tx`
        insert into session_identities (session_id, email, name, source)
        values (${sessionId}, ${email}, ${name ?? null}, 'contact_form')
      `;
    }
  });
}
