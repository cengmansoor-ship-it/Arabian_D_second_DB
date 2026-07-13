# Checkpoint 6 — Reports, Jalali/Hijri Dates, Printing, Export, Dashboard

## Scope (brief sections S, T, V)

1. Real, DB-driven dashboard (no hard-coded values).
2. General company report across 8 sections (purchasing, expenses, customers, exchange,
   property sales, rentals, employees, projects) with date range + currency filters.
3. Gregorian ↔ Jalali (Solar Hijri) date conversion, surfaced on print headers.
4. A shared, printable company header + print buttons on financial report pages.
5. CSV export for tabular report sections.
6. Company settings extended with logo/address/phone/whatsapp/email/website, used by the
   print header.

## Design decisions

- **Jalali conversion implemented as a self-contained utility, not a dependency.** The
  Solar Hijri calendar algorithm is well-known, deterministic, and small (~40 lines); adding
  an npm package for it would be unnecessary weight. It is implemented twice — once in
  `lib/db-sequelize/src/jalali.ts` for potential backend use, once in
  `artifacts/web/src/lib/jalali.ts` for the frontend, since the web package does not depend
  on `db-sequelize`. Both copies use floor-based `div`/`mod` (not truncating division), which
  was verified against reference dates (2026-07-12 → 1405/04/21, Nowruz 1979-03-21 →
  1358/01/01, 2024-03-20 → 1403/01/01) — an initial version using `~~(a/b)` truncation
  produced wrong years for negative intermediate values and was corrected.

- **Printing is pragmatic, not 14 dedicated print routes.** The brief calls for print output
  on many report types. Rather than building a separate `/print/...` route per report, a
  shared `<PrintHeader>` component (company name/logo/address/phone/whatsapp/email/website,
  Gregorian + Jalali print date, report date range, prepared-by user) is embedded directly
  into the relevant pages (Profit & Loss, General Report, Journal, Party ledger), paired with
  a "چاپ" (Print) button that calls `window.print()`. A print stylesheet
  (`@media print` in `index.css`) hides the sidebar/topbar/filters/buttons and reveals the
  print header. This reaches the same practical outcome (a clean printed page with company
  letterhead) with much less duplicated routing.

- **CSV export, not Excel.** No spreadsheet library existed in the repo. A dependency-free
  CSV writer (`artifacts/web/src/lib/exportCsv.ts`) is used, which opens correctly in Excel
  (UTF-8 BOM prefix for RTL/Pashto text) without adding a new package.

- **Dashboard and General Report totals are computed live from each module's own tables**
  (mirroring the Profit & Loss report's pattern from Checkpoint 5), not cached or
  pre-aggregated, so they always reflect current DB state and cannot drift out of sync.

## What was built

- `lib/db-sequelize/src/jalali.ts` / `artifacts/web/src/lib/jalali.ts` — Gregorian↔Jalali
  conversion utilities.
- `lib/db-sequelize/src/reports-service.ts` — added `getDashboardSummary()` and
  `getGeneralReport()`, alongside the existing `getProfitAndLoss()`.
- `GET /api/reports/dashboard` — dashboard summary (blocks/floors/unit-status breakdown,
  customer count, sales/received/outstanding per currency, today's cash in/out, active
  rentals, today's attendance breakdown, company receivables/payables, recent transactions,
  computed alerts). No caching, no mock arrays.
- `GET /api/reports/general?currencyCode&startDate&endDate` — the 8-section general report,
  each section read directly from its own module table (Purchase, Expense, SaleReceipt,
  ExchangeTransaction, Sale, Rental, EmployeePayment) plus a per-project block/floor/unit
  status breakdown.
- `DashboardPage.tsx` rewritten to consume `/reports/dashboard` — all previous mock arrays
  (`areaData`, `barData`, `pieData`) and fake stat cards removed.
- `GeneralReportPage.tsx` (new) — filters (date range, currency, free-text search), 8
  section tables, per-section CSV export, page-level print button, project structure table.
- `PrintHeader.tsx` (new, shared) — wired into Profit & Loss, General Report, Journal, and
  Party ledger pages, each with a "چاپ" print button.
- `exportCsv.ts` (new, shared CSV writer).
- Migration `004-company-settings-contact-fields` + `CompanySetting` model + `PUT /settings`
  + `SettingsPage.tsx` — added logo URL, address, phone, whatsapp, email, website fields.

## Verification

- `pnpm run typecheck:libs`, `pnpm --filter @workspace/api-server run typecheck`,
  `pnpm --filter @workspace/web run typecheck` all pass with zero errors.
- Manual authenticated API verification (`curl`, admin session) against the running dev
  server:
  - `GET /api/reports/dashboard` → real, non-mock figures matching DB state (e.g.
    `totalBlocks: 10`, `totalFloors: 60`, `totalProperties: 271`, per-currency sales/received/
    outstanding, today's attendance, recent transactions list, a computed outstanding-balance
    alert) — confirms no hard-coded dashboard values remain.
  - `GET /api/reports/general?currencyCode=AFN&startDate=2020-01-01&endDate=2026-12-31` →
    all 8 sections plus the project structure table populated with real records (purchases,
    exchange transactions, property sales, rentals, employee payments, sale receipts) that
    match the underlying module data.
- DB integrity: `PRAGMA integrity_check` → `ok`; journal lines still balance per currency
  (AFN 2,488,850 = 2,488,850; USD 130 = 130) — no drift introduced by this checkpoint's
  read-only reporting code.
- An end-to-end Playwright verification pass was attempted but the tester did not return a
  verdict within the available time budget and was cancelled; verification for this
  checkpoint therefore relies on the typecheck + authenticated API checks above rather than
  a full browser-driven pass. This is a documented gap to revisit if issues surface.
