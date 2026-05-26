import { spawn } from "node:child_process";

const port = "3105";
const baseUrl = `http://127.0.0.1:${port}`;
const childEnv = { ...process.env, PORT: port };
delete childEnv.NODE_OPTIONS;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 45000) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // server not ready
    }
    await wait(750);
  }
  throw new Error("Website dev server did not become ready.");
}

const server = spawn(
  process.execPath,
  ["../node_modules/next/dist/bin/next", "dev", "--webpack", "--port", port],
  {
    cwd: "website",
    stdio: ["ignore", "pipe", "pipe"],
    env: childEnv
  }
);

server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

try {
  await waitForServer();
  const smoke = spawn(
    process.execPath,
    ["scripts/smoke-chat-http.mjs"],
    {
      cwd: "website",
      stdio: "inherit",
      env: { ...childEnv, SMOKE_BASE_URL: baseUrl }
    }
  );

  const code = await new Promise((resolve) => smoke.on("exit", resolve));
  if (code !== 0) process.exit(code ?? 1);
} finally {
  server.kill("SIGTERM");
}
