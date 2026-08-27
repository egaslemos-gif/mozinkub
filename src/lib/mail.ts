/**
 * Destino de emails de inscrição / candidaturas / contacto.
 * Ordem: override → REGISTRATION_EMAIL → INQUIRY_EMAIL → SiteConfig.email → DEFAULT_INBOX
 */
export const DEFAULT_INBOX = "elemos@unilicungo.ac.mz";

export function resolveRegistrationInbox(
  override?: string | null,
  siteEmail?: string | null,
): string {
  const candidates = [
    override,
    process.env.REGISTRATION_EMAIL,
    process.env.INQUIRY_EMAIL,
    siteEmail,
    DEFAULT_INBOX,
  ];
  for (const c of candidates) {
    const v = c?.trim();
    if (v && v.includes("@")) return v;
  }
  return DEFAULT_INBOX;
}

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Email do candidato — aparece como Reply-To */
  replyTo?: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainTextToHtml(text: string): string {
  const body = escapeHtml(text).replace(/\n/g, "<br/>");
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">${body}</body></html>`;
}

async function sendViaResend(
  mail: OutboundMail,
  from: string,
  apiKey: string,
): Promise<{ sent: boolean; reason?: string }> {
  const payload: Record<string, unknown> = {
    from,
    to: [mail.to],
    subject: mail.subject,
    text: mail.text,
    html: mail.html || plainTextToHtml(mail.text),
  };
  if (mail.replyTo?.includes("@")) {
    payload.reply_to = mail.replyTo.trim();
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

/**
 * Fallback sem API key — FormSubmit.co.
 * Na 1.ª utilização o destino recebe um email de activação; depois funciona.
 */
async function sendViaFormSubmit(
  mail: OutboundMail,
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const res = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(mail.to)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: mail.subject,
          _template: "table",
          _replyto: mail.replyTo || undefined,
          message: mail.text,
          from_app: "MozInkub IEUL",
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[mail] FormSubmit failed:", res.status, body);
      return { sent: false, reason: `FormSubmit ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[mail] FormSubmit error:", err);
    return { sent: false, reason: "network" };
  }
}

/**
 * Envio de email:
 * 1) Resend se RESEND_API_KEY existir (recomendado em produção)
 * 2) FormSubmit como fallback de teste (activa o destino na 1.ª vez)
 * A candidatura / mensagem fica sempre na base de dados independentemente do email.
 */
export async function sendOutboundMail(
  mail: OutboundMail,
): Promise<{ sent: boolean; reason?: string; provider?: string }> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "MozInkub IEUL <onboarding@resend.dev>";

  if (resendKey) {
    const result = await sendViaResend(mail, from, resendKey);
    return { ...result, provider: "resend" };
  }

  const allowFallback =
    process.env.MAIL_FORMSUBMIT_FALLBACK !== "0" &&
    process.env.MAIL_FORMSUBMIT_FALLBACK !== "false";

  if (allowFallback) {
    const result = await sendViaFormSubmit(mail);
    if (result.sent) {
      console.info("[mail] enviado via FormSubmit →", mail.to);
    }
    return { ...result, provider: "formsubmit" };
  }

  console.info(
    "[mail] email não enviado (configure RESEND_API_KEY). Destino:",
    mail.to,
    "|",
    mail.subject,
  );
  return { sent: false, reason: "not_configured" };
}
