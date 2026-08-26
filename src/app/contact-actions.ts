"use server";

import { prisma } from "@/lib/prisma";

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

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      subject,
      message,
      projectSlug: projectSlug || null,
    },
  });

  return { ok: true as const };
}
