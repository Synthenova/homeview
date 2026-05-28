export const DEFAULT_AGENT_WORKSPACE_ID = "default";

export const SUPPORTED_AGENT_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    label: "OpenAI GPT-4o mini"
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Google Gemini 2.5 Flash"
  }
] as const;

export const ALLOWED_SOURCE_TYPES = [
  {
    extension: ".txt",
    mediaType: "text/plain",
    kind: "text"
  },
  {
    extension: ".md",
    mediaType: "text/markdown",
    kind: "text"
  },
  {
    extension: ".html",
    mediaType: "text/html",
    kind: "text"
  },
  {
    extension: ".htm",
    mediaType: "text/html",
    kind: "text"
  },
  {
    extension: ".pdf",
    mediaType: "application/pdf",
    kind: "pdf"
  },
  {
    extension: ".png",
    mediaType: "image/png",
    kind: "image"
  },
  {
    extension: ".jpg",
    mediaType: "image/jpeg",
    kind: "image"
  },
  {
    extension: ".jpeg",
    mediaType: "image/jpeg",
    kind: "image"
  },
  {
    extension: ".webp",
    mediaType: "image/webp",
    kind: "image"
  },
  {
    extension: ".gif",
    mediaType: "image/gif",
    kind: "image"
  }
] as const;

export type AgentWorkspace = {
  id: string;
  name: string;
  model: string;
  instructions: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentSourceKind = (typeof ALLOWED_SOURCE_TYPES)[number]["kind"];

export type AgentSource = {
  id: string;
  workspaceId: string;
  objectKey: string;
  fileName: string;
  mediaType: string;
  sourceKind: AgentSourceKind;
  sizeBytes: number;
  publicUrl: string;
  textContent: string | null;
  createdAt: string;
  updatedAt: string;
};

type SqlLike = any;

function normalizeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapWorkspace(row: {
  id: string;
  name: string;
  model: string;
  instructions: string;
  created_at: Date | string;
  updated_at: Date | string;
}): AgentWorkspace {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    instructions: row.instructions,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at)
  };
}

function mapSource(row: {
  id: string;
  workspace_id: string;
  object_key: string;
  file_name: string;
  media_type: string;
  source_kind: AgentSourceKind;
  size_bytes: number;
  public_url: string;
  text_content: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): AgentSource {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    objectKey: row.object_key,
    fileName: row.file_name,
    mediaType: row.media_type,
    sourceKind: row.source_kind,
    sizeBytes: row.size_bytes,
    publicUrl: row.public_url,
    textContent: row.text_content,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at)
  };
}

export function getAllowedSourceType(fileName: string, providedMediaType?: string | null) {
  const normalized = fileName.trim().toLowerCase();
  const matched = ALLOWED_SOURCE_TYPES.find((entry) => normalized.endsWith(entry.extension));

  if (!matched) return null;
  if (providedMediaType && providedMediaType !== matched.mediaType) {
    if (!(matched.mediaType === "text/plain" && providedMediaType.startsWith("text/"))) {
      return null;
    }
  }

  return matched;
}

export function stripHtmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getAgentWorkspace(sql: SqlLike) {
  const [row] = await sql<{
    id: string;
    name: string;
    model: string;
    instructions: string;
    created_at: Date | string;
    updated_at: Date | string;
  }>`
    select id, name, model, instructions, created_at, updated_at
    from agent_workspaces
    where id = ${DEFAULT_AGENT_WORKSPACE_ID}
    limit 1
  `;

  return row ? mapWorkspace(row) : null;
}

export async function saveAgentWorkspace(sql: SqlLike, input: { model: string; instructions: string }) {
  const [row] = await sql<{
    id: string;
    name: string;
    model: string;
    instructions: string;
    created_at: Date | string;
    updated_at: Date | string;
  }>`
    insert into agent_workspaces (id, name, model, instructions, updated_at)
    values (
      ${DEFAULT_AGENT_WORKSPACE_ID},
      'Homeview Agent',
      ${input.model},
      ${input.instructions},
      now()
    )
    on conflict (id) do update set
      model = excluded.model,
      instructions = excluded.instructions,
      updated_at = now()
    returning id, name, model, instructions, created_at, updated_at
  `;

  return mapWorkspace(row);
}

export async function listAgentSources(sql: SqlLike) {
  const rows = await sql<{
    id: string;
    workspace_id: string;
    object_key: string;
    file_name: string;
    media_type: string;
    source_kind: AgentSourceKind;
    size_bytes: number;
    public_url: string;
    text_content: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>`
    select
      id,
      workspace_id,
      object_key,
      file_name,
      media_type,
      source_kind,
      size_bytes,
      public_url,
      text_content,
      created_at,
      updated_at
    from agent_sources
    where workspace_id = ${DEFAULT_AGENT_WORKSPACE_ID}
    order by created_at asc
  `;

  return rows.map(mapSource);
}

export async function getAgentSource(sql: SqlLike, id: string) {
  const [row] = await sql<{
    id: string;
    workspace_id: string;
    object_key: string;
    file_name: string;
    media_type: string;
    source_kind: AgentSourceKind;
    size_bytes: number;
    public_url: string;
    text_content: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>`
    select
      id,
      workspace_id,
      object_key,
      file_name,
      media_type,
      source_kind,
      size_bytes,
      public_url,
      text_content,
      created_at,
      updated_at
    from agent_sources
    where id = ${id}
    limit 1
  `;

  return row ? mapSource(row) : null;
}

export async function insertAgentSource(
  sql: SqlLike,
  input: {
    objectKey: string;
    fileName: string;
    mediaType: string;
    sourceKind: AgentSourceKind;
    sizeBytes: number;
    publicUrl: string;
    textContent: string | null;
  }
) {
  const [row] = await sql<{
    id: string;
    workspace_id: string;
    object_key: string;
    file_name: string;
    media_type: string;
    source_kind: AgentSourceKind;
    size_bytes: number;
    public_url: string;
    text_content: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>`
    insert into agent_sources (
      workspace_id,
      object_key,
      file_name,
      media_type,
      source_kind,
      size_bytes,
      public_url,
      text_content,
      updated_at
    )
    values (
      ${DEFAULT_AGENT_WORKSPACE_ID},
      ${input.objectKey},
      ${input.fileName},
      ${input.mediaType},
      ${input.sourceKind},
      ${input.sizeBytes},
      ${input.publicUrl},
      ${input.textContent},
      now()
    )
    returning
      id,
      workspace_id,
      object_key,
      file_name,
      media_type,
      source_kind,
      size_bytes,
      public_url,
      text_content,
      created_at,
      updated_at
  `;

  return mapSource(row);
}

export async function deleteAgentSourceRecord(sql: SqlLike, id: string) {
  const [row] = await sql<{
    id: string;
    workspace_id: string;
    object_key: string;
    file_name: string;
    media_type: string;
    source_kind: AgentSourceKind;
    size_bytes: number;
    public_url: string;
    text_content: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>`
    delete from agent_sources
    where id = ${id}
    returning
      id,
      workspace_id,
      object_key,
      file_name,
      media_type,
      source_kind,
      size_bytes,
      public_url,
      text_content,
      created_at,
      updated_at
  `;

  return row ? mapSource(row) : null;
}
