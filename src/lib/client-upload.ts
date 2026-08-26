"use client";

import { upload } from "@vercel/blob/client";

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Upload directo browser → Vercel Blob (sem passar pelo body da Serverless Function).
 * Fallback para /api/admin/upload em desenvolvimento sem Blob.
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
    const blob = await upload(`ieul/${Date.now()}-${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/blob",
      contentType: file.type || undefined,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    // Sem token Blob (dev local): usar rota server-side
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
      if (res.ok && data && data.ok) return data;
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
