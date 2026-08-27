import "server-only";
import { JWT, OAuth2Client } from "google-auth-library";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

function parseServiceAccount(): ServiceAccount | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        client_email?: string;
        private_key?: string;
      };
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch (err) {
      console.error("[drive] GOOGLE_SERVICE_ACCOUNT_JSON inválido:", err);
      return null;
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
  if (email && key) {
    return {
      client_email: email,
      private_key: key.replace(/\\n/g, "\n"),
    };
  }
  return null;
}

function hasOAuthConfig(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim(),
  );
}

export function isGoogleDriveConfigured(): boolean {
  const folder = Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID?.trim());
  return folder && (hasOAuthConfig() || Boolean(parseServiceAccount()));
}

/**
 * Preferência: OAuth do Gmail (cycode360@gmail.com) — sem admin Workspace.
 * Fallback: service account (só funciona bem com Shared Drive / DWD).
 */
async function getAccessToken(): Promise<string> {
  if (hasOAuthConfig()) {
    const client = new OAuth2Client(
      process.env.GOOGLE_OAUTH_CLIENT_ID!.trim(),
      process.env.GOOGLE_OAUTH_CLIENT_SECRET!.trim(),
    );
    client.setCredentials({
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN!.trim(),
    });
    const { credentials } = await client.refreshAccessToken();
    if (!credentials.access_token) {
      throw new Error("OAuth: sem access_token (refresh token inválido?)");
    }
    console.info("[drive] auth=oauth");
    return credentials.access_token;
  }

  const sa = parseServiceAccount();
  if (!sa) throw new Error("Credenciais Google Drive em falta");

  const subject =
    process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim() ||
    process.env.GOOGLE_DRIVE_SHARE_EMAIL?.trim();

  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
    ...(subject?.includes("@") ? { subject } : {}),
  });
  const tokens = await client.authorize();
  if (!tokens.access_token) throw new Error("Sem access_token Google");
  console.info("[drive] auth=service_account", subject ? `as ${subject}` : "");
  return tokens.access_token;
}

function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || `anexo-${Date.now()}`;
}

function explainDriveError(status: number, errText: string): string {
  if (
    errText.includes("storageQuotaExceeded") ||
    errText.includes("Service Accounts do not have storage quota")
  ) {
    return (
      "Service account sem quota no Meu Drive. Use OAuth com cycode360@gmail.com " +
      "(docs/google-drive-setup.md) ou uma Unidade partilhada."
    );
  }
  if (errText.includes("invalid_grant") || errText.includes("unauthorized_client")) {
    return (
      "Credenciais Google inválidas. Volte a gerar o refresh token OAuth " +
      "(npm run drive:oauth) e actualize GOOGLE_OAUTH_REFRESH_TOKEN no Vercel."
    );
  }
  if (status === 404) {
    return "Pasta Drive não encontrada. Confirme GOOGLE_DRIVE_FOLDER_ID.";
  }
  return "Falha ao enviar para o Google Drive. Verifique OAuth / pasta (docs/google-drive-setup.md).";
}

async function shareFile(fileId: string, token: string): Promise<void> {
  // Com OAuth do dono da pasta, o ficheiro já fica no Drive dele.
  // Partilha extra opcional (ex.: cópia para outro email).
  const shareWith = process.env.GOOGLE_DRIVE_SHARE_EMAIL?.trim();
  if (!shareWith?.includes("@")) return;

  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "user",
        emailAddress: shareWith,
      }),
    },
  ).catch((err) => {
    console.warn("[drive] partilha com", shareWith, "falhou:", err);
  });
}

export async function uploadRegistrationToDrive(
  file: File,
): Promise<{ ok: true; url: string; name: string } | { ok: false; error: string }> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!folderId || !isGoogleDriveConfigured()) {
    return {
      ok: false,
      error:
        "Google Drive não configurado. Defina pasta + OAuth (cycode360@gmail.com) — ver docs/google-drive-setup.md.",
    };
  }

  try {
    const token = await getAccessToken();
    const bytes = Buffer.from(await file.arrayBuffer());
    const originalName = safeFileName(file.name);
    const storedName = `${Date.now()}-${originalName}`;
    const contentType = file.type || "application/octet-stream";

    const metadata = JSON.stringify({
      name: storedName,
      parents: [folderId],
    });

    const boundary = `ieul_${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`,
      "utf8",
    );
    const epilogue = Buffer.from(`\r\n--${boundary}--`, "utf8");
    const body = Buffer.concat([preamble, bytes, epilogue]);

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      console.error("[drive] upload failed:", uploadRes.status, errText);
      return { ok: false, error: explainDriveError(uploadRes.status, errText) };
    }

    const data = (await uploadRes.json()) as {
      id?: string;
      name?: string;
      webViewLink?: string;
    };

    if (!data.id) {
      return { ok: false, error: "Resposta inválida do Google Drive." };
    }

    await shareFile(data.id, token);

    const url =
      data.webViewLink ||
      `https://drive.google.com/file/d/${data.id}/view`;

    console.info("[drive] uploaded", data.name || storedName, "→", url);
    return { ok: true, url, name: originalName.slice(0, 120) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[drive] error:", err);
    return { ok: false, error: explainDriveError(0, msg) };
  }
}

export { DRIVE_SCOPE };
