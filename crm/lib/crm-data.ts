import { sql } from "./db";
import {
  addCrmContactTag,
  createCrmStatus,
  createCrmTag,
  getCrmContactDetail,
  listCrmContactSummaries,
  listCrmStatuses,
  listCrmTags,
  removeCrmContactTag,
  setCrmContactStatus,
  type CrmContactDetail,
  type CrmContactSummary,
  type CrmStatusDefinition,
  type CrmTag
} from "../../shared/crm-contacts";

export async function getDashboardStats() {
  const [stats] = await sql`
    select
      (select count(*)::int from crm_contact_profiles) as contacts,
      (select count(*)::int from chat_messages) as messages,
      (select count(*)::int from crm_contact_profiles where status = 'new') as new_contacts,
      (select coalesce(sum(estimated_cost_usd), 0)::numeric(12, 6) from ai_usage) as ai_spend
  `;

  return {
    contacts: stats.contacts as number,
    messages: stats.messages as number,
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
  return listCrmContactSummaries(sql);
}

export async function getContact(email: string): Promise<CrmContactDetail | null> {
  return getCrmContactDetail(sql, email);
}

export async function getCrmFilters(): Promise<{
  statuses: CrmStatusDefinition[];
  tags: CrmTag[];
  projectTypes: string[];
}> {
  const [statuses, tags, projectTypeRows] = await Promise.all([
    listCrmStatuses(sql),
    listCrmTags(sql),
    sql<{ project_type: string }[]>`
      select distinct project_type
      from contact_queries
      where project_type is not null
      order by project_type asc
    `
  ]);

  return {
    statuses,
    tags,
    projectTypes: projectTypeRows.map((row) => row.project_type)
  };
}

export async function updateCrmContactStatus(email: string, status: string) {
  return setCrmContactStatus(sql, email, status);
}

export async function createCrmContactStatus(name: string, label?: string | null) {
  return createCrmStatus(sql, { name, label });
}

export async function attachCrmContactTag(email: string, name: string, color?: string | null) {
  return addCrmContactTag(sql, email, { name, color });
}

export async function detachCrmContactTag(email: string, tagName: string) {
  return removeCrmContactTag(sql, email, tagName);
}

export async function createStandaloneCrmTag(name: string, color?: string | null) {
  return createCrmTag(sql, { name, color });
}

export type { CrmContactDetail, CrmContactSummary, CrmStatusDefinition, CrmTag };
