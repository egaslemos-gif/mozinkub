"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isCallOpen } from "@/lib/funding";
import { resolveRegistrationInbox, sendOutboundMail } from "@/lib/mail";
import { storeUploadedFile } from "@/lib/upload";

const DOC_EXTS = ["pdf", "doc", "docx"];

async function saveDocument(file: File) {
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!DOC_EXTS.includes(ext)) {
    return { ok: false as const, error: "Formato inválido. Use PDF, DOC ou DOCX." };
  }
  return storeUploadedFile(file);
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

  const application = await prisma.callApplication.create({
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

  const site = await prisma.siteConfig.findUnique({ where: { id: "main" } });
  const inbox = resolveRegistrationInbox(null, site?.email);

  await sendOutboundMail({
    to: inbox,
    replyTo: email,
    subject: `[IEUL] Candidatura edital: ${call.title} — ${projectTitle}`,
    text: [
      `Nova candidatura ao edital: ${call.title}`,
      `Slug: ${call.slug}`,
      ``,
      `Projecto: ${projectTitle}`,
      `Área: ${area}`,
      `Líder: ${leaderName}`,
      `Email: ${email}`,
      `Telefone: ${phone || "—"}`,
      `Equipa: ${team || "—"}`,
      ``,
      `Resumo:`,
      summary,
      ``,
      `Documento: ${saved.url}`,
      `ID: ${application.id}`,
      `Recebida em: ${application.createdAt.toISOString()}`,
    ].join("\n"),
  });

  revalidatePath(`/editais/${call.slug}`);
  revalidatePath(`/admin/editais/${call.id}`);
  revalidatePath("/admin/editais");
  revalidatePath("/admin/candidaturas");

  return { ok: true as const };
}
