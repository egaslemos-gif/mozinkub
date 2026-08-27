"use server";

import { prisma } from "@/lib/prisma";
import { resolveRegistrationInbox, sendOutboundMail } from "@/lib/mail";

export async function submitContactMessage(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const projectSlug = String(formData.get("projectSlug") || "").trim();

  if (!name || !email || !subject || !message) {
    return { ok: false as const, error: "Preencha todos os campos obrigatórios." };
  }

  const row = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      subject,
      message,
      projectSlug: projectSlug || null,
    },
  });

  const site = await prisma.siteConfig.findUnique({ where: { id: "main" } });
  const inbox = resolveRegistrationInbox(null, site?.email);

  await sendOutboundMail({
    to: inbox,
    replyTo: email,
    subject: `[IEUL] Contacto: ${subject} — ${name}`,
    text: [
      `Nova mensagem de contacto`,
      ``,
      `Nome: ${name}`,
      `Email: ${email}`,
      `Telefone: ${phone || "—"}`,
      `Assunto: ${subject}`,
      projectSlug ? `Projecto: ${projectSlug}` : null,
      ``,
      `Mensagem:`,
      message,
      ``,
      `ID: ${row.id}`,
      `Recebida em: ${row.createdAt.toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return { ok: true as const };
}
