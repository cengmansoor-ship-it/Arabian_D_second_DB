#!/usr/bin/env bash
# Creates a timestamped copy of the live SQLite database for backup purposes.
# Never overwrites the active database file. Safe to run while the app is running
# (SQLite's file-copy of a WAL-less, fully-committed database is consistent as
# long as no write is in-flight at the exact moment of copy; for a guaranteed-
# consistent snapshot under load, stop the API Server workflow first).
#
# Usage: ./scripts/backup-db.sh [source-db-path] [backup-dir]
set -euo pipefail
cd "$(dirname "$0")/.."

SRC_DB="${1:-artifacts/api-server/data/arabian-d.sqlite}"
BACKUP_DIR="${2:-backups}"

if [ ! -f "$SRC_DB" ]; then
  echo "Source database not found: $SRC_DB" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$BACKUP_DIR/arabian-d.$TIMESTAMP.sqlite"

cp "$SRC_DB" "$DEST"

echo "Verifying backup integrity..."
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('$DEST', { readOnly: true });
const result = db.prepare('PRAGMA integrity_check').get();
if (result.integrity_check !== 'ok') {
  console.error('Backup failed integrity check:', result);
  process.exit(1);
}
console.log('Backup OK:', result.integrity_check);
"

echo "Backup written to: $DEST"
