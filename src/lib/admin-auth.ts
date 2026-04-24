import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "patrick-admin-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "Patrick2911@1";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? `${getAdminPassword()}:patrick-admin-session`;
}

function createSignature(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function isValidAdminPassword(password: string) {
  const expected = Buffer.from(getAdminPassword());
  const received = Buffer.from(password);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export function createAdminSessionToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${createSignature(issuedAt)}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) return false;

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  if (createSignature(issuedAt) !== signature) return false;

  const ageInSeconds = (Date.now() - Number(issuedAt)) / 1000;
  return Number.isFinite(ageInSeconds) && ageInSeconds >= 0 && ageInSeconds <= SESSION_MAX_AGE;
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function getAdminSessionCookie(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getClearedAdminSessionCookie() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
}
