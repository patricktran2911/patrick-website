const GOOGLE_DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

export function extractGoogleDriveFileId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (GOOGLE_DRIVE_ID_PATTERN.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const pathnameMatch = url.pathname.match(/\/d\/([A-Za-z0-9_-]{10,})/);
  if (pathnameMatch?.[1]) {
    return pathnameMatch[1];
  }

  const queryId = url.searchParams.get("id");
  if (queryId && GOOGLE_DRIVE_ID_PATTERN.test(queryId)) {
    return queryId;
  }

  return null;
}

export function getGoogleDriveAssetUrls(value: string) {
  const fileId = extractGoogleDriveFileId(value);
  if (!fileId) return null;

  return {
    fileId,
    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
  };
}
