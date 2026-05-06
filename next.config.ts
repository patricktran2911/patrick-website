import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR;

/** Origins the browser may fetch (voice + chat use NEXT_PUBLIC_AI_DIRECT_URL in production). */
function collectAiConnectOrigins() {
  const candidates = [
    process.env.NEXT_PUBLIC_AI_DIRECT_URL,
    process.env.NEXT_PUBLIC_AI_API_URL,
    process.env.AI_API_URL,
  ];

  const origins = new Set<string>();
  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    try {
      origins.add(new URL(raw.trim()).origin);
    } catch {
      /* ignore invalid env URLs */
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  ...(distDir ? { distDir } : {}),
  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  async headers() {
    const aiOrigins = collectAiConnectOrigins();
    const connectSrc = [
      "'self'",
      "https://api.emailjs.com",
      "https://challenges.cloudflare.com",
      "https://ai-dev.patrickcs-web.com",
      ...aiOrigins,
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
    ];
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob: data:",
      "font-src 'self'",
      "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://docs.google.com",
      `connect-src ${[...new Set(connectSrc)].join(" ")}`,
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
