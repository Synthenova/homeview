import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { updateCrmContactStatus } from "@/lib/crm-data";

export async function PATCH(request: Request, { params }: { params: Promise<{ email: string }> }) {
  await requireCurrentUser();
  const { email } = await params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;

  if (!body?.status) {
    return NextResponse.json({ error: "Status is required." }, { status: 400 });
  }

  const status = await updateCrmContactStatus(decodeURIComponent(email), body.status);
  return NextResponse.json({ status });
}
