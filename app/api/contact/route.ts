import { NextResponse } from "next/server";
import { contactEmail } from "@/lib/site";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.message) {
    return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
  }

  // Replace this with Resend, Postmark, or a CRM webhook when production mail is connected.
  console.log("Homeview contact request", {
    to: contactEmail,
    name: body.name,
    email: body.email,
    projectType: body.projectType,
    message: body.message
  });

  return NextResponse.json({ ok: true });
}
