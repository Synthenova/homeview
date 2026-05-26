create table if not exists crm_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'viewer')),
  created_by_email text not null,
  created_by_role text not null check (created_by_role in ('super_admin', 'admin')),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create unique index if not exists crm_users_email_lower_unique
  on crm_users (lower(email));

create index if not exists crm_users_active_idx
  on crm_users (lower(email))
  where disabled_at is null;
