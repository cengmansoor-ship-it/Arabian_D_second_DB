# MODULE PROGRESS REPORT

Status per each of the 50 mandatory modules listed in the audit brief (§6).
Statuses use the audit's own 8-value scale. Full evidence for each line is in
`FUNCTIONAL_TEST_REPORT.md`, `BUTTONS_AND_PAGES_TEST.md`, `DATABASE_AUDIT.md`,
`SECURITY_AUDIT.md`, and `ERRORS_AND_BLOCKERS.md`.

| # | Module | Status | Current state | Problems found | Required future work |
|---|---|---|---|---|---|
| 1 | Login | COMPLETE | Login/logout tested live, JWT httpOnly cookie, bcrypt hashing | None | None |
| 2 | User roles | PARTIAL | RBAC engine (11 permission keys, `requirePermission` middleware) works; only `admin` role seeded | "Create role" button broken; no other role configured | Fix create-role button; seed/configure the 9 PDF-named roles |
| 3 | Password changing | MISSING | No route or page exists | — | Build password-change screen + API |
| 4 | 3 wrong attempts → lock | MISSING | No lockout fields or logic exist; tested live with 4 wrong attempts, none blocked | Explicit named PDF requirement, unimplemented | Add `failedLoginCount`/`lockedUntil` to `User`, enforce in login route |
| 5 | Welcome page | MISSING | No route/page; login redirects straight to dashboard | Explicit named PDF requirement, unimplemented | Build welcome/splash screen with the required flow |
| 6 | Company settings | PARTIAL | Name/currency/fiscal-month tested working | No backup/print/HR/rental/exchange policy sub-sections exist | Build remaining settings sub-pages |
| 7 | Three currencies (AFN/USD/PKR) | PARTIAL | All 3 seeded; add-currency tested; per-currency ledger separation confirmed at code level | Live multi-currency journal entry not exercised end-to-end | Verify/extend multi-currency flows once Sales/Rentals exist |
| 8 | Projects | COMPLETE | CRUD tested via API and UI | None | None |
| 9 | Project sections | PARTIAL | `block_groups` table exists in DB | Not exercised via API/UI in this audit | Confirm/build UI for block groups/sections |
| 10 | Blocks | COMPLETE | CRUD + duplicate-code rejection tested | None | None |
| 11 | Floors | COMPLETE | CRUD tested | None | None |
| 12 | Houses (units) | COMPLETE | CRUD tested; status/purpose enums confirmed | Required 270-unit layout does not exist (see module 8/PROJ-16) | Build bulk layout-generation tool, then populate the real structure |
| 13 | Shops | PARTIAL | Purpose enum works at data level | No dedicated Shops menu, page, or ledger | Build dedicated Shops module per §19 of the requirements |
| 14 | Parking | MISSING | Only a generic `unitTypeId` value exists | No dedicated screen/workflow | Build dedicated Parking screen if required distinctly from generic units |
| 15 | Mosque | MISSING | Same as Parking | Same | Same, for Mosque |
| 16 | Supermarket and other facilities | MISSING | Same as Parking | Same | Same, for Supermarket/other facilities |
| 17 | Customers | COMPLETE | CRUD + search tested working | None | None |
| 18 | Customer categories | PARTIAL | `Party.type` enum covers categories at data level | No dedicated categories management UI | Build categories UI if distinct from the type enum is required |
| 19 | Customer ledgers | PARTIAL | Ledger page renders correctly | Only tested against a party with zero transactions; not verified with real financial data | Verify once Sales/Rentals can post real transactions |
| 20 | Sales | BROKEN | Backend route+model exist; frontend does not | `POST /api/sales` fails with HTTP 500 (nested-transaction bug) | Fix `createSale()`/`postJournal()` transaction nesting; build Sales frontend |
| 21 | Property availability | PARTIAL | Unit status/purpose fields work | No dedicated "available properties" browsing UI | Build once Sales frontend exists |
| 22 | Installments | BLOCKED | Code exists (`addSaleReceipt`) | Cannot be tested — depends on Sales working | Test/fix after Sales bug is resolved |
| 23 | Receipts | BLOCKED | Same as Installments | Same | Same |
| 24 | Project and sales synchronization | BLOCKED | Unit status updates work in isolation | Cannot confirm sale→unit sync since no sale can be created | Test after Sales bug is resolved |
| 25 | Rental management | MISSING | No `rental_contracts` table, no frontend | Entire module absent | Build per §20 of the requirements |
| 26 | Daily journal | PARTIAL | Manual entries + reverse tested working | Two-view Money In/Out split, Jalali auto-date, totals footer not fully confirmed | Confirm/build remaining journal UI pieces |
| 27 | Incoming money | PARTIAL | Works via manual journal entries only | Not fed by Sales/Rentals since those are broken/missing | Depends on Sales/Rentals completion |
| 28 | Outgoing money | PARTIAL | Works via manual journal entries only | Not fed by Expenses/Purchases since those are missing | Depends on Expenses/Purchases completion |
| 29 | Expenses | MISSING | No tables, no frontend | Entire module absent | Build per §15 of the requirements |
| 30 | Purchasing | MISSING | No tables, no frontend | Entire module absent | Build per §16 of the requirements |
| 31 | Supplier ledgers | MISSING | Depends on Purchasing | Entire module absent | Build with Purchasing |
| 32 | Return bills | MISSING | Depends on Purchasing | Entire module absent | Build with Purchasing |
| 33 | Employees | MISSING | No tables, no frontend | Entire module absent | Build per §21 of the requirements |
| 34 | Attendance | MISSING | Depends on Employees | Entire module absent | Build with Employees |
| 35 | Employee accounts | MISSING | Depends on Employees | Entire module absent | Build with Employees |
| 36 | Exchange/Sarafi | MISSING | No tables, no frontend | Entire module absent | Build per §17 of the requirements |
| 37 | Partners and shares | MISSING | No tables, no frontend | Entire module absent | Build per §22 of the requirements |
| 38 | Profit and loss | MISSING | Depends on Partners/Sales/Rentals/Expenses | Entire module absent | Build after dependent modules exist |
| 39 | General reports | MISSING | No Reports module at all | Entire module absent | Build per §25, after source modules exist |
| 40 | Date filtering | NOT TESTED | Not specifically evaluated beyond party search | — | Verify across modules as they're built |
| 41 | Search | PARTIAL | Party search tested working | Not confirmed on other list pages | Verify/extend to other modules |
| 42 | Printing | MISSING | No print/export control found on any page | Entire capability absent | Build print/PDF/Excel per §26 |
| 43 | Hijri Shamsi and Gregorian dates | MISSING | No Jalali date display anywhere despite `jalaali-js` being a planned dependency in `replit.md` | Named PDF requirement, unimplemented | Integrate Jalali calendar display/input across the app |
| 44 | Audit logs | COMPLETE | Viewable in UI and API, 25 entries recorded this session | None | None |
| 45 | Edit and delete/cancellation behavior | PARTIAL | Void/reverse tested working for journal entries; no hard-delete endpoints found (correct, matches stated principle) | Cannot confirm same behavior for Sales/Rentals since they don't work/exist | Verify once those modules exist |
| 46 | Responsive mobile interface | NOT TESTED | Click-through used a standard desktop viewport only | — | Dedicated mobile-breakpoint pass needed |
| 47 | RTL Pashto interface | COMPLETE | `dir="rtl"` + Pashto strings confirmed consistent across all 12 existing pages | None | None |
| 48 | Data persistence | COMPLETE | Confirmed via direct SQLite queries before/after live writes | None | None |
| 49 | Dashboard calculations | PARTIAL | Cards/charts render; most source modules don't exist to feed full totals | Cannot verify DASH-05 (computed, not manual counters) without more source data | Re-verify once Sales/Rentals/Expenses exist |
| 50 | Security and validation | PARTIAL | bcrypt/JWT/RBAC/input-validation all confirmed working | No lockout, no CSRF token, no rate limiting, raw stack traces leaked in error responses | See `SECURITY_AUDIT.md` for the full severity-ranked list |

## Summary count (50 modules — matches the per-row table above exactly)

| Status | Count | Modules |
|---|---|---|
| COMPLETE | 9 | Login, Projects, Blocks, Floors, Houses, Customers, Audit logs, RTL interface, Data persistence |
| PARTIAL | 15 | User roles, Company settings, Three currencies, Project sections, Shops, Customer categories, Customer ledgers, Property availability, Daily journal, Incoming money, Outgoing money, Search, Edit/delete behavior, Dashboard calculations, Security and validation |
| BROKEN | 1 | Sales |
| MISSING | 20 | Password changing, Account lock, Welcome page, Parking, Mosque, Supermarket, Rental management, Expenses, Purchasing, Supplier ledgers, Return bills, Employees, Attendance, Employee accounts, Exchange/Sarafi, Partners and shares, Profit and loss, General reports, Printing, Hijri/Gregorian dates |
| BLOCKED | 3 | Installments, Receipts, Project/sales synchronization |
| NOT TESTED | 2 | Date filtering, Responsive mobile interface |
| **Total** | **50** | |
