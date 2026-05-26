export type CrmRole = "super_admin" | "admin" | "viewer";

export type CrmSession = {
  email: string;
  role: CrmRole;
  source: "env" | "db";
  userId?: string;
  exp: number;
};

export const CRM_SESSION_COOKIE = "crm_session";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlDecode(value: string) {
  return decoder.decode(base64UrlToBytes(value));
}

function bytesToBase64Url(bytes: Uint8Array | ArrayBuffer) {
  const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";

  for (const byte of byteArray) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return bytesToBase64Url(signature);
}

function timingSafeEqualString(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);

  if (leftBytes.length !== rightBytes.length) return false;

  let diff = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }

  return diff === 0;
}

export function getSessionSecret() {
  return process.env.CRM_SESSION_SECRET || "";
}

export async function createSessionToken(session: Omit<CrmSession, "exp">) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Missing CRM_SESSION_SECRET.");

  const payload = base64UrlEncode(
    JSON.stringify({
      ...session,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    })
  );
  const signature = await signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined) {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = await signPayload(payload, secret);
  if (!timingSafeEqualString(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as CrmSession;
    if (!session.email || !session.role || !session.exp) return null;
    if (session.exp <= Math.floor(Date.now() / 1000)) return null;

    return session;
  } catch {
    return null;
  }
}
