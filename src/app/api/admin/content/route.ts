import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readSiteContentFile, writeSiteContent } from "@/lib/site-content";

export const runtime = "nodejs";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  const content = await readSiteContentFile();
  return NextResponse.json({ content });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedResponse();
  }

  const body = (await request.json().catch(() => null)) as
    | { content?: unknown }
    | null;

  if (!body || body.content === undefined) {
    return NextResponse.json(
      { error: "Missing content payload." },
      { status: 400 }
    );
  }

  try {
    const content = await writeSiteContent(body.content);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
