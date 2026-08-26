/**
 * Normalize media URLs so Vercel Blob files are served via our authenticated proxy.
 * Direct *.blob.vercel-storage.com URLs often return 403 (private store / policy).
 */
export function toAppMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/api/media/")) return trimmed;
  if (trimmed.startsWith("/") || trimmed.startsWith("data:")) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (
      host.endsWith(".public.blob.vercel-storage.com") ||
      host.endsWith(".private.blob.vercel-storage.com") ||
      host === "blob.vercel-storage.com"
    ) {
      const pathname = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
      if (!pathname) return trimmed;
      return `/api/media/${pathname.split("/").map(encodeURIComponent).join("/")}`;
    }
  } catch {
    /* keep original */
  }

  return trimmed;
}

/** Extract Blob store pathname from a Blob URL or /api/media path. */
export function blobPathnameFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/api/media/")) {
    return decodeURIComponent(trimmed.slice("/api/media/".length));
  }

  try {
    const u = new URL(trimmed);
    if (
      u.hostname.endsWith(".public.blob.vercel-storage.com") ||
      u.hostname.endsWith(".private.blob.vercel-storage.com")
    ) {
      return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    }
  } catch {
    return null;
  }
  return null;
}
