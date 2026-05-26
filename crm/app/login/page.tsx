import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const errorMessages: Record<string, string> = {
  invalid: "Email or password is incorrect.",
  missing: "Enter both email and password."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (user) redirect(params.next || "/");

  const isConfigured =
    Boolean(process.env.CRM_SESSION_SECRET) &&
    Boolean(process.env.CRM_SUPER_ADMIN_EMAIL) &&
    Boolean(process.env.CRM_SUPER_ADMIN_PASSWORD_HASH);

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Homeview CRM</p>
          <h1>Sign in</h1>
        </div>
        {!isConfigured ? (
          <p className="form-error">
            CRM auth is not configured. Set CRM_SUPER_ADMIN_EMAIL, CRM_SUPER_ADMIN_PASSWORD_HASH, and
            CRM_SESSION_SECRET.
          </p>
        ) : null}
        {params.error ? <p className="form-error">{errorMessages[params.error] || "Sign in failed."}</p> : null}
        <form action="/api/login" className="crm-form" method="post">
          <input name="next" type="hidden" value={params.next || "/"} />
          <label>
            Email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Password
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          <button disabled={!isConfigured} type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
