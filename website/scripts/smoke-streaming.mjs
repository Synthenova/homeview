import { streamText } from "ai";

const apiKey = process.env.AI_GATEWAY_API_KEY;
const model = process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini";

if (!apiKey) {
  console.error("Missing AI_GATEWAY_API_KEY.");
  process.exit(1);
}

const result = streamText({
  model,
  prompt: "Count from one to five using digits only, separated by spaces."
});

let text = "";
let chunks = 0;

for await (const delta of result.textStream) {
  chunks += 1;
  text += delta;
}

const usage = await result.usage;

console.log({
  model,
  chunks,
  text: text.trim(),
  usage
});

if (chunks < 1 || text.trim().length === 0) {
  console.error("AI SDK stream did not produce text chunks.");
  process.exit(1);
}
