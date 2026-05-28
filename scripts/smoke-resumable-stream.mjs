import { createResumableStreamContext } from "resumable-stream";

if (!process.env.REDIS_URL) {
  console.error("Missing REDIS_URL. resumable-stream uses TCP Redis via REDIS_URL or KV_URL.");
  process.exit(1);
}

const waitUntilPromises = [];
const streamContext = createResumableStreamContext({
  keyPrefix: "homeview-smoke",
  waitUntil: (promise) => {
    waitUntilPromises.push(promise);
  }
});

const streamId = `stream_${crypto.randomUUID()}`;
const chunks = ["alpha ", "beta ", "gamma ", "delta ", "epsilon ", "zeta ", "eta ", "theta"];
const expected = chunks.join("");

function makeSlowStream() {
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });
}

const initialStream = await streamContext.createNewResumableStream(streamId, makeSlowStream);

if (!initialStream) {
  console.error("Failed to create initial resumable stream.");
  process.exit(1);
}

const initialReader = initialStream.getReader();
let partial = "";

while (partial.length < "alpha ".length) {
  const { done, value } = await initialReader.read();
  if (done) break;
  partial += value;
}

await initialReader.cancel("simulate client disconnect");

await new Promise((resolve) => setTimeout(resolve, 100));

const resumedStream = await streamContext.resumeExistingStream(streamId, partial.length);

if (!resumedStream) {
  console.error("No active resumable stream found after simulated disconnect.");
  process.exit(1);
}

const resumedReader = resumedStream.getReader();
let remainder = "";

for (;;) {
  const { done, value } = await resumedReader.read();
  if (done) break;
  remainder += value;
}

await Promise.all(waitUntilPromises);

const combined = partial + remainder;

console.log({
  streamId,
  partial,
  remainder,
  combined,
  resumed: combined === expected
});

if (combined !== expected) {
  console.error("Resumed stream did not reconstruct the expected output.");
  process.exit(1);
}

process.exit(0);
