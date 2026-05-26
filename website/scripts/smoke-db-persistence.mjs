import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL or SUPABASE_DATABASE_URL.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const id = `smoke_${crypto.randomUUID()}`;

try {
  await sql`
    create table if not exists homeview_smoke_events (
      id text primary key,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    insert into homeview_smoke_events (id, payload)
    values (${id}, ${sql.json({ kind: "chat-persistence-smoke", ok: true })})
  `;

  const rows = await sql`
    select id, payload
    from homeview_smoke_events
    where id = ${id}
  `;

  if (rows.length !== 1 || rows[0].payload.kind !== "chat-persistence-smoke") {
    throw new Error("Inserted smoke row could not be read back.");
  }

  await sql`delete from homeview_smoke_events where id = ${id}`;

  console.log({
    database: "ok",
    inserted: true,
    readBack: true,
    cleanedUp: true
  });
} finally {
  await sql.end({ timeout: 5 });
}
