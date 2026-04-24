import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminSessionCookie,
  isValidAdminPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password?.trim() ?? "";

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminSessionCookie(createAdminSessionToken()));
  return response;
}
