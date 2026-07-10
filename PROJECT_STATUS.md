# Project Status — Arabian D Residence

Tracks implementation progress against `REQUIREMENTS_TRACEABILITY.md` and `ASSUMPTIONS.md`.

## Phase 1–4: Foundation — DONE (this session)

- Monorepo wired up: `@workspace/db-sequelize` package added (`lib/db-sequelize`), referenced from `tsconfig.json`, installed and typechecked.
- Sequelize connection (`lib/db-sequelize/src/connection.ts`): SQLite by default (`data/arabian-d.sqlite`), switches to MySQL via `DB_DIALECT=mysql` + `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` — no code changes needed to move hosted.
- Core models: `User`, `Role`, `Permission`, `RolePermission`/`UserRole` join tables, `AuditLog`, `Currency`, `CompanySetting`, `DocumentSequence`.
- Auth: bcrypt password hashing, JWT in httpOnly cookie (`SESSION_SECRET`), `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `requireAuth` middleware.
- Seed on boot (`ensureDatabaseReady`): creates `admin` role with core permission keys, base currencies (AFN/USD/PKR), company settings row, document numbering sequences (sales/rental contracts, receipts, purchase invoices, expense vouchers, journal entries), and a default admin user (`ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars, defaults `admin`/`admin123` — **change this in production**).
- `API Server` workflow configured and verified running; `/api/healthz`, `/api/auth/login`, `/api/auth/me` all tested working end-to-end.

## Phase 5–13: Not started

The central posting engine, parties/ledgers, projects/blocks/floors/units, purchases/inventory, expenses/cash journal, sales/installments, rental contracts, exchange dealer, HR/wages, partners/investors, dashboards/reports/print/export are **not yet implemented**. These are large, mostly-independent slices of the spec — see the follow-up tasks proposed alongside this file for how they're broken up.

## Known gaps / notes

- Default admin credentials must be changed before any real use; currently only enforced by env var override.
- No automated tests yet (planned per-phase alongside the corresponding follow-up tasks).
- `lib/db` (Drizzle/Postgres) remains an unused stub per `replit.md` — the real app uses `lib/db-sequelize`.
