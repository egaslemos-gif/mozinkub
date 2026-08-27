# Cloudinary — armazenamento de imagens e documentos

Substitui (ou complementa) o Vercel Blob para uploads de media. URLs públicas via CDN `res.cloudinary.com`.

## 1) Criar conta Cloudinary

1. Registe-se em [cloudinary.com](https://cloudinary.com) (plano **Free** — 25 GB).
2. No **Dashboard**, copie:
   - **Cloud name**
   - **API Key**
   - **API Secret**

## 2) Variáveis no Vercel (projecto `mozinkub`)

**Settings → Environment Variables** — adicionar em Production + Preview:

| Variável | Exemplo |
|----------|---------|
| `CLOUDINARY_CLOUD_NAME` | `dxxxxxx` |
| `CLOUDINARY_API_KEY` | `123456789012345` |
| `CLOUDINARY_API_SECRET` | `xxxxxxxxxxxxxxxx` |

Localmente, adicione ao `.env.local` (não commitar).

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
