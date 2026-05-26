import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { verifyPassword } from "./password";
import { CRM_SESSION_COOKIE, type CrmRole, type CrmSession, verifySessionToken } from "./session";

export type CrmUser = {
  id: string;
  email: string;
  role: "admin" | "viewer";
  created_by_email: string;
  created_by_role: "super_admin" | "admin";
  created_at: Date;
  disabled_at: Date | null;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function canCreateUsers(role: CrmRole) {
  return role === "super_admin" || role === "admin";
}

export function canDeleteUsers(role: CrmRole) {
  return role === "super_admin";
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CRM_SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return user;
}

export async function requireUserManager() {
  const user = await requireCurrentUser();
  if (!canCreateUsers(user.role)) redirect("/");

  return user;
}

export async function authenticateCrmUser(email: string, password: string): Promise<Omit<CrmSession, "exp"> | null> {
  const normalizedEmail = normalizeEmail(email);
  const superAdminEmail = normalizeEmail(process.env.CRM_SUPER_ADMIN_EMAIL || "");
  const superAdminHash = process.env.CRM_SUPER_ADMIN_PASSWORD_HASH || "";

  if (superAdminEmail && normalizedEmail === superAdminEmail) {
    if (!superAdminHash || !verifyPassword(password, superAdminHash)) return null;

    return {
      email: normalizedEmail,
      role: "super_admin",
      source: "env"
    };
  }

  const [user] = (await sql`
    select id, email, password_hash, role
    from crm_users
    where lower(email) = ${normalizedEmail}
      and disabled_at is null
    limit 1
  `) as Array<{ id: string; email: string; password_hash: string; role: "admin" | "viewer" }>;

  if (!user || !verifyPassword(password, user.password_hash)) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    source: "db"
  };
}

export async function getCrmUsers() {
  return sql`
    select id, email, role, created_by_email, created_by_role, created_at, disabled_at
    from crm_users
    order by created_at desc
  ` as Promise<CrmUser[]>;
}
