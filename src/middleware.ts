import { NextRequest, NextResponse } from "next/server";

/**
 * User-Agent substrings for bots/scanners to block.
 * Legitimate crawlers (Googlebot, Bingbot, DuckDuckBot) are NOT listed here
 * so they can still index the site for SEO.
 */
const BLOCKED_UA_PATTERNS = [
  "scrapy",
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "petalbot",
  "zgrab",
  "nikto",
  "sqlmap",
  "masscan",
  "nmap",
];

export function middleware(request: NextRequest) {
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();

  if (BLOCKED_UA_PATTERNS.some((pattern) => ua.includes(pattern))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
