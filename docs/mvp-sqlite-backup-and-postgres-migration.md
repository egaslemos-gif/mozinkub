# MVP: SQLite com backup (GDrive) e migração futura para Postgres

Este guia permite operar o MVP com SQLite de forma controlada, mantendo backups e preparando a transição para Postgres.

## 1) Decisão de infraestrutura para MVP

- **Não recomendado na Vercel**: SQLite como base principal (filesystem efémero).
- **Recomendado para MVP com SQLite**: ambiente com disco persistente (VPS/VM/host com volume).
- Sincronização com Google Drive via cliente local (Google Drive Desktop), apontando a pasta de backups para um diretório sincronizado.

## 2) Pasta institucional no Google Drive

Pasta alvo (nuvem):
[IEUL Backups — Google Drive](https://drive.google.com/drive/folders/18qV9A0HRd0wCfLSwzGT8HsN_ePsQfhmP?usp=drive_link)

- Folder ID: `18qV9A0HRd0wCfLSwzGT8HsN_ePsQfhmP`
- Config local: `.env.backup`

### Estado actual neste PC

- **Google Drive Desktop não está instalado** → não existe caminho local `G:\My Drive\...`.
- Enquanto isso, o backup diário grava em OneDrive (já sincroniza):
  - `C:\Users\Egas Lemos\OneDrive\IEUL-Backups\sqlite`
- Quando instalar o [Google Drive para desktop](https://www.google.com/drive/download/), faça streaming/mirror da pasta acima e reinstale a tarefa com o caminho local dessa pasta.

## 2.1) Variáveis de ambiente

No `.env`:

```env
DATABASE_URL="file:./dev.db"
```

No `.env.backup` (já criado):

```env
GDRIVE_FOLDER_ID=18qV9A0HRd0wCfLSwzGT8HsN_ePsQfhmP
GDRIVE_BACKUP_DIR=C:\Users\Egas Lemos\OneDrive\IEUL-Backups\sqlite
```

> Se `GDRIVE_BACKUP_DIR` não estiver definido, os backups vão para `backups/sqlite/`.
## 3) Scripts disponíveis

- `npm run db:backup`  
  Cria snapshot da base SQLite (inclui `-wal` e `-shm` quando existirem) com hash SHA-256.

- `npm run db:restore -- --file "<caminho>.db" --force`  
  Restaura uma cópia `.db` para a base ativa (faz backup pré-restore automaticamente).

- `npm run db:backup:schedule`  
  Regista agendamento diário no Windows (default às 20:00).

### Scripts PowerShell (Windows)

- `scripts/windows-daily-backup-runner.ps1`  
  Executa backup e escreve log em `backups/logs/`.

- `scripts/windows-install-daily-backup-task.ps1`  
  Instala/atualiza tarefa agendada:
  - `-TaskName` (default `IEUL-SQLite-Daily-Backup`)
  - `-DailyAt` (default `20:00`)
  - `-GDriveBackupDir` (opcional)

Exemplo com Google Drive:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/windows-install-daily-backup-task.ps1 `
  -DailyAt "20:00" `
  -GDriveBackupDir "C:\Users\<UTILIZADOR>\Google Drive\IEUL-Backups\sqlite"
```

Verificar tarefa:

```powershell
schtasks /Query /TN "\IEUL-SQLite-Daily-Backup" /V /FO LIST
```

Executar teste imediato:

```powershell
schtasks /Run /TN "\IEUL-SQLite-Daily-Backup"
```

## 4) Política mínima de backup (MVP)

- Frequência: **diária** (ou 2x por dia em fase crítica).
- Retenção:
  - últimos 14 dias (diários),
  - últimos 8 backups semanais.
- Verificação:
  - 1 restore de teste por semana num ambiente de staging/local.
- Segurança:
  - pasta de backup com acesso restrito (admin da incubadora).

## 5) Procedimento operacional recomendado

1. Confirmar app está estável (janela de baixa atividade).
2. Executar `npm run db:backup`.
3. Verificar logs (arquivo, tamanho e SHA-256).
4. Confirmar sincronização no Google Drive.
5. Registrar backup (data/hora/responsável) numa planilha operacional.
6. Verificar log da execução em `backups/logs/`.

## 6) Persistência na Vercel (imagens e dados admin)

Na Vercel o filesystem é efémero. Para o MVP de testes:

1. **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`) — armazena ficheiros (logos, capas, PDFs) e um snapshot SQLite em `durable/ieul.db`.
2. Em cada cold start a app restaura a base a partir do Blob (lock + retries); se o Blob existir mas falhar o download, **não** cai no seed (evita apagar dados).
3. Após escritas admin, o snapshot é reenviado ao Blob. **Durante `next build` o persist está desligado** — um deploy não sobrescreve a base de produção com o seed.
4. O seed é **idempotente**: não apaga galeria, slides, timeline, nem sobrescreve `logoUrl` / `coverUrl` já existentes.

Isto cobre a fase de aprovação com gestores. A migração definitiva para **Postgres (Neon)** continua recomendada.

### Migração futura para Postgres (checklist)

Quando decidirem mover para produção em Vercel:

1. Provisionar Postgres (Vercel Postgres, Neon ou Supabase).
2. Definir `DATABASE_URL` do Postgres.
3. Executar migrações Prisma para o novo banco.
4. Migrar dados SQLite -> Postgres (script de carga validado).
5. Validar contagens e integridade (users, projects, calls, etc.).
6. Congelar escrita em SQLite, cortar para Postgres e monitorar.

## 7) Risco principal (transparência)

SQLite em produção com múltiplos utilizadores concorrentes pode limitar escalabilidade e lock de escrita. Para MVP é aceitável com carga baixa + backup disciplinado; para expansão, migrar para Postgres é mandatário.

