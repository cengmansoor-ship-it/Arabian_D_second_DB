# BUILD AND RUN REPORT

## Commands executed and results

| # | Command | Purpose | Result |
|---|---|---|---|
| 1 | `git rev-parse --abbrev-ref HEAD` | Record branch | `main` |
| 2 | `git log -1 --format='%H %ci'` | Record commit hash | `b6cf637d0f64633374e342d476bcf75002ac81ba` (2026-07-10 23:24:52 +0000) |
| 3 | `git status --short` | Check working tree | Pre-existing uncommitted changes from an earlier, unrelated task (frontend reskin) + new attached PDFs/zip. Nothing was added or changed by this audit. |
| 4 | Workflow `Web App`: `(PORT=8080 pnpm --filter @workspace/api-server run dev &) && PORT=5000 API_URL=http://localhost:8080 pnpm --filter @workspace/web run dev` | Run the full stack | **Succeeded.** Backend builds (`node ./build.mjs`, esbuild bundle ~1.7 MB) then starts (`node --enable-source-maps ./dist/index.mjs`) on port 8080; frontend starts via `vite dev` on port 5000 with `/api` proxied to 8080. No install step was needed — dependencies were already installed from a prior session. |
| 5 | `curl -X POST /api/auth/login` (admin/admin123) | Verify login | `200 OK`, `auth_token` httpOnly cookie set, JWT valid |
| 6 | `curl /api/auth/me` with cookie | Verify session | `200 OK`, returns admin user + roles |
| 7 | 4× `curl -X POST /api/auth/login` with wrong password, then 1 correct | Verify lockout | All 4 wrong attempts returned `401`; the 5th (correct) attempt still succeeded — **no lockout enforced** |
| 8 | `curl /api/projects` with no cookie | Verify auth enforcement | `401 {"error":"Not authenticated"}` — correctly rejected |
| 9 | `curl -X POST /api/projects`, `/api/projects/1/blocks`, `/api/projects/1/blocks/1/floors`, `/api/projects/1/blocks/1/floors/1/units`, `/api/parties`, `/api/sales`, `/api/journal/manual` | Exercise full financial/property CRUD chain | See `FUNCTIONAL_TEST_REPORT.md` for full detail — project/block/floor/unit/party/manual-journal creation all succeeded; **sale creation failed with HTTP 500** |
| 10 | Direct SQLite queries via a throwaway Node script using the `sqlite3` package already present in `artifacts/api-server/node_modules` (no `sqlite3` CLI is installed in this environment) | Verify real persistence and row counts | Confirmed database file at `artifacts/api-server/data/arabian-d.sqlite`; confirmed tables and row counts before/after testing (see `DATABASE_AUDIT.md`) |
| 11 | Browser-based click-through session (Playwright-driven) across every sidebar page after logging in | Verify UI-level functionality | See `BUTTONS_AND_PAGES_TEST.md` — all reachable pages loaded; one broken control found (Roles → Create role) |

## Ports used

- **5000** — frontend (Vite dev server, proxies `/api/*` to 8080), this is the port shown in the Replit preview
- **8080** — backend Express API server (internal, not directly exposed in preview)

## Required secrets / environment variables

- `SESSION_SECRET` — required for JWT signing (already present in this environment's secrets, confirmed by the platform's available-secrets list; value not read or displayed)
- Optional, not currently set: `DB_DIALECT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` (only needed for MySQL mode), `SQLITE_STORAGE` (path override), `ADMIN_USERNAME`, `ADMIN_PASSWORD` (seed overrides — defaults `admin`/`admin123` are in active use)

## Failed commands / errors encountered

- `POST /api/sales` with a valid, available, for-sale unit → **HTTP 500**, unhandled server error. Full stack trace and root-cause analysis in `FUNCTIONAL_TEST_REPORT.md` and `ERRORS_AND_BLOCKERS.md`.
- Several early test `curl` calls returned expected `400`/`409` validation errors while the correct request shape was being discovered (duplicate block code, missing required fields for Party/Sale) — these are not application bugs, they are correct validation behavior, listed here only for completeness of "exact commands executed."
- No installation, build, or startup command failed. No missing dependency or missing native module was encountered.

## No critical console/server errors outside the one documented 500

Workflow logs were reviewed via `RefreshAllLogs`; aside from the expected `401`s (wrong password / missing auth, all intentional test cases) and the one `500` on sale creation, no other server-side exceptions were observed during this audit session.
