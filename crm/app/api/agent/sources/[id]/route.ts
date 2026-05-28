import { NextResponse } from "next/server";
import { deleteObjectFromR2 } from "../../../../../../shared/r2";
import { requireCurrentUser } from "@/lib/auth";
import { readAgentSource, removeAgentSource } from "@/lib/agent-data";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireCurrentUser();
  const { id } = await params;
  const source = await readAgentSource(id);

  if (!source) {
    return NextResponse.json({ error: "Source not found." }, { status: 404 });
  }

  await deleteObjectFromR2(source.objectKey);
  await removeAgentSource(id);

  return NextResponse.json({ ok: true });
}
