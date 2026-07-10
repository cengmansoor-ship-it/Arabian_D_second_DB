---
name: Arabian D Residence frontend/backend wiring
description: How the @workspace/web frontend talks to @workspace/api-server, and the RBAC pattern used across modules.
---

- Frontend (`artifacts/web`, port 5000, webview) proxies `/api/*` to the API server (`artifacts/api-server`, port 8080, console) via Vite's `server.proxy`. Backend `cors()` must use `{ origin: true, credentials: true }` (not the bare default) or the httpOnly auth cookie won't be accepted cross-port in dev.

**Why:** the two are separate pnpm workspace packages/workflows, not one combined dev server, so cookie auth needs explicit CORS credentials.

- RBAC pattern for new modules: add permission keys to `CORE_PERMISSIONS` in `lib/db-sequelize/src/seed.ts`, gate mutation routes with `requirePermission(key)` (`artifacts/api-server/src/middlewares/requirePermission.ts`), and call `recordAudit(...)` (`artifacts/api-server/src/lib/audit.ts`) on every create/update. Keep following this for every future module (sales, rentals, purchases, etc.) rather than inventing a new auth check per route.
- Sequelize `Op.or`/`Op.and` gotcha: never do `where[Op.or as unknown as string] = [...]` — stringifying a Symbol key silently breaks the query (returns empty results, no error). Use `const where: Record<symbol, unknown> = { [Op.or]: [...] }` or build the whole where object as one literal so the real Symbol key is preserved.
