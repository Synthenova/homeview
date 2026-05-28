import { NextResponse } from "next/server";
import { SUPPORTED_AGENT_MODELS } from "../../../../../shared/agent-config";
import { requireCurrentUser } from "@/lib/auth";
import { readAgentWorkspace, updateAgentWorkspace } from "@/lib/agent-data";

export async function GET() {
  await requireCurrentUser();
  const workspace = await readAgentWorkspace();

  return NextResponse.json({
    workspace,
    models: SUPPORTED_AGENT_MODELS
  });
}

export async function POST(request: Request) {
  await requireCurrentUser();
  const body = (await request.json().catch(() => null)) as
    | {
        model?: string;
        instructions?: string;
      }
    | null;

  if (!body?.model || typeof body.instructions !== "string") {
    return NextResponse.json({ error: "Model and instructions are required." }, { status: 400 });
  }

  if (!SUPPORTED_AGENT_MODELS.some((entry) => entry.id === body.model)) {
    return NextResponse.json({ error: "Unsupported model." }, { status: 400 });
  }

  const workspace = await updateAgentWorkspace({
    model: body.model,
    instructions: body.instructions
  });

  return NextResponse.json({ workspace });
}
