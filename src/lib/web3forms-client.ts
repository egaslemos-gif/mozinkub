/**
 * Web3Forms no browser (obrigatório no plano gratuito).
 * Chamadas server-side devolvem 403 — ver docs.web3forms.com troubleshooting.
 */
export const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY?.trim() ||
  "2b13d06d-3b42-494a-9a82-84ca416fdeb3";

export type Web3FormsPayload = {
  subject: string;
  name: string;
  email: string;
  message: string;
};

export async function submitWeb3Forms(
  payload: Web3FormsPayload,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: payload.subject,
        from_name: "MozInkub IEUL",
        name: payload.name,
        email: payload.email,
        replyto: payload.email,
        message: payload.message,
        botcheck: "",
      }),
    });

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;

    if (!res.ok || data?.success === false) {
      console.error("[web3forms] failed:", res.status, data);
      return { ok: false, reason: data?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[web3forms] error:", err);
    return { ok: false, reason: "network" };
  }
}
