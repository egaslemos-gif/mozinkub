import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission, sessionToAuthUser } from "@/lib/rbac";

export const runtime = "nodejs";

/**
 * Token endpoint for @vercel/blob/client — ficheiro vai do browser → Blob
 * (evita o limite ~4.5 MB das Serverless Functions).
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = sessionToAuthUser(session);
    await requirePermission(user, "documents.upload");

    const body = (await request.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/svg+xml",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId: user!.id }),
      }),
    });
    return NextResponse.json(json);
  } catch (err) {
    console.error("[api/admin/blob]", err);
    const message =
      err instanceof Error ? err.message : "Não foi possível autorizar o upload.";
    const status =
      message.includes("autenticado") || message.includes("Sessão")
        ? 401
        : message.includes("permissão") || message.includes("inactiva")
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
