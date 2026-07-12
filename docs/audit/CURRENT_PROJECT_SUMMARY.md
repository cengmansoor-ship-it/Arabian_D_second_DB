# CURRENT PROJECT SUMMARY

**Project:** Arabian D Residence Management System
**Audit date:** 2026-07-12
**Git branch:** `main`
**Git commit at audit start:** `b6cf637d0f64633374e342d476bcf75002ac81ba` (2026-07-10 23:24:52 +0000)
**Working tree at audit start:** contained pre-existing uncommitted changes from a prior, separate task (a visual reskin of `artifacts/web/src/index.css`, `AppShell.tsx`, `LoginPage.tsx`, `DashboardPage.tsx`). These changes predate this audit, were not made as part of it, and were **not modified further** during this audit.
**Diagnostic changes made during this audit:** none to application source. All verification was done via `curl`/API calls, direct read-only SQLite queries, and a browser-based click-through session. Test records created during functional testing (see `FUNCTIONAL_TEST_REPORT.md`) remain in the dev database and are clearly identified there; they were not scrubbed because doing so risked destroying audit evidence, and this is a local dev SQLite file, not production data.

## 1. Technology stack (actual, verified from code)

| Layer | Technology | Evidence |
|---|---|---|
| Monorepo | pnpm workspaces, Node.js 24, TypeScript 5.9 | `package.json`, `pnpm-workspace.yaml` |
| Backend framework | Express 5.2.1 | `artifacts/api-server` |
| ORM | Sequelize 6.37.x | `lib/db-sequelize/src/connection.ts` |
| Database (active) | SQLite, file `artifacts/api-server/data/arabian-d.sqlite` (216 KB at audit time) | `lib/db-sequelize/src/connection.ts`; verified file exists on disk |
| Database (configured but unused) | MySQL (via `DB_DIALECT=mysql` env vars) — code path exists, not exercised | same file |
| Database (dead code, NOT used by the app) | Drizzle ORM + PostgreSQL in `lib/db` | confirmed unreferenced by the running app; `replit.md` itself calls this an "unused stub" |
| Auth | JWT (`jsonwebtoken`) in an httpOnly cookie, `bcryptjs` password hashing | `lib/db-sequelize/src/auth.ts`, verified via live login `curl` test |
| Frontend | React 19 + Vite + React Router + TanStack Query + Tailwind v4 (CSS custom properties) | `artifacts/web` |
| Locale | Pashto RTL hardcoded strings, no i18n framework | grep across `artifacts/web/src/pages/*.tsx` |
| Money | `decimal.js`, `DECIMAL(20,4)` columns | `lib/db-sequelize/src/posting.ts`, model definitions |

## 2. Application classification

- **Full stack**, not frontend-only or backend-only: verified React frontend on port 5000 proxying `/api` to an Express backend on port 8080, both under one `Web App` workflow.
- **Database-connected with real persistence**: confirmed via direct SQLite file inspection (`arabian-d.sqlite`) both before and after live API writes — created records survive and are queryable outside the running process.
- **No mock/in-memory data** found in any inspected backend route; all list/detail endpoints query Sequelize models.
- **No localStorage/sessionStorage usage for business data** was found in the frontend; only auth/session state is handled via the httpOnly cookie set by the server.

## 3. What actually exists vs. what the project's own docs claim

The repository already contains its own planning documents, written before/during earlier build sessions:

- `REQUIREMENTS_TRACEABILITY.md` — a very detailed requirement matrix (100+ requirement IDs across 18 sections). **Every single row is marked ⬜ (not started)** and the file header says "Status: Pre-implementation (Phase 0 complete)," dated 2026-07-10. This is now **stale** — it does not reflect that Phases 1–8 (per `PROJECT_STATUS.md`) were actually built.
- `PROJECT_STATUS.md` — states Phases 1–8 are "DONE" (auth, settings, users/roles, projects/blocks/floors/units, accounting/posting engine, parties) and Phases 9–13 (Sales/installments/receipts, shops, rentals, purchases, expenses, exchange, HR, partners, dashboards/reports/print/export) are "not started." This audit found this is **also partially stale**: a `sales.ts` backend route and `sales-service.ts` **do exist** in code (partial Sales implementation), but there is **no Sales page in the frontend** and the sale-creation backend workflow is **broken** (see `FUNCTIONAL_TEST_REPORT.md`).
- `ASSUMPTIONS.md` — records the decision to discard an incompatible Flutter template and build a clean React frontend using only its visual language as reference; also documents 10 open questions for the owner (final layout counts, shop counts, SMTP availability, fiscal year start, etc.) that remain unanswered.

**Conclusion:** treat the project's own status docs as directional but not authoritative for this audit — this audit's statuses in `REQUIREMENTS_TRACEABILITY.md` (the audit version, `docs/audit/REQUIREMENTS_TRACEABILITY.md`) reflect only what was independently observed working during this session.

## 4. High-level state in one paragraph

The system has a real, working authentication layer, a real double-entry accounting/posting engine, and real CRUD for Projects → Blocks → Floors → Units, Parties, Users/Roles, Cash Accounts, and manual Journal entries — all backed by genuine SQLite persistence with no mock data. However, the database had **zero business data** (no projects, blocks, floors, units, sales, or parties) before this audit created test records — the required 10-block/60-floor/270-house structure from the PDFs does not exist anywhere in the running system, seeded or otherwise, and must be created manually through the UI/API. The Sales module (the PDFs' central requirement) has a backend route that **fails with a server error** on the very first successful attempt to sell a unit. There is no Welcome/splash screen, no account lockout after failed logins, no Hijri/Jalali date display anywhere in the UI (despite `jalaali-js` being listed as a planned dependency in `replit.md`), no printing, and entire modules from the PDFs — Rentals, Purchases/Suppliers, Expenses, Exchange/Sarafi, Employees/Attendance, Partners/Profit-Loss, and General Reports — have no frontend pages and, in most cases, no backend routes at all.
