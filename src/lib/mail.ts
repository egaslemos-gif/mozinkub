/**
 * Destino de emails de inscrição / candidaturas / contacto.
 * Ordem: override → REGISTRATION_EMAIL → INQUIRY_EMAIL → SiteConfig.email → DEFAULT_INBOX
 */
export const DEFAULT_INBOX = "elemos@unilicungo.ac.mz";

/** Access key pública Web3Forms (pode sobrescrever com WEB3FORMS_ACCESS_KEY). */
const DEFAULT_WEB3FORMS_KEY = "2b13d06d-3b42-494a-9a82-84ca416fdeb3";

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
 * Web3Forms — envia para o email ligado à access key no dashboard.
 * Docs: https://docs.web3forms.com/
 */
async function sendViaWeb3Forms(
  mail: OutboundMail,
  accessKey: string,
): Promise<{ sent: boolean; reason?: string }> {
  const replyTo = mail.replyTo?.includes("@") ? mail.replyTo.trim() : undefined;

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: mail.subject,
        from_name: "MozInkub IEUL",
        name: replyTo ? `Candidato (${replyTo})` : "MozInkub IEUL",
        email: replyTo || mail.to,
        replyto: replyTo,
        message: mail.text,
        to: mail.to,
      }),
    });

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;

    if (!res.ok || data?.success === false) {
      console.error("[mail] Web3Forms failed:", res.status, data);
      return {
        sent: false,
        reason: data?.message || `Web3Forms ${res.status}`,
      };
    }
    return { sent: true };
  } catch (err) {
    console.error("[mail] Web3Forms error:", err);
    return { sent: false, reason: "network" };
  }
}

/**
 * Envio de email:
 * 1) Resend se RESEND_API_KEY existir
 * 2) Web3Forms (access key) — fluxo actual
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

  const web3Key =
    process.env.WEB3FORMS_ACCESS_KEY?.trim() || DEFAULT_WEB3FORMS_KEY;

  if (web3Key) {
    const result = await sendViaWeb3Forms(mail, web3Key);
    if (result.sent) {
      console.info("[mail] enviado via Web3Forms →", mail.to);
    }
    return { ...result, provider: "web3forms" };
  }

  console.info(
    "[mail] email não enviado (configure WEB3FORMS_ACCESS_KEY ou RESEND_API_KEY). Destino:",
    mail.to,
    "|",
    mail.subject,
  );
  return { sent: false, reason: "not_configured" };
}
