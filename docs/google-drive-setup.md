# Google Drive — anexos via Gmail (cycode360@gmail.com)

Sem acesso ao admin UniLicungo, usamos **OAuth** da conta Gmail `cycode360@gmail.com`.  
Os ficheiros ficam no Drive dessa conta (tem quota). Service account sozinha no Meu Drive **não funciona**.

## Passo 1 — Pasta no Drive

1. Entre em [drive.google.com](https://drive.google.com) com **cycode360@gmail.com**.
2. Crie a pasta `IEUL-Inscricoes` (ou use uma existente).
3. Copie o ID do URL → `GOOGLE_DRIVE_FOLDER_ID`.

## Passo 2 — Google Cloud (mesmo projecto ou outro)

1. Active **Google Drive API**.
2. **Google Auth Platform → Clientes → Criar cliente**:
   - Tipo: **Aplicação da Web**
   - Nome: `mozinkub-drive-oauth`
   - URI de redirecionamento: `http://localhost:3456/oauth2callback`
3. Copie **ID do cliente** e **Segredo do cliente**.

## Passo 3 — Gerar refresh token (local)

Em `ieul-web/.env.local`:

```env
GOOGLE_OAUTH_CLIENT_ID="….apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="…"
```

Depois:

```bash
npm run drive:oauth
```

Inicie sessão com **cycode360@gmail.com**, aceite as permissões.  
O terminal mostra `GOOGLE_OAUTH_REFRESH_TOKEN=...`.

## Passo 4 — Vercel

```bash
GOOGLE_DRIVE_FOLDER_ID="id_da_pasta_no_drive_cycode360"
GOOGLE_OAUTH_CLIENT_ID="…"
GOOGLE_OAUTH_CLIENT_SECRET="…"
GOOGLE_OAUTH_REFRESH_TOKEN="…"
GOOGLE_DRIVE_SHARE_EMAIL="cycode360@gmail.com"
REGISTRATION_EMAIL="cycode360@gmail.com"
```

Redeploy. Teste uma inscrição com anexo.

## Web3Forms

No dashboard Web3Forms, mude o **Recipient** para `cycode360@gmail.com` (se quiser notificações no mesmo sítio).

## Notas

| Método | Quando usar |
|--------|-------------|
| **OAuth Gmail** (este guia) | Sem admin Workspace — caminho actual |
| Service account + Shared Drive / DWD | Só com Google Workspace admin |

Revogar acesso da app: https://myaccount.google.com/permissions
