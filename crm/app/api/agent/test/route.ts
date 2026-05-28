import { createAgentUIStreamResponse, createIdGenerator, type UIMessage } from "ai";
import { buildAgent } from "../../../../../shared/agent-runtime";
import { requireCurrentUser } from "@/lib/auth";
import { readAgentSources, readAgentWorkspace } from "@/lib/agent-data";

export const maxDuration = 300;

type AgentTestRequest = {
  messages?: UIMessage[];
};

export async function POST(request: Request) {
  await requireCurrentUser();
  const body = (await request.json().catch(() => null)) as AgentTestRequest | null;

  if (!body?.messages || body.messages.length === 0) {
    return Response.json({ error: "Messages are required." }, { status: 400 });
  }

  const [workspace, sources] = await Promise.all([readAgentWorkspace(), readAgentSources()]);

  if (!workspace) {
    return Response.json({ error: "Agent workspace is not configured." }, { status: 500 });
  }

  const agent = buildAgent(workspace, sources);
  const messages = body.messages as UIMessage[];

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages as any,
    originalMessages: messages as any,
    generateMessageId: createIdGenerator({ prefix: "crmmsg", size: 16 })
  });
}
