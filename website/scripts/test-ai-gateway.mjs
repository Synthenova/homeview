import { generateText } from "ai";

const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY;
const model = process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini";

if (!apiKey) {
  console.error("Missing AI_GATEWAY_API_KEY or VERCEL_AI_GATEWAY.");
  process.exit(1);
}

process.env.AI_GATEWAY_API_KEY = apiKey;

const result = await generateText({
  model,
  prompt: "Reply with only: gateway ok"
});

console.log({
  model,
  text: result.text.trim(),
  usage: result.usage
});
