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
