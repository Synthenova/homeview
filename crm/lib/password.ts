import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("base64url");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split(":");

  if (method !== "scrypt" || !salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "base64url");

  if (candidate.length !== expected.length) return false;

  return crypto.timingSafeEqual(candidate, expected);
}
