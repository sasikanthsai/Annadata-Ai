// Server-only helpers for the admin shared-credential gate.
// Do NOT import this file from components or *.functions.ts module scope.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type AdminSession = { username?: string; loggedInAt?: number };

export const adminSessionConfig = {
  password: process.env.ADMIN_SESSION_SECRET ?? "dev-only-fallback-please-set-ADMIN_SESSION_SECRET-32+chars",
  name: "annadata-admin",
  maxAge: 60 * 60 * 8, // 8 hours
  cookie: {
    httpOnly: true,
    // Must be secure + SameSite=None so the cookie works correctly across origins.
    // preview iframe (cross-site top-level) back to our same-origin server fns.
    // Partitioned keeps it working in browsers that block normal third-party cookies.
    secure: true,
    sameSite: "none" as const,
    partitioned: true,
    path: "/",
  },
};

const ADMIN_TOKEN_MAX_AGE_MS = adminSessionConfig.maxAge * 1000;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", adminSessionConfig.password).update(payload, "utf8").digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminAccessToken(username: string): string {
  const now = Date.now();
  const payload = base64UrlEncode(JSON.stringify({
    username: normalizeUsername(username),
    iat: now,
    exp: now + ADMIN_TOKEN_MAX_AGE_MS,
  }));
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAdminAccessToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as { username?: unknown; exp?: unknown };
    const username = normalizeUsername(String(parsed.username ?? ""));
    const exp = Number(parsed.exp ?? 0);
    if (!username || !Number.isFinite(exp) || Date.now() > exp) return null;
    return username;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export function normalizeUsername(value: string): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Verifies credentials against the public.admin_users table. */
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const uname = normalizeUsername(username);
  if (!uname) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("password_hash")
    .eq("username", uname)
    .maybeSingle();
  if (!data?.password_hash) return false;
  const expected = hashPassword(password);
  // Both hex strings of equal length; constant-time compare:
  if (expected.length !== data.password_hash.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ data.password_hash.charCodeAt(i);
  return diff === 0;
}
