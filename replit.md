# Arabian D Residence — Real Estate Management System

A complete, production-quality, local-first Real Estate, Construction Accounting, Sales, Rental, Purchasing, Workforce, Partner Investment, and Reporting System for **Arabian D Residence** (اربین ډي استوګنځای).

## Run & Operate

- The `API Server` workflow runs `PORT=8080 pnpm --filter @workspace/api-server run dev` (SQLite DB auto-created at `data/arabian-d.sqlite`, seeded with a default admin user on boot — see `lib/db-sequelize/src/seed.ts`)
- Default login: `admin` / `admin123` (override via `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars) — **change before real use**
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- See `PROJECT_STATUS.md` for what's implemented vs. still pending against the spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Backend:** Express 5, Sequelize ORM (SQLite local / MySQL hosted), decimal.js for money
- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, TanStack Table
- **Database:** SQLite (default local/offline) → MySQL (future hosted)
- **Auth:** JWT in httpOnly cookies, bcrypt password hashing
- **Locale:** Pashto RTL primary, jalaali-js for Jalali/Solar Hijri calendar
- **Font:** Beheij Zar (local @font-face, TTF files must be uploaded separately)
- **Print/PDF:** CSS @media print; ExcelJS for Excel export
- **Validation:** Zod (`zod/v4`), Sequelize model validations
- **API codegen:** Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `REQUIREMENTS_TRACEABILITY.md` — every requirement mapped to DB tables, API endpoints, frontend pages, tests
- `ASSUMPTIONS.md` — all implementation decisions and open questions
- `attached_assets/Arabian_D_Package/` — all uploaded reference documents
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db-sequelize/` — the real database layer (Sequelize models, connection, auth, seed)
- `lib/db/` — Drizzle/Postgres stub (NOT used by main app; main app uses Sequelize/SQLite)
- `PROJECT_STATUS.md` — phase-by-phase implementation progress against the spec

## Architecture decisions

- **Local-first, offline-capable:** SQLite + local backend; no external API calls for core features
- **Sequelize ORM** with dialect config so same codebase deploys to MySQL later (no code fork)
- **Central posting engine:** every financial action posts to `journal_transactions`/`journal_lines` — no isolated module totals
- **Multi-currency isolation:** AFN/USD/PKR are never summed together; separate ledger per currency per party
- **No floating-point money:** DECIMAL(20,4) in DB, `decimal.js` in all services
- **Beheij Zar font** loaded via local `@font-face` — no external font service
- **Jalali calendar** via `jalaali-js` (pure JS, offline-compatible)
- **Template note:** The uploaded template (Tenplate.zip) is Flutter/Dart — incompatible with React requirement. Discarded; building clean React frontend (see ASSUMPTIONS.md A-1)

## Product

Arabian D Residence is a high-rise mixed-use development. The system manages:
- Dynamic project layout (blocks → floors → units), draft/published layout versions
- Sales of apartments and commercial units with installment/receipt tracking
- Rental contracts for shops with per-period payment allocation
- Material purchases, supplier ledgers, inventory, and purchase returns
- Expense management and daily cash journal (Roznamcha)
- Exchange dealer (Sarafi) module with multi-currency legs
- Employee attendance (daily/monthly), wage calculation, employee ledger
- Partner/investor (Haji) ledger with profit/loss distribution
- Complete print/PDF/Excel for all ledgers, contracts, receipts, and reports

## User preferences

- Primary UI language: Pashto (RTL)
- Do not start coding until REQUIREMENTS_TRACEABILITY.md and ASSUMPTIONS.md are complete
- No fake data, no demo pages, no lorem ipsum in final build
- All financial calculations validated server-side

## Gotchas

- Never use `number` type for money; always use `decimal.js`
- Jalali dates must never shift due to UTC conversion (store as DATEONLY)
- Unit status is derived from contracts/sales, never a manually maintained counter
- Posted financial records cannot be hard-deleted; use Void/Reverse only
- The Beheij Zar font files (BAHIJ ZAR-REGULAR.TTF, BAHIJ ZAR-BOLD.TTF) must be uploaded separately; fallback to system-ui until they are present

## Pointers

- See `REQUIREMENTS_TRACEABILITY.md` for the full requirement → implementation map
- See `ASSUMPTIONS.md` for all decisions and open questions for the owner
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
