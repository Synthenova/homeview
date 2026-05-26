import { NextResponse } from "next/server";
import { authenticateCrmUser } from "@/lib/auth";
import { createSessionToken, CRM_SESSION_COOKIE } from "@/lib/session";

function redirectWithError(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);

  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!email || !password) {
    return redirectWithError(request, "missing");
  }

  const user = await authenticateCrmUser(email, password);
  if (!user) {
    return redirectWithError(request, "invalid");
  }

  const token = await createSessionToken(user);
  const redirectUrl = new URL(next.startsWith("/") ? next : "/", request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(CRM_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
