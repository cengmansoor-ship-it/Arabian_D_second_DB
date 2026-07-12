# Local & Replit Runbook

## Stack

Node 24, TypeScript, Express 5, Sequelize (SQLite by default, MySQL-capable),
React + Vite, pnpm workspace monorepo.

## Running on Replit

The `Web App` workflow starts both services:

```
(PORT=8080 pnpm --filter @workspace/api-server run dev &) && PORT=5000 API_URL=http://localhost:8080 pnpm --filter @workspace/web run dev
```

- API server: port 8080 (internal)
- Web frontend (proxied to the Preview pane): port 5000

Required secret: `SESSION_SECRET` (already configured as a Replit Secret —
never hardcode it). See the environment-secrets workflow to view/rotate it.

On first boot, `ensureDatabaseReady()` runs automatically: it applies all
pending migrations and seeds the baseline data (admin role/user, currencies,
company settings, document numbering, and the idempotent 10-block/60-floor/
270-unit residential structure) if the database is empty.

Default first-run credentials (development only): `admin` / `admin123`.
Set `ADMIN_USERNAME` / `ADMIN_PASSWORD` secrets before any real deployment.

## Running locally (outside Replit)

```bash
pnpm install
cp .env.example .env   # fill in SESSION_SECRET at minimum
cd artifacts/api-server && PORT=8080 pnpm run dev &
cd artifacts/web && PORT=5000 API_URL=http://localhost:8080 pnpm run dev
```

## Database migrations

Migrations live in `lib/db-sequelize/src/migrations/` (Umzug-based, tracked in
the `SequelizeMeta` table). They run automatically on every server start via
`ensureDatabaseReady()`. To add a new one:

1. Create `lib/db-sequelize/src/migrations/NNN-description.ts` using the
   `defineMigration` helper.
2. Import it from `lib/db-sequelize/src/migrations/index.ts`.
3. Restart the API server — the migration runs once and is recorded.

`sequelize.sync()` alone does NOT add columns to an existing table; always use
a migration for schema changes.

## Seeding

Seeding is idempotent and runs as part of `ensureDatabaseReady()`; there is no
separate seed command to run manually. Re-running it (e.g. via server
restart) will not duplicate blocks/floors/units, roles, or currencies.

## Running the full verification suite

```bash
./scripts/test.sh
# or on Windows:
pwsh ./scripts/test.ps1
```

Runs, in order: TypeScript checks, backend automated tests (Vitest +
Supertest against an isolated test database), a frontend production build,
and a database integrity check.

## Backups

See `docs/operations/BACKUP_AND_RESTORE.md`.
