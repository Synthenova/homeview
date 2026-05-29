import { defaultStatusColorForName, resolveStatusColor } from "./crm-status-colors";

type SqlLike = any;

export type CrmStatusDefinition = {
  name: string;
  label: string;
  sortOrder: number;
  color: string;
};

export type CrmTag = {
  id: string;
  name: string;
  color: string | null;
};

export type CrmContactSummary = {
  emailNormalized: string;
  email: string;
  displayName: string | null;
  status: string;
  statusLabel: string;
  notes: string;
  requestCount: number;
  sessionCount: number;
  chatCount: number;
  messageCount: number;
  aiSpend: number;
  firstContactAt: string | null;
  latestContactAt: string | null;
  lastSeenAt: string | null;
  latestProjectType: string | null;
  projectTypes: string[];
  latestInquiry: string | null;
  latestChatPreview: string | null;
  tags: CrmTag[];
};

export type CrmContactDetail = CrmContactSummary & {
  sessions: Array<{
    sessionId: string;
    firstSeenAt: string;
    lastSeenAt: string;
    landingPage: string | null;
    referrer: string | null;
  }>;
  chats: Array<{
    id: string;
    title: string | null;
    status: string;
    updatedAt: string;
    messageCount: number;
    estimatedCostUsd: number;
    lastMessagePreview: string | null;
  }>;
  requests: Array<{
    id: string;
    createdAt: string;
    name: string | null;
    email: string;
    projectType: string | null;
    message: string;
    status: string;
  }>;
};

export type CrmContactFilters = {
  search?: string;
  status?: string | null;
  tag?: string | null;
  projectType?: string | null;
  sort?: "latest_activity" | "first_contact" | "most_requests" | "most_chats" | "highest_spend" | "email";
};

type ContactAggregateRow = {
  email_normalized: string;
  email: string;
  display_name: string | null;
  request_count: number;
  first_contact_at: Date | null;
  latest_contact_at: Date | null;
  latest_project_type: string | null;
  latest_inquiry: string | null;
  project_types: string[] | null;
};

type SessionAggregateRow = {
  email_normalized: string;
  session_count: number;
  chat_count: number;
  message_count: number;
  ai_spend: string | number | null;
  last_seen_at: Date | null;
};

type ProfileRow = {
  email_normalized: string;
  display_name: string | null;
  status: string;
  status_label: string | null;
  notes: string | null;
  updated_at: Date;
};

type LatestChatRow = {
  email_normalized: string;
  last_message_preview: string | null;
};

type TagRow = {
  email_normalized: string;
  id: string;
  name: string;
  color: string | null;
};

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function normalizeContactEmail(email: string) {
  return email.trim().toLowerCase();
}

function titleCaseFromSlug(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function listCrmStatuses(sql: SqlLike): Promise<CrmStatusDefinition[]> {
  const rows = (await sql<{
    name: string;
    label: string;
    sort_order: number;
    color: string | null;
  }>`
    select name, label, sort_order, color
    from crm_contact_statuses
    order by sort_order asc, lower(label) asc
  `) as Array<{ name: string; label: string; sort_order: number; color: string | null }>;

  return rows.map((row: { name: string; label: string; sort_order: number; color: string | null }) => ({
    name: row.name,
    label: row.label,
    sortOrder: row.sort_order,
    color: resolveStatusColor(row.name, row.color)
  }));
}

export async function createCrmStatus(
  sql: SqlLike,
  input: { name: string; label?: string | null; sortOrder?: number | null }
) {
  const name = normalizeContactEmail(input.name).replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!name) {
    throw new Error("Status name is required.");
  }

  const label = input.label?.trim() || titleCaseFromSlug(name);
  const color = defaultStatusColorForName(name);

  const [row] = await sql<{
    name: string;
    label: string;
    sort_order: number;
    color: string | null;
  }>`
    insert into crm_contact_statuses (name, label, sort_order, color)
    values (
      ${name},
      ${label},
      ${input.sortOrder ?? 999},
      ${color}
    )
    on conflict (name) do update set
      label = excluded.label
    returning name, label, sort_order, color
  `;

  return {
    name: row.name,
    label: row.label,
    sortOrder: row.sort_order,
    color: resolveStatusColor(row.name, row.color)
  };
}

export async function listCrmTags(sql: SqlLike): Promise<CrmTag[]> {
  const rows = (await sql<{
    id: string;
    name: string;
    color: string | null;
  }>`
    select id, name, color
    from crm_tags
    order by lower(name) asc
  `) as Array<{ id: string; name: string; color: string | null }>;

  return rows.map((row: { id: string; name: string; color: string | null }) => ({
    id: row.id,
    name: row.name,
    color: row.color
  }));
}

export async function createCrmTag(sql: SqlLike, input: { name: string; color?: string | null }) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Tag name is required.");
  }

  const [existing] = await sql<{
    id: string;
    name: string;
    color: string | null;
  }>`
    select id, name, color
    from crm_tags
    where lower(name) = lower(${name})
    limit 1
  `;

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      color: existing.color
    };
  }

  const [row] = await sql<{
    id: string;
    name: string;
    color: string | null;
  }>`
    insert into crm_tags (name, color)
    values (${name}, ${input.color ?? null})
    returning id, name, color
  `;

  return {
    id: row.id,
    name: row.name,
    color: row.color
  };
}

export async function ensureCrmContactProfile(
  sql: SqlLike,
  input: { email: string; displayName?: string | null }
) {
  const emailNormalized = normalizeContactEmail(input.email);
  if (!emailNormalized) {
    throw new Error("Email is required.");
  }

  await sql`
    insert into crm_contact_profiles (email_normalized, display_name)
    values (${emailNormalized}, ${input.displayName?.trim() || null})
    on conflict (email_normalized) do update set
      display_name = coalesce(crm_contact_profiles.display_name, excluded.display_name),
      updated_at = now()
  `;

  return emailNormalized;
}

export async function resolveContactEmailBySession(sql: SqlLike, sessionId: string) {
  const [row] = await sql<{
    email: string | null;
  }>`
    select email
    from session_identities
    where session_id = ${sessionId}
      and email is not null
    order by created_at desc
    limit 1
  `;

  return row?.email ? normalizeContactEmail(row.email) : null;
}

async function listContactAggregateRows(sql: SqlLike) {
  const [contactRows, sessionRows, profileRows, latestChatRows, tagRows] = await Promise.all([
    sql<ContactAggregateRow[]>`
      with emails as (
        select lower(email) as email_normalized
        from contact_queries
        where email is not null
        union
        select lower(email) as email_normalized
        from session_identities
        where email is not null
      )
      select
        emails.email_normalized,
        coalesce(
          (
            select cq.email
            from contact_queries cq
            where lower(cq.email) = emails.email_normalized
            order by cq.created_at desc
            limit 1
          ),
          (
            select si.email
            from session_identities si
            where lower(si.email) = emails.email_normalized
            order by si.created_at desc
            limit 1
          )
        ) as email,
        coalesce(
          (
            select cq.name
            from contact_queries cq
            where lower(cq.email) = emails.email_normalized
              and cq.name is not null
            order by cq.created_at desc
            limit 1
          ),
          (
            select si.name
            from session_identities si
            where lower(si.email) = emails.email_normalized
              and si.name is not null
            order by si.created_at desc
            limit 1
          )
        ) as display_name,
        (
          select count(*)::int
          from contact_queries cq
          where lower(cq.email) = emails.email_normalized
        ) as request_count,
        (
          select min(cq.created_at)
          from contact_queries cq
          where lower(cq.email) = emails.email_normalized
        ) as first_contact_at,
        (
          select max(cq.created_at)
          from contact_queries cq
          where lower(cq.email) = emails.email_normalized
        ) as latest_contact_at,
        (
          select cq.project_type
          from contact_queries cq
          where lower(cq.email) = emails.email_normalized
            and cq.project_type is not null
          order by cq.created_at desc
          limit 1
        ) as latest_project_type,
        (
          select cq.message
          from contact_queries cq
          where lower(cq.email) = emails.email_normalized
          order by cq.created_at desc
          limit 1
        ) as latest_inquiry,
        coalesce(
          (
            select array_agg(distinct cq.project_type) filter (where cq.project_type is not null)
            from contact_queries cq
            where lower(cq.email) = emails.email_normalized
          ),
          '{}'::text[]
        ) as project_types
      from emails
    `,
    sql<SessionAggregateRow[]>`
      with email_sessions as (
        select distinct lower(email) as email_normalized, session_id
        from session_identities
        where email is not null
      )
      select
        email_sessions.email_normalized,
        count(distinct email_sessions.session_id)::int as session_count,
        coalesce(sum(chat_counts.chat_count), 0)::int as chat_count,
        coalesce(sum(message_counts.message_count), 0)::int as message_count,
        coalesce(sum(spend.cost_usd), 0)::numeric(12, 6) as ai_spend,
        max(vs.last_seen_at) as last_seen_at
      from email_sessions
      left join visitor_sessions vs
        on vs.id = email_sessions.session_id
      left join lateral (
        select count(*)::int as chat_count
        from chat_threads t
        where t.session_id = email_sessions.session_id
      ) chat_counts on true
      left join lateral (
        select count(*)::int as message_count
        from chat_messages m
        where m.session_id = email_sessions.session_id
      ) message_counts on true
      left join lateral (
        select coalesce(sum(u.estimated_cost_usd), 0)::numeric(12, 6) as cost_usd
        from ai_usage u
        where u.session_id = email_sessions.session_id
      ) spend on true
      group by email_sessions.email_normalized
    `,
    sql<ProfileRow[]>`
      select
        p.email_normalized,
        p.display_name,
        p.status,
        s.label as status_label,
        p.notes,
        p.updated_at
      from crm_contact_profiles p
      join crm_contact_statuses s
        on s.name = p.status
    `,
    sql<LatestChatRow[]>`
      with email_sessions as (
        select distinct lower(email) as email_normalized, session_id
        from session_identities
        where email is not null
      ),
      ranked_messages as (
        select
          email_sessions.email_normalized,
          cm.content as last_message_preview,
          row_number() over (
            partition by email_sessions.email_normalized
            order by cm.created_at desc
          ) as row_number
        from email_sessions
        join chat_threads t
          on t.session_id = email_sessions.session_id
        join chat_messages cm
          on cm.chat_id = t.id
      )
      select email_normalized, last_message_preview
      from ranked_messages
      where row_number = 1
    `,
    sql<TagRow[]>`
      select
        cpt.email_normalized,
        t.id,
        t.name,
        t.color
      from crm_contact_profile_tags cpt
      join crm_tags t
        on t.id = cpt.tag_id
      order by cpt.email_normalized, lower(t.name)
    `
  ]);

  return { contactRows, sessionRows, profileRows, latestChatRows, tagRows };
}

function buildContactSummariesFromRows(rows: Awaited<ReturnType<typeof listContactAggregateRows>>) {
  const sessionMap = new Map<string, SessionAggregateRow>(
    rows.sessionRows.map((row: SessionAggregateRow) => [row.email_normalized, row])
  );
  const profileMap = new Map<string, ProfileRow>(
    rows.profileRows.map((row: ProfileRow) => [row.email_normalized, row])
  );
  const latestChatMap = new Map<string, string | null>(
    rows.latestChatRows.map((row: LatestChatRow) => [row.email_normalized, row.last_message_preview])
  );
  const tagMap = new Map<string, CrmTag[]>();

  for (const row of rows.tagRows) {
    tagMap.set(row.email_normalized, [
      ...(tagMap.get(row.email_normalized) ?? []),
      {
        id: row.id,
        name: row.name,
        color: row.color
      }
    ]);
  }

  return rows.contactRows.map((row: ContactAggregateRow) => {
    const sessionData = sessionMap.get(row.email_normalized);
    const profile = profileMap.get(row.email_normalized);

    return {
      emailNormalized: row.email_normalized,
      email: row.email,
      displayName: profile?.display_name ?? row.display_name,
      status: profile?.status ?? "new",
      statusLabel: profile?.status_label ?? "New",
      notes: profile?.notes ?? "",
      requestCount: row.request_count ?? 0,
      sessionCount: sessionData?.session_count ?? 0,
      chatCount: sessionData?.chat_count ?? 0,
      messageCount: sessionData?.message_count ?? 0,
      aiSpend: Number(sessionData?.ai_spend ?? 0),
      firstContactAt: iso(row.first_contact_at),
      latestContactAt: iso(row.latest_contact_at),
      lastSeenAt: iso(sessionData?.last_seen_at),
      latestProjectType: row.latest_project_type,
      projectTypes: row.project_types ?? [],
      latestInquiry: row.latest_inquiry,
      latestChatPreview: latestChatMap.get(row.email_normalized) ?? null,
      tags: tagMap.get(row.email_normalized) ?? []
    } satisfies CrmContactSummary;
  });
}

export async function listCrmContactSummaries(sql: SqlLike, filters: CrmContactFilters = {}) {
  const rows = await listContactAggregateRows(sql);
  let summaries: CrmContactSummary[] = buildContactSummariesFromRows(rows);

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    summaries = summaries.filter((contact: CrmContactSummary) =>
      [contact.email, contact.displayName, contact.latestInquiry, contact.latestChatPreview]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search))
    );
  }

  if (filters.status) {
    summaries = summaries.filter((contact: CrmContactSummary) => contact.status === filters.status);
  }

  if (filters.tag) {
    const tag = filters.tag.toLowerCase();
    summaries = summaries.filter((contact: CrmContactSummary) =>
      contact.tags.some((item: CrmTag) => item.name.toLowerCase() === tag)
    );
  }

  if (filters.projectType) {
    const projectType = filters.projectType.toLowerCase();
    summaries = summaries.filter((contact: CrmContactSummary) =>
      contact.projectTypes.some((item: string) => item.toLowerCase() === projectType)
    );
  }

  const sort = filters.sort ?? "latest_activity";
  summaries.sort((left: CrmContactSummary, right: CrmContactSummary) => {
    switch (sort) {
      case "first_contact":
        return (new Date(left.firstContactAt ?? 0).getTime() || 0) - (new Date(right.firstContactAt ?? 0).getTime() || 0);
      case "most_requests":
        return right.requestCount - left.requestCount;
      case "most_chats":
        return right.chatCount - left.chatCount;
      case "highest_spend":
        return right.aiSpend - left.aiSpend;
      case "email":
        return left.email.localeCompare(right.email);
      case "latest_activity":
      default: {
        const leftActivity = new Date(left.lastSeenAt ?? left.latestContactAt ?? left.firstContactAt ?? 0).getTime();
        const rightActivity = new Date(right.lastSeenAt ?? right.latestContactAt ?? right.firstContactAt ?? 0).getTime();
        return rightActivity - leftActivity;
      }
    }
  });

  return summaries;
}

export async function getCrmContactDetail(sql: SqlLike, email: string): Promise<CrmContactDetail | null> {
  const emailNormalized = normalizeContactEmail(email);
  const summaries = await listCrmContactSummaries(sql);
  const summary = summaries.find((item: CrmContactSummary) => item.emailNormalized === emailNormalized);

  if (!summary) return null;

  const [sessions, chats, requests] = await Promise.all([
    sql<{
      session_id: string;
      first_seen_at: Date;
      last_seen_at: Date;
      landing_page: string | null;
      referrer: string | null;
    }[]>`
      with email_sessions as (
        select distinct session_id
        from session_identities
        where lower(email) = ${emailNormalized}
      )
      select
        vs.id as session_id,
        vs.first_seen_at,
        vs.last_seen_at,
        vs.landing_page,
        vs.referrer
      from email_sessions
      join visitor_sessions vs
        on vs.id = email_sessions.session_id
      order by vs.last_seen_at desc
    `,
    sql<{
      id: string;
      title: string | null;
      status: string;
      updated_at: Date;
      message_count: number;
      estimated_cost_usd: string | number | null;
      last_message_preview: string | null;
    }[]>`
      with email_sessions as (
        select distinct session_id
        from session_identities
        where lower(email) = ${emailNormalized}
      )
      select
        c.id,
        c.title,
        c.status,
        c.updated_at,
        c.message_count,
        c.estimated_cost_usd,
        c.last_message_preview
      from crm_chat_summaries c
      join email_sessions es
        on es.session_id = c.session_id
      order by c.updated_at desc
    `,
    sql<{
      id: string;
      created_at: Date;
      name: string | null;
      email: string;
      project_type: string | null;
      message: string;
      status: string;
    }[]>`
      select
        id,
        created_at,
        name,
        email,
        project_type,
        message,
        status
      from contact_queries
      where lower(email) = ${emailNormalized}
      order by created_at desc
    `
  ]);

  return {
    ...summary,
    sessions: sessions.map((row: {
      session_id: string;
      first_seen_at: Date;
      last_seen_at: Date;
      landing_page: string | null;
      referrer: string | null;
    }) => ({
      sessionId: row.session_id,
      firstSeenAt: row.first_seen_at.toISOString(),
      lastSeenAt: row.last_seen_at.toISOString(),
      landingPage: row.landing_page,
      referrer: row.referrer
    })),
    chats: chats.map((row: {
      id: string;
      title: string | null;
      status: string;
      updated_at: Date;
      message_count: number;
      estimated_cost_usd: string | number | null;
      last_message_preview: string | null;
    }) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updatedAt: row.updated_at.toISOString(),
      messageCount: row.message_count,
      estimatedCostUsd: Number(row.estimated_cost_usd ?? 0),
      lastMessagePreview: row.last_message_preview
    })),
    requests: requests.map((row: {
      id: string;
      created_at: Date;
      name: string | null;
      email: string;
      project_type: string | null;
      message: string;
      status: string;
    }) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      name: row.name,
      email: row.email,
      projectType: row.project_type,
      message: row.message,
      status: row.status
    }))
  };
}

export async function setCrmContactStatus(sql: SqlLike, email: string, status: string) {
  const emailNormalized = await ensureCrmContactProfile(sql, { email });
  const [statusRow] = await sql<{ name: string; label: string }[]>`
    select name, label
    from crm_contact_statuses
    where name = ${status}
    limit 1
  `;

  if (!statusRow) {
    throw new Error("Status does not exist.");
  }

  await sql`
    update crm_contact_profiles
    set status = ${status}, updated_at = now()
    where email_normalized = ${emailNormalized}
  `;

  return statusRow;
}

export async function addCrmContactTag(
  sql: SqlLike,
  email: string,
  input: { name: string; color?: string | null }
) {
  const emailNormalized = await ensureCrmContactProfile(sql, { email });
  const tag = await createCrmTag(sql, input);

  await sql`
    insert into crm_contact_profile_tags (email_normalized, tag_id)
    values (${emailNormalized}, ${tag.id})
    on conflict (email_normalized, tag_id) do nothing
  `;

  await sql`
    update crm_contact_profiles
    set updated_at = now()
    where email_normalized = ${emailNormalized}
  `;

  return tag;
}

export async function removeCrmContactTag(sql: SqlLike, email: string, tagName: string) {
  const emailNormalized = normalizeContactEmail(email);

  await sql`
    delete from crm_contact_profile_tags
    where email_normalized = ${emailNormalized}
      and tag_id in (
        select id
        from crm_tags
        where lower(name) = lower(${tagName})
      )
  `;

  await sql`
    update crm_contact_profiles
    set updated_at = now()
    where email_normalized = ${emailNormalized}
  `;
}
