import {
  createAgentUIStreamResponse,
  createIdGenerator,
  type InferAgentUIMessage,
  type UIMessage
} from "ai";
import { after } from "next/server";
import { homeviewAgent } from "@/lib/agent";
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
import { getResumableStreamContext } from "@/lib/resumable";

export const maxDuration = 300;

type HomeviewUIMessage = InferAgentUIMessage<typeof homeviewAgent>;

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
  const model = process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini";

  await ensureSession({
    sessionId,
    userAgent,
    referrer,
    landingPage: body.landingPage
  });
  await ensureChat({ chatId, sessionId });
  await touchSession(sessionId);

  const existing = await readChat(chatId);
  const previousMessages = (existing?.messages ?? []) as HomeviewUIMessage[];
  const messages = [
    ...previousMessages.filter((item) => item.id !== message.id),
    message as HomeviewUIMessage
  ];
  const streamId = createStreamId();
  const runId = createRunId();

  await Promise.all([
    setActiveStream({ chatId, streamId }),
    createRun({ runId, chatId, sessionId, streamId, model })
  ]);
  after(saveMessages({ chatId, sessionId, messages }));

  try {
    return await createAgentUIStreamResponse({
      agent: homeviewAgent,
      uiMessages: messages,
      originalMessages: messages,
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
