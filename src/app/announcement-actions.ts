"use server";

import { prisma } from "@/lib/prisma";
import { resolveRegistrationInbox, sendOutboundMail } from "@/lib/mail";

type Attachment = { url: string; name: string };

function parseAttachments(raw: string): Attachment[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (a): a is Attachment =>
          a &&
          typeof a === "object" &&
          typeof a.url === "string" &&
          (a.url.startsWith("http") || a.url.startsWith("/")) &&
          typeof a.name === "string",
      )
      .slice(0, 3)
      .map((a) => ({ url: a.url.trim(), name: a.name.trim().slice(0, 120) || "anexo" }));
  } catch {
    return [];
  }
}

export async function submitAnnouncementRegistration(formData: FormData) {
  const announcementId = String(formData.get("announcementId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const organization = String(formData.get("organization") || "").trim();
  const profile = String(formData.get("profile") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const attachments = parseAttachments(String(formData.get("attachmentsJson") || "[]"));

  if (!announcementId || !name || !email) {
    return { ok: false as const, error: "Preencha nome e email." };
  }
  if (!email.includes("@")) {
    return { ok: false as const, error: "Email inválido." };
  }

  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, published: true, acceptRegistrations: true },
  });
  if (!announcement) {
    return {
      ok: false as const,
      error: "Inscrições não estão abertas para esta actualização.",
    };
  }

  if (
    announcement.registrationClosesAt &&
    announcement.registrationClosesAt.getTime() < Date.now()
  ) {
    return { ok: false as const, error: "O prazo de inscrição já terminou." };
  }

  const application = await prisma.announcementApplication.create({
    data: {
      announcementId: announcement.id,
      name,
      email,
      phone: phone || null,
      organization: organization || null,
      profile: profile || null,
      message: message || null,
      attachmentsJson: JSON.stringify(attachments),
      status: "RECEBIDA",
    },
  });

  const site = await prisma.siteConfig.findUnique({ where: { id: "main" } });
  const inbox = resolveRegistrationInbox(
    announcement.registrationEmail,
    site?.email,
  );

  if (inbox) {
    const attachmentLines =
      attachments.length > 0
        ? attachments.map((a, i) => `Anexo ${i + 1}: ${a.name} — ${a.url}`)
        : ["Anexos: —"];

    await sendOutboundMail({
      to: inbox,
      subject: `[IEUL] Inscrição: ${announcement.title} — ${name}`,
      text: [
        `Nova inscrição em: ${announcement.title}`,
        `Slug: ${announcement.slug}`,
        ``,
        `Nome: ${name}`,
        `Email: ${email}`,
        `Telefone: ${phone || "—"}`,
        `Instituição: ${organization || "—"}`,
        `Perfil: ${profile || "—"}`,
        `Mensagem: ${message || "—"}`,
        ``,
        ...attachmentLines,
        ``,
        `ID candidatura: ${application.id}`,
        `Recebida em: ${application.createdAt.toISOString()}`,
      ].join("\n"),
    });
  }

  return {
    ok: true as const,
    message: "Inscrição recebida. A coordenação irá contactá-lo(a).",
  };
}
