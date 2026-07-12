# RECOMMENDED PHASE PLAN

Grouped future phases only — **no implementation was performed as part of
this document or this audit.** Ordering reflects dependencies: fix breakage
first, then complete the requirement's own central module (Sales), then
build the remaining independent modules, then the cross-cutting layers
(Reports, Printing, Dates) that depend on data existing in every module.

## Phase 0 — Critical bug fixes
- **Scope:** Fix the Sales nested-transaction bug (`createSale()` /
  `postJournal()`); fix the Roles page "Create role" button; sanitize API
  error responses (no raw stack traces).
- **Pages/workflows affected:** `/sales` (backend only, no frontend yet),
  `/roles`, all API error paths.
- **Tests required:** A real sale can be created, receipted, and reflected
  in the ledger and journal (T-07/T-10/T-20 equivalents); a new role can be
  created and assigned from the UI.
- **Acceptance criteria:** `POST /api/sales` returns `201` with a persisted
  row; Roles "Create role" submits and the new role appears in the list.
- **Dependencies:** None — this phase blocks nearly every phase after it.
- **Estimated complexity:** Low–Medium (the root cause is already
  identified and isolated; no design work needed).

## Phase 1 — Authentication & Welcome completeness
- **Scope:** Account lockout after 3 failed attempts, password-change
  screen, forgot-password workflow, Welcome/splash page, rate limiting on
  login, CSRF protection.
- **Pages/workflows:** `/welcome`, `/settings/password`, `/forgot-password`,
  `/reset-password`, login route middleware.
- **Tests required:** T-01, T-02, T-32 (role-permission denial once a
  second role exists from Phase 0).
- **Acceptance criteria:** 3 wrong passwords locks the account for the
  configured period; Welcome page appears once after login, not on refresh
  or direct dashboard navigation.
- **Dependencies:** Phase 0 (Roles fix, to seed additional roles for
  permission testing).
- **Estimated complexity:** Low–Medium.

## Phase 2 — Project layout tooling & reference data
- **Scope:** Layout versions (Draft/Published/Archived), `unit_parts` for
  multi-level commercial units, a bulk layout-generation wizard, then use it
  (or manual entry) to populate the actual 10-block/60-floor/270-house
  reference structure.
- **Pages/workflows:** `/projects/:id/layout`, `/projects/:id/layout/generate`.
- **Tests required:** T-03, T-04, T-05, T-06.
- **Acceptance criteria:** Generating a layout with the documented
  parameters produces the exact block/floor/unit counts from the PDFs,
  verifiable directly in the database.
- **Dependencies:** None beyond Phase 0.
- **Estimated complexity:** Medium.

## Phase 3 — Sales module completion (frontend + full workflow)
- **Scope:** Sales frontend (new sale, receipts/installments, sale ledger,
  sale documents), overpayment/credit handling, sale-status lifecycle.
- **Pages/workflows:** `/sales`, `/sales/new`, `/sales/:id`,
  `/sales/:id/receipts/new`, `/sales/:id/ledger`.
- **Tests required:** T-07 through T-13.
- **Acceptance criteria:** Acceptance Scenario B (register customer → sale →
  payments → Fully Paid → ledger/journal match) passes end-to-end.
- **Dependencies:** Phase 0 (bug fix) and Phase 2 (needs real units to sell).
- **Estimated complexity:** High.

## Phase 4 — Rental module
- **Scope:** Rental contracts, schedules, payment allocation, early
  termination, deposit settlement, rental reports.
- **Pages/workflows:** `/rentals`, `/rentals/new`, `/rentals/:id/schedule`,
  `/rentals/:id/payments/new`, `/rentals/:id/end`.
- **Tests required:** T-08, T-09, T-14, T-15.
- **Acceptance criteria:** Acceptance Scenario C passes end-to-end.
- **Dependencies:** Phase 2 (needs real units); interacts with Phase 3 for
  the "sold unit can't be rented" cross-check.
- **Estimated complexity:** High.

## Phase 5 — Purchasing, inventory, supplier ledgers & returns
- **Scope:** Item master, purchases with multi-line items, inventory
  tracking, supplier ledgers, purchase returns.
- **Pages/workflows:** `/inventory/items`, `/purchases/new`,
  `/suppliers/:id/ledger`, `/purchases/:id/return`.
- **Tests required:** T-16 through T-19.
- **Acceptance criteria:** Acceptance Scenario D passes end-to-end.
- **Dependencies:** Phase 0 only (independent of Sales/Rentals).
- **Estimated complexity:** High.

## Phase 6 — Expenses
- **Scope:** Expense categories, expense entries with approval status,
  category/date/project reports.
- **Pages/workflows:** `/expenses`, `/settings/expense-categories`,
  `/reports/expenses`.
- **Tests required:** T-20 (posted-once), reuse of ACCT-04/ACCT-05.
- **Acceptance criteria:** An approved expense posts exactly once as Money
  Out and appears correctly in the Daily Journal.
- **Dependencies:** Phase 0 only.
- **Estimated complexity:** Medium.

## Phase 7 — Exchange / Sarafi
- **Scope:** Exchange dealer registration, per-currency ledgers, all 5
  transaction types, currency-exchange double-leg posting.
- **Pages/workflows:** `/exchange/dealers`, `/exchange/new`,
  `/exchange/dealers/:id/ledger`, `/reports/exchange`.
- **Tests required:** T-26.
- **Acceptance criteria:** A currency-exchange transaction creates two
  correctly balanced legs in different currencies.
- **Dependencies:** Phase 0 only; benefits from Phase 2's currency work
  already being solid.
- **Estimated complexity:** Medium.

## Phase 8 — Employees, attendance & employee ledger
- **Scope:** Employee master, daily attendance with duplicate prevention,
  wage calculation (daily/monthly), employee ledger, month-end closing.
- **Pages/workflows:** `/hr/employees`, `/hr/attendance`,
  `/hr/attendance/bulk`, `/hr/employees/:id/ledger`.
- **Tests required:** T-22, T-23, T-24.
- **Acceptance criteria:** Acceptance Scenario E passes end-to-end.
- **Dependencies:** Phase 0 only.
- **Estimated complexity:** High.

## Phase 9 — Partners, shares & profit/loss
- **Scope:** Partner master, contribution/withdrawal transactions, 100%
  distribution validation, cash-basis and accrual-basis profit/loss views,
  distribution approval workflow.
- **Pages/workflows:** `/partners`, `/partners/:id`, `/partners/:id/ledger`,
  `/reports/profit-loss`.
- **Tests required:** T-27.
- **Acceptance criteria:** Acceptance Scenario F passes end-to-end.
- **Dependencies:** Phases 3–8 (profit/loss needs real Sales, Rental,
  Expense, and Purchase data to be meaningful).
- **Estimated complexity:** High.

## Phase 10 — Reports, printing, and dates (cross-cutting, last)
- **Scope:** All 12 named reports, all 17 named printable documents (with
  A4/half-A4, logo/header/footer, Jalali+Gregorian dates), Jalali calendar
  display and date-range filtering across the whole app, general
  company-wide report reconciling all modules.
- **Pages/workflows:** `/reports/*`, print routes for every document type.
- **Tests required:** T-28, T-31.
- **Acceptance criteria:** Every named report and print document renders
  correctly with real data, in both calendars, with no clipped RTL text.
- **Dependencies:** All prior phases — this phase reports on data produced
  by every other module, and is intentionally sequenced last.
- **Estimated complexity:** High.

## Phase 11 — Backup/restore and final hardening
- **Scope:** Manual + scheduled backup, backup history, restore workflow
  with pre-restore safety backup and integrity check, final Dashboard
  re-verification once all source modules exist, mobile/responsive pass.
- **Pages/workflows:** `/settings/backup`, `/settings/backup/restore`,
  `/dashboard`.
- **Tests required:** T-30, DASH-04/DASH-05 re-verification.
- **Acceptance criteria:** A backup can be created, and a restore from it
  passes an integrity check.
- **Dependencies:** All prior phases.
- **Estimated complexity:** Medium.
