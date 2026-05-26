import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var homeviewCrmSql: ReturnType<typeof postgres> | undefined;
}

function getClient() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL or SUPABASE_DATABASE_URL.");
  }

  const client =
    globalThis.homeviewCrmSql ??
    postgres(databaseUrl, {
      max: 5,
      prepare: false
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.homeviewCrmSql = client;
  }

  return client;
}

export const sql = new Proxy(function sqlProxy() {}, {
  apply(_target, _thisArg, argArray) {
    return getClient()(argArray[0], ...argArray.slice(1));
  },
  get(_target, prop) {
    return getClient()[prop as keyof ReturnType<typeof postgres>];
  }
}) as unknown as ReturnType<typeof postgres>;
