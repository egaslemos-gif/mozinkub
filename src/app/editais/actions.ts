"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isCallOpen } from "@/lib/funding";

const MAX_BYTES = 12 * 1024 * 1024;
const DOC_EXTS = ["pdf", "doc", "docx"];

async function saveDocument(file: File) {
  if (file.size > MAX_BYTES) {
    return { ok: false as const, error: "Ficheiro demasiado grande (máx. 12 MB)." };
  }
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!DOC_EXTS.includes(ext)) {
    return { ok: false as const, error: "Formato inválido. Use PDF, DOC ou DOCX." };
  }
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "candidaturas");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true as const, url: `/uploads/candidaturas/${name}` };
}

export async function submitCallApplication(formData: FormData) {
  const callId = String(formData.get("callId") || "");
  const call = await prisma.fundingCall.findFirst({
    where: { id: callId, published: true },
  });
  if (!call) {
    return { ok: false as const, error: "Edital não encontrado." };
  }
  if (!isCallOpen(call)) {
    return { ok: false as const, error: "Este edital não está a aceitar candidaturas." };
  }

  const projectTitle = String(formData.get("projectTitle") || "").trim();
  const area = String(formData.get("area") || "").trim();
  const leaderName = String(formData.get("leaderName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const team = String(formData.get("team") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const file = formData.get("document");

  if (!projectTitle || !area || !leaderName || !email || !summary) {
    return { ok: false as const, error: "Preencha todos os campos obrigatórios." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Anexe o ficheiro do projecto (PDF)." };
  }

  const saved = await saveDocument(file);
  if (!saved.ok) return saved;

  await prisma.callApplication.create({
    data: {
      callId: call.id,
      projectTitle,
      area,
      leaderName,
      email,
      phone: phone || null,
      team: team || null,
      summary,
      documentUrl: saved.url,
      status: "RECEBIDA",
    },
  });

  revalidatePath(`/editais/${call.slug}`);
  revalidatePath(`/admin/editais/${call.id}`);
  revalidatePath("/admin/editais");
  revalidatePath("/admin/candidaturas");

  return { ok: true as const };
}
