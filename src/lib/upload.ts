import "server-only";
import { put } from "@vercel/blob";
import { blobUploadErrorMessage } from "@/lib/blob-errors";
import { toAppMediaUrl } from "@/lib/media-url";

const ALLOWED = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "svg",
  "pdf",
  "doc",
  "docx",
  "mp4",
  "webm",
  "mov",
]);

function safeExt(fileName: string) {
  const ext = (fileName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ALLOWED.has(ext) ? ext : "jpg";
}

function mimeFor(ext: string) {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
  };
  return map[ext] || "application/octet-stream";
}

/**
 * Upload persistente:
 * 1) Vercel Blob (BLOB_READ_WRITE_TOKEN) — obrigatório em produção Vercel
 * 2) Disco local public/uploads — desenvolvimento
 * URLs públicas passam por /api/media (evita 403 do CDN Blob).
 */
export async function storeUploadedFile(file: File): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Ficheiro inválido" };
  }
  if (file.size > 12 * 1024 * 1024) {
    return { ok: false, error: "Ficheiro demasiado grande (máx. 12 MB)" };
  }

  const ext = safeExt(file.name);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || mimeFor(ext);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      let blob;
      try {
        blob = await put(`ieul/${name}`, bytes, {
          access: "public",
          contentType,
          addRandomSuffix: false,
        });
      } catch (publicErr) {
        console.warn("[upload] public put failed, trying private:", publicErr);
        blob = await put(`ieul/${name}`, bytes, {
          access: "private",
          contentType,
          addRandomSuffix: false,
        });
      }
      return { ok: true, url: toAppMediaUrl(blob.url) };
    } catch (err) {
      console.error("[upload] Vercel Blob failed:", err);
      if (process.env.VERCEL) {
        return {
          ok: false,
          error: blobUploadErrorMessage(
            err,
            "Falha no armazenamento de imagens (Vercel Blob). Tente novamente.",
          ),
        };
      }
    }
  }

  if (process.env.VERCEL) {
    return {
      ok: false,
      error:
        "Upload indisponível: configure BLOB_READ_WRITE_TOKEN (Vercel Blob) para guardar imagens de forma persistente.",
    };
  }

  try {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return { ok: true, url: `/uploads/${name}` };
  } catch (err) {
    console.error("[upload] local write failed:", err);
    return { ok: false, error: "Não foi possível gravar o ficheiro no disco." };
  }
}
