import { readChat } from "@/lib/chat-store";

export async function GET(_: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const chat = await readChat(chatId);

  if (!chat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat });
}
