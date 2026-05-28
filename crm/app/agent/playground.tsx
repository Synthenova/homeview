"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat, type UIMessage } from "@ai-sdk/react";
import {
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  Trash2,
  X
} from "lucide-react";
import type { AgentSource, AgentWorkspace } from "@/lib/agent-data";

type ModelOption = {
  id: string;
  label: string;
};

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => {
      if (part.type === "text") return part.text;
      return "";
    })
    .join("");
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceIcon(source: AgentSource) {
  return source.sourceKind === "image" ? <ImageIcon size={16} /> : <FileText size={16} />;
}

function SourceModal({
  open,
  sources,
  onClose,
  onUpload,
  onDelete
}: {
  open: boolean;
  sources: AgentSource[];
  onClose: () => void;
  onUpload: (files: FileList) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = sources.filter((source) => source.fileName.toLowerCase().includes(search.trim().toLowerCase()));

  if (!open) return null;

  return (
    <div className="agent-modal-backdrop" role="presentation">
      <div className="agent-modal agent-source-modal" role="dialog" aria-modal="true">
        <button className="agent-modal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="agent-modal-header">
          <div>
            <h3>Sources</h3>
            <p>Upload reference files for the shared Homeview agent.</p>
          </div>
        </div>
        <div className="agent-source-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sources"
          />
          <button
            className="agent-ghost-button"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Plus size={16} />
            {uploading ? "Uploading..." : "Attach"}
          </button>
          <input
            ref={inputRef}
            className="agent-hidden-input"
            type="file"
            multiple
            accept=".txt,.md,.html,.htm,.pdf,.png,.jpg,.jpeg,.webp,.gif"
            onChange={async (event) => {
              if (!event.target.files?.length) return;
              setUploading(true);
              try {
                await onUpload(event.target.files);
              } finally {
                event.target.value = "";
                setUploading(false);
              }
            }}
          />
        </div>
        <div className="agent-source-list">
          {filtered.length === 0 ? <p className="agent-empty">No sources match this search.</p> : null}
          {filtered.map((source) => (
            <div className="agent-source-row" key={source.id}>
              <div className="agent-source-icon">{sourceIcon(source)}</div>
              <div className="agent-source-meta">
                <strong>{source.fileName}</strong>
                <span>
                  {source.mediaType} · {formatBytes(source.sizeBytes)}
                </span>
              </div>
              <button
                className="agent-icon-button danger"
                type="button"
                onClick={async () => {
                  setDeletingId(source.id);
                  try {
                    await onDelete(source.id);
                  } finally {
                    setDeletingId(null);
                  }
                }}
                disabled={deletingId === source.id}
                aria-label={`Delete ${source.fileName}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="agent-modal-actions">
          <span className="agent-modal-note">Uploads and deletions are saved immediately.</span>
          <button className="agent-primary-button" type="button" onClick={onClose}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructionsModal({
  open,
  instructions,
  onClose,
  onSave
}: {
  open: boolean;
  instructions: string;
  onClose: () => void;
  onSave: (next: string) => Promise<void>;
}) {
  const [value, setValue] = useState(instructions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(instructions);
  }, [instructions]);

  if (!open) return null;

  return (
    <div className="agent-modal-backdrop" role="presentation">
      <div className="agent-modal" role="dialog" aria-modal="true">
        <button className="agent-modal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="agent-modal-header">
          <div>
            <h3>Instructions</h3>
            <p>This system prompt is used by the CRM test playground and the main website chat.</p>
          </div>
        </div>
        <textarea
          className="agent-textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={12}
          placeholder="Describe how the agent should behave, use sources, and answer."
        />
        <div className="agent-modal-actions">
          <button className="agent-ghost-button" type="button" onClick={onClose}>
            Discard
          </button>
          <button
            className="agent-primary-button"
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(value);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentPlayground({
  initialWorkspace,
  initialSources
}: {
  initialWorkspace: AgentWorkspace;
  initialSources: AgentSource[];
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [sources, setSources] = useState(initialSources);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const chatRef = useRef<ReturnType<typeof useChat> | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/agent/config");
      const data = (await response.json()) as { workspace: AgentWorkspace; models: ModelOption[] };
      if (!response.ok) return;
      setWorkspace(data.workspace);
      setModels(data.models);
    })();
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent/test"
      }),
    []
  );

  const chat = useChat({
    id: `agent-playground-${resetKey}`,
    transport,
    experimental_throttle: 60,
    onError: (chatError) => {
      setError(chatError.message);
    },
    onFinish: () => setError(null)
  });

  chatRef.current = chat;

  async function saveWorkspace(next: Partial<Pick<AgentWorkspace, "instructions" | "model">>) {
    const response = await fetch("/api/agent/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: next.model ?? workspace.model,
        instructions: next.instructions ?? workspace.instructions
      })
    });
    const data = (await response.json()) as { workspace?: AgentWorkspace; error?: string };
    if (!response.ok || !data.workspace) {
      throw new Error(data.error || "Failed to save workspace.");
    }
    setWorkspace(data.workspace);
  }

  async function uploadFiles(files: FileList) {
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/agent/sources", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { source?: AgentSource; error?: string };

      if (!response.ok || !data.source) {
        throw new Error(data.error || `Failed to upload ${file.name}.`);
      }

      setSources((current) => [...current, data.source as AgentSource]);
    }
  }

  async function deleteSource(id: string) {
    const response = await fetch(`/api/agent/sources/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to delete source.");
    }

    setSources((current) => current.filter((source) => source.id !== id));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || chat.status === "submitted" || chat.status === "streaming") return;
    setError(null);
    setInput("");
    await chat.sendMessage({ text: prompt });
  }

  return (
    <>
      <div className="agent-page">
        <aside className="agent-sidebar">
          <h3 className="agent-sidebar-title">Playground</h3>

          <button className="agent-side-card" type="button" onClick={() => setInstructionsOpen(true)}>
            <div className="agent-side-card-icon">
              <Settings2 size={18} />
            </div>
            <div className="agent-side-card-copy">
              <strong>Instructions</strong>
              <span className="agent-side-card-preview">
                {workspace.instructions.trim() || "Set the system prompt used by CRM and website chat."}
              </span>
            </div>
          </button>

          <button className="agent-side-card" type="button" onClick={() => setSourcesOpen(true)}>
            <div className="agent-side-card-icon">
              <Paperclip size={18} />
            </div>
            <div className="agent-side-card-copy">
              <strong>Sources</strong>
              <span>Shared knowledge files for this agent.</span>
            </div>
            <em>{sources.length}</em>
          </button>
        </aside>

        <section className="agent-main">
          <header className="agent-topbar">
            <button
              className="agent-ghost-button"
              type="button"
              onClick={() => {
                setResetKey((value) => value + 1);
                setError(null);
              }}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </header>

          <div className="agent-chat-messages">
            {chat.messages.map((message) => (
              <div className={`agent-message ${message.role}`} key={message.id}>
                {messageText(message)}
              </div>
            ))}

            {chat.status === "submitted" ? <div className="agent-message assistant thinking">Thinking...</div> : null}
            {error ? <div className="agent-error">{error}</div> : null}
          </div>

          <form className="agent-composer" onSubmit={submit}>
            <div className="agent-composer-inner">
              {/*
              <div className="agent-model-picker">
                <select
                  value={workspace.model}
                  onChange={async (event) => {
                    const nextModel = event.target.value;
                    await saveWorkspace({ model: nextModel });
                  }}
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
              */}
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a real source-backed question"
              />
              <button className="agent-send-button" type="submit" disabled={chat.status !== "ready"}>
                <Send size={16} />
              </button>
            </div>
          </form>
        </section>
      </div>

      <InstructionsModal
        open={instructionsOpen}
        instructions={workspace.instructions}
        onClose={() => setInstructionsOpen(false)}
        onSave={async (instructions) => {
          await saveWorkspace({ instructions });
        }}
      />

      <SourceModal
        open={sourcesOpen}
        sources={sources}
        onClose={() => setSourcesOpen(false)}
        onUpload={uploadFiles}
        onDelete={deleteSource}
      />
    </>
  );
}
