import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const CRM_BASE_URL = process.env.CRM_BASE_URL || "http://localhost:3101";
const WEBSITE_BASE_URL = process.env.WEBSITE_BASE_URL || "http://localhost:3100";
const PDF_PATH = process.env.SMOKE_AGENT_PDF_PATH || "/Users/nirmal/Downloads/Nirmal_Resume.pdf";
const FIXTURE_DIR = path.join(process.cwd(), "testdata/agent");

if (!process.env.CRM_SESSION_SECRET) {
  console.error("Missing CRM_SESSION_SECRET.");
  process.exit(1);
}

function createAdminCookie() {
  const token = execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
        const session = await import("./crm/lib/session.ts");
        const token = await session.createSessionToken({
          email: process.env.CRM_SUPER_ADMIN_EMAIL || "admin@homeview.local",
          role: "super_admin",
          source: "env"
        });
        process.stdout.write(token);
      `
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_NO_WARNINGS: "1"
      }
    }
  ).trim();

  return `crm_session=${token}`;
}

async function parseJson(url, init) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function withRetry(label, fn, attempts = 3) {
  let lastError;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (index + 1)));
      }
    }
  }

  throw new Error(`${label} failed after ${attempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function crmHeaders(extraHeaders = {}) {
  return {
    Cookie: createAdminCookie(),
    ...extraHeaders
  };
}

async function ensureSource(filePath, fileName, mediaType) {
  const current = await parseJson(`${CRM_BASE_URL}/api/agent/sources`, {
    headers: crmHeaders()
  });
  const existing = current.sources.find((source) => source.fileName === fileName);

  if (existing) {
    return existing;
  }

  const formData = new FormData();
  const file = new File([readFileSync(filePath)], fileName, { type: mediaType });
  formData.append("file", file);

  const response = await fetch(`${CRM_BASE_URL}/api/agent/sources`, {
    method: "POST",
    headers: crmHeaders(),
    body: formData
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.source) {
    throw new Error(`Failed to upload ${fileName}: ${JSON.stringify(data)}`);
  }

  return data.source;
}

function assertIncludes(text, expected, label) {
  if (!text.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${label} missing "${expected}". Actual response: ${text}`);
  }
}

async function askCrm(prompt) {
  return withRetry("CRM agent test", async () => {
    return readStreamedAssistantText(`${CRM_BASE_URL}/api/agent/test`, {
      headers: crmHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        messages: [
          {
            id: `user-${Date.now()}`,
            role: "user",
            parts: [{ type: "text", text: prompt }]
          }
        ]
      })
    });
  });
}

async function askWebsite(prompt) {
  return withRetry("Website shared-agent test", async () => {
    return execFileSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "--input-type=module",
        "-e",
        `
          const { buildAgent } = await import("./shared/agent-runtime.ts");
          const { getAgentWorkspace, listAgentSources } = await import("./shared/agent-config.ts");
          const { sql } = await import("./website/lib/db.ts");

          const workspace = await getAgentWorkspace(sql);
          const sources = await listAgentSources(sql);

          if (!workspace) {
            throw new Error("Agent workspace is not configured.");
          }

          const agent = buildAgent(workspace, sources);
          const result = await agent.generate({ prompt: process.env.SMOKE_PROMPT });
          process.stdout.write(result.text.trim());
          await sql.end({ timeout: 5 });
        `
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          NODE_NO_WARNINGS: "1",
          SMOKE_PROMPT: prompt
        },
        maxBuffer: 4 * 1024 * 1024
      }
    ).trim();
  });
}

async function readStreamedAssistantText(url, { headers, body }) {
  const headerArgs = Object.entries(headers).flatMap(([key, value]) => ["-H", `${key}: ${value}`]);
  const rawResponse = execFileSync(
    "curl",
    ["-sS", "-N", "-D", "-", "-X", "POST", url, ...headerArgs, "--data-raw", body],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024
    }
  );

  const splitIndex = rawResponse.indexOf("\r\n\r\n");
  const separatorLength = splitIndex >= 0 ? 4 : 2;
  const normalizedSplitIndex = splitIndex >= 0 ? splitIndex : rawResponse.indexOf("\n\n");

  if (normalizedSplitIndex < 0) {
    throw new Error(`Could not split headers from body for ${url}. Raw prefix: ${rawResponse.slice(0, 400)}`);
  }

  const rawHeaders = rawResponse.slice(0, normalizedSplitIndex);
  const raw = rawResponse.slice(normalizedSplitIndex + separatorLength);
  const statusLine = rawHeaders.split(/\r?\n/)[0] || "";
  const contentTypeMatch = rawHeaders.match(/^content-type:\s*([^\r\n]+)/im);
  const locationMatch = rawHeaders.match(/^location:\s*([^\r\n]+)/im);
  const contentType = contentTypeMatch?.[1]?.trim() || "";
  const statusCode = Number(statusLine.split(" ")[1] || 0);

  if (statusCode >= 300) {
    throw new Error(`Stream request failed: ${statusLine} ${locationMatch?.[1] || raw.slice(0, 400)}`);
  }

  if (!contentType.includes("text/event-stream")) {
    throw new Error(
      `Expected SSE response from ${url}, received ${contentType || "unknown"}: ${raw.slice(0, 400)}`
    );
  }

  const text = raw
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter((part) => part.startsWith("data: "))
    .map((part) => part.slice(6))
    .filter((part) => part && part !== "[DONE]")
    .map((part) => JSON.parse(part))
    .filter((part) => part.type === "text-delta")
    .map((part) => part.delta)
    .join("");

  if (!text) {
    throw new Error(`No assistant text was streamed by ${url}. Raw prefix: ${raw.slice(0, 600)}`);
  }

  return text.trim();
}

async function verifyDeleteFlow() {
  const fileName = `delete-me-${Date.now()}.txt`;
  const formData = new FormData();
  formData.append("file", new File([`temporary delete proof ${Date.now()}`], fileName, { type: "text/plain" }));

  const createResponse = await fetch(`${CRM_BASE_URL}/api/agent/sources`, {
    method: "POST",
    headers: crmHeaders(),
    body: formData
  });
  const createData = await createResponse.json();

  if (!createResponse.ok || !createData.source) {
    throw new Error(`Delete-flow upload failed: ${JSON.stringify(createData)}`);
  }

  const deleteResponse = await fetch(`${CRM_BASE_URL}/api/agent/sources/${createData.source.id}`, {
    method: "DELETE",
    headers: crmHeaders()
  });

  if (!deleteResponse.ok) {
    throw new Error(`Delete-flow delete failed: ${await deleteResponse.text()}`);
  }

  const after = await parseJson(`${CRM_BASE_URL}/api/agent/sources`, {
    headers: crmHeaders()
  });

  if (after.sources.some((source) => source.fileName === fileName)) {
    throw new Error("Deleted source still appears in the source list.");
  }
}

await parseJson(`${CRM_BASE_URL}/api/agent/config`, {
  method: "POST",
  headers: crmHeaders({ "Content-Type": "application/json" }),
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    instructions:
      "Use uploaded sources before answering factual questions. Cite the file name when a source is used. Keep answers concise and direct."
  })
});
console.error("Configured shared agent workspace.");

await ensureSource(path.join(FIXTURE_DIR, "facts.txt"), "facts.txt", "text/plain");
await ensureSource(path.join(FIXTURE_DIR, "notes.md"), "notes.md", "text/markdown");
await ensureSource(path.join(FIXTURE_DIR, "brief.html"), "brief.html", "text/html");
await ensureSource(PDF_PATH, "Nirmal_Resume.pdf", "application/pdf");
await ensureSource(path.join(FIXTURE_DIR, "reference-ui.png"), "reference-ui.png", "image/png");
console.error("Verified required sources.");

await verifyDeleteFlow();
console.error("Verified delete flow.");

const crmTextAnswer = await askCrm(
  "Using the uploaded text and HTML sources, what are the pricing anchor, owner codename, preferred launch city, and design mood? Cite the file names."
);
console.error("Verified CRM text answer.");
assertIncludes(crmTextAnswer, "2400", "CRM text answer");
assertIncludes(crmTextAnswer, "Maple", "CRM text answer");
assertIncludes(crmTextAnswer, "Singapore", "CRM text answer");
assertIncludes(crmTextAnswer, "olive", "CRM text answer");
assertIncludes(crmTextAnswer, "facts.txt", "CRM text answer");
assertIncludes(crmTextAnswer, "notes.md", "CRM text answer");
assertIncludes(crmTextAnswer, "brief.html", "CRM text answer");

const crmPdfAnswer = await askCrm(
  "What current role is shown in Nirmal_Resume.pdf? Cite the file name."
);
console.error("Verified CRM PDF answer.");
assertIncludes(crmPdfAnswer, "Data Scientist", "CRM PDF answer");
assertIncludes(crmPdfAnswer, "Nirmal_Resume.pdf", "CRM PDF answer");

const crmImageAnswer = await askCrm(
  "What kind of interface is shown in reference-ui.png? Cite the file name."
);
console.error("Verified CRM image answer.");
assertIncludes(crmImageAnswer, "reference-ui.png", "CRM image answer");
if (!/interface|project|conversation/i.test(crmImageAnswer)) {
  throw new Error(`CRM image answer did not describe the interface clearly: ${crmImageAnswer}`);
}

const websiteAnswer = await askWebsite(
  "Using the uploaded files, what are the owner codename and preferred launch city? Cite the file names."
);
console.error("Verified website shared-agent answer.");
assertIncludes(websiteAnswer, "Maple", "Website answer");
assertIncludes(websiteAnswer, "Singapore", "Website answer");
assertIncludes(websiteAnswer, "facts.txt", "Website answer");
assertIncludes(websiteAnswer, "notes.md", "Website answer");

console.log(JSON.stringify({
  crmTextAnswer,
  crmPdfAnswer,
  crmImageAnswer,
  websiteAnswer
}, null, 2));
