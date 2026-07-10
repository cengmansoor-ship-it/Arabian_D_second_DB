# Project Status — Arabian D Residence

Tracks implementation progress against `REQUIREMENTS_TRACEABILITY.md` and `ASSUMPTIONS.md`.

## Phase 1–4: Foundation — DONE (this session)

- Monorepo wired up: `@workspace/db-sequelize` package added (`lib/db-sequelize`), referenced from `tsconfig.json`, installed and typechecked.
- Sequelize connection (`lib/db-sequelize/src/connection.ts`): SQLite by default (`data/arabian-d.sqlite`), switches to MySQL via `DB_DIALECT=mysql` + `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` — no code changes needed to move hosted.
- Core models: `User`, `Role`, `Permission`, `RolePermission`/`UserRole` join tables, `AuditLog`, `Currency`, `CompanySetting`, `DocumentSequence`.
- Auth: bcrypt password hashing, JWT in httpOnly cookie (`SESSION_SECRET`), `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `requireAuth` middleware.
- Seed on boot (`ensureDatabaseReady`): creates `admin` role with core permission keys, base currencies (AFN/USD/PKR), company settings row, document numbering sequences (sales/rental contracts, receipts, purchase invoices, expense vouchers, journal entries), and a default admin user (`ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars, defaults `admin`/`admin123` — **change this in production**).
- `API Server` workflow configured and verified running; `/api/healthz`, `/api/auth/login`, `/api/auth/me` all tested working end-to-end.

## Phase 5: Authentication, Company Settings & Application Shell — DONE (this session)

- Backend: `users.manage`/`roles.manage`/`settings.manage`-gated REST endpoints — `GET/PUT /api/settings`, `GET/POST /api/settings/currencies`, `GET/POST/PUT /api/users`, `GET/POST /api/roles`, `PUT /api/roles/:id/permissions`, `GET /api/roles/permissions`, `GET /api/audit-logs` — all backed by real Sequelize models, no mock data.
- `requirePermission` middleware (role → permission lookup) and a shared `recordAudit` helper wired into every settings/users/roles mutation, writing to `audit_logs`.
- New `@workspace/web` frontend package (React 19 + Vite + TanStack Query + React Router + Tailwind v4), Pashto RTL throughout, proxies `/api` to the API server.
- Pages: Login (real JWT cookie auth), App Shell (sidebar/topbar, role-aware nav), Dashboard (live company settings), Settings (company info + currencies), Users (create/list/activate/deactivate + role assignment), Roles (create role + toggle permissions), Audit Log (paginated feed).
- `Web App` workflow configured on port 5000 (webview); `API Server` remains on 8080 (console).
- Verified end-to-end: login, session cookie, settings read/update, currency add, user create/list, role/permission toggle, and audit log all tested against the running server.

## Phase 6: Projects, Blocks, Floors, Units — DONE (this session, core slice)

- Models: `Project` (status: draft/active/on_hold/completed/archived), `BlockGroup`, `Block`, `Floor` (floor_type enum), `UnitType` (dynamic master list, seeded with the 11 core types), `Unit` (status: draft/available/reserved/sold/rented/blocked/cancelled/inactive; purpose: for_sale/for_rent/both/not_available).
- Backend: `GET/POST/PUT /api/projects`, `GET/POST /api/projects/:id/block-groups`, `GET/POST/PUT /api/projects/:id/blocks(/:blockId)`, `GET/POST /api/projects/:id/blocks/:blockId/floors`, `GET /api/projects/:id/unit-map` (nested block→floor→unit tree), `POST /api/projects/:id/blocks/:blockId/floors/:floorId/units`, `PUT /api/units/:id`, `GET/POST /api/unit-types` — all gated by a new `projects.manage` permission, all writes audited.
- Guardrail: unit `status` can only be set manually to draft/available/blocked/cancelled/inactive via the API — `sold`/`reserved`/`rented` are rejected with an explicit error, reserved for the future sales/rental posting services (per the "unit status is derived, never manually maintained" rule in replit.md).
- Frontend: Projects list + create + status change, Project detail page with block creation, inline floor creation per block, inline unit creation per floor, a color-coded visual unit map (click a unit to view/change its manual-only status), and a Unit Types settings page.
- Verified end-to-end via curl: full project → block → floor → unit → unit-map chain, and the manual-status guard rejecting `sold`. Frontend and backend both typecheck clean.
- **Not yet built** (deferred, lower priority per spec): layout versions (draft/published, §PROJ-02), multi-level `unit_parts` for commercial units spanning floors (PROJ-10), the bulk layout-generation wizard (PROJ-12), and block groups/sections UI (model exists, no dedicated screen yet). These will be layered onto this same schema when sales/rentals need them.

## Phase 7: Central Accounting & Posting Engine — DONE (this session, core slice)

- Models: `Account` (asset/liability/equity/income/expense, seeded with the 7 core accounts), `CashAccount` (per-currency cash box linked to an account, seeded with a default AFN cash box), `JournalTransaction` (idempotency key, manual flag, void/reversal fields), `JournalLine` (account, currency, direction, DECIMAL(20,4) amount, optional party type/id for future per-party ledgers), `PostingLink` (unique per source module+id+posting type — enforces "posted only once"), `FiscalPeriod`.
- `postJournal()` and `reverseJournal()` in `lib/db-sequelize/src/posting.ts` — the single entry point every future module (sales, rentals, purchases, HR, exchange, partners) must call to post money. Enforces debit === credit **per currency** (decimal.js, no floats), rejects duplicate source postings, wraps everything in a DB transaction, and reversal creates a proper offsetting transaction (never mutates/deletes the original).
- Backend: `GET /api/journal` (with Money In/Money Out `?direction=` filter), `GET /api/journal/accounts`, `POST /api/journal/manual`, `POST /api/journal/:id/reverse` (reason required, audited), `GET/POST /api/cash-accounts` — all gated by `accounting.manage`.
- Frontend: Journal page (multi-line manual entry builder with live account/currency pickers, transaction list with debit/credit table, reverse-with-reason flow) and a Cash Accounts settings page.
- Verified end-to-end via curl: balanced posting succeeds, unbalanced posting is rejected with a clear error, and reversal produces a correctly offsetting transaction. Full workspace typecheck passes.
- **Not yet built** (deferred until the modules that need them): idempotency-key HTTP middleware for client-side duplicate-click protection (ACCT-05/09 — the engine already dedupes by source+type and rejects unbalanced/duplicate idempotency keys server-side), fiscal period open/close UI, party-ledger read endpoints (`journal_lines.partyType/partyId` columns exist and are ready, but no parties module exists yet to attach them to).

## Phase 8: Parties & Customer Master — DONE (this session)

- Models: `Party` (9 types: individual/market/sales customer, supplier, tenant, exchange dealer, employee, partner, other; name/father/grandfather name, Tazkira, tax/reg number, 2 phones, address, notes, photo URL, indexed on name/tazkira/type) and `PartyRole` (a party can hold multiple roles over time).
- Backend: `GET /api/parties?q=&type=` (search by name/tazkira/phone), `GET /api/parties/duplicate-check?name=&tazkiraNumber=`, `GET/POST/PUT /api/parties/:id`, `GET /api/parties/:id/ledger?currency=` — reads `journal_lines` filtered by `partyType`+`partyId` (already-existing columns from the Phase 7 posting engine) and returns a debit/credit/net balance per currency. All mutations gated by `parties.manage` and audited.
- Frontend: Parties list with search/type filter and inline duplicate-name warning on blur, Party detail page with an editable info panel and a per-currency ledger view (pulsing طلب/پور debt warning banner when net balance is owed).
- Verified end-to-end via curl: create, search, duplicate-check, a manual AR posting tagged to the party, and the ledger endpoint correctly aggregating that posting into a balance. Full workspace typecheck passes.
- **Not yet built** (deferred): party photo/document upload (needs an object-storage decision), printable ledger with company header/Jalali dates, and the full cross-module activity timeline (will populate naturally once sales/rentals/purchases start posting through this same party+ledger mechanism).

## Phase 9–13: Not started

Sales/installments/receipts, shops/commercial units, rentals, purchases/inventory, expenses/cash journal, exchange dealer, HR/wages, partners/investors, dashboards/reports/print/export are **not yet implemented**. Per the agreed build order, **Sales/Installments/Receipts** is next.

## Known gaps / notes

- Default admin credentials must be changed before any real use; currently only enforced by env var override.
- No automated tests yet (planned per-phase alongside the corresponding follow-up tasks).
- `lib/db` (Drizzle/Postgres) remains an unused stub per `replit.md` — the real app uses `lib/db-sequelize`.
