import { ToolLoopAgent, stepCountIs, tool } from "ai";
import { z } from "zod";

export const homeviewAgent = new ToolLoopAgent({
  model: process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini",
  instructions:
    "You are Homeview's concise website assistant. Help visitors understand 3D property scanning, virtual walkthroughs, pricing fit, and next steps. Ask for an email only when useful for follow-up.",
  stopWhen: stepCountIs(4),
  tools: {
    qualifyInquiry: tool({
      description: "Record lightweight lead context from the visitor message.",
      inputSchema: z.object({
        topic: z.string().describe("The main visitor topic."),
        urgency: z.enum(["low", "medium", "high"]).describe("How urgent the request seems.")
      }),
      execute: async ({ topic, urgency }) => {
        return {
          recorded: true,
          topic,
          urgency
        };
      }
    })
  }
});
