# Turso (libSQL) — base persistente na Vercel

Substitui o SQLite no Blob (`durable/ieul.db`) por uma base Turso. As **imagens** continuam no Vercel Blob (ainda bloqueado no Hobby até upgrade/reset).

## 1) Completar a integração no Vercel

1. No modal **Install Integration** → clique **Accept and Create**.
2. Crie/seleccione a database (ex.: `mozinkub`).
3. **Ligue** o recurso ao projecto `mozinkub` (Production + Preview).
4. Em **Settings → Environment Variables**, confirme (nomes podem variar):
   - `TURSO_DATABASE_URL` = `libsql://....turso.io`
   - `TURSO_AUTH_TOKEN` = token
   - ou `LIBSQL_URL` + `LIBSQL_AUTH_TOKEN`

Mantenha também `DATABASE_URL="file:./dev.db"` para o Prisma CLI em build/local.

## 2) O que o código faz

- Se Turso estiver configurado → Prisma usa `@prisma/adapter-libsql` (sem restore/persist no Blob).
- Em `npm run build` → `scripts/prepare-db.ts` aplica o schema no Turso e faz seed se a base estiver vazia.
- Sem Turso → caminho antigo (SQLite local / Blob durable).

## 3) Redeploy

Após as variáveis estarem no projecto:

```bash
git push
```

Ou **Redeploy** no dashboard Vercel.

## 4) Login demo (após seed)

- `coordenacao@ieul.ul.ac.mz` / `ieul2026`

## Nota sobre imagens

Uploads de media ainda dependem do Blob. Enquanto *Advanced Operations* estiver no limite Hobby, faça upgrade a Pro ou espere o reset (25/09/2026).
