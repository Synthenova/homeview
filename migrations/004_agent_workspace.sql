create table if not exists agent_workspaces (
  id text primary key,
  name text not null,
  model text not null,
  instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into agent_workspaces (id, name, model, instructions)
values ('default', 'Homeview Agent', 'openai/gpt-4o-mini', '')
on conflict (id) do nothing;

create table if not exists agent_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null references agent_workspaces(id) on delete cascade,
  object_key text not null unique,
  file_name text not null,
  media_type text not null,
  source_kind text not null check (source_kind in ('text', 'pdf', 'image')),
  size_bytes int not null check (size_bytes >= 0),
  public_url text not null,
  text_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_sources_workspace_created_at_idx
  on agent_sources(workspace_id, created_at desc);
