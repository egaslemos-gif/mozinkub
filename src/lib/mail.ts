/**
 * Destino de emails de inscrição / candidaturas / contacto (Resend no servidor).
 * Web3Forms corre no browser — ver `web3forms-client.ts` (API free bloqueia server-side com 403).
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

/**
 * Envio server-side via Resend (opcional).
 * Sem RESEND_API_KEY devolve not_configured — o cliente usa Web3Forms.
 */
export async function sendOutboundMail(
  mail: OutboundMail,
): Promise<{ sent: boolean; reason?: string; provider?: string }> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    return { sent: false, reason: "not_configured", provider: "none" };
  }

  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "MozInkub IEUL <onboarding@resend.dev>";

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
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[mail] Resend failed:", res.status, body);
      return { sent: false, reason: `Resend ${res.status}`, provider: "resend" };
    }
    return { sent: true, provider: "resend" };
  } catch (err) {
    console.error("[mail] Resend error:", err);
    return { sent: false, reason: "network", provider: "resend" };
  }
}
