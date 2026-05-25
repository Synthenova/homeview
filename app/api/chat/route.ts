import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { calUrl, contactEmail } from "@/lib/site";

type IncomingMessage = {
  role: "assistant" | "user";
  content: string;
};

const systemPrompt = `You are Homeview's AI client closer.
Answer questions about 3D property scanning, virtual tours, construction records, insurance documentation, pricing, and next steps.
Keep replies concise and practical.
When the visitor seems interested, suggest booking a 15-minute call: ${calUrl}.
If they do not want to book, ask for their email so the team can send details.
Contact email: ${contactEmail}.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages = (body?.messages ?? []) as IncomingMessage[];

  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      reply:
        `I can help with pricing, walkthroughs, or project fit. The fastest next step is booking a 15-minute call here: ${calUrl}. If you prefer email, send the property details to ${contactEmail}.`
    });
  }

  const provider = createOpenAI({
    apiKey,
    baseURL: process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1"
  });

  try {
    const result = await generateText({
      model: provider(process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini"),
      system: systemPrompt,
      prompt: lastMessage
    });

    return NextResponse.json({ reply: result.text });
  } catch {
    return NextResponse.json({
      reply:
        `I can help with that. For an exact quote, book a 15-minute call here: ${calUrl}. If you prefer, send your property type, location, and timeline to ${contactEmail}.`
    });
  }
}
