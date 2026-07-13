# Backup and Restoration

The system stores all data in a single SQLite file:
`artifacts/api-server/data/arabian-d.sqlite`.

## Creating a backup

```bash
./scripts/backup-db.sh
# or on Windows:
pwsh ./scripts/backup-db.ps1
```

This copies the live database to `backups/arabian-d.<UTC-timestamp>.sqlite` and
immediately runs `PRAGMA integrity_check` against the copy, failing loudly if
the backup is not valid. It never modifies or deletes the source file.

For a guaranteed-consistent snapshot under active write load, stop the
`API Server` workflow first, run the backup, then restart it. In practice a
single-file SQLite copy taken between requests is safe, since SQLite commits
are atomic and the app does not use WAL mode.

Recommended schedule: run a backup before every deployment, and on a daily
cron/scheduled task for production use.

## Checking database integrity

```bash
./scripts/check-db-integrity.sh
# or on Windows:
pwsh ./scripts/check-db-integrity.ps1
```

This is read-only. It runs SQLite's own `PRAGMA integrity_check` and an
application-level check that, for every currency, the sum of journal debit
lines equals the sum of journal credit lines (the double-entry invariant the
whole accounting system depends on).

## Restoring from a backup

**Do not overwrite the active database file directly while the API Server
workflow is running.**

1. Stop the `Web App` / `API Server` workflow.
2. Move the current (possibly broken) database aside, so it is not lost:
   ```bash
   mv artifacts/api-server/data/arabian-d.sqlite artifacts/api-server/data/arabian-d.sqlite.before-restore
   ```
3. Copy the chosen backup into place:
   ```bash
   cp backups/arabian-d.<timestamp>.sqlite artifacts/api-server/data/arabian-d.sqlite
   ```
4. Verify integrity before restarting the app:
   ```bash
   ./scripts/check-db-integrity.sh
   ```
5. Restart the workflow and confirm the app loads and shows the expected data
   (Dashboard totals, recent transactions).
6. Only delete `arabian-d.sqlite.before-restore` once you have confirmed the
   restored database is correct.

### Testing the restore procedure without touching the active database

To validate a backup file without any risk to production data, point a
throwaway copy of the API server at it via the `SQLITE_STORAGE` environment
variable instead of overwriting anything:

```bash
SQLITE_STORAGE=/tmp/restore-test.sqlite cp backups/arabian-d.<timestamp>.sqlite /tmp/restore-test.sqlite
SQLITE_STORAGE=/tmp/restore-test.sqlite node scripts/check-db-integrity.sh /tmp/restore-test.sqlite
```

This is exactly the mechanism the automated test suite uses (see
`artifacts/api-server/tests/setup.ts`) to run against an isolated database
file, never the real one.
