"use client";

import { upload } from "@vercel/blob/client";
import { blobUploadErrorMessage } from "@/lib/blob-errors";
import { toAppMediaUrl } from "@/lib/media-url";

const MAX_BYTES = 12 * 1024 * 1024;

function safeFileName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return base.slice(0, 80) || "file";
}

async function uploadViaServer(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string } | null> {
  try {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const data = (await res.json().catch(() => null)) as
      | { ok: true; url: string }
      | { ok: false; error: string }
      | null;
    if (res.ok && data && data.ok) {
      return { ok: true, url: toAppMediaUrl(data.url) };
    }
    if (data && "error" in data && data.error) {
      return { ok: false, error: data.error };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Upload admin: servidor primeiro (Cloudinary/Blob/local), fallback Blob directo.
 * URLs Cloudinary são CDN público; Blob passa por /api/media quando necessário.
 */
export async function uploadAdminFile(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Ficheiro inválido." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: "Ficheiro demasiado grande (máx. 12 MB). Comprima e tente novamente.",
    };
  }

  const serverResult = await uploadViaServer(file);
  if (serverResult?.ok) {
    return serverResult;
  }
  if (serverResult && !serverResult.ok) {
    // Server responded with error — only retry Blob if message suggests Blob-specific path
    const blobLikely =
      serverResult.error.includes("Blob") ||
      serverResult.error.includes("BLOB_READ_WRITE_TOKEN");
    if (!blobLikely) {
      return {
        ok: false,
        error: blobUploadErrorMessage(serverResult.error, serverResult.error),
      };
    }
  }

  const pathname = `ieul/${Date.now()}-${safeFileName(file.name)}`;

  try {
    let blob;
    try {
      blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob",
        contentType: file.type || undefined,
      });
    } catch (publicErr) {
      try {
        blob = await upload(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/admin/blob",
          contentType: file.type || undefined,
        });
      } catch (privateErr) {
        throw privateErr || publicErr;
      }
    }
    return { ok: true, url: toAppMediaUrl(blob.url) };
  } catch (err) {
    const fallback = await uploadViaServer(file);
    if (fallback?.ok) return fallback;

    return {
      ok: false,
      error: blobUploadErrorMessage(
        serverResult?.error || err,
        serverResult?.error || "Falha no upload. Tente novamente.",
      ),
    };
  }
}
