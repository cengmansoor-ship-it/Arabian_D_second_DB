# REQUIREMENTS TRACEABILITY (AUDIT VERSION)

This is an independent, evidence-based traceability matrix built from the two
PDFs, cross-checked against the root `REQUIREMENTS_TRACEABILITY.md` (which is
stale — every row there still reads ⬜, dated 2026-07-10, and does not reflect
work actually built since). Statuses here use only the 8 statuses defined by
the audit brief: **COMPLETE, PARTIAL, UI ONLY, BROKEN, MISSING, NOT TESTED,
BLOCKED, UNRESOLVED**. Evidence for each claim lives in the other `docs/audit/`
files (`FUNCTIONAL_TEST_REPORT.md`, `BUTTONS_AND_PAGES_TEST.md`,
`DATABASE_AUDIT.md`, `SECURITY_AUDIT.md`, `ERRORS_AND_BLOCKERS.md`) — this file
only assigns the final status per requirement ID and a one-line reason.

**Total requirement IDs evaluated: 222** (sections 1–23 of the root matrix;
§24 "deliverables checklist," §25 automated tests, and §26 acceptance
scenarios are covered separately at the end of this file, not in the 222
count, since they are process/test artifacts rather than product
requirements).

## 1. Authentication & user management

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| AUTH-01 | Login form | COMPLETE | Live login tested, `200` + session cookie |
| AUTH-02 | Show/hide password toggle | NOT TESTED | Not exercised during click-through |
| AUTH-03 | Lock after 3 failed attempts | MISSING | 4 wrong attempts, no lockout; no `failedLoginCount`/`lockedUntil` fields exist |
| AUTH-04 | Forgot password workflow | MISSING | No route, no page |
| AUTH-05 | Password change screen | MISSING | No route, no page |
| AUTH-06 | Session logout | COMPLETE | Tested via UI, redirects to `/login` |
| AUTH-07 | User status active/disabled/locked | PARTIAL | Active/disabled confirmed working; no "locked" state exists (ties to AUTH-03) |
| AUTH-08 | Last login timestamp | NOT TESTED | Not inspected |
| AUTH-09 | Failed login counter | MISSING | No such field on `User` model |
| AUTH-10 | Audit login/security events | NOT TESTED | Audit log works generally; login-specific entries not specifically confirmed |
| AUTH-11 | Super Admin unlock CLI | MISSING | No CLI command found |
| AUTH-12 | Password hashing | COMPLETE | bcryptjs confirmed in `auth.ts` |
| AUTH-13 | Secure JWT/CSRF | PARTIAL | httpOnly JWT cookie yes; no CSRF token |
| AUTH-14 | Rate limiting on auth endpoints | MISSING | 4 rapid attempts, no throttling |
| AUTH-15 | No default production password | PARTIAL | Override env vars exist; nothing forces a change from `admin`/`admin123` |

### Roles (ROLE-01..09)
All 9 named roles (Super Admin, Admin, Accountant, Project Manager, Sales
Manager, Rental Manager, Purchase/Inventory Officer, HR/Attendance Officer,
Viewer/Auditor): **PARTIAL** — the generic RBAC engine (`requirePermission`,
11 permission keys, roles/permissions tables) works and is proven functional,
but only one seeded role (`admin`, holding all permissions) exists in the
database; none of these 9 specific named roles are configured, and the
Roles page "Create role" button is broken, blocking creating them via the UI.

## 2. Welcome/splash screen

| Req ID | Status | Reason |
|---|---|---|
| WELC-01..05 | MISSING (all 5) | No welcome page/route exists anywhere in `App.tsx` or `pages/`; login redirects straight to the dashboard |

## 3. Company setup & settings

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| SET-01 | First-run setup wizard | MISSING | No wizard route found; seed script sets defaults directly |
| SET-02 | Company profile | PARTIAL | Name/base currency/fiscal month tested working; logo/phones/email/website/Facebook fields not individually tested |
| SET-03 | Currencies configuration | COMPLETE | Add-currency tested live, 3→4 |
| SET-04 | Document number sequences UI | MISSING | Table exists in DB; no settings page found |
| SET-05 | Fiscal year configuration | PARTIAL | `fiscal_periods` table exists + fiscal month field tested; no dedicated fiscal-year UI confirmed |
| SET-06 | Backup folder path | MISSING | No backup settings page |
| SET-07 | Print paper size settings | MISSING | No printing exists at all |
| SET-08 | Attendance/workweek policy | MISSING | No HR settings page |
| SET-09 | Rental proration policy | MISSING | No rental settings page |
| SET-10 | Exchange-rate policy | MISSING | No exchange settings page |
| SET-11 | Audit viewer | COMPLETE | `/audit-log` tested working, 25 entries |

## 4. Central accounting & posting engine

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| ACCT-01 | Central journal (accounts/transactions/lines/links) | COMPLETE | Confirmed via schema + live manual entry |
| ACCT-02 | Cash accounts table | COMPLETE | CRUD tested working |
| ACCT-03 | Debit = credit per currency | COMPLETE | `posting.ts` enforces this; live entry confirmed |
| ACCT-04 | Posted-only-once (unique posting_links) | PARTIAL | Constraint exists in schema; not exercised with a live duplicate-post attempt |
| ACCT-05 | Idempotency key per posting | PARTIAL | Column exists (`idempotencyKey`, unique); not exercised live |
| ACCT-06 | طلب/پور directional clarity in UI | NOT TESTED | Not specifically evaluated |
| ACCT-07 | Color coding (green/red/black) | NOT TESTED | Not specifically evaluated |
| ACCT-08 | Void/Reverse with reason/timestamp/user | COMPLETE | Tested live via UI, reversal transaction created |
| ACCT-09 | Duplicate-submit protection (UUID + disabled button) | NOT TESTED | Not exercised |
| ACCT-10 | Fiscal periods table | PARTIAL | Table exists; workflow not exercised |
| ACCT-11 | Document sequences table | PARTIAL | Table exists; no UI to manage it |
| ACCT-12 | No floating-point money (DECIMAL 20,4 / decimal.js) | COMPLETE | Confirmed in model definitions and `posting.ts` |

## 5. Multi-currency

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| CUR-01 | Separate ledger per currency | COMPLETE | Every money table has its own `currencyCode`; `postJournal` balances per-currency |
| CUR-02 | Never sum AFN+USD+PKR | COMPLETE | No code path found that sums across currencies; no report screens exist yet that could violate this |
| CUR-03 | Exchange rates stored (date/source/user) | MISSING | No `exchange_rates` table exists in the 27-table schema |
| CUR-04 | Cross-currency receipt validation | NOT TESTED | No Sales/Exchange module reachable to test |
| CUR-05 | Converted report shows explicit rate | MISSING | No Reports module exists |

## 6. Dynamic project & property layout

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| PROJ-01 | Project entity with status | PARTIAL | CRUD works; status-field transitions not individually tested |
| PROJ-02 | Layout version (Draft/Published/Archived) | MISSING | No `project_layout_versions` table exists |
| PROJ-03 | Block entity | COMPLETE | CRUD + duplicate-code rejection tested |
| PROJ-04 | Floor entity | COMPLETE | CRUD tested |
| PROJ-05 | Floor type enum (8 values) | PARTIAL | `residential` tested; other 7 enum values not individually exercised |
| PROJ-06 | Unit entity | COMPLETE | CRUD tested |
| PROJ-07 | Unit status enum (8 values) | COMPLETE | Confirmed matches spec exactly |
| PROJ-08 | Unit purpose enum (4 values) | COMPLETE | Confirmed matches spec exactly |
| PROJ-09 | Unit types dynamic master list | COMPLETE | Add-type tested, 11→12 |
| PROJ-10 | Multi-level commercial units (`unit_parts`) | MISSING | No `unit_parts` table exists |
| PROJ-11 | Visual unit map with status colors | PARTIAL | Inline block/floor/unit editors on Project Detail page work; no dedicated full-project visual map route confirmed |
| PROJ-12 | Layout generation wizard (bulk) | MISSING | No bulk-generation tool anywhere |
| PROJ-13 | Published unit with transaction can't be structurally deleted | NOT TESTED | No delete endpoint found to test against |
| PROJ-14 | "15 levels/182 units" specific numbers | UNRESOLVED | Contradicts PROJ-16's explicit "reference example only, do not hardcode" instruction — flagging rather than guessing which is authoritative |
| PROJ-15 | Block group/section entity | NOT TESTED | `block_groups` table exists in DB; not exercised via API/UI |
| PROJ-16 | 10 blocks/60 floors/270 houses reference layout | MISSING | Confirmed via direct DB query — 0 of this structure exists |
| PROJ-17 | Configurable unit numbering format | NOT TESTED | Not exercised |

## 7. Party & customer master

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| PARTY-01 | Shared parties master | COMPLETE | CRUD tested |
| PARTY-02 | Party type enum (9 values) | COMPLETE | Confirmed, e.g. `sales_customer` |
| PARTY-03 | Full field set (father/grandfather/Tazkira/tax/photo/docs) | PARTIAL | Name tested; other fields not individually verified |
| PARTY-04 | Fast search + duplicate-identity warning | PARTIAL | Search tested working; duplicate warning not tested |
| PARTY-05 | Separate ledger per currency per party | PARTIAL | Ledger page renders correctly but only tested against a party with zero transactions |
| PARTY-06 | Opening-debt 5-second warning | MISSING | No such UI behavior observed |
| PARTY-07 | Printable ledger with Jalali+Gregorian dates | MISSING | No printing anywhere; no Jalali dates anywhere |
| PARTY-08 | Full activity timeline | NOT TESTED | Not exercised across modules |

## 8. Daily journal / Roznamcha

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| JOUR-01 | Two views: Money In / Money Out | PARTIAL | API supports `?direction=` filter; distinct dual-view UI not confirmed |
| JOUR-02 | Auto-populated from all financial modules | PARTIAL | Manual entries confirmed; Sales/Rentals/Expenses/etc. can't feed it since those modules are broken/missing |
| JOUR-03 | Opens on today's Jalali date, auto-advance | MISSING | No Jalali date support anywhere |
| JOUR-04 | Totals by currency/direction footer | NOT TESTED | Not conclusively observed either way during click-through |
| JOUR-05 | Date navigation/search/filters | NOT TESTED | Not exercised |
| JOUR-06 | Edit draft / reverse posted | PARTIAL | Reverse tested working; "edit draft" not tested |
| JOUR-07 | Print/PDF/Excel export | MISSING | No export control found on any page |
| JOUR-08 | Permission-controlled manual entry | COMPLETE | Tested via UI and API |
| JOUR-09 | Three-currency totals | PARTIAL | AFN tested live; USD/PKR configured but not exercised in a live multi-currency entry |

## 9. Expense management

All 6 (EXP-01..06): **MISSING** — no `expenses`/`expense_categories` tables exist, no frontend page, confirmed absent from the sidebar and route list.

## 10. Material purchases, supplier ledgers, inventory & returns

All 13 (PUR-01..13): **MISSING** — no `items`/`purchases`/`purchase_returns`/inventory tables exist, no frontend pages.

## 11. Exchange dealer / Sarafi module

All 5 (EXC-01..05): **MISSING** — no `exchange_dealers`/`exchange_transactions` tables exist, no frontend pages.

## 12. Sales module

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| SALE-01 | Sale fields/entity | BROKEN | Model+route exist but `POST /api/sales` returns `500` |
| SALE-02 | Sale status enum | BLOCKED | Cannot reach any status since no sale can be created |
| SALE-03 | Sale creation transaction | BROKEN | Confirmed nested-transaction failure (see `ERRORS_AND_BLOCKERS.md`) |
| SALE-04 | Sold unit can't resell | BLOCKED | Same reason |
| SALE-05 | Sold unit can't be rented | BLOCKED | Same reason |
| SALE-06 | Sale receipt fields | BLOCKED | Same reason |
| SALE-07 | Remaining balance calculation | BLOCKED | Same reason |
| SALE-08 | Overpayment handling | BLOCKED | Same reason |
| SALE-09 | Fully-paid status transition | BLOCKED | Same reason |
| SALE-10 | Receipt → journal posting | BLOCKED | Same reason |
| SALE-11 | Reversal recalculates balance | BLOCKED | Same reason |
| SALE-12 | Customer/sales ledger | MISSING | No Sales frontend exists at all |
| SALE-13 | Sale documents (contract/receipts/etc.) | MISSING | No printing anywhere |
| SALE-14 | Print header on sale documents | MISSING | Same reason |

## 13. Shops & commercial units

| Req ID | Status | Reason |
|---|---|---|
| SHOP-01 | PARTIAL | Purpose enum (for sale/rent/both/n-a) works at data-model level; no dedicated Shops UI |
| SHOP-02..07 | MISSING (all 6) | No dedicated Shops module, menu, or ledger exists; shops are only a generic `unitTypeId` value with no dedicated workflow |

## 14. Rental module

All 11 (RENT-01..11): **MISSING** — no `rental_contracts` table exists, no frontend pages.

## 15. Employee, attendance, wage & ledger

All 12 (EMP-01..12): **MISSING** — no employee/attendance tables exist, no frontend pages.

## 16. Partner / investor / Haji module

All 8 (PART-01..08): **MISSING** — no partner tables exist, no frontend pages.

## 17. Document attachment system

All 5 (DOC-01..05): **MISSING** — no `documents` table exists in the schema; no upload UI observed anywhere.

## 18. Dashboard

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| DASH-01 | Summary cards | PARTIAL | Dashboard loads with some cards; most source modules (sales, rentals, expenses, purchases) don't exist to feed full totals |
| DASH-02 | Charts | PARTIAL | Revenue range buttons tested working |
| DASH-03 | Lists (recent receipts/sales/late rent/etc.) | MISSING | Source modules missing |
| DASH-04 | Links to filtered detail pages | NOT TESTED | Not exercised |
| DASH-05 | Values computed from source transactions, not manual counters | NOT TESTED | Not verified at code level in this pass |
| DASH-06 | Last backup shown | MISSING | No backup feature exists |

## 19. Reports

All 12 (REP-01..12): **MISSING** — no Reports module/pages found anywhere in the frontend or route list.

## 20. Print / PDF / Excel

All 17 (PRINT-01..17): **MISSING** — confirmed during the click-through: "No print or export button was found on any audited page."

## 21. Audit log

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| AUD-01 | Audit all sensitive actions | PARTIAL | 25 entries recorded for actions exercised this session; login/failed-login-specific entries not individually confirmed |
| AUD-02 | Audit entry fields (before/after JSON, IP, etc.) | PARTIAL | Log is viewable with entries; exact field completeness not opened/inspected at the field level |
| AUD-03 | Audit log read-only to normal users | NOT TESTED | Only one role (`admin`) exists to test against |

## 22. Backup, restore & recovery

All 6 (BAK-01..06): **MISSING** — no backup/restore route or settings page found anywhere.

## 23. Calendar, date, and timezone

| Req ID | Requirement | Status | Reason |
|---|---|---|---|
| DATE-01 | Business timezone Asia/Kabul | NOT TESTED | Not verified |
| DATE-02 | Jalali/Solar Hijri primary calendar | MISSING | Confirmed absent everywhere in the UI |
| DATE-03 | Print docs show both calendars | MISSING | No printing exists |
| DATE-04 | Date-only fields stored without UTC shift | NOT TESTED | Not verified |
| DATE-05 | Jalali date-range filtering | MISSING | No Jalali UI exists |
| DATE-06 | Configurable fiscal-year numbering | PARTIAL | `fiscal_periods` table + fiscal month setting exist; full numbering scheme not verified |

## Total tally (222 requirement IDs, sections 1–23)

| Status | Count |
|---|---|
| COMPLETE | 21 |
| PARTIAL | 34 |
| UI ONLY | 0 |
| BROKEN | 2 |
| MISSING | 137 |
| NOT TESTED | 18 |
| BLOCKED | 9 |
| UNRESOLVED | 1 |
| **Total** | **222** |

## Deliverables checklist (§24 of the root matrix — process artifacts, not product requirements, not included in the 222 above)

`README.md`, `.env.example`, `DEPLOYMENT.md`, and most named runbooks/reference
docs (`RUNBOOK_*`, `API_REFERENCE.md`, `DATABASE_SCHEMA.md`,
`ACCEPTANCE_TESTS.md`) were **not found** in the repository root during this
audit. `ASSUMPTIONS.md`, `PROJECT_STATUS.md`, and the root
`REQUIREMENTS_TRACEABILITY.md` do exist but are self-reported/stale, as noted
in `CURRENT_PROJECT_SUMMARY.md`.

## Automated tests (§25, T-01..T-32) and acceptance scenarios (§26, A–F)

**No automated test suite exists in the repository** (no `test`/`spec` files
were found under `artifacts/api-server` or `artifacts/web` during this audit).
All 32 named automated tests (T-01..T-32) are therefore **MISSING** as
automated tests. A small number of their underlying behaviors were exercised
manually instead (see `FUNCTIONAL_TEST_REPORT.md`): balanced-entry validation
(T-20/T-25 equivalent), reversal (T-13/T-29 equivalent), duplicate block code
(adjacent to T-21). All 6 acceptance scenarios (A–F) are **MISSING/BLOCKED**:
Scenario A (layout) is blocked by PROJ-16 being missing; Scenario B (sale by
installments) is blocked by the Sales bug; Scenarios C–F are blocked by their
respective modules (Rentals, Purchases, Employees, Partners) being missing
entirely.
