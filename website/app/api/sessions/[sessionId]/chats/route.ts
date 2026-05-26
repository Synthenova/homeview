import { createChat, ensureSession, listChats } from "@/lib/chat-store";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  await ensureSession({ sessionId });
  return Response.json({ chats: await listChats(sessionId) });
}

export async function POST(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  await ensureSession({ sessionId });
  const chatId = await createChat(sessionId);
  return Response.json({ chatId });
}
