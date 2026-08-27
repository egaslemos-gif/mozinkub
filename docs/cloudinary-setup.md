# Cloudinary — armazenamento de imagens e documentos

Substitui (ou complementa) o Vercel Blob para uploads de media. URLs públicas via CDN `res.cloudinary.com`.

## 1) Criar conta Cloudinary

1. Registe-se em [cloudinary.com](https://cloudinary.com) (plano **Free** — 25 GB).
2. No **Dashboard**, copie:
   - **Cloud name**
   - **API Key**
   - **API Secret**

## 2) Variáveis no Vercel (projecto `mozinkub`)

**Settings → Environment Variables** — adicionar em Production + Preview.

**Opção A — três variáveis:**

| Variável | Valor (dashboard Cloudinary) |
|----------|------------------------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

**Opção B — uma variável (copiar do quickstart):**

| Variável | Valor |
|----------|-------|
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |

⚠️ **Não troque** API Key com API Secret. Se vir *Invalid Signature*, o Secret está errado — copie de novo em **View API Keys** e faça **Redeploy**.

## 3) Redeploy

```bash
git push
```

Ou **Redeploy** no dashboard Vercel após guardar as variáveis.

## 4) Prioridade de upload

1. **Cloudinary** — se `CLOUDINARY_*` estiver definido
2. **Vercel Blob** — se `BLOB_READ_WRITE_TOKEN` (legado)
3. **Disco local** — apenas em desenvolvimento

## 5) Tipos suportados

Imagens (jpg, png, webp, gif, svg), vídeos (mp4, webm, mov), documentos (pdf, doc, docx). Máximo **12 MB** por ficheiro.

Ficheiros ficam na pasta Cloudinary `ieul/`.

## Nota sobre media antiga

URLs antigas do Vercel Blob continuam a funcionar via proxy `/api/media` enquanto o Blob responder. Novos uploads vão para Cloudinary.
