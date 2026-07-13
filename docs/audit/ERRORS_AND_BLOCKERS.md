# ERRORS AND BLOCKERS

## Critical bug #1 — Sale creation fails with HTTP 500 (Sales module is BROKEN, not just incomplete)

**Reproduction (exact commands):**
```
POST /api/projects            {"code":"ARB","name":"Arabian D Residence"}         → 201
POST /api/projects/1/blocks   {"code":"A1","name":"Block A1"}                     → 201
POST /api/projects/1/blocks/1/floors  {"name":"Floor 1","levelNumber":1,"floorType":"residential"} → 201
POST /api/projects/1/blocks/1/floors/1/units {"unitNumber":"1","unitTypeId":1,"purpose":"residential"} → 201
POST /api/parties             {"name":"Ahmad Test Customer","type":"sales_customer"} → 201
PUT  /api/units/1             {"purpose":"for_sale","status":"available"}         → 200
POST /api/sales               {"unitId":1,"partyId":1,"price":39000,"currencyCode":"USD","saleDate":"2026-07-12"} → 500
```

**Observed error (from server logs, `dist/index.mjs` running `lib/db-sequelize/src/posting.ts:70` / `sales-service.ts`):**
```
Error at Database.<anonymous> (sequelize/src/dialects/sqlite/query.js:236)
  ...
  at async JournalTransaction.save (sequelize/src/model.js:4154)
  at async JournalTransaction.create (sequelize/src/model.js:2305)
  at async <anonymous> (lib/db-sequelize/src/posting.ts:70)
  at async <anonymous> (sequelize/src/sequelize.js:1197)
```
returned to the client as a raw HTML stack trace with HTTP 500.

**Root cause (identified by reading the source, not fixed — this audit does not implement fixes):**
`createSale()` in `lib/db-sequelize/src/sales-service.ts` opens its own `sequelize.transaction(async (t) => {...})`, and — while that outer transaction is still open — calls `postJournal()` in `lib/db-sequelize/src/posting.ts`, which opens a **second, independent** `sequelize.transaction(async (t) => {...})` rather than reusing the parent transaction. On SQLite (the active dialect in this environment), this nested/overlapping transaction pattern fails when `JournalTransaction.create()` tries to insert while the outer transaction's write lock is already held.

**Supporting evidence that isolates the cause:** a **manual** journal entry via `POST /api/journal/manual` (which calls `postJournal()` directly, with no outer transaction wrapping it) succeeded immediately (`201`) with the identical accounts/currency. The failure is specific to the *nested*-transaction code path used only by Sales (and, by the same code pattern, would very likely also affect `addSaleReceipt()`, which has the identical nested-transaction structure — not independently tested since no sale can be created to attach a receipt to).

**Impact:** the entire Sales module — the PDFs' central, named requirement ("فروشات") — cannot complete a single sale in its current state. This blocks all downstream financial-audit requirements in §9 of the audit task (installments, receipts, ledger reflection, sale-totals-match-ledger-totals) since none of them can be reached.

**Status:** BROKEN. Not fixed as part of this audit per the "audit only, no implementation" instruction.

## Critical bug #2 — Roles page "Create role" button stays disabled

**Reproduction:** navigate to `/roles`, fill in the visible name/description fields for a new role, attempt to submit.

**Observed result:** the `جوړول` (Create) button remains disabled and the form cannot be submitted, discovered during the browser click-through test.

**Impact:** blocks creating any role other than the single seeded `admin` role through the UI, which in turn blocked live-testing the "restricted role correctly denied access" security scenario in this same audit (see `SECURITY_AUDIT.md`). Root cause not diagnosed (would require frontend debugging, out of scope for an audit-only task).

**Status:** BROKEN.

## Non-bugs encountered during testing (documented for completeness, not blockers)

- Several early `curl` calls returned expected `400`/`409` validation errors while discovering the correct request payload shape (e.g., `Party.type` requires one of 9 specific enum values like `sales_customer`, not free text like `customer`; `Sale` requires `price` not `totalPrice`). These are correct validation behavior, not bugs.
- `GET /api/projects/1/blocks/1/floors/1/units` returned `404` — this exact route does not exist (units are listed via a different endpoint, e.g. the unit-map endpoint mentioned in `PROJECT_STATUS.md`). Not independently followed up since it did not block the audit.

## Blockers to full requirement coverage in this audit

- **No second role exists** → could not fully verify negative RBAC test cases (a restricted user being denied a `*.manage` action) end-to-end through the UI (see `SECURITY_AUDIT.md`).
- **No Sales/Rentals/Purchases/Expenses/Exchange/HR/Partners/Reports frontend pages exist at all** → most of the "Mandatory Module Audit" list (items 20–43 in the task) could not be functionally tested beyond confirming they are simply **MISSING** from the UI; a few (Sales) have partial, broken backend routes; the rest have neither frontend nor backend evidence.
- **No Welcome page exists** → the entire "Welcome Page Audit" section of the task is **MISSING**, not partially blocked.
