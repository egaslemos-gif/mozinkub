/**
 * Autorização OAuth one-shot para cycode360@gmail.com (ou outra conta Gmail).
 *
 * Pré-requisitos:
 * 1. Google Cloud → APIs → activar Google Drive API
 * 2. Google Auth Platform → Clientes → Criar cliente → Aplicação da Web
 *    Redirect URI: http://localhost:3456/oauth2callback
 * 3. Copiar Client ID + Client Secret para .env.local:
 *    GOOGLE_OAUTH_CLIENT_ID=...
 *    GOOGLE_OAUTH_CLIENT_SECRET=...
 *
 * Uso: npm run drive:oauth
 * Depois cole o refresh_token no Vercel como GOOGLE_OAUTH_REFRESH_TOKEN.
 */
const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");

const REDIRECT = "http://localhost:3456/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadEnvLocal();

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error(
    "Defina GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET em .env.local",
  );
  process.exit(1);
}

const oauth2 = new OAuth2Client(clientId, clientSecret, REDIRECT);
const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [SCOPE],
});

console.log("\n1) Inicie sessão com cycode360@gmail.com no browser:\n");
console.log(authUrl);
console.log("\n2) A aguardar callback em", REDIRECT, "…\n");

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || "/", REDIRECT);
    if (u.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const code = u.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end("Missing code");
      return;
    }
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>OAuth OK</h1><p>Pode fechar esta janela e voltar ao terminal.</p>",
    );

    console.log("\n=== Cole no Vercel / .env.local ===\n");
    console.log(`GOOGLE_OAUTH_CLIENT_ID="${clientId}"`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET="${clientSecret}"`);
    if (tokens.refresh_token) {
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`);
    } else {
      console.log(
        "# ATENÇÃO: Google não devolveu refresh_token. Revogue o acesso da app em",
      );
      console.log(
        "# https://myaccount.google.com/permissions e volte a correr npm run drive:oauth",
      );
    }
    console.log("\n");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end("Erro OAuth");
    server.close();
    process.exit(1);
  }
});

server.listen(3456, () => {
  // try open browser (Windows)
  try {
    require("child_process").exec(
      `start "" "${authUrl}"`,
      { shell: true },
      () => {},
    );
  } catch {
    /* ignore */
  }
});
