# DATABASE AUDIT

## Engine & connection

- **Engine:** SQLite (Sequelize `dialect: "sqlite"`), file at `artifacts/api-server/data/arabian-d.sqlite`.
- **Connection code:** `lib/db-sequelize/src/connection.ts` — `storage = process.env.SQLITE_STORAGE || path.join(process.cwd(), "data", "arabian-d.sqlite")`.
- **MySQL support exists in code** (`DB_DIALECT=mysql` + host/port/name/user/password env vars) but is **not active** in this environment — not exercised by this audit.
- Confirmed via direct read-only Node script (using the `sqlite3` package already in `artifacts/api-server/node_modules`, since no `sqlite3` CLI binary is installed) that the file is a real, queryable SQLite database, not a placeholder.

## Tables present (27, from `sqlite_master`)

`accounts, audit_logs, block_groups, blocks, cash_accounts, company_settings, currencies, document_sequences, fiscal_periods, floors, journal_lines, journal_transactions, parties, party_roles, permissions, posting_links, projects, role_permissions, roles, sale_credits, sale_receipts, sales, unit_types, units, user_roles, users` (+ `sqlite_sequence`, an internal SQLite autoincrement table).

## Row counts — BEFORE this audit's functional testing (initial boot/seed state)

| Table | Count | Note |
|---|---|---|
| projects, blocks, floors, units | **0, 0, 0, 0** | No project structure existed at all — the 10-block/60-floor/270-house layout from the PDFs was **not seeded** |
| parties, sales, sale_receipts | **0, 0, 0** | No customers or sales data |
| journal_transactions, journal_lines | **0, 0** | No financial activity |
| accounts | 7 | Seeded chart of accounts: 1000 Cash on Hand, 1100 AR, 2000 AP, 3000 Owner's Equity, 4000 Sales Revenue, 4100 Rental Revenue, 5000 General Expenses |
| cash_accounts | 1 | "Main Cash Box (AFN)" |
| currencies | 3 | AFN, USD, PKR |
| document_sequences | 6 | Numbering sequences for future documents |
| unit_types | 11 | Apartment, Shop, Parking, Restaurant, Clinic, Supermarket, Mosque, Office, Storage, Other, Other Commercial |
| roles, permissions, role_permissions | 1, 11, 11 | Single `admin` role with all 11 permission keys |
| users, user_roles | 1, 1 | Default `admin` user only |
| audit_logs | 0 | No activity yet |

**This directly contradicts an initial automated code-reading assessment** (obtained before running a live query) that assumed the 270-unit structure was seeded based on reading `seed.ts` and route logic alone. Actually querying the database showed the assumption was wrong — `seed.ts` seeds only reference/config data (accounts, currencies, roles, unit types, document sequences), never actual project/block/floor/unit rows. **This is exactly the kind of "looks complete in code, not verified against real data" gap this audit exists to catch.**

## Row counts — AFTER this audit's functional testing (test records created via API + UI click-through, see `FUNCTIONAL_TEST_REPORT.md` / `BUTTONS_AND_PAGES_TEST.md`)

| Table | Count |
|---|---|
| projects | 2 (1 via curl: "Arabian D Residence"/ARB; 1 via UI: "Test Project m8BI") |
| blocks | 2 |
| floors | 2 |
| units | 2 |
| parties | 2 |
| sales | **0** — every attempt to create a sale failed (see below); no orphan rows were left behind, confirming the failing transaction rolled back cleanly |
| sale_receipts | 0 |
| journal_transactions | 3 (1 manual entry created by curl, 1 manual entry created via UI, 1 automatic reversal of that entry created via UI "restore" test) |
| journal_lines | 6 |
| users | 2 (admin + one UI-created test user, deactivated during testing) |
| cash_accounts | 2 |
| audit_logs | 25 |

These are genuinely persisted rows (re-queried directly against the `.sqlite` file, independent of the API process), confirming real persistence, not mock/in-memory data.

## Project data audit (PDF requirement: 10 blocks / 60 floors / 270 houses, A1–A5 × 6×4, B1–B5 × 6×5)

- **Not present.** At audit time the database contains 2 test blocks/floors/units created manually during this audit, not the required structure.
- **Blocks/floors/units CAN be added** — verified end-to-end via API: `POST /api/projects/:id/blocks`, `.../floors`, `.../units` all succeeded and persisted.
- **Duplicate block codes are prevented**: `POST` a second block with the same code in the same project correctly returned `409 {"error":"Block code already exists in this project"}`.
- **Property status is stored correctly** as an enum (`draft/available/reserved/sold/rented/blocked/cancelled/inactive`) on `units.status`, and a separate `units.purpose` enum (`for_sale/for_rent/both/not_available`) gates whether a unit is sellable/rentable — verified by directly setting both fields via `PUT /api/units/:id` and observing persisted values.
- **Status:** the full required layout is **MISSING** from the running system; the underlying mechanism to build it (blocks → floors → units) is **present and functional**, but no wizard, seed script, or import tool exists to generate the 270-unit structure in bulk — an admin would have to create 10 blocks, 60 floors, and 270 units one at a time through the current UI/API.

## Constraints & relationships (from Sequelize model definitions, `lib/db-sequelize/src/models/`)

| Relationship | Enforced how |
|---|---|
| Block → Project (`projectId`) | FK |
| Floor → Block (`blockId`) | FK |
| Unit → Floor (`floorId`) | FK |
| Sale → Unit (`unitId`), Sale → Party (`partyId`) | FK |
| SaleReceipt → Sale (`saleId`) | FK |
| JournalLine → JournalTransaction (`transactionId`), JournalLine → Account (`accountId`) | FK |
| PostingLink unique per `(sourceModule, sourceId, postingType)` | Unique constraint — enforces "posted only once" |
| `Project.code`, `Account.code`, `UnitType.name`, `User.username` | Unique constraints |
| `idempotencyKey` on `journal_transactions` | Unique constraint |

## Issues identified

1. **No seed/import mechanism for the required project layout.** The 270-unit structure central to the PDFs does not exist anywhere (code, seed, or DB) and must be built manually, unit by unit, through the current UI. High operational risk for real usage.
2. **Nested-transaction bug causes sale creation to fail outright** (see `FUNCTIONAL_TEST_REPORT.md`/`ERRORS_AND_BLOCKERS.md`) — `createSale()` opens a `sequelize.transaction()` and, inside it, calls `postJournal()` which opens **its own independent** `sequelize.transaction()`. SQLite does not support two concurrently-open write transactions on the same connection/pool the way this code assumes, and the insert into `journal_transactions` fails. This is a real architectural bug, not a data problem — it will need to be fixed before the Sales module (a core PDF requirement) can be used at all.
3. **No orphan records or incorrect totals were found** in the small dataset that does exist — every test record created had valid foreign keys and correct enum values.
4. **No mock data, no local/browser storage substitutes for business data** were found anywhere.
5. **Currency isolation is correctly modeled**: every money-bearing table (`sales`, `sale_receipts`, `journal_lines`, `cash_accounts`) carries its own `currencyCode` column rather than a single global currency, and `postJournal()` explicitly balances debits/credits **per currency**, rejecting any transaction that doesn't balance within each currency bucket — this was confirmed by reading `posting.ts` and is consistent with the "AFN/USD/PKR must never be summed" requirement, though no report screens exist yet to visually confirm the separation end-to-end (no Reports module is built).
6. **Unsafe deletion behavior:** no hard-delete endpoints were found for financial records (sales, receipts, journal transactions) — only status changes and an explicit void/reverse flow (verified working for journal entries via the UI). This matches the "no hard-delete, void/reverse only" principle stated in `replit.md`. Whether this same protection extends to a real Sales/Receipts UI could not be verified since the Sales frontend does not exist.
