import postgres from "postgres";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3105";
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL or SUPABASE_DATABASE_URL.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const sessionId = `sess_smoke_${crypto.randomUUID()}`;

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  }
  return response;
}

async function waitFor(predicate, label) {
  const started = Date.now();
  while (Date.now() - started < 20000) {
    const value = await predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

try {
  await request("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, landingPage: "/smoke" })
  });

  const chatResponse = await request(`/api/sessions/${sessionId}/chats`, { method: "POST" });
  const { chatId } = await chatResponse.json();

  const userMessage = {
    id: `msg_smoke_${crypto.randomUUID()}`,
    role: "user",
    parts: [{ type: "text", text: "What does Homeview do? Reply in one short sentence." }]
  };

  const streamResponse = await request("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: chatId,
      sessionId,
      message: userMessage,
      landingPage: "/smoke"
    })
  });

  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder();
  let streamed = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    streamed += decoder.decode(value);
  }

  if (!streamed.includes("text")) {
    throw new Error("Chat stream did not include UI message text chunks.");
  }

  const persistedMessages = await waitFor(async () => {
    const rows = await sql`
      select count(*)::int as count
      from chat_messages
      where chat_id = ${chatId}
    `;
    return rows[0].count >= 2 ? rows[0].count : false;
  }, "persisted chat messages");

  const completedRun = await waitFor(async () => {
    const runs = await sql`
      select status
      from chat_runs
      where chat_id = ${chatId}
      order by started_at desc
      limit 1
    `;
    return runs[0]?.status === "completed" ? runs[0] : false;
  }, "completed chat run");

  const resumeChatResponse = await request(`/api/sessions/${sessionId}/chats`, { method: "POST" });
  const { chatId: resumeChatId } = await resumeChatResponse.json();
  const resumeMessage = {
    id: `msg_resume_${crypto.randomUUID()}`,
    role: "user",
    parts: [
      {
        type: "text",
        text:
          "Write a detailed 700 word overview of 3D property scanning for a homeowner. Use short paragraphs."
      }
    ]
  };

  const partialResponse = await request("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: resumeChatId,
      sessionId,
      message: resumeMessage,
      landingPage: "/smoke"
    })
  });
  const partialReader = partialResponse.body.getReader();
  const firstChunk = await partialReader.read();
  if (firstChunk.done) {
    throw new Error("Expected first streamed chunk before resume.");
  }

  const resumedResponse = await request(`/api/chat/${resumeChatId}/stream`);
  const resumedReader = resumedResponse.body.getReader();
  const resumedChunk = await resumedReader.read();
  const resumedBytes = resumedChunk.done ? 0 : resumedChunk.value.byteLength;

  if (resumedBytes === 0) {
    throw new Error("Resume endpoint returned no stream bytes.");
  }
  await resumedReader.cancel("resume smoke received bytes");
  await partialReader.cancel("close original browser stream after resume check");

  await request("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      name: "Smoke Test",
      email: "smoke@example.com",
      projectType: "Real estate",
      message: "Testing CRM contact persistence"
    })
  });

  const crmRows = await sql`
    select contact_email, chat_count, message_count, lead_status
    from crm_session_summaries
    where id = ${sessionId}
  `;

  if (crmRows.length !== 1 || crmRows[0].contact_email !== "smoke@example.com") {
    throw new Error("CRM session summary did not link contact email.");
  }

  console.log({
    sessionId,
    chatId,
    streamed: true,
    persistedMessages,
    runStatus: completedRun.status,
    resumedBytes,
    contactLinked: true,
    crmLeadStatus: crmRows[0].lead_status
  });
} finally {
  await sql`
    delete from visitor_sessions
    where id = ${sessionId}
  `;
  await sql.end({ timeout: 5 });
}
