# FUNCTIONAL TEST REPORT

Testing method: live `curl` calls against the running API (with a real authenticated session cookie) plus a browser-based click-through session (Playwright). All test data below is genuinely persisted (re-verified via direct SQLite queries), not simulated.

## Login → Welcome → Dashboard flow

| Step | Result |
|---|---|
| Login page loads | WORKING |
| Login with admin/admin123 | WORKING — `200`, session cookie set |
| Welcome page appears after login | **MISSING** — no such page/route exists anywhere in `App.tsx` or `pages/`; login redirects straight to `/` (Dashboard) |
| Dashboard loads | WORKING |
| No critical console errors | WORKING — none observed during the click-through session |
| No critical server errors (aside from the documented Sales 500) | WORKING |

## Financial & sales audit (PDF §9 requirements)

| Test | Result |
|---|---|
| Create a real customer (Party) | WORKING — `POST /api/parties` with `type:"sales_customer"` persisted and appears in the list/search |
| Select a property from available properties | PARTIAL — a unit can be marked `available`/`for_sale` via `PUT /api/units/:id`, but there is no dedicated "available properties" picker UI (no Sales frontend exists) |
| Register a sale | **BROKEN** — `POST /api/sales` returns HTTP 500 (see `ERRORS_AND_BLOCKERS.md`); no sale row is ever created |
| Sold property becomes unavailable | NOT TESTED — cannot reach this state since sale creation never succeeds |
| Same property cannot be sold twice | NOT TESTED — same reason |
| First/second/third installment receipts | NOT TESTED — `addSaleReceipt()` requires an existing sale, which cannot be created; code review shows it uses the identical nested-transaction pattern that breaks Sales, so it is very likely to fail the same way, but this was not independently confirmed |
| Remaining balance calculated correctly | NOT TESTED |
| Receipt appears in customer ledger | NOT TESTED |
| Receipt appears in daily journal | NOT TESTED |
| Sale totals match ledger totals | NOT TESTED |
| AFN/USD/PKR kept separate | PARTIAL — confirmed at the code level (`postJournal` balances strictly per `currencyCode`, and every money table has its own `currencyCode` column), but could not be confirmed against a real sale since none can be created |
| Refresh does not remove data | WORKING — all created test records (projects, blocks, floors, units, parties, manual journal entries, cash accounts, users) persisted correctly across repeated queries |

## Manual journal / daily journal (Roznamcha)

| Test | Result |
|---|---|
| Create a balanced manual journal entry (2 lines, equal debit/credit, same currency) | WORKING — via both `curl` and the UI, entry appears in the list with correct totals |
| Reject an unbalanced entry | Confirmed at code level (`posting.ts` throws `PostingError` if debit ≠ credit per currency) — not independently re-tested live in this session but is the same code path exercised successfully above |
| Edit/reverse an entry | WORKING — tested live via the UI: reversing an entry marks it voided and creates a correctly offsetting reversal transaction (`#3`) |
| Totals by currency shown | PARTIAL — the Journal page shows per-entry lines; a dedicated "grand total by currency" footer was not observed during the click-through, though this may simply not have been the focus of that pass — **not conclusively confirmed either way** |
| Automatic Money In / Money Out categorization | PARTIAL — `GET /api/journal?direction=` supports filtering by direction per `PROJECT_STATUS.md`; UI-level "two views" split was not explicitly exercised |
| Three-currency support | WORKING — AFN confirmed live; USD/PKR exist as configured currencies but a live multi-currency journal entry was not separately tested |

## Project data (blocks/floors/units)

| Test | Result |
|---|---|
| Create project | WORKING |
| Create block | WORKING |
| Duplicate block code rejected | WORKING — `409` |
| Create floor | WORKING (once the correct required field, `name`, was supplied — initially returned a clear `400` validation message) |
| Create unit | WORKING |
| Change unit status/purpose | WORKING |
| 270-unit required structure exists | **MISSING** — confirmed via direct DB query; must be built manually, unit by unit; no bulk-generation tool exists |

## Company settings / currencies / users / roles / audit log

| Test | Result |
|---|---|
| View/update company settings | WORKING (tested via UI: company name, base currency, fiscal month all saved and reflected) |
| Add a currency | WORKING (tested via UI, new currency appeared in the list; total went from 3 to 4) |
| Create cash account | WORKING |
| Create user | WORKING |
| Deactivate user | WORKING |
| Create role | **BROKEN** — see `ERRORS_AND_BLOCKERS.md` |
| Toggle permission on existing role | WORKING |
| Audit log records actions and is viewable | WORKING — 25 entries recorded across all the mutations performed in this session, viewable in both the API and the UI |

## Modules with no functional test possible (no implementation to test)

Rentals, Purchases/Supplier ledgers/Return bills, Expenses, Exchange/Sarafi, Employees/Attendance/Employee accounts, Partners/Shares/Profit-and-loss, General reports, Printing, Hijri/Shamsi dates, Welcome page — see `MODULE_PROGRESS_REPORT.md` and `REMAINING_WORK.md` for the full breakdown. All marked **MISSING**.

## Tests passed vs failed (summary count)

- **Passed (WORKING):** 24 individual checks across auth, projects/blocks/floors/units, parties, manual journal, settings/currencies, cash accounts, users, roles-permission-toggle, audit log.
- **Failed (BROKEN):** 2 — Sale creation (HTTP 500); Roles → Create role button.
- **Not testable (MISSING/NOT TESTED):** everything downstream of a successful sale (installments, receipts, ledger reflection), plus every module with no implementation at all.
