import { NextResponse } from "next/server";
import { parseMusicTrackUrls } from "@/lib/music-tracks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { songUrls?: unknown }
    | null;

  if (!body || !Array.isArray(body.songUrls)) {
    return NextResponse.json(
      { error: "songUrls must be an array." },
      { status: 400 }
    );
  }

  const tracks = parseMusicTrackUrls(
    body.songUrls.filter((item): item is string => typeof item === "string")
  ).filter((track) => track.kind === "youtube");

  const titles = Object.fromEntries(
    await Promise.all(
      tracks.map(async (track) => {
        try {
          const metadataUrl = new URL("https://www.youtube.com/oembed");
          metadataUrl.searchParams.set("url", track.url);
          metadataUrl.searchParams.set("format", "json");

          const response = await fetch(metadataUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            cache: "force-cache",
          });

          if (!response.ok) {
            return [track.url, null] as const;
          }

          const payload = (await response.json()) as { title?: string };
          return [track.url, payload.title?.trim() || null] as const;
        } catch {
          return [track.url, null] as const;
        }
      })
    )
  );

  return NextResponse.json({ titles });
}
