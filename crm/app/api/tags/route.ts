import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { createStandaloneCrmTag, getCrmFilters } from "@/lib/crm-data";

export async function GET() {
  await requireCurrentUser();
  const { tags } = await getCrmFilters();
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  await requireCurrentUser();
  const body = (await request.json().catch(() => null)) as { name?: string; color?: string | null } | null;

  if (!body?.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const tag = await createStandaloneCrmTag(body.name, body.color ?? null);
  return NextResponse.json({ tag });
}
