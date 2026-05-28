import { generateText, ToolLoopAgent, stepCountIs, tool } from "ai";
import { z } from "zod";
import type { AgentSource, AgentWorkspace } from "./agent-config";

function truncateText(value: string, limit = 12000) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n\n[truncated]`;
}

export function buildAgentInstructions(workspace: AgentWorkspace) {
  const userInstructions = workspace.instructions.trim();

  return [
    "You are Homeview's configurable project assistant.",
    "Use the available source tools before making claims about uploaded knowledge files.",
    "When a question depends on uploaded files, list the files, choose the relevant one, and read it.",
    "Prefer concise, direct answers and mention file names when citing source-backed information.",
    userInstructions ? `Workspace instructions:\n${userInstructions}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

type AgentBuildOptions = {
  additionalInstructions?: string | null;
  tools?: Record<string, any>;
};

export function buildAgent(workspace: AgentWorkspace, sources: AgentSource[], options: AgentBuildOptions = {}) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const sourceByFileName = new Map(sources.map((source) => [source.fileName.toLowerCase(), source]));
  const baseInstructions = buildAgentInstructions(workspace);
  const instructions = [baseInstructions, options.additionalInstructions?.trim() || null]
    .filter(Boolean)
    .join("\n\n");

  return new ToolLoopAgent({
    model: workspace.model,
    instructions,
    stopWhen: stepCountIs(6),
    tools: {
      listFiles: tool({
        description: "List uploaded source files available to the agent.",
        inputSchema: z.object({}),
        execute: async () => ({
          files: sources.map((source) => ({
            id: source.id,
            fileName: source.fileName,
            mediaType: source.mediaType,
            sourceKind: source.sourceKind,
            sizeBytes: source.sizeBytes,
            preview:
              source.sourceKind === "text" ? truncateText((source.textContent ?? "").replace(/\s+/g, " "), 180) : null
          }))
        })
      }),
      readFile: tool({
        description:
          "Read one uploaded source file. Text files return text directly. PDFs and images are interpreted with the current model.",
        inputSchema: z.object({
          fileId: z.string().describe("The source file id to inspect."),
          question: z
            .string()
            .min(1)
            .describe("What you need from the file so the reader can focus on the relevant content.")
        }),
        execute: async ({ fileId, question }) => {
          const source = sourceMap.get(fileId) || sourceByFileName.get(fileId.toLowerCase());

          if (!source) {
            return {
              ok: false,
              error: "File not found."
            };
          }

          if (source.sourceKind === "text") {
            return {
              ok: true,
              fileName: source.fileName,
              sourceKind: source.sourceKind,
              text: truncateText(source.textContent ?? "")
            };
          }

          if (source.sourceKind === "pdf") {
            const result = await generateText({
              model: workspace.model,
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Read ${source.fileName} and answer this request: ${question}`
                    },
                    {
                      type: "file",
                      data: source.publicUrl,
                      mediaType: source.mediaType,
                      filename: source.fileName
                    }
                  ]
                }
              ],
              experimental_include: {
                requestBody: false,
                responseBody: false
              }
            });

            return {
              ok: true,
              fileName: source.fileName,
              sourceKind: source.sourceKind,
              response: result.text.trim()
            };
          }

          const result = await generateText({
            model: workspace.model,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Inspect ${source.fileName} and answer this request: ${question}`
                  },
                  {
                    type: "image",
                    image: source.publicUrl,
                    mediaType: source.mediaType
                  }
                ]
              }
            ],
            experimental_include: {
              requestBody: false,
              responseBody: false
            }
          });

          return {
            ok: true,
            fileName: source.fileName,
            sourceKind: source.sourceKind,
            response: result.text.trim()
          };
        }
      }),
      ...(options.tools ?? {})
    }
  });
}
