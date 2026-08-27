"use server";

import { prisma } from "@/lib/prisma";
import { resolveRegistrationInbox, sendOutboundMail } from "@/lib/mail";

export async function submitAnnouncementRegistration(formData: FormData) {
  const announcementId = String(formData.get("announcementId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const organization = String(formData.get("organization") || "").trim();
  const profile = String(formData.get("profile") || "").trim();
  const message = String(formData.get("message") || "").trim();

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
      status: "RECEBIDA",
    },
  });

  const site = await prisma.siteConfig.findUnique({ where: { id: "main" } });
  const inbox = resolveRegistrationInbox(
    announcement.registrationEmail,
    site?.email,
  );

  if (inbox) {
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
