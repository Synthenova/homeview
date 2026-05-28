create table if not exists crm_contact_statuses (
  name text primary key,
  label text not null,
  sort_order int not null default 999,
  created_at timestamptz not null default now()
);

insert into crm_contact_statuses (name, label, sort_order)
values
  ('new', 'New', 10),
  ('engaged', 'Engaged', 20),
  ('qualified', 'Qualified', 30),
  ('proposal_sent', 'Proposal Sent', 40),
  ('follow_up', 'Follow Up', 50),
  ('won', 'Won', 60),
  ('lost', 'Lost', 70),
  ('archived', 'Archived', 80)
on conflict (name) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

create table if not exists crm_contact_profiles (
  email_normalized text primary key,
  display_name text,
  status text not null default 'new' references crm_contact_statuses(name),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_contact_profiles_status_idx
  on crm_contact_profiles(status);

create table if not exists crm_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create unique index if not exists crm_tags_name_lower_unique
  on crm_tags(lower(name));

create table if not exists crm_contact_profile_tags (
  email_normalized text not null references crm_contact_profiles(email_normalized) on delete cascade,
  tag_id uuid not null references crm_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (email_normalized, tag_id)
);

create index if not exists crm_contact_profile_tags_tag_id_idx
  on crm_contact_profile_tags(tag_id);
