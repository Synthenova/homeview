import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_BUCKET_NAME = "homeview";
const DEFAULT_PUBLIC_BASE_URL = "https://pub-fc879930da7e409380acfbef662b54bc.r2.dev";
const DEFAULT_ACCOUNT_ID = "c63c7a188a8f427836683d9a365ec2ad";

function readWranglerOAuthToken() {
  try {
    const filePath = path.join(os.homedir(), "Library/Preferences/.wrangler/config/default.toml");
    const contents = readFileSync(filePath, "utf8");
    const match = contents.match(/^oauth_token = "(.*)"$/m);

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getCloudflareConfig() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || readWranglerOAuthToken();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME || DEFAULT_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || DEFAULT_PUBLIC_BASE_URL;

  if (!apiToken) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN and no local Wrangler OAuth token was found.");
  }

  return {
    apiToken,
    accountId,
    bucketName,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, "")
  };
}

function objectApiUrl(key: string) {
  const { accountId, bucketName } = getCloudflareConfig();
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodedKey}`;
}

async function cloudflareRequest(url: string, init?: RequestInit) {
  const { apiToken } = getCloudflareConfig();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare R2 request failed (${response.status}): ${text}`);
  }

  return response;
}

export function buildPublicObjectUrl(key: string) {
  const { publicBaseUrl } = getCloudflareConfig();
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${publicBaseUrl}/${encodedKey}`;
}

export async function uploadObjectToR2(input: {
  key: string;
  body: Blob | ArrayBuffer | Uint8Array | string;
  contentType: string;
}) {
  await cloudflareRequest(objectApiUrl(input.key), {
    method: "PUT",
    headers: {
      "Content-Type": input.contentType
    },
    body: input.body as BodyInit
  });

  return {
    key: input.key,
    publicUrl: buildPublicObjectUrl(input.key)
  };
}

export async function deleteObjectFromR2(key: string) {
  await cloudflareRequest(objectApiUrl(key), {
    method: "DELETE"
  });
}
