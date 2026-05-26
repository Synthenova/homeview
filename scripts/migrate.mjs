import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL or SUPABASE_DATABASE_URL.");
  process.exit(1);
}

const root = process.cwd();
const migrationsDir = path.join(root, "migrations");
const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const existing = await sql`select version from schema_migrations where version = ${version}`;

    if (existing.length > 0) {
      console.log(`skip ${version}`);
      continue;
    }

    const content = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`insert into schema_migrations (version) values (${version})`;
    });
    console.log(`applied ${version}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
