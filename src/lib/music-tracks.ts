export type MusicTrack =
  | {
      kind: "youtube";
      url: string;
      videoId: string;
      label: string;
    }
  | {
      kind: "audio";
      url: string;
      label: string;
    };

function buildFallbackLabel(url: URL, index: number) {
  const pathname = url.pathname.split("/").filter(Boolean).pop();

  if (!pathname) {
    return `Track ${String(index + 1).padStart(2, "0")}`;
  }

  return decodeURIComponent(pathname)
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function extractYouTubeVideoId(url: URL) {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live"].includes(segments[0] ?? "")) {
      return segments[1] ?? null;
    }
  }

  return null;
}

export function parseMusicTrackUrl(rawUrl: string, index: number): MusicTrack | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return null;
  }

  const videoId = extractYouTubeVideoId(url);
  const label = buildFallbackLabel(url, index);

  if (videoId) {
    return {
      kind: "youtube",
      url: url.toString(),
      videoId,
      label: `Track ${String(index + 1).padStart(2, "0")}`,
    };
  }

  return {
    kind: "audio",
    url: url.toString(),
    label,
  };
}

export function parseMusicTrackUrls(songUrls: string[]) {
  return songUrls
    .map((songUrl, index) => parseMusicTrackUrl(songUrl, index))
    .filter((track): track is MusicTrack => track !== null);
}
