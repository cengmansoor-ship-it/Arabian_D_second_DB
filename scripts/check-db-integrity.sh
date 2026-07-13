#!/usr/bin/env bash
# Runs SQLite's PRAGMA integrity_check and a per-currency journal balance check
# against the live database. Read-only — never writes to the database.
# Usage: ./scripts/check-db-integrity.sh [db-path]
set -euo pipefail
cd "$(dirname "$0")/.."

DB_PATH="${1:-artifacts/api-server/data/arabian-d.sqlite}"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found: $DB_PATH (nothing to check yet, skipping)"
  exit 0
fi

node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('$DB_PATH', { readOnly: true });

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
for (const [currency, { debit = 0, credit = 0 }] of Object.entries(byCurrency)) {
  const diff = Math.abs(debit - credit);
  const status = diff < 0.01 ? 'balanced' : 'UNBALANCED';
  if (diff >= 0.01) ok = false;
  console.log(\`  \${currency}: debit=\${debit} credit=\${credit} -> \${status}\`);
}
if (!ok) {
  console.error('FAILED: one or more currencies have unbalanced journal lines');
  process.exit(1);
}
console.log('Per-currency journal balance: ok');
"
