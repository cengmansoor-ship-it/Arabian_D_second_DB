# REMAINING WORK

This is a description-only inventory of work required to bring the system in
line with the two PDFs. **No implementation is included or was performed as
part of this document** — see `RECOMMENDED_PHASE_PLAN.md` for how this could
be sequenced.

## A. Fix before anything else (BROKEN, blocking downstream work)

1. **Sales creation fails (HTTP 500)** — `createSale()` opens a transaction
   and, inside it, calls `postJournal()`, which opens its own independent
   transaction; SQLite cannot handle the overlap. Blocks Sales, Installments,
   Receipts, Project/Sales synchronization, and the Sales-dependent parts of
   Dashboard, Daily Journal, and Reports.
2. **Roles page "Create role" button stays disabled** — blocks creating any
   of the 9 PDF-named roles, and blocks testing restrictive RBAC scenarios.

## B. Explicit named requirements with zero implementation (MISSING)

- Account lockout after 3 failed logins (with configurable lock period)
- Welcome/splash page (two-section layout, ~3s timer, Enter-to-continue)
- Password-change screen and forgot-password workflow
- Hijri/Solar-Hijri (Jalali) date display anywhere in the UI, and dual
  Jalali+Gregorian dates on printed documents
- Any printing/export capability (PDF, Excel, or print-formatted view) —
  confirmed absent on every single page audited
- The 10-block/60-floor/270-house reference project layout (data does not
  exist; the tooling to bulk-generate it also does not exist)
- Layout versions (Draft/Published/Archived) and multi-level `unit_parts` for
  commercial units spanning multiple floors
- Exchange-rate storage (no `exchange_rates` table exists at all)
- Document/attachment system (no `documents` table, no upload UI)
- Backup/restore workflow and settings

## C. Entire modules with no frontend and, in most cases, no backend at all

- **Rentals** — contracts, schedules, payments, early termination, deposit
  settlement, reports
- **Expenses** — categories, entries, approval, category ledger/report
- **Purchasing / Inventory / Supplier ledgers / Returns** — item master,
  purchases, stock, supplier ledger, return bills
- **Exchange / Sarafi** — dealer registration, per-currency ledgers,
  transaction types, currency-exchange double-leg posting
- **Employees / Attendance / Employee ledger** — employee master, daily
  attendance, wage calculation, employee ledger, month-end closing
- **Partners / Investors / Haji module** — partner master, contribution/
  withdrawal transactions, profit-split validation (100% check), cash vs
  accrual profit-and-loss views, distribution approval workflow
- **General/company-wide Reports** — all 12 named reports (project summary,
  unit availability, sales, rental, purchases, expenses, journal/cash, party
  aging, employee, exchange dealer, partner, general company report)
- **Shops & commercial units** as a dedicated module (currently only a
  generic unit-type value, with no dedicated menu, ledger, or cross-module
  sale/rent exclusivity guard)
- **Parking / Mosque / Supermarket** as dedicated screens (same situation as
  Shops)

## D. Partially-built areas that need completion, not creation from scratch

- **Daily Journal** — add the explicit two-view Money-In/Money-Out split,
  Jalali date navigation, and a confirmed currency-totals footer
- **Company Settings** — add the missing sub-pages (backup, print paper
  size, attendance/workweek policy, rental proration policy, exchange-rate
  policy, document-sequence management UI)
- **Party ledger** — needs to be verified against real transaction volume
  once Sales/Rentals exist; add the opening-debt 5-second warning; add
  printable output
- **Dashboard** — once Sales/Rentals/Expenses/Purchases exist, re-verify
  that summary cards, charts, and lists are computed from real source data
  (not manual counters) and link through to filtered detail pages
- **Security hardening** — add CSRF protection, rate limiting on
  `/api/auth/login`, and replace raw Node/Sequelize stack traces in API
  error responses with sanitized messages + server-side logging

## E. Verification work that could not be completed in this audit's scope

- Full requirement-by-requirement automated test suite (T-01..T-32) — none
  currently exists; only a handful of underlying behaviors were verified
  manually
- The 6 named acceptance scenarios (A–F) — all blocked by missing/broken
  modules described above
- Mobile/responsive-breakpoint pass — only a desktop viewport was used
  during this audit's click-through
- RBAC negative-path testing (a restricted role correctly denied an action)
  — blocked by only one role existing

## What is explicitly NOT part of this remaining-work list

Everything marked COMPLETE in `MODULE_PROGRESS_REPORT.md` and
`REQUIREMENTS_TRACEABILITY.md` (Login, Projects/Blocks/Floors/Units CRUD,
Customers/Parties, manual Journal entries + reversal, Settings core fields,
Cash Accounts, Users, Audit Log, RTL layout, and real SQLite persistence) is
genuinely working today and does not need to be rebuilt.
