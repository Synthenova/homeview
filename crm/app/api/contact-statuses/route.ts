import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { createCrmContactStatus, getCrmFilters } from "@/lib/crm-data";

export async function GET() {
  await requireCurrentUser();
  const { statuses } = await getCrmFilters();
  return NextResponse.json({ statuses });
}

export async function POST(request: Request) {
  await requireCurrentUser();
  const body = (await request.json().catch(() => null)) as { name?: string; label?: string | null } | null;

  if (!body?.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const status = await createCrmContactStatus(body.name, body.label);
  return NextResponse.json({ status });
}
