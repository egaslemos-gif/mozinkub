/**
 * Destino de emails de inscrição / candidaturas.
 * Ordem: override da actualização → REGISTRATION_EMAIL → INQUIRY_EMAIL → SiteConfig.email
 */
export function resolveRegistrationInbox(
  override?: string | null,
  siteEmail?: string | null,
): string | null {
  const candidates = [
    override,
    process.env.REGISTRATION_EMAIL,
    process.env.INQUIRY_EMAIL,
    siteEmail,
  ];
  for (const c of candidates) {
    const v = c?.trim();
    if (v && v.includes("@")) return v;
  }
  return null;
}

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Envio de email — pronto para ligar Resend/SMTP quando as variáveis existirem.
 * Por agora grava nos logs; a candidatura fica sempre na base de dados.
 */
export async function sendOutboundMail(
  mail: OutboundMail,
): Promise<{ sent: boolean; reason?: string }> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "MozInkub IEUL <onboarding@resend.dev>";

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[mail] Resend failed:", res.status, body);
        return { sent: false, reason: `Resend ${res.status}` };
      }
      return { sent: true };
    } catch (err) {
      console.error("[mail] Resend error:", err);
      return { sent: false, reason: "network" };
    }
  }

  console.info(
    "[mail] email não enviado (configure RESEND_API_KEY + REGISTRATION_EMAIL). Destino:",
    mail.to,
    "|",
    mail.subject,
  );
  return { sent: false, reason: "not_configured" };
}
