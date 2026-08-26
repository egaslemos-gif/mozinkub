"use client";

import { upload } from "@vercel/blob/client";
import { toAppMediaUrl } from "@/lib/media-url";

const MAX_BYTES = 12 * 1024 * 1024;

function safeFileName(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return base.slice(0, 80) || "file";
}

/**
 * Upload directo browser → Vercel Blob (sem passar pelo body da Serverless Function).
 * Fallback para /api/admin/upload em desenvolvimento sem Blob.
 * URLs devolvidas passam pelo proxy /api/media para evitar 403 no site público.
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

  const pathname = `ieul/${Date.now()}-${safeFileName(file.name)}`;

  try {
    let blob;
    try {
      blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob",
        contentType: file.type || undefined,
      });
    } catch {
      blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/admin/blob",
        contentType: file.type || undefined,
      });
    }
    return { ok: true, url: toAppMediaUrl(blob.url) };
  } catch (err) {
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
      return {
        ok: false,
        error:
          (data && "error" in data && data.error) ||
          (err instanceof Error ? err.message : `Falha no upload (${res.status}).`),
      };
    } catch {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Falha no upload. Tente novamente.",
      };
    }
  }
}
