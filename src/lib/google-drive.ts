import "server-only";
import { JWT } from "google-auth-library";

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

export function isGoogleDriveConfigured(): boolean {
  return Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() && parseServiceAccount());
}

async function getAccessToken(): Promise<string> {
  const sa = parseServiceAccount();
  if (!sa) throw new Error("Service account em falta");

  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const tokens = await client.authorize();
  if (!tokens.access_token) throw new Error("Sem access_token Google");
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

async function shareFile(
  fileId: string,
  token: string,
): Promise<void> {
  // Link público de leitura — quem recebe o email consegue abrir
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone",
    }),
  }).catch((err) => {
    console.warn("[drive] permissão anyone falhou (política Workspace?):", err);
  });

  const shareWith =
    process.env.GOOGLE_DRIVE_SHARE_EMAIL?.trim() ||
    process.env.REGISTRATION_EMAIL?.trim() ||
    "elemos@unilicungo.ac.mz";

  if (shareWith.includes("@")) {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`,
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
}

/**
 * Upload de anexos de inscrição para uma pasta Google Drive partilhada.
 * A pasta (GOOGLE_DRIVE_FOLDER_ID) deve estar partilhada com a service account (Editor).
 */
export async function uploadRegistrationToDrive(
  file: File,
): Promise<{ ok: true; url: string; name: string } | { ok: false; error: string }> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!folderId || !parseServiceAccount()) {
    return {
      ok: false,
      error:
        "Google Drive não configurado. Defina GOOGLE_DRIVE_FOLDER_ID e a service account (ver docs/google-drive-setup.md).",
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
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
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
      return {
        ok: false,
        error:
          "Falha ao enviar para o Google Drive. Confirme a pasta partilhada com a service account.",
      };
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
    console.error("[drive] error:", err);
    return {
      ok: false,
      error: "Erro ao ligar ao Google Drive. Verifique as credenciais.",
    };
  }
}
