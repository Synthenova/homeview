export const SESSION_STORAGE_KEY = "homeview_session_id";
export const ACTIVE_CHAT_STORAGE_KEY = "homeview_active_chat_id";

export function getStoredSessionId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setStoredSessionId(sessionId: string) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export function getStoredActiveChatId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
}

export function setStoredActiveChatId(chatId: string) {
  window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chatId);
}

export async function ensureStoredSessionId(options?: {
  email?: string;
  landingPage?: string;
}) {
  const existingSessionId = getStoredSessionId();
  if (existingSessionId && !options?.email) return existingSessionId;

  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: existingSessionId,
      email: options?.email ?? null,
      landingPage:
        options?.landingPage ?? (typeof window === "undefined" ? null : window.location.pathname)
    })
  });

  if (!response.ok) {
    throw new Error("Failed to create session.");
  }

  const data = (await response.json()) as { sessionId: string };
  setStoredSessionId(data.sessionId);
  return data.sessionId;
}
