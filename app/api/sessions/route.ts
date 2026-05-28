import { createSessionId, ensureSession } from "@/lib/chat-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sessionId = body.sessionId || createSessionId();

  await ensureSession({
    sessionId,
    userAgent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
    landingPage: body.landingPage
  });

  return Response.json({ sessionId });
}
