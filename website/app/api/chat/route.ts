import {
  createAgentUIStreamResponse,
  createIdGenerator,
  tool,
  type UIMessage
} from "ai";
import { after } from "next/server";
import { z } from "zod";
import { getAgentWorkspace, listAgentSources } from "../../../../shared/agent-config";
import {
  addCrmContactTag,
  createCrmStatus,
  createCrmTag,
  getCrmContactDetail,
  listCrmStatuses,
  listCrmTags,
  removeCrmContactTag,
  resolveContactEmailBySession,
  setCrmContactStatus
} from "../../../../shared/crm-contacts";
import {
  completeRun,
  createRun,
  createRunId,
  createStreamId,
  ensureChat,
  ensureSession,
  readChat,
  saveMessages,
  saveUsage,
  setActiveStream,
  touchSession
} from "@/lib/chat-store";
import { sql } from "@/lib/db";
import { createHomeviewAgent } from "@/lib/agent";
import { getResumableStreamContext } from "@/lib/resumable";

export const maxDuration = 300;

type ChatRequest = {
  id?: string;
  sessionId?: string;
  message?: UIMessage;
  messages?: UIMessage[];
  landingPage?: string;
};

async function createResponse(body: ChatRequest, request: Request, attempt = 1): Promise<Response> {
  const chatId = body.id;
  const sessionId = body.sessionId;
  const message = body.message ?? body.messages?.[body.messages.length - 1];

  if (!chatId || !sessionId || !message) {
    return Response.json({ error: "chat id, sessionId, and message are required." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");
  const [workspace, sources] = await Promise.all([getAgentWorkspace(sql), listAgentSources(sql)]);

  if (!workspace) {
    return Response.json({ error: "Agent workspace is not configured." }, { status: 500 });
  }

  await ensureSession({
    sessionId,
    userAgent,
    referrer,
    landingPage: body.landingPage
  });
  await ensureChat({ chatId, sessionId });
  await touchSession(sessionId);

  const [contactEmail, availableStatuses, availableTags] = await Promise.all([
    resolveContactEmailBySession(sql, sessionId),
    listCrmStatuses(sql),
    listCrmTags(sql)
  ]);
  const currentContact = contactEmail ? await getCrmContactDetail(sql, contactEmail) : null;
  const agent = createHomeviewAgent(workspace, sources, {
    additionalInstructions: contactEmail
      ? [
          `The current CRM contact email is ${currentContact?.email ?? contactEmail}.`,
          `Current CRM status: ${currentContact?.statusLabel ?? "New"}.`,
          currentContact?.tags.length
            ? `Current CRM tags: ${currentContact.tags.map((tag) => tag.name).join(", ")}.`
            : "Current CRM tags: none.",
          `Available CRM statuses: ${availableStatuses.map((status) => `${status.name} (${status.label})`).join(", ")}.`,
          availableTags.length
            ? `Existing CRM tags include: ${availableTags.map((tag) => tag.name).join(", ")}.`
            : "No CRM tags exist yet.",
          "When the user explicitly asks to update their CRM status or tags, always use the CRM tools to perform the change.",
          "When the user clearly shows qualification, urgency, pricing intent, or demo interest, attach appropriate CRM tags."
        ].join("\n")
      : null,
    tools: contactEmail
      ? {
          getCrmContact: tool({
            description: "Read the CRM contact profile for the current website chat user.",
            inputSchema: z.object({}),
            execute: async () => {
              const detail = await getCrmContactDetail(sql, contactEmail);
              return {
                email: detail?.email ?? contactEmail,
                status: detail?.status ?? "new",
                statusLabel: detail?.statusLabel ?? "New",
                tags: detail?.tags.map((tag) => tag.name) ?? []
              };
            }
          }),
          setCrmStatus: tool({
            description: "Set the CRM pipeline status for the current website chat user.",
            inputSchema: z.object({
              status: z.string().min(1)
            }),
            execute: async ({ status }) => {
              const result = await setCrmContactStatus(sql, contactEmail, status);
              return { ok: true, status: result.name, label: result.label };
            }
          }),
          createCrmStatus: tool({
            description: "Create a new CRM status definition when an existing one is insufficient.",
            inputSchema: z.object({
              name: z.string().min(1),
              label: z.string().min(1).optional()
            }),
            execute: async ({ name, label }) => {
              const status = await createCrmStatus(sql, { name, label });
              return { ok: true, status };
            }
          }),
          addCrmTag: tool({
            description: "Add a CRM tag to the current website chat user. Creates the tag if needed.",
            inputSchema: z.object({
              tag: z.string().min(1),
              color: z.string().optional()
            }),
            execute: async ({ tag, color }) => {
              const created = await addCrmContactTag(sql, contactEmail, { name: tag, color: color ?? null });
              return { ok: true, tag: created.name };
            }
          }),
          removeCrmTag: tool({
            description: "Remove a CRM tag from the current website chat user.",
            inputSchema: z.object({
              tag: z.string().min(1)
            }),
            execute: async ({ tag }) => {
              await removeCrmContactTag(sql, contactEmail, tag);
              return { ok: true, removed: tag };
            }
          }),
          createCrmTag: tool({
            description: "Create a reusable CRM tag definition.",
            inputSchema: z.object({
              name: z.string().min(1),
              color: z.string().optional()
            }),
            execute: async ({ name, color }) => {
              const tag = await createCrmTag(sql, { name, color: color ?? null });
              return { ok: true, tag };
            }
          })
        }
      : undefined
  });
  const model = workspace.model;

  const existing = await readChat(chatId);
  const previousMessages = existing?.messages ?? [];
  const messages = [
    ...previousMessages.filter((item) => item.id !== message.id),
    message
  ] as UIMessage[];
  const streamId = createStreamId();
  const runId = createRunId();

  await Promise.all([
    setActiveStream({ chatId, streamId }),
    createRun({ runId, chatId, sessionId, streamId, model })
  ]);
  after(saveMessages({ chatId, sessionId, messages }));

  try {
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: messages as any,
      originalMessages: messages as any,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onStepFinish: ({ usage }) => {
        if (usage) {
          after(saveUsage({ runId, chatId, sessionId, model, usage }));
        }
      },
      onFinish: ({ messages: finishedMessages }) => {
        after(
          Promise.all([
            saveMessages({ chatId, sessionId, messages: finishedMessages }),
            completeRun({ runId, chatId, status: "completed" })
          ])
        );
      },
      consumeSseStream: async ({ stream }) => {
        await getResumableStreamContext().createNewResumableStream(streamId, () => stream);
      }
    });
  } catch (error) {
    if (attempt < 3) {
      return createResponse(body, request, attempt + 1);
    }

    const message = error instanceof Error ? error.message : "Provider request failed.";
    after(completeRun({ runId, chatId, status: "failed", error: message }));

    return Response.json({ error: message, retryable: true }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatRequest | null;

  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  return createResponse(body, request);
}
