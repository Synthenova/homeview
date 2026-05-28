"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { Calendar, Mail, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter } from "next/navigation";
import { getStoredSessionId, setStoredSessionId } from "@/lib/browser-session";
import { CONTACT_SUBMITTED_EVENT, ContactForm } from "@/components/ContactForm";

type ChatRecord = {
  id: string;
  messages: UIMessage[];
};

type ContactSubmittedDetail = {
  ok: true;
  sessionId: string;
  chatId: string;
  prompt: string;
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
  queuedPrompt,
  onQueuedPromptSent
}: {
  chatId: string;
  sessionId: string;
  initialMessages: UIMessage[];
  queuedPrompt: string | null;
  onQueuedPromptSent: () => void;
}) {
  const [input, setInput] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const chatRef = useRef<ReturnType<typeof useChat> | null>(null);
  const pendingPromptRef = useRef<string | null>(null);

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
    }
  });

  chatRef.current = chat;

  useEffect(() => {
    if (!queuedPrompt) return;
    pendingPromptRef.current = queuedPrompt;
  }, [queuedPrompt]);

  useEffect(() => {
    const prompt = pendingPromptRef.current;
    if (!prompt || chat.messages.length > 0) return;
    if (chat.status === "submitted" || chat.status === "streaming") return;

    pendingPromptRef.current = null;
    onQueuedPromptSent();
    void chat.sendMessage({ text: prompt });
  }, [chat, chat.messages.length, chat.status, onQueuedPromptSent]);

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
  const pathname = usePathname();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loadingShell, setLoadingShell] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  async function loadChat(nextChatId: string) {
    const response = await fetch(`/api/chats/${nextChatId}`);
    const data = (await response.json()) as { chat: ChatRecord };
    setInitialMessages(data.chat.messages);
    setChatId(nextChatId);
  }

  async function openChatSession(nextSessionId: string, prompt?: string) {
    setLoadingShell(true);
    try {
      const response = await fetch(`/api/sessions/${nextSessionId}/chats`, { method: "POST" });
      const data = (await response.json()) as { chatId: string };
      await loadChat(data.chatId);
      setQueuedPrompt(prompt ?? null);
    } finally {
      setLoadingShell(false);
    }
  }

  useEffect(() => {
    const storedSessionId = getStoredSessionId();
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  useEffect(() => {
    const onContactSubmitted = (event: Event) => {
      const detail = (event as CustomEvent<ContactSubmittedDetail>).detail;
      if (!detail?.sessionId || !detail?.chatId) return;

      setStoredSessionId(detail.sessionId);
      setSessionId(detail.sessionId);
      setClosing(false);
      setOpen(true);
      setLoadingShell(true);

      void (async () => {
        try {
          await loadChat(detail.chatId);
          setQueuedPrompt(detail.prompt);
        } finally {
          setLoadingShell(false);
        }
      })();
    };

    window.addEventListener(CONTACT_SUBMITTED_EVENT, onContactSubmitted);
    return () => window.removeEventListener(CONTACT_SUBMITTED_EVENT, onContactSubmitted);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function openModal() {
    if (open) {
      closeModal();
      return;
    }

    setClosing(false);
    setOpen(true);
    const existingSessionId = sessionId ?? getStoredSessionId();
    if (!existingSessionId) return;
    setSessionId(existingSessionId);
    if (chatId && sessionId === existingSessionId) return;
    void openChatSession(existingSessionId);
  }

  function closeModal() {
    setClosing(true);
    setVisible(false);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }

  function goToBookCall() {
    closeModal();

    if (pathname === "/") {
      document.getElementById("book-call")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (pathname === "/contact") {
      document.getElementById("book-call")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    router.push("/#book-call");
  }

  return (
    <div className="chatbot-root">
      <button className="chat-launcher" onClick={openModal} aria-label="Open Homeview assistant">
        <MessageCircle size={22} />
        <span>Ask Homeview</span>
      </button>

      {open ? (
        sessionId ? (
          <div
            ref={modalRef}
            className={`chat-modal t-modal ${closing ? "is-closing" : visible ? "is-open" : ""}`}
            role="dialog"
            aria-modal="false"
            aria-label="Homeview assistant"
          >
            <div className="chat-header">
              <div>
                <h2>Homeview AI Assistant</h2>
              </div>
              <button onClick={closeModal} aria-label="Close chat">
                <X size={18} />
              </button>
            </div>

            <div className="chat-actions">
              <button type="button" onClick={goToBookCall}>
                <Calendar size={15} /> Book 15 min
              </button>
              <a href="mailto:hello@homeview.ai">
                <Mail size={15} /> Email
              </a>
            </div>

            <div className="chat-workspace">
              {loadingShell ? <div className="chat-loading">Loading conversation...</div> : null}
              {chatId && !loadingShell ? (
                <ChatConversation
                  key={chatId}
                  chatId={chatId}
                  sessionId={sessionId}
                  initialMessages={initialMessages}
                  queuedPrompt={queuedPrompt}
                  onQueuedPromptSent={() => setQueuedPrompt(null)}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div
            ref={modalRef}
            className={`chat-modal chat-modal-gated t-modal ${closing ? "is-closing" : visible ? "is-open" : ""}`}
            role="dialog"
            aria-modal="false"
            aria-label="Contact Homeview"
          >
            <button className="chat-gated-close" onClick={closeModal} aria-label="Close contact form">
              <X size={18} />
            </button>
            <ContactForm />
          </div>
        )
      ) : null}
    </div>
  );
}
