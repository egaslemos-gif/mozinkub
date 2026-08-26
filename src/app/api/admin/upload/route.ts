import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requirePermission, sessionToAuthUser } from "@/lib/rbac";
import { storeUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";

/** Upload de imagens/PDF para o admin (limite maior que Server Actions default). */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = sessionToAuthUser(session);
    await requirePermission(user, "documents.upload");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Ficheiro inválido" }, { status: 400 });
    }

    const result = await storeUploadedFile(file);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/admin/upload]", err);
    const message =
      err instanceof Error ? err.message : "Falha no upload. Tente novamente.";
    const status = message.includes("autenticado") || message.includes("Sessão")
      ? 401
      : message.includes("permissão") || message.includes("inactiva")
        ? 403
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
