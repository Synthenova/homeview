import { NextResponse } from "next/server";
import { ensureSession, saveContactQuery } from "@/lib/chat-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.message) {
    return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
  }

  if (body.sessionId) {
    await ensureSession({
      sessionId: body.sessionId,
      userAgent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer")
    });
  }

  await saveContactQuery({
    sessionId: body.sessionId,
    name: body.name,
    email: body.email,
    projectType: body.projectType,
    message: body.message
  });

  return NextResponse.json({ ok: true });
}
