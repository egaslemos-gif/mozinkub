import "server-only";
import { put } from "@vercel/blob";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
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
  };
  return map[ext] || "application/octet-stream";
}

/**
 * Upload persistente:
 * 1) Vercel Blob (BLOB_READ_WRITE_TOKEN) — preferido em produção
 * 2) Disco local public/uploads — desenvolvimento
 * 3) data URL — fallback em Vercel sem Blob (imagens ≤ 2 MB)
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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`ieul/${name}`, bytes, {
        access: "public",
        contentType: file.type || mimeFor(ext),
        addRandomSuffix: false,
      });
      return { ok: true, url: blob.url };
    } catch (err) {
      console.error("[upload] Vercel Blob failed:", err);
      // continua para fallback
    }
  }

  // Local / writable filesystem
  if (!process.env.VERCEL) {
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

  // Vercel sem Blob: data URL para imagens pequenas
  if (IMAGE_EXT.has(ext) && file.size <= 2 * 1024 * 1024) {
    const b64 = bytes.toString("base64");
    return { ok: true, url: `data:${mimeFor(ext)};base64,${b64}` };
  }

  return {
    ok: false,
    error:
      "Upload indisponível neste ambiente. Configure BLOB_READ_WRITE_TOKEN (Vercel Blob) ou use imagens até 2 MB.",
  };
}
