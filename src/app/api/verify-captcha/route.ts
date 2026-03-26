import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: unknown = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing token" },
        { status: 400 }
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;

    // In local development with no key set, use Cloudflare's always-pass test secret.
    // In production, TURNSTILE_SECRET_KEY must be set.
    const effectiveSecret =
      secret ??
      (process.env.NODE_ENV !== "production"
        ? "1x0000000000000000000000000000000AA"
        : null);

    if (!effectiveSecret) {
      return NextResponse.json(
        { success: false, error: "Captcha not configured on server" },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: effectiveSecret, response: token }),
      }
    );

    const data = (await verifyRes.json()) as { success: boolean };

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: "Bot verification failed" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
