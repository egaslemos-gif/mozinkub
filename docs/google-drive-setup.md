# Google Drive — anexos de inscrição

Os anexos vão para o **Google Drive** (não Cloudinary). Cloudinary fica para media pública do site.

## Problema comum (403 storageQuotaExceeded)

Contas de serviço **não têm espaço** no «Meu Drive». Por isso partilhar uma pasta pessoal com a SA **não chega**.

Use **uma** destas soluções:

---

## Solução A — Domain-wide delegation (recomendada)

O app age **como** `elemos@unilicungo.ac.mz` e grava na pasta `Inscricoes` desse utilizador.

### 1. Já feito
- Service account `mozinkub-drive@….iam.gserviceaccount.com`
- JSON no Vercel (`GOOGLE_SERVICE_ACCOUNT_JSON`)
- Pasta `Inscricoes` + `GOOGLE_DRIVE_FOLDER_ID`

### 2. Admin Google Workspace (UniLicungo)

1. [Admin Console](https://admin.google.com) → **Segurança** → **Controlos de API** → **Delegação em todo o domínio**.
2. **Adicionar novo**:
   - **ID do cliente** = `client_id` numérico do JSON da service account  
     (ex.: `116507920895482497361`)
   - **Scopes** (colar exactamente):
     ```
     https://www.googleapis.com/auth/drive
     ```
3. Guardar.

### 3. Variáveis Vercel

```bash
GOOGLE_DRIVE_FOLDER_ID="1bShsg_EDyv9Gq18_OD2B1fn-SuPX2QCB"
GOOGLE_SERVICE_ACCOUNT_JSON='{...}'
GOOGLE_DRIVE_IMPERSONATE_EMAIL="elemos@unilicungo.ac.mz"
GOOGLE_DRIVE_SHARE_EMAIL="elemos@unilicungo.ac.mz"
```

`GOOGLE_DRIVE_IMPERSONATE_EMAIL` (ou `GOOGLE_DRIVE_SHARE_EMAIL`) activa a impersonação no código.

Redeploy após alterar vars / após o admin activar a delegação.

---

## Solução B — Unidade partilhada (Shared Drive)

Se não puder activar domain-wide delegation:

1. No Drive: **Novo** → **Unidade partilhada** (ex.: `IEUL Inscrições`).
2. Adicione `mozinkub-drive@…` como **Gestor de conteúdo**.
3. Crie pasta dentro da unidade, copie o novo ID → `GOOGLE_DRIVE_FOLDER_ID`.
4. Redeploy.

---

## Checklist rápido

| Item | Estado |
|------|--------|
| Drive API activa no projecto GCP | ☐ |
| JSON + folder ID no Vercel | ☐ |
| Domain-wide delegation **ou** Shared Drive | ☐ |
| Redeploy | ☐ |
| Teste inscrição com anexo | ☐ |

Links no email / admin: `https://drive.google.com/file/d/…`
