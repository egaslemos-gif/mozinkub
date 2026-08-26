param(
  [string]$ProjectRoot = "C:\Users\Egas Lemos\OneDrive\Academica\UniLicungo\PROJECTOS\INCUBADORA UL\ieul-web",
  [string]$GDriveBackupDir = ""
)

$ErrorActionPreference = "Stop"

Set-Location $ProjectRoot

if (-not $GDriveBackupDir -or $GDriveBackupDir.Trim().Length -eq 0) {
  $envBackupFile = Join-Path $ProjectRoot ".env.backup"
  if (Test-Path $envBackupFile) {
    Get-Content $envBackupFile | ForEach-Object {
      if ($_ -match '^\s*GDRIVE_BACKUP_DIR\s*=\s*(.+)\s*$') {
        $GDriveBackupDir = $Matches[1].Trim().Trim('"')
      }
    }
  }
}

if ($GDriveBackupDir -and $GDriveBackupDir.Trim().Length -gt 0) {
  $env:GDRIVE_BACKUP_DIR = $GDriveBackupDir
}

$logsDir = Join-Path $ProjectRoot "backups\logs"
if (!(Test-Path $logsDir)) {
  New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
}

$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $logsDir "backup-$stamp.log"

try {
  "[$(Get-Date -Format s)] Iniciando backup SQLite..." | Out-File -FilePath $logFile -Encoding utf8
  if ($env:GDRIVE_BACKUP_DIR) {
    "[$(Get-Date -Format s)] GDRIVE_BACKUP_DIR=$($env:GDRIVE_BACKUP_DIR)" | Out-File -FilePath $logFile -Append -Encoding utf8
  }
  npm run db:backup *>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
  "[$(Get-Date -Format s)] Backup concluido com sucesso." | Out-File -FilePath $logFile -Append -Encoding utf8
} catch {
  "[$(Get-Date -Format s)] ERRO: $($_.Exception.Message)" | Out-File -FilePath $logFile -Append -Encoding utf8
  throw
}
