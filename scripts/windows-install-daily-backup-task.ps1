param(
  [string]$TaskName = "IEUL-SQLite-Daily-Backup",
  [string]$DailyAt = "20:00",
  [string]$ProjectRoot = "C:\Users\Egas Lemos\OneDrive\Academica\UniLicungo\PROJECTOS\INCUBADORA UL\ieul-web",
  [string]$GDriveBackupDir = ""
)

$ErrorActionPreference = "Stop"

$runnerScript = Join-Path $ProjectRoot "scripts\windows-daily-backup-runner.ps1"
if (!(Test-Path $runnerScript)) {
  throw "Script runner nao encontrado: $runnerScript"
}

$args = "-NoProfile -ExecutionPolicy Bypass -File `"$runnerScript`" -ProjectRoot `"$ProjectRoot`""
if ($GDriveBackupDir -and $GDriveBackupDir.Trim().Length -gt 0) {
  $args += " -GDriveBackupDir `"$GDriveBackupDir`""
}

Write-Host "Criando/atualizando tarefa agendada:"
Write-Host "  Nome: $TaskName"
Write-Host "  Hora: $DailyAt"
Write-Host "  Comando: powershell.exe $args"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $args
$trigger = New-ScheduledTaskTrigger -Daily -At $DailyAt
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 2) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Force | Out-Null

Write-Host "Tarefa configurada com sucesso."
Write-Host "Para verificar: schtasks /Query /TN `"$TaskName`" /V /FO LIST"

