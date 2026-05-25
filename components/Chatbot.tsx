"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Calendar, Mail, MessageCircle, Send, X } from "lucide-react";
import { calUrl } from "@/lib/site";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const starter: ChatMessage = {
  role: "assistant",
  content:
    "I can help with pricing, 3D walkthroughs, project fit, or booking a 15-minute call."
};

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages })
    });

    const data = (await response.json()) as { reply?: string };
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content:
          data.reply ??
          "I can help with this. The fastest next step is to book a 15-minute call or leave your email."
      }
    ]);
    setLoading(false);
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
              <span className="eyebrow">AI closer</span>
              <h2>Ask about your property scan</h2>
            </div>
            <button onClick={closeModal} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>
          <div className="chat-actions">
            <a href={calUrl} target="_blank" rel="noreferrer">
              <Calendar size={15} /> Book 15 min
            </a>
            <a href="mailto:hello@homeview.ai">
              <Mail size={15} /> Send email
            </a>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {loading ? <div className="chat-message assistant">Thinking...</div> : null}
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
        </div>
      ) : null}
    </div>
  );
}
