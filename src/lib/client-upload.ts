"use client";

import { toAppMediaUrl } from "@/lib/media-url";

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Upload admin via servidor (/api/admin/upload → Cloudinary).
 * Sem fallback para Vercel Blob (store suspenso no Hobby).
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
        `Falha no upload (${res.status}).`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha no upload. Tente novamente.",
    };
  }
}
