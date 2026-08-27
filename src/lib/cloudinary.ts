import "server-only";
import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

type CloudinaryResourceType = "image" | "video" | "raw";

function resourceTypeForExt(ext: string): CloudinaryResourceType {
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (["pdf", "doc", "docx"].includes(ext)) return "raw";
  return "image";
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
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      },
      (err, result) => {
        if (err || !result?.secure_url) {
          console.error("[cloudinary] upload failed:", err);
          resolve({
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "Falha no armazenamento Cloudinary. Tente novamente.",
          });
          return;
        }
        resolve({ ok: true, url: result.secure_url });
      },
    );

    stream.end(bytes);
  });
}
