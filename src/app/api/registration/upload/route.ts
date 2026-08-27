import { NextResponse } from "next/server";
import {
  isGoogleDriveConfigured,
  uploadRegistrationToDrive,
} from "@/lib/google-drive";
import { storeUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"]);

/**
 * Upload público só para anexos de inscrição.
 * Prioridade: Google Drive (economiza Cloudinary) → fallback Cloudinary/Blob se Drive não estiver configurado.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "Ficheiro inválido." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Anexo demasiado grande (máx. 8 MB)." },
        { status: 400 },
      );
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mimeOk = !file.type || ALLOWED_MIME.has(file.type);
    const extOk = ALLOWED_EXT.has(ext);
    if (!mimeOk && !extOk) {
      return NextResponse.json(
        {
          ok: false,
          error: "Formato não permitido. Use PDF, DOC, DOCX, JPG, PNG ou WEBP.",
        },
        { status: 400 },
      );
    }

    if (isGoogleDriveConfigured()) {
      const result = await uploadRegistrationToDrive(file);
      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json({
        ok: true as const,
        url: result.url,
        name: result.name,
        storage: "google_drive" as const,
      });
    }

    console.warn(
      "[api/registration/upload] Google Drive não configurado — a usar Cloudinary/Blob (temporário)",
    );
    const result = await storeUploadedFile(file);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({
      ok: true as const,
      url: result.url,
      name: file.name.slice(0, 120),
      storage: "legacy" as const,
    });
  } catch (err) {
    console.error("[api/registration/upload]", err);
    return NextResponse.json(
      { ok: false, error: "Falha no upload do anexo." },
      { status: 500 },
    );
  }
}
