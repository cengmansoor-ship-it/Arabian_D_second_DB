# BUTTONS AND PAGES TEST

Method: real browser session (Playwright-driven), logged in as `admin`, every sidebar-reachable page visited and its primary interactive elements exercised with real form submissions (not just visual inspection). Full session transcript retained; table below is the condensed result.

| Page | Element | Expected action | Actual result | Status | Error |
|---|---|---|---|---|---|
| Dashboard `/` | Top search field | Filter/search content | Text entered and retained; no crash | WORKING | — |
| Dashboard `/` | Revenue range buttons (ورځ/اونۍ/میاشت) | Switch chart time range | Selection responds, active state changes | WORKING | — |
| Settings `/settings` | Company info form (name, base currency, fiscal month) | Save company settings | Values persisted and reflected on reload | WORKING | — |
| Settings `/settings` | Add-currency form | Add a new currency | New currency appears in list (3→4) | WORKING | — |
| Projects `/projects` | New project form | Create project | New project appears, route `/projects/2` reachable | WORKING | — |
| Project detail `/projects/1` | New block form | Create block | New block appears in layout | WORKING | — |
| Project detail `/projects/1` | Block row → floor editor | Open inline floor editor | Editor opens inline | WORKING | — |
| Project detail `/projects/1` | New floor form | Create floor | New floor appears under block | WORKING | — |
| Project detail `/projects/1` | Floor row → unit editor | Open inline unit editor | Editor opens inline | WORKING | — |
| Project detail `/projects/1` | Unit tile → status editor | Open/change unit status | Modal opens, status interaction completes | WORKING | — |
| Unit Types `/unit-types` | Add-type form | Add new unit type | New chip appears, count 11→12 | WORKING | — |
| Parties `/parties` | New party form | Register new party | New party appears in table | WORKING | — |
| Parties `/parties` | Search field | Filter by name | Table correctly filters to matching row only | WORKING | — |
| Party detail `/parties/2` | Ledger section | Show party ledger | Renders correctly, empty-state message shown (no transactions for this party) | WORKING | — |
| Party detail `/parties/2` | Edit form | Update party info | Field updated and persisted | WORKING | — |
| Journal `/journal` | Manual entry form (2 lines) | Post balanced journal entry | New balanced entry appears in list | WORKING | — |
| Journal `/journal` | "Add line" button | Add a third journal line | New line row appears in form | WORKING | — |
| Journal `/journal` | Reverse/restore action | Void an entry with a reason | Entry voided, reversal entry created and appears in list | WORKING | — |
| Cash Accounts `/cash-accounts` | New account form | Create cash account | New account appears in table | WORKING | — |
| Users `/users` | New user form | Create user with role | New user appears in table | WORKING | — |
| Users `/users` | Deactivate button | Deactivate a user | Row status changes to inactive, reactivate option appears | WORKING | — |
| Roles `/roles` | Permission checkbox | Toggle a permission on existing role | Permission count changes, checkbox reflects new state | WORKING | — |
| Roles `/roles` | **Create role form** | Create a new role | **Submit button (`جوړول`) stays disabled after filling required fields — role cannot be created from the UI** | **BROKEN** | Button never becomes enabled; no network request fires |
| Audit Log `/audit-log` | Page load | Show recent actions | Loads and displays 24+ records correctly, in sync with actions taken during this session | WORKING | — |
| Global sidebar | Logout button | End session, return to login | Redirects to `/login` correctly | WORKING | — |
| All pages | Print/export controls | — | **No print or export button was found on any audited page** | NOT FOUND | — |

## Pages/modules that could not be tested because they do not exist in the frontend at all

Sales, Sale Receipts/Installments, Rentals, Shops (dedicated menu), Parking/Mosque/Supermarket (dedicated screens — these are only generic `unitTypeId` values, not dedicated pages), Purchases, Supplier ledgers, Return bills, Expenses, Exchange/Sarafi, Employees, Attendance, Employee accounts, Partners/Shares, Profit & Loss, General/company-wide reports, any print/export page, any Welcome/splash page, any Hijri-date-aware screen, any password-change screen, any forgot-password flow.

**Status for all of the above: MISSING (no page, no navigation entry).**

## Decorative/icon-only controls

A small number of icon-only controls with no clear label were not individually exercised (e.g., minor toolbar icons without accompanying text) — flagged as **NOT TESTED** rather than assumed working, per the audit's own rule against claiming something works without clicking it.
