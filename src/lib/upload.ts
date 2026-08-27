import "server-only";

import { put } from "@vercel/blob";

import { blobUploadErrorMessage } from "@/lib/blob-errors";

import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

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

 * Upload persistente (prioridade):

 * 1) Cloudinary — recomendado em produção (plano free generoso)

 * 2) Vercel Blob (BLOB_READ_WRITE_TOKEN) — legado

 * 3) Disco local public/uploads — desenvolvimento

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



  if (isCloudinaryConfigured()) {

    const result = await uploadToCloudinary(bytes, name, ext);

    if (result.ok) {

      return { ok: true, url: result.url };

    }

    if (process.env.VERCEL) {

      return result;

    }

    console.warn("[upload] Cloudinary failed, trying fallback:", result.error);

  }



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

      if (process.env.VERCEL && !isCloudinaryConfigured()) {

        return {

          ok: false,

          error: blobUploadErrorMessage(

            err,

            "Falha no armazenamento de imagens (Vercel Blob). Configure Cloudinary ou upgrade Blob.",

          ),

        };

      }

    }

  }



  if (process.env.VERCEL) {

    return {

      ok: false,

      error:

        "Upload indisponível: configure CLOUDINARY_* ou BLOB_READ_WRITE_TOKEN para guardar ficheiros.",

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

