# IEUL Web — Site institucional + CMS

Plataforma da Incubadora de Empresas da Universidade Licungo (MozInkub N+1).

## Arranque local

```bash
cd ieul-web
npm install
npm run db:setup
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: `coordenacao@ieul.ul.ac.mz` / `ieul2026`

## Stack

Next.js · Tailwind · Prisma (SQLite) · Auth.js (credenciais)

## Operação MVP (SQLite)

- Backup manual/automático:
  - `npm run db:backup`
  - `npm run db:backup:schedule` (Windows, diário)
- Restore:
  - `npm run db:restore -- --file "C:/caminho/backup.db" --force`

Guia operacional completo:
- `docs/mvp-sqlite-backup-and-postgres-migration.md`
