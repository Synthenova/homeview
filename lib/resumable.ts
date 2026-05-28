import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";

type StreamContext = ReturnType<typeof createResumableStreamContext>;

declare global {
  // eslint-disable-next-line no-var
  var homeviewResumableStreamContext: StreamContext | undefined;
}

export function getResumableStreamContext() {
  if (!globalThis.homeviewResumableStreamContext) {
    globalThis.homeviewResumableStreamContext = createResumableStreamContext({
      keyPrefix: "homeview-chat",
      waitUntil: after
    });
  }

  return globalThis.homeviewResumableStreamContext;
}
