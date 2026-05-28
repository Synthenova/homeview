import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { attachCrmContactTag, detachCrmContactTag } from "@/lib/crm-data";

export async function POST(request: Request, { params }: { params: Promise<{ email: string }> }) {
  await requireCurrentUser();
  const { email } = await params;
  const body = (await request.json().catch(() => null)) as { tag?: string; color?: string | null } | null;

  if (!body?.tag) {
    return NextResponse.json({ error: "Tag is required." }, { status: 400 });
  }

  const tag = await attachCrmContactTag(decodeURIComponent(email), body.tag, body.color ?? null);
  return NextResponse.json({ tag });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ email: string }> }) {
  await requireCurrentUser();
  const { email } = await params;
  const body = (await request.json().catch(() => null)) as { tag?: string } | null;

  if (!body?.tag) {
    return NextResponse.json({ error: "Tag is required." }, { status: 400 });
  }

  await detachCrmContactTag(decodeURIComponent(email), body.tag);
  return NextResponse.json({ ok: true });
}
