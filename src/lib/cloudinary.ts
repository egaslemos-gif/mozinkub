import "server-only";
import { v2 as cloudinary } from "cloudinary";

function trimEnv(value: string | undefined): string | undefined {
  let v = value?.trim();
  if (!v) return undefined;
  // Strip accidental wrapping quotes from Vercel paste
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

/** Normalize CLOUDINARY_URL if user pasted "CLOUDINARY_URL=cloudinary://..." */
function normalizeCloudinaryUrl(raw: string): string {
  let v = raw.trim();
  if (v.toUpperCase().startsWith("CLOUDINARY_URL=")) {
    v = v.slice("CLOUDINARY_URL=".length).trim();
  }
  return v;
}

/** Parse cloudinary://KEY:SECRET@CLOUD_NAME from dashboard quickstart. */
function configFromUrl(url: string) {
  try {
    const parsed = new URL(normalizeCloudinaryUrl(url));
    if (parsed.protocol !== "cloudinary:") return null;
    const apiKey = decodeURIComponent(parsed.username);
    const apiSecret = decodeURIComponent(parsed.password);
    const cloudName = parsed.hostname;
    if (!apiKey || !apiSecret || !cloudName) return null;
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
  } catch {
    return null;
  }
}

function getCloudinaryCredentials():
  | { cloud_name: string; api_key: string; api_secret: string }
  | null {
  const url = trimEnv(process.env.CLOUDINARY_URL);
  if (url) {
    const fromUrl = configFromUrl(url);
    if (fromUrl) return fromUrl;
    console.error(
      "[cloudinary] CLOUDINARY_URL presente mas inválida — esperado cloudinary://KEY:SECRET@CLOUD_NAME",
    );
  }

  const cloud_name = trimEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const api_key = trimEnv(process.env.CLOUDINARY_API_KEY);
  const api_secret = trimEnv(process.env.CLOUDINARY_API_SECRET);
  if (cloud_name && api_key && api_secret) {
    return { cloud_name, api_key, api_secret };
  }
  return null;
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryCredentials() !== null;
}

function configureCloudinary() {
  const creds = getCloudinaryCredentials();
  if (!creds) return;
  cloudinary.config({ ...creds, secure: true });
}

type CloudinaryResourceType = "image" | "video" | "raw";

function resourceTypeForExt(ext: string): CloudinaryResourceType {
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (["pdf", "doc", "docx"].includes(ext)) return "raw";
  return "image";
}

function friendlyCloudinaryError(err: unknown): string {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message: unknown }).message)
        : "";

  if (/invalid signature/i.test(msg)) {
    return (
      "Credenciais Cloudinary inválidas (API Secret incorrecto). " +
      "No Vercel, confira CLOUDINARY_API_SECRET ou CLOUDINARY_URL e faça Redeploy."
    );
  }
  if (/invalid api key/i.test(msg)) {
    return "CLOUDINARY_API_KEY inválida. Copie novamente do dashboard Cloudinary.";
  }
  return msg || "Falha no armazenamento Cloudinary. Tente novamente.";
}

/**
 * Upload bytes to Cloudinary folder `ieul/`. Returns public HTTPS CDN URL.
 */
export async function uploadToCloudinary(
  bytes: Buffer,
  fileName: string,
  ext: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isCloudinaryConfigured()) {
    return { ok: false, error: "Cloudinary não configurado." };
  }

  configureCloudinary();

  const resourceType = resourceTypeForExt(ext);
  const publicId = fileName.replace(/\.[^.]+$/, "");

  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ieul",
        public_id: publicId,
        resource_type: resourceType,
        ...(resourceType === "raw" ? { format: ext } : {}),
      },
      (err, result) => {
        if (err || !result?.secure_url) {
          console.error("[cloudinary] upload failed:", err);
          resolve({ ok: false, error: friendlyCloudinaryError(err) });
          return;
        }
        resolve({ ok: true, url: result.secure_url });
      },
    );

    stream.end(bytes);
  });
}
