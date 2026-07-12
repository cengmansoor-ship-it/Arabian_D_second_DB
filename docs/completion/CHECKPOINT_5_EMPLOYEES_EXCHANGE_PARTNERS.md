# Checkpoint 5 — Employees/Attendance, Exchange/Sarafi, Partners/Profit&Loss

## Scope decisions
- **Employee wages**: cash-basis. Attendance accrues a payable amount daily (full daily/monthly-prorated
  wage for `present`, half for `half_day`, zero for `absent`/`leave`) but posts no journal entry at
  accrual time — no journal entry exists until an `EmployeePayment` is made (debit Salaries & Wages
  Expense `5100`, credit Cash). This mirrors the Expense/Purchase pattern already used elsewhere in the
  system and avoids inventing an accrual/payable-liability model the brief did not ask for. Employee
  balance = total accrued (from attendance) minus total non-voided payments.
- **Exchange / Sarafi**: modeled as an immediately-settled spot transaction between the company and an
  `exchange_dealer` party. `postJournal` enforces debit == credit **per currency code**, so a direct
  two-currency swap (e.g. give AFN, receive USD) cannot be posted as one balanced multi-currency journal
  entry. Resolved with a new "Exchange Clearing" account (`3100`): the AFN leg (debit Clearing, credit
  Cash) and the USD leg (debit Cash, credit Clearing) each balance independently within their own
  currency, while the dealer party is tagged on both legs so the party ledger still shows the full
  exchange history. An optional fee is an additional cash outflow (in the given currency) expensed to a
  new "Exchange Fees Expense" account (`5200`). This is a documented design decision, not a business
  rule found in any source document (no PDFs were present in this environment).
- **Partners**: a `Partner` links 1:1 to an existing `Party` of type `partner` (reusing the existing
  Parties module rather than duplicating contact fields, consistent with how Suppliers reused `Party` in
  Checkpoint 4). Initial investment posts a journal entry (debit Cash, credit Owner's Equity `3000`,
  party-tagged) at creation if non-zero. Investments/withdrawals post symmetric journal entries;
  withdrawals are blocked if they would exceed the partner's current capital balance (initial investment
  + investments − withdrawals).
- **Profit & Loss**: implemented as a computed report (`getProfitAndLoss`), not a stored table. It reads
  directly from each module's own tables (Sale, Rental, Expense, Purchase/PurchaseReturn,
  EmployeePayment, PartnerTransaction) filtered by date range and currency, rather than deriving figures
  from shared journal accounts — this avoids ambiguity where Purchases and Expenses both post to account
  `5000`, and keeps every line trivially reconcilable against its own module's records. Partner
  withdrawals are shown on the report for visibility but excluded from the profit/loss calculation itself
  (an equity movement, not a cost). "Available balance" is a real-time cash-on-hand figure computed from
  journal lines against the currency's cash account(s).

## What was built
- Models: `Employee`, `Attendance` (unique index on employeeId+date to prevent duplicate-day entries),
  `EmployeePayment`, `ExchangeTransaction`, `Partner` (unique partyId), `PartnerTransaction` — all
  auto-created by `sequelize.sync()`.
- Services: `employee-service.ts` (`createEmployee`, `recordAttendance` with duplicate-date guard and
  payable computation, `getEmployeeBalance`, `addEmployeePayment` posting the 5100/cash journal entry),
  `exchange-service.ts` (`createExchangeTransaction`, resolving each currency's cash account and posting
  the Exchange Clearing-balanced multi-currency journal plus optional fee), `partner-service.ts`
  (`createPartner`, `getPartnerBalance`, `addPartnerTransaction` with the over-withdrawal guard),
  `reports-service.ts` (`getProfitAndLoss`). Every balance-recompute read and posting call threads the
  caller's active transaction (per the established `sequelize-sqlite-transactions` pattern).
- Routes: `/employees` (+ `/:id/attendance`, `/:id/payments`), `/exchange`, `/partners` (+
  `/:id/transactions`), `/reports/profit-loss`, gated by permissions `hr.manage`, `exchange.manage`,
  `partners.manage`, `reports.view` respectively, with `recordAudit` on every mutation.
- Chart-of-accounts additions: `5100` Salaries & Wages Expense, `5200` Exchange Fees Expense, `3100`
  Exchange Clearing (all idempotent `findOrCreate` in `seed.ts`). Reused existing `1000` Cash, `3000`
  Owner's Equity.
- New permissions: `exchange.manage`, `partners.manage` (reused existing `hr.manage`, `reports.view`).
- New document sequences: `employee` (EMP-), `employee_payment` (EPAY-), `exchange` (EXC-), `partner`
  (PTR-), `partner_transaction` (PTX-).
- Frontend: `EmployeesPage`/`EmployeeDetailPage` (attendance + payments), `ExchangePage` (list+create),
  `PartnersPage`/`PartnerDetailPage` (transactions table), `ProfitLossPage` (date/currency-filtered
  report). New nav entries (کارکوونکي / صرافي / شریکان / ګټه او تاوان) added to the sidebar.

## Verification
- `pnpm run typecheck:libs`, `pnpm --filter @workspace/api-server run typecheck`,
  `pnpm --filter @workspace/web run typecheck` all pass.
- Live Playwright end-to-end run covering: employee creation, attendance recording, duplicate-date
  attendance correctly rejected, salary payment reducing the accrued balance; exchange transaction
  creation with a two-currency amount and a fee; partner creation with initial investment, an
  investment transaction, a withdrawal transaction, and an over-withdrawal correctly rejected;
  profit-loss report rendering plausible non-NaN numbers including the employee cost line. No backend
  500s or console errors were observed; all UI flows behaved as expected.
- `PRAGMA integrity_check` → `ok`. Journal lines balance debit == credit **per currency**: AFN
  2,488,850 = 2,488,850, USD 130 = 130 — confirming the Exchange Clearing-account design correctly
  keeps each currency's journal self-balanced even though the underlying transaction spans two
  currencies.
- The Playwright run's test employee, exchange transaction, and partner (with their attendance/
  payments/transactions) were left in the database as real, balanced financial records, consistent
  with the Checkpoint 3/4 precedent of not deleting posted financial data as "cleanup".
