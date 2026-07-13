# Checkpoint 4 — Rentals / Expenses / Purchases (+Payments/Returns) / Suppliers

## Scope decisions
- **Suppliers**: no new model or module needed. "supplier" is already a `PartyType`, and
  `PartiesPage.tsx` already lists/filters/creates parties by type — supplier management is fully
  covered by the existing Parties module. Purchases pick a supplier via the same
  search-select pattern Sales uses to pick a customer.
- **Rentals**: modeled as a single running balance (`rentAmount + depositAmount` minus receipts),
  mirroring the Sales pattern, rather than a recurring-invoice/amortization schedule. The brief's
  literal field list (rental number, tenant, unit, start/end, rent amount, frequency, deposit,
  status; prevent double rental; link to tenant; create rental receipts) does not require
  recurring invoicing, so the simpler model satisfies the requirement without inventing scope.
- **Purchases**: modeled as one line item per purchase (item, qty, unit, unit price, total) per the
  brief's literal (singular) field list, with a running AP balance reduced by `PurchasePayment` and
  `PurchaseReturn` records — the same pattern as Sales' AR balance reduced by receipts.

## What was built
- Models: `Rental`, `RentalReceipt`, `Expense`, `Purchase`, `PurchasePayment`, `PurchaseReturn`
  (all auto-created by `sequelize.sync()`; no new migration files needed since these are brand-new
  tables, not column changes to existing ones).
- Services: `rental-service.ts` (`createRental` with double-booking prevention via
  `assertNoActiveRental`, atomic optional first receipt, `addRentalReceipt`/`reverseRentalReceipt`
  with overpayment guard, `endRental` reverting the unit to `available`), `expense-service.ts`
  (`createExpense`, `voidExpense`), `purchase-service.ts` (`createPurchase`,
  `addPurchasePayment` auto-transitioning status to `paid` at zero balance, `createPurchaseReturn`).
  Every balance-recompute read and every `postJournal`/`reverseJournal` call threads the caller's
  active transaction from the start (see `sequelize-sqlite-transactions` memory entry, applied
  proactively after the equivalent bug was found and fixed in Checkpoint 3).
- Routes: `/rentals`, `/expenses`, `/purchases` in `artifacts/api-server/src/routes/`, mirroring
  the Sales route's structure (GET list/detail, POST create, POST sub-resource actions), each
  gated by a dedicated permission (`rentals.manage`, `expenses.manage`, `purchases.manage`) with
  `recordAudit` on every mutation.
- Chart-of-accounts addition: account `2100` "Tenant Deposits Payable" (liability), added via
  idempotent `findOrCreate` in `seed.ts`. Reused existing accounts `1100` AR, `4100` Rental
  Revenue, `2000` AP, `5000` General Expenses, `1000` Cash — no other new accounts were needed.
- New permission `expenses.manage`; reused existing `rentals.manage`/`purchases.manage`.
- New document sequences: `rental_receipt` (RRCPT-), `purchase_payment` (PPAY-),
  `purchase_return` (PRET-). Existing `rental_contract` (RC-), `purchase_invoice` (PINV-),
  `expense_voucher` (EXP-) sequences (present but unused before this checkpoint) are now live.
- Frontend: `RentalsPage`/`RentalDetailPage`, `ExpensesPage` (list+create+void, no detail page
  needed), `PurchasesPage`/`PurchaseDetailPage` (with payments + returns tables), all following the
  Sales pages' modal/table conventions. New nav entries (کرایې / لګښتونه / پیرودنې) added to the
  sidebar. Unit picker for rentals reuses the existing `GET /units?status=available&purpose=for_rent`
  flat search endpoint — no backend change needed there.

## Verification
- `pnpm run typecheck:libs`, `pnpm --filter @workspace/api-server run typecheck`,
  `pnpm --filter @workspace/web run typecheck` all pass.
- Live Playwright end-to-end run covering all three modules: rental creation with deposit,
  receipt add + balance drop, receipt reversal restoring the balance, and confirmation that a unit
  with an active rental no longer appears as selectable for a second rental (double-booking
  prevention verified); expense creation and void; purchase creation, partial payment, a return,
  and a final payment that correctly flips status to "paid" at zero balance. No backend 500s or
  console errors were observed.
- `PRAGMA integrity_check` → `ok`. Journal debits and credits both total 2,413,600 after all test
  postings — double-entry integrity holds across Sales (Checkpoint 3) and the new Rentals/
  Expenses/Purchases postings combined.
- The Playwright run's test rental, expense, and purchase (with their receipts/payments/returns)
  were left in the database as real, balanced financial records, consistent with the Checkpoint 3
  precedent of not deleting posted financial data as "cleanup".
