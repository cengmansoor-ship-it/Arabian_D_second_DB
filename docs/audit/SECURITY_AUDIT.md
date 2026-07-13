# SECURITY AUDIT

No passwords, tokens, or secret values are reproduced below.

## Password storage
- **bcryptjs** hashing, confirmed in `lib/db-sequelize/src/auth.ts`. Passwords are never stored or logged in plaintext in any code path inspected.
- Default seed credentials (`admin`/`admin123`) are documented in `replit.md` with an explicit "change before real use" warning, and are overridable via `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars. **Risk:** if deployed without changing these, the admin account is guessable. Status: **PARTIAL** (mechanism to override exists; nothing currently forces a change).

## Authentication / sessions
- JWT stored in an **httpOnly** cookie (`auth_token`), `SameSite=Lax`, 7-day expiry — confirmed via live `curl` response headers. httpOnly correctly prevents JS/XSS from reading the token.
- **No CSRF token** was found alongside the cookie-based session; `SameSite=Lax` provides partial protection but is not equivalent to explicit CSRF protection for state-changing `POST`/`PUT` requests. **Status: PARTIAL / gap.**
- **No rate limiting** was found on `/api/auth/login` — confirmed by sending 4 rapid wrong-password attempts with no throttling or delay.

## Account lockout (explicit PDF requirement: lock after 3 wrong attempts)
- **Tested live**: 4 consecutive wrong-password attempts against the `admin` account all returned `401`, and a 5th, correct-password attempt still succeeded immediately afterward.
- **No `failedLoginCount`/`lockedUntil` fields exist on the `User` model**, and no lockout logic exists in `auth.ts` or the login route.
- **Status: MISSING.** This is a named, explicit requirement in the second PDF ("د پاسپورډ په اشتباه ډول رسه په دریم ځل سیستم ورک سی د قلف") and is not implemented at all.

## Authorization (RBAC)
- `requirePermission(permissionKey)` middleware exists and is applied to mutation routes (`projects.manage`, `sales.manage`, `accounting.manage`, `parties.manage`, `users.manage`, `roles.manage`, `settings.manage`) — confirmed by reading route files.
- **Only one role exists in the current database** (`admin`, holding all 11 permissions) — there is no second, restricted role to test against, so **enforcement of the restrictive case (a low-privilege user being correctly blocked) was NOT TESTED live**; only the code-level presence of the middleware was confirmed, and unauthenticated (no-cookie) access to a protected route was confirmed blocked (`401`).
- The Roles page UI has a broken "Create role" button (see `BUTTONS_AND_PAGES_TEST.md`), which blocks creating a second role through the UI to test this end-to-end. This could be worked around via a direct `POST /api/roles` API call in a future session, but was not attempted here to avoid scope creep beyond the audit.
- `GET` (read) routes generally only require authentication, not a specific permission — e.g., any authenticated user (regardless of role) can currently read `/api/projects`, `/api/parties`, `/api/users`, `/api/roles`. This may or may not be intended; the PDFs do not specify per-role read restrictions in enough detail to judge — **Status: UNRESOLVED.**

## Input validation
- Backend routes validate presence/type of required fields and return `400` with a clear message on missing/invalid input (confirmed for Party, Sale, Floor creation during testing).
- Enum fields (`Unit.status`, `Unit.purpose`, `Party.type`) are validated against an explicit allow-list in route code before hitting the DB.
- No SQL injection risk identified — all queries go through Sequelize's parameterized query builder; no raw string-concatenated SQL was found in the inspected routes.

## Direct URL access / API authorization
- Confirmed: an unauthenticated request to a protected API route (`GET /api/projects`) is correctly rejected with `401`.
- Frontend route guarding for direct URL access to admin-only pages (e.g., navigating straight to `/users` without the right role) was **not independently re-verified with a restricted account** for the same reason noted above (only one role exists); the UI click-through test did reach `/users`, `/roles`, `/audit-log` successfully as the `admin` user, which is the expected/correct behavior for that role.

## Secret management
- `SESSION_SECRET` is required by the JWT signing code and is managed via Replit's environment secrets mechanism (present, not read/displayed as part of this audit, per standard practice).
- No hardcoded secrets, API keys, or credentials were found in the inspected source files.

## Error-message leakage
- The one reproduced server error (sale creation, see `ERRORS_AND_BLOCKERS.md`) returned a **raw Node/Sequelize stack trace with full file paths** directly in the HTTP response body (Express's default error handler in this environment, not a custom sanitized error page). This is an information-disclosure risk in any environment where this default error page is reachable by an end user rather than just during development/debugging. **Status: gap identified**, should be replaced with a generic error message + server-side logging before production use.

## Summary of security findings by severity

| Finding | Severity |
|---|---|
| No account lockout after repeated failed logins (explicit PDF requirement) | High |
| Raw stack traces returned in API error responses | High |
| No rate limiting on login endpoint | Medium |
| No explicit CSRF token (relies on `SameSite=Lax` only) | Medium |
| Read routes not permission-scoped (only auth-scoped) | Low/Unresolved — needs product decision |
| Default seed admin credentials not forced to change | Low (mitigated by documented warning + env override) |
