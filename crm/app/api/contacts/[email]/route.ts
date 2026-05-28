import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { getContact } from "@/lib/crm-data";

export async function GET(_: Request, { params }: { params: Promise<{ email: string }> }) {
  await requireCurrentUser();
  const { email } = await params;
  const contact = await getContact(decodeURIComponent(email));

  if (!contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  return NextResponse.json({ contact });
}
