import { sql } from "./db";

export async function getDashboardStats() {
  const [stats] = await sql`
    select
      (select count(*)::int from visitor_sessions) as sessions,
      (select count(*)::int from chat_threads) as chats,
      (select count(*)::int from contact_queries where status = 'new') as new_contacts,
      (select coalesce(sum(estimated_cost_usd), 0)::numeric(12, 6) from ai_usage) as ai_spend
  `;

  return {
    sessions: stats.sessions as number,
    chats: stats.chats as number,
    newContacts: stats.new_contacts as number,
    aiSpend: Number(stats.ai_spend ?? 0)
  };
}

export async function getSessions() {
  return sql`
    select *
    from crm_session_summaries
    order by coalesce(latest_chat_at, last_seen_at) desc
    limit 100
  `;
}

export async function getSession(id: string) {
  const [session] = await sql`
    select *
    from crm_session_summaries
    where id = ${id}
  `;

  const chats = await sql`
    select *
    from crm_chat_summaries
    where session_id = ${id}
    order by updated_at desc
  `;

  const contacts = await sql`
    select *
    from crm_contact_queries
    where session_id = ${id}
    order by created_at desc
  `;

  return { session, chats, contacts };
}

export async function getChats() {
  return sql`
    select *
    from crm_chat_summaries
    order by updated_at desc
    limit 100
  `;
}

export async function getChat(id: string) {
  const [chat] = await sql`
    select *
    from crm_chat_summaries
    where id = ${id}
  `;

  const messages = await sql`
    select *
    from chat_messages
    where chat_id = ${id}
    order by created_at asc
  `;

  const runs = await sql`
    select *
    from chat_runs
    where chat_id = ${id}
    order by started_at desc
  `;

  return { chat, messages, runs };
}

export async function getContacts() {
  return sql`
    select *
    from crm_contact_queries
    order by created_at desc
    limit 100
  `;
}
