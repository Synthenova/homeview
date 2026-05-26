import { NextResponse } from "next/server";
import { CRM_SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set(CRM_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}
