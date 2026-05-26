create extension if not exists pgcrypto;

create table if not exists visitor_sessions (
  id text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  user_agent text,
  referrer text,
  landing_page text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists session_identities (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references visitor_sessions(id) on delete cascade,
  email text,
  name text,
  phone text,
  source text not null check (source in ('chat', 'contact_form', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists session_identities_session_id_idx on session_identities(session_id);
create index if not exists session_identities_email_idx on session_identities(lower(email));

create table if not exists chat_threads (
  id text primary key,
  session_id text not null references visitor_sessions(id) on delete cascade,
  title text,
  status text not null default 'active' check (
    status in ('active', 'completed', 'interrupted', 'failed', 'closed')
  ),
  active_stream_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_threads_session_id_updated_at_idx
  on chat_threads(session_id, updated_at desc);
create index if not exists chat_threads_updated_at_idx on chat_threads(updated_at desc);

create table if not exists chat_messages (
  id text primary key,
  chat_id text not null references chat_threads(id) on delete cascade,
  session_id text not null references visitor_sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  parts jsonb not null default '[]'::jsonb,
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chat_id_created_at_idx
  on chat_messages(chat_id, created_at asc);
create index if not exists chat_messages_session_id_idx on chat_messages(session_id);

create table if not exists chat_runs (
  id text primary key,
  chat_id text not null references chat_threads(id) on delete cascade,
  session_id text not null references visitor_sessions(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'failed', 'interrupted')),
  stream_id text,
  model text,
  attempt_count int not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create index if not exists chat_runs_chat_id_started_at_idx on chat_runs(chat_id, started_at desc);
create index if not exists chat_runs_status_idx on chat_runs(status);

create table if not exists contact_queries (
  id uuid primary key default gen_random_uuid(),
  session_id text references visitor_sessions(id) on delete set null,
  name text,
  email text not null,
  project_type text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists contact_queries_session_id_idx on contact_queries(session_id);
create index if not exists contact_queries_created_at_idx on contact_queries(created_at desc);
create index if not exists contact_queries_email_idx on contact_queries(lower(email));

create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  chat_id text references chat_threads(id) on delete set null,
  run_id text references chat_runs(id) on delete set null,
  session_id text references visitor_sessions(id) on delete set null,
  model text not null,
  input_tokens int,
  output_tokens int,
  total_tokens int,
  estimated_cost_usd numeric(12, 6),
  raw_usage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_chat_id_idx on ai_usage(chat_id);
create index if not exists ai_usage_created_at_idx on ai_usage(created_at desc);

create or replace view crm_session_summaries as
select
  s.id,
  s.first_seen_at,
  s.last_seen_at,
  s.user_agent,
  s.referrer,
  s.landing_page,
  coalesce(count(distinct t.id), 0)::int as chat_count,
  coalesce(count(distinct m.id), 0)::int as message_count,
  max(i.email) filter (where i.email is not null) as contact_email,
  max(i.name) filter (where i.name is not null) as contact_name,
  max(t.updated_at) as latest_chat_at,
  case
    when max(i.email) filter (where i.email is not null) is not null then 'identified'
    else 'anonymous'
  end as lead_status
from visitor_sessions s
left join chat_threads t on t.session_id = s.id
left join chat_messages m on m.session_id = s.id
left join session_identities i on i.session_id = s.id
group by s.id;

create or replace view crm_chat_summaries as
select
  t.id,
  t.session_id,
  t.title,
  t.status,
  t.active_stream_id,
  t.last_error,
  t.created_at,
  t.updated_at,
  coalesce(count(m.id), 0)::int as message_count,
  coalesce(sum(u.estimated_cost_usd), 0)::numeric(12, 6) as estimated_cost_usd,
  (
    select cm.content
    from chat_messages cm
    where cm.chat_id = t.id
    order by cm.created_at desc
    limit 1
  ) as last_message_preview
from chat_threads t
left join chat_messages m on m.chat_id = t.id
left join ai_usage u on u.chat_id = t.id
group by t.id;
