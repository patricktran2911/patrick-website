import { NextResponse } from "next/server";
import { getClearedAdminSessionCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getClearedAdminSessionCookie());
  return response;
}
