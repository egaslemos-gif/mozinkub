import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Serve Blob media through the app so private/public store access works in <img>/<video>.
 * Direct Blob CDN URLs were returning 403 for visitor traffic.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ pathname: string[] }> },
) {
  const { pathname: parts } = await context.params;
  const pathname = parts.map((p) => decodeURIComponent(p)).join("/");
  if (!pathname || pathname.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Media unavailable" }, { status: 503 });
  }

  try {
    let result: Awaited<ReturnType<typeof get>> = null;
    for (const access of ["public", "private"] as const) {
      try {
        result = await get(pathname, { access, token, useCache: true });
        if (result?.stream) break;
      } catch {
        result = null;
      }
    }
    if (!result?.stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers = new Headers();
    const contentType =
      result.blob.contentType ||
      result.headers.get("content-type") ||
      "application/octet-stream";
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    const contentLength = result.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(result.stream, { status: 200, headers });
  } catch (err) {
    console.error("[api/media]", pathname, err);
    return NextResponse.json({ error: "Unavailable" }, { status: 502 });
  }
}
