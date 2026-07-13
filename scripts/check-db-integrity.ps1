# Runs SQLite's PRAGMA integrity_check and a per-currency journal balance check
# against the live database. Read-only.
# Usage: pwsh ./scripts/check-db-integrity.ps1 [db-path]
param(
  [string]$DbPath = "artifacts/api-server/data/arabian-d.sqlite"
)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path $DbPath)) {
  Write-Host "Database not found: $DbPath (nothing to check yet, skipping)"
  exit 0
}

node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('$DbPath', { readOnly: true });

const integrity = db.prepare('PRAGMA integrity_check').get();
if (integrity.integrity_check !== 'ok') {
  console.error('FAILED integrity_check:', integrity);
  process.exit(1);
}
console.log('PRAGMA integrity_check: ok');

const rows = db.prepare('SELECT currencyCode, direction, SUM(CAST(amount as REAL)) as total FROM journal_lines GROUP BY currencyCode, direction').all();
const byCurrency = {};
for (const r of rows) {
  byCurrency[r.currencyCode] = byCurrency[r.currencyCode] || { debit: 0, credit: 0 };
  byCurrency[r.currencyCode][r.direction] = r.total;
}
let ok = true;
for (const [currency, vals] of Object.entries(byCurrency)) {
  const debit = vals.debit || 0;
  const credit = vals.credit || 0;
  const diff = Math.abs(debit - credit);
  const status = diff < 0.01 ? 'balanced' : 'UNBALANCED';
  if (diff >= 0.01) ok = false;
  console.log('  ' + currency + ': debit=' + debit + ' credit=' + credit + ' -> ' + status);
}
if (!ok) {
  console.error('FAILED: one or more currencies have unbalanced journal lines');
  process.exit(1);
}
console.log('Per-currency journal balance: ok');
"
