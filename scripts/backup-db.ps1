# Creates a timestamped copy of the live SQLite database for backup purposes.
# Never overwrites the active database file.
# Usage: pwsh ./scripts/backup-db.ps1 [source-db-path] [backup-dir]
param(
  [string]$SrcDb = "artifacts/api-server/data/arabian-d.sqlite",
  [string]$BackupDir = "backups"
)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path $SrcDb)) {
  Write-Error "Source database not found: $SrcDb"
  exit 1
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$Dest = Join-Path $BackupDir "arabian-d.$Timestamp.sqlite"

Copy-Item $SrcDb $Dest

Write-Host "Verifying backup integrity..."
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('$Dest', { readOnly: true });
const result = db.prepare('PRAGMA integrity_check').get();
if (result.integrity_check !== 'ok') {
  console.error('Backup failed integrity check:', result);
  process.exit(1);
}
console.log('Backup OK:', result.integrity_check);
"

Write-Host "Backup written to: $Dest"
