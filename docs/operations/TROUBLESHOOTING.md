# Troubleshooting

## App fails to start: "SESSION_SECRET environment variable is required"

Set the `SESSION_SECRET` secret (Replit: use the environment-secrets workflow;
locally: set it in `.env`). This signs auth JWTs and CSRF cookies.

## Login always returns 401 even with correct credentials

- Check whether the account is locked: 3 failed attempts locks it for 15
  minutes (`423 Locked` response). An administrator with `users.manage`
  permission can call `POST /api/users/:id/unlock`, or the corresponding
  "Unlock" button on the Users page.
- Confirm you're using the seeded default (`admin` / `admin123`) if this is a
  fresh install and `ADMIN_PASSWORD` was never set.

## "Invalid or missing CSRF token" on any POST/PUT/PATCH/DELETE

The frontend must first issue any GET request (which sets the `csrf_token`
cookie) and then echo that cookie's value back in an `X-CSRF-Token` header on
the mutating request. This is already wired into `artifacts/web/src/lib/api.ts`
— if you see this from a custom script or `curl`, fetch a cookie first:

```bash
curl -s -c cookies.txt http://localhost:8080/api/auth/me
TOKEN=$(grep csrf_token cookies.txt | awk '{print $7}')
curl -s -b cookies.txt -H "x-csrf-token: $TOKEN" -X POST ... 
```

## "column does not exist" / "relation does not exist" after pulling new code

A migration has not run yet. Restart the API server — migrations run
automatically on boot via `ensureDatabaseReady()`. If it still fails, check
`lib/db-sequelize/src/migrations/index.ts` to confirm the new migration file
is imported there.

## Sale/rental/journal creation returns 400 "... is already ..." or "unbalanced"

This is expected validation, not a bug: sales/rentals refuse to double-book a
unit that is no longer `available`, and manual journal entries are rejected
unless total debits equal total credits per currency. Check the unit's
current `status` or the entry's line amounts.

## Preview pane is blank / workflow times out waiting on a port

1. Confirm the `Web App` workflow is running and was restarted after your
   latest change.
2. Check workflow logs for a stack trace (most often a missing env var or a
   TypeScript build error caught at runtime).
3. Confirm `artifacts/web`'s Vite dev server has `server.allowedHosts: true`
   (already configured) — the Replit preview proxies from a different origin.

## Database looks corrupted or numbers don't reconcile

Run `./scripts/check-db-integrity.sh`. If it reports a failure, stop the app
and follow the restore procedure in `docs/operations/BACKUP_AND_RESTORE.md`
using the most recent known-good backup — do not attempt to hand-edit the
SQLite file.

## Tests fail with "Unable to obtain CSRF token" or similar in `artifacts/api-server/tests`

Make sure `SESSION_SECRET` is set in the shell running the tests (Replit
Secrets are already available in the workflow environment; if running
`pnpm --filter @workspace/api-server run test` manually in a fresh shell,
export it first).
