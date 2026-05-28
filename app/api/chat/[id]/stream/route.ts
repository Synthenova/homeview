import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { readChat } from "@/lib/chat-store";
import { getResumableStreamContext } from "@/lib/resumable";

export const maxDuration = 300;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await readChat(id);

  if (!chat?.activeStreamId) {
    return new Response(null, { status: 204 });
  }

  const stream = await getResumableStreamContext().resumeExistingStream(chat.activeStreamId);

  if (!stream) {
    return new Response(null, { status: 204 });
  }

  return new Response(stream, {
    headers: UI_MESSAGE_STREAM_HEADERS
  });
}
