"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canDeleteUsers, normalizeEmail, requireUserManager } from "@/lib/auth";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function createCrmUser(_previousState: { error?: string; ok?: string }, formData: FormData) {
  const actor = await requireUserManager();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");

  if (!email || !password || !["admin", "viewer"].includes(role)) {
    return { error: "Enter an email, password, and valid role." };
  }

  if (password.length < 10) {
    return { error: "Use a password with at least 10 characters." };
  }

  try {
    await sql`
      insert into crm_users (email, password_hash, role, created_by_email, created_by_role)
      values (${email}, ${hashPassword(password)}, ${role}, ${actor.email}, ${actor.role})
    `;
  } catch (error) {
    if (error instanceof Error && error.message.includes("crm_users_email_lower_unique")) {
      return { error: "A user with that email already exists." };
    }

    return { error: "Could not create user." };
  }

  revalidatePath("/users");
  return { ok: "User created." };
}

export async function disableCrmUser(formData: FormData) {
  const actor = await requireUserManager();
  if (!canDeleteUsers(actor.role)) redirect("/users");

  const userId = String(formData.get("userId") || "");
  if (!userId) redirect("/users");

  await sql`
    update crm_users
    set disabled_at = now()
    where id = ${userId}
      and disabled_at is null
  `;

  revalidatePath("/users");
  redirect("/users");
}
