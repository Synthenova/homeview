import { NextResponse } from "next/server";
import { getAllowedSourceType, listAgentSources, stripHtmlToText } from "../../../../../shared/agent-config";
import { buildPublicObjectUrl, uploadObjectToR2 } from "../../../../../shared/r2";
import { requireCurrentUser } from "@/lib/auth";
import { createAgentSource } from "@/lib/agent-data";
import { sql } from "@/lib/db";

export const maxDuration = 300;

const MAX_SOURCE_SIZE_BYTES = 10 * 1024 * 1024;

function slugifyFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${safeBase || "source"}${extension.toLowerCase()}`;
}

async function extractTextContent(file: File, mediaType: string) {
  const raw = await file.text();

  if (mediaType === "text/html") {
    return stripHtmlToText(raw);
  }

  return raw.trim();
}

export async function GET() {
  await requireCurrentUser();
  const sources = await listAgentSources(sql);
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  await requireCurrentUser();
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const allowed = getAllowedSourceType(file.name, file.type || null);
  if (!allowed) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: txt, md, html, pdf, png, jpg, jpeg, webp, gif." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SOURCE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10 MB upload limit." }, { status: 400 });
  }

  const objectKey = `agent-sources/${Date.now()}-${slugifyFileName(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await uploadObjectToR2({
    key: objectKey,
    body: bytes,
    contentType: allowed.mediaType
  });

  const source = await createAgentSource({
    objectKey,
    fileName: file.name,
    mediaType: allowed.mediaType,
    sourceKind: allowed.kind,
    sizeBytes: file.size,
    publicUrl: buildPublicObjectUrl(objectKey),
    textContent: allowed.kind === "text" ? await extractTextContent(file, allowed.mediaType) : null
  });

  return NextResponse.json({ source });
}
