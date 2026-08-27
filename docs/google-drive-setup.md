# Google Drive — anexos de inscrição

Os anexos de candidatura / inscrição vão para o **Google Drive** (não para o Cloudinary), para poupar espaço de media pública.

O Cloudinary continua só para cartazes, galeria e imagens do site.

## 1. Criar pasta no Drive

1. Com a conta **elemos@unilicungo.ac.mz** (ou a conta oficial), abra [Google Drive](https://drive.google.com).
2. Crie uma pasta, por exemplo: `IEUL — Inscrições`.
3. Abra a pasta → copie o **ID** do URL:

```
https://drive.google.com/drive/folders/XXXXXXXXXXXXXXXXXXXX
                                  ^^^^^^^^^^^^^^^^^^^^
                                  = GOOGLE_DRIVE_FOLDER_ID
```

## 2. Service Account (Google Cloud)

1. Vá a [Google Cloud Console](https://console.cloud.google.com/) → projecto (ou crie um).
2. Active **Google Drive API**.
3. **IAM e administrador → Contas de serviço → Criar**.
4. Crie a conta (ex.: `mozinkub-drive@….iam.gserviceaccount.com`).
5. Em **Chaves → Adicionar chave → JSON** → descarregue o ficheiro.
6. **Partilhe a pasta** do passo 1 com o email da service account, permissão **Editor**.

## 3. Variáveis no Vercel / `.env.local`

Opção A — JSON completo (recomendado):

```bash
GOOGLE_DRIVE_FOLDER_ID="id_da_pasta"
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}'
GOOGLE_DRIVE_SHARE_EMAIL="elemos@unilicungo.ac.mz"
```

Opção B — campos separados:

```bash
GOOGLE_DRIVE_FOLDER_ID="id_da_pasta"
GOOGLE_SERVICE_ACCOUNT_EMAIL="mozinkub-drive@….iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_SHARE_EMAIL="elemos@unilicungo.ac.mz"
```

No Vercel: `vercel env add` para Production e Preview, depois redesploy.

## 4. Comportamento

| Situação | Destino |
|----------|---------|
| Drive configurado | Pasta Google Drive + link no email / admin |
| Drive em falta | Fallback temporário Cloudinary/Blob (com aviso nos logs) |

Os ficheiros ficam com ligação de leitura (e partilha explícita com `GOOGLE_DRIVE_SHARE_EMAIL`).

## 5. Teste

1. Faça uma inscrição com anexo em `/actualizacoes/...`.
2. Confirme o ficheiro na pasta Drive.
3. O email deve mostrar `https://drive.google.com/file/d/…` em vez de `res.cloudinary.com`.
