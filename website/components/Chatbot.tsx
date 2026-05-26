"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { Calendar, Mail, MessageCircle, Plus, RotateCcw, Send, X } from "lucide-react";
import { DefaultChatTransport } from "ai";
import {
  getStoredActiveChatId,
  getStoredSessionId,
  setStoredActiveChatId,
  setStoredSessionId
} from "@/lib/browser-session";
import { calUrl } from "@/lib/site";

type ChatSummary = {
  id: string;
  title: string;
  status: string;
  messageCount: number;
  lastMessagePreview: string | null;
  updatedAt: string;
};

type ChatRecord = {
  id: string;
  messages: UIMessage[];
};

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function ChatConversation({
  chatId,
  sessionId,
  initialMessages,
  onSettled
}: {
  chatId: string;
  sessionId: string;
  initialMessages: UIMessage[];
  onSettled: () => void;
}) {
  const [input, setInput] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const chatRef = useRef<ReturnType<typeof useChat> | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            sessionId,
            message: messages[messages.length - 1],
            landingPage: window.location.pathname
          }
        }),
        prepareReconnectToStreamRequest: ({ id }) => ({
          api: `/api/chat/${id}/stream`
        })
      }),
    [sessionId]
  );

  const chat = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: true,
    experimental_throttle: 60,
    onError: () => {
      setRetryCount((count) => {
        if (count < 3) {
          window.setTimeout(() => {
            void chatRef.current?.regenerate();
          }, 500 * (count + 1));
        }
        return count + 1;
      });
    },
    onFinish: () => {
      setRetryCount(0);
      onSettled();
    }
  });

  chatRef.current = chat;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || chat.status === "submitted" || chat.status === "streaming") return;
    setInput("");
    await chat.sendMessage({ text: prompt });
  }

  return (
    <section className="chat-thread">
      <div className="chat-messages">
        {chat.messages.length === 0 ? (
          <div className="chat-message assistant">
            Ask about pricing, 3D walkthroughs, project fit, or next steps.
          </div>
        ) : null}
        {chat.messages.map((message) => (
          <div className={`chat-message ${message.role}`} key={message.id}>
            {messageText(message)}
          </div>
        ))}
        {chat.status === "submitted" ? <div className="chat-message assistant">Thinking...</div> : null}
        {chat.error && retryCount >= 3 ? (
          <div className="chat-error">
            <span>Provider failed. Try again.</span>
            <button type="button" onClick={() => void chat.regenerate()}>
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        ) : null}
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about pricing, demo, or next steps"
        />
        <button type="submit" aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}

export function Chatbot() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatList, setChatList] = useState<ChatSummary[]>([]);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loadingShell, setLoadingShell] = useState(true);
  const modalRef = useRef<HTMLDivElement | null>(null);

  async function refreshChats(nextSessionId = sessionId) {
    if (!nextSessionId) return;
    const response = await fetch(`/api/sessions/${nextSessionId}/chats`);
    const data = (await response.json()) as { chats: ChatSummary[] };
    setChatList(data.chats);
  }

  async function loadChat(nextChatId: string) {
    const response = await fetch(`/api/chats/${nextChatId}`);
    const data = (await response.json()) as { chat: ChatRecord };
    setInitialMessages(data.chat.messages);
    setChatId(nextChatId);
    setStoredActiveChatId(nextChatId);
  }

  async function createChat(nextSessionId = sessionId) {
    if (!nextSessionId) return;
    const response = await fetch(`/api/sessions/${nextSessionId}/chats`, { method: "POST" });
    const data = (await response.json()) as { chatId: string };
    setInitialMessages([]);
    setChatId(data.chatId);
    setStoredActiveChatId(data.chatId);
    await refreshChats(nextSessionId);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const storedSessionId = getStoredSessionId();
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: storedSessionId,
          landingPage: window.location.pathname
        })
      });
      const data = (await response.json()) as { sessionId: string };

      if (cancelled) return;

      setStoredSessionId(data.sessionId);
      setSessionId(data.sessionId);

      const chatsResponse = await fetch(`/api/sessions/${data.sessionId}/chats`);
      const chatsData = (await chatsResponse.json()) as { chats: ChatSummary[] };
      const storedChatId = getStoredActiveChatId();
      const selected = chatsData.chats.find((item) => item.id === storedChatId) ?? chatsData.chats[0];

      if (cancelled) return;

      setChatList(chatsData.chats);

      if (selected) {
        await loadChat(selected.id);
      } else {
        await createChat(data.sessionId);
      }

      setLoadingShell(false);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openModal() {
    setClosing(false);
    setOpen(true);
  }

  function closeModal() {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }

  return (
    <div className="chatbot-root">
      <button className="chat-launcher" onClick={openModal} aria-label="Open Homeview assistant">
        <MessageCircle size={22} />
        <span>Ask Homeview</span>
      </button>

      {open ? (
        <div
          ref={modalRef}
          className={`chat-modal t-modal ${closing ? "is-closing" : "is-open"}`}
          role="dialog"
          aria-modal="false"
          aria-label="Homeview assistant"
        >
          <div className="chat-header">
            <div>
              <span className="eyebrow">AI assistant</span>
              <h2>Property scan chats</h2>
            </div>
            <button onClick={closeModal} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="chat-actions">
            <button type="button" onClick={() => void createChat()} disabled={!sessionId}>
              <Plus size={15} /> New chat
            </button>
            <a href={calUrl} target="_blank" rel="noreferrer">
              <Calendar size={15} /> Book 15 min
            </a>
            <a href="mailto:hello@homeview.ai">
              <Mail size={15} /> Email
            </a>
          </div>

          <div className="chat-workspace">
            <aside className="chat-list" aria-label="Chat history">
              {loadingShell ? <p>Loading...</p> : null}
              {chatList.map((item) => (
                <button
                  className={item.id === chatId ? "is-active" : ""}
                  key={item.id}
                  onClick={() => void loadChat(item.id)}
                  type="button"
                >
                  <strong>{item.title || "New chat"}</strong>
                  <span>{item.lastMessagePreview || "No messages yet"}</span>
                </button>
              ))}
            </aside>

            {chatId && sessionId ? (
              <ChatConversation
                key={chatId}
                chatId={chatId}
                sessionId={sessionId}
                initialMessages={initialMessages}
                onSettled={() => void refreshChats()}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
